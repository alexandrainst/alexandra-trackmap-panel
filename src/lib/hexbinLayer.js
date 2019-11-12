/*
	This is a modifed version of Asymmetrik's leaflet-d3 HexbinLayer:
	https://github.com/Asymmetrik/leaflet-d3/blob/master/src/js/hexbin/HexbinLayer.js

	LICENSE:
		The MIT License (MIT)

		Copyright (c) 2007-2018 Asymmetrik Ltd, a Maryland Corporation

		Permission is hereby granted, free of charge, to any person obtaining a copy
		of this software and associated documentation files (the "Software"), to deal
		in the Software without restriction, including without limitation the rights
		to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
		copies of the Software, and to permit persons to whom the Software is
		furnished to do so, subject to the following conditions:

		The above copyright notice and this permission notice shall be included in all
		copies or substantial portions of the Software.

		THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
		IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
		FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
		AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
		LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
		OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
		SOFTWARE.
*/

import * as d3 from 'd3';
import * as d3Hexbin from 'd3-hexbin';

/**
 * This is a convoluted way of getting ahold of the hexbin function.
 * - When imported globally, d3 is exposed in the global namespace as 'd3'
 * - When imported using a module system, it's a named import (and can't collide with d3)
 * - When someone isn't importing d3-hexbin, the named import will be undefined
 *
 * As a result, we have to figure out how it's being imported and get the function reference
 * (which is why we have this convoluted nested ternary statement
 */
let d3_hexbin = (null != d3.hexbin)? d3.hexbin : (null != d3Hexbin)? d3Hexbin.hexbin : null;

export function hexbinInit(leaflet) {
	/**
	 * leaflet is defined by the Leaflet library, see git://github.com/Leaflet/Leaflet.git for documentation
	 * We extend leaflet.SVG to take advantage of built-in zoom animations.
	 */
	leaflet.HexbinLayer = leaflet.SVG.extend({
		includes: leaflet.Evented || leaflet.Mixin.Events,

		/**
		 * Default options
		 */
		options : {
			radius : 12,
			opacity: 0.6,
			duration: 200,

			colorScaleExtent: [ 1, undefined ],
			radiusScaleExtent: [ 1, undefined ],
			colorDomain: null,
			radiusDomain: null,
			colorRange: [ '#f7fbff', '#08306b' ],
			radiusRange: [ 4, 12 ],

			pointerEvents: 'all'
		},


		/**
		 * Standard Leaflet initialize function, accepting an options argument provided by the
		 * user when they create the layer
		 * @param options Options object where the options override the defaults
		 */
		initialize : function(options) {
			leaflet.setOptions(this, options);

			// Set up the letious overrideable functions
			this._fn = {
				lat: function(d) { return d[0]; },
				lng: function(d) { return d[1]; },
				colorValue: function(d) { return d.length; },
				radiusValue: function(d) { return Number.MAX_VALUE; },

				fill: function(d) {
					let val = this._fn.colorValue(d);
					return (null != val) ? this._scale.color(val) : 'none';
				}
			};

			// Set up the customizable scale
			this._scale = {
				color: d3.scaleLinear(),
				radius: d3.scaleLinear()
			};

			// Set up the Dispatcher for managing events and callbacks
			this._dispatch = d3.dispatch('mouseover', 'mouseout', 'click');

			// Set up the default hover handler
			this._hoverHandler = leaflet.HexbinHoverHandler.none();

			// Create the hex layout
			this._hexLayout = d3_hexbin()
				.radius(this.options.radius)
				.x(function(d) { return d.point[0]; })
				.y(function(d) { return d.point[1]; });

			// Initialize the data array to be empty
			this._data = [];

			this._scale.color
				.range(this.options.colorRange)
				.clamp(true);

			this._scale.radius
				.range(this.options.radiusRange)
				.clamp(true);

		},

		/**
		 * Callback made by Leaflet when the layer is added to the map
		 * @param map Reference to the map to which this layer has been added
		 */
		onAdd : function(map) {

			leaflet.SVG.prototype.onAdd.call(this);

			// Store a reference to the map for later use
			this._map = map;

			// Redraw on moveend
			map.on({ 'moveend': this.redraw }, this);

			// Initial draw
			this.redraw();

		},

		/**
		 * Callback made by Leaflet when the layer is removed from the map
		 * @param map Reference to the map from which this layer is being removed
		 */
		onRemove : function(map) {

			// leaflet.SVG.prototype.onRemove.call(this);

			// Destroy the svg container
			this._destroyContainer();

			// Remove events
			map.off({ 'moveend': this.redraw }, this);

			this._map = null;

			d3.select(this._container).remove();
			// Explicitly will leave the data array alone in case the layer will be shown again
			//this._data = [];

		},

		/**
		 * Create the SVG container for the hexbins
		 * @private
		 */
		_initContainer : function() {

			leaflet.SVG.prototype._initContainer.call(this);
			this._d3Container = d3.select(this._container).select('g');
		},

		/**
		 * Clean up the svg container
		 * @private
		 */
		_destroyContainer: function() {

			// Don't do anything

		},

		/**
		 * (Re)draws the hexbins data on the container
		 * @private
		 */
		redraw : function() {
			let that = this;

			if (!that._map) {
				return;
			}

			// Generate the mapped version of the data
			let data = that._data.map(function(d) {
				let lat = that._fn.lat(d);
				let lng = that._fn.lng(d);

				let point = that._project([ lat, lng ]);
				return { o: d, point: point };
			});

			// Select the hex group for the current zoom level. This has
			// the effect of recreating the group if the zoom level has changed
			let join = this._d3Container.selectAll('g.hexbin')
				.data([ this._map.getZoom() ], function(d) { return d; });

			// enter
			let enter = join.enter().append('g')
				.attr('class', function(d) { return 'hexbin zoom-' + d; });

			// enter + update
			let enterUpdate = enter.merge(join);

			// exit
			join.exit().remove();

			// add the hexagons to the select
			this._createHexagons(enterUpdate, data);

		},

		_createHexagons : function(g, data) {
			let that = this;

			// Create the bins using the hexbin layout

			// Generate the map bounds (to be used to filter the hexes to what is visible)
			let bounds = that._map.getBounds();
			let size = that._map.getSize();
			bounds = bounds.pad(that.options.radius * 2 / Math.max(size.x, size.y));

			let bins = that._hexLayout(data);

			// Derive the extents of the data values for each dimension
			let colorExtent = that._getExtent(bins, that._fn.colorValue, that.options.colorScaleExtent);
			let radiusExtent = that._getExtent(bins, that._fn.radiusValue, that.options.radiusScaleExtent);

			// Match the domain cardinality to that of the color range, to allow for a polylinear scale
			let colorDomain = this.options.colorDomain;
			if (null == colorDomain) {
				colorDomain = that._linearlySpace(colorExtent[0], colorExtent[1], that._scale.color.range().length);
			}
			let radiusDomain = this.options.radiusDomain || radiusExtent;

			// Set the scale domains
			that._scale.color.domain(colorDomain);
			that._scale.radius.domain(radiusDomain);


			/*
			 * Join
			 *    Join the Hexagons to the data
			 *    Use a deterministic id for tracking bins based on position
			 */
			bins = bins.filter(function(d) {
				return bounds.contains(that._map.layerPointToLatLng(leaflet.point(d.x, d.y)));
			});
			let join = g.selectAll('g.hexbin-container')
				.data(bins, function(d) {
					return d.x + ':' + d.y;
				});


			/*
			 * Update
			 *    Set the fill and opacity on a transition
			 *    opacity is re-applied in case the enter transition was cancelled
			 *    the path is applied as well to resize the bins
			 */
			join.select('path.hexbin-hexagon').transition().duration(that.options.duration)
				.attr('fill', that._fn.fill.bind(that))
				.attr('fill-opacity', that.options.opacity)
				.attr('stroke-opacity', that.options.opacity)
				.attr('d', function(d) {
					return that._hexLayout.hexagon(that._scale.radius(that._fn.radiusValue.call(that, d)));
				});


			/*
			 * Enter
			 *    Establish the path, size, fill, and the initial opacity
			 *    Transition to the final opacity and size
			 */
			let enter = join.enter().append('g').attr('class', 'hexbin-container');

			enter.append('path').attr('class', 'hexbin-hexagon')
				.attr('transform', function(d) {
					return 'translate(' + d.x + ',' + d.y + ')';
				})
				.attr('d', function(d) {
					return that._hexLayout.hexagon(that._scale.radius.range()[0]);
				})
				.attr('fill', that._fn.fill.bind(that))
				.attr('fill-opacity', 0.01)
				.attr('stroke-opacity', 0.01)
				.transition().duration(that.options.duration)
					.attr('fill-opacity', that.options.opacity)
					.attr('stroke-opacity', that.options.opacity)
					.attr('d', function(d) {
						return that._hexLayout.hexagon(that._scale.radius(that._fn.radiusValue.call(that, d)));
					});

			// Grid
			let gridEnter = enter.append('path').attr('class', 'hexbin-grid')
				.attr('transform', function(d) {
					return 'translate(' + d.x + ',' + d.y + ')';
				})
				.attr('d', function(d) {
					return that._hexLayout.hexagon(that.options.radius);
				})
				.attr('fill', 'none')
				.attr('stroke', 'none')
				.style('pointer-events', that.options.pointerEvents);

			// Grid enter-update
			gridEnter.merge(join.select('path.hexbin-grid'))
				.on('mouseover', function(d, i) {
					that._hoverHandler.mouseover.call(this, that, d, i);
					that._dispatch.call('mouseover', this, d, i);
				})
				.on('mouseout', function(d, i) {
					that._dispatch.call('mouseout', this, d, i);
					that._hoverHandler.mouseout.call(this, that, d, i);
				})
				.on('click', function(d, i) {
					that._dispatch.call('click', this, d, i);
				});


			// Exit
			let exit = join.exit();

			exit.select('path.hexbin-hexagon')
				.transition().duration(that.options.duration)
				.attr('fill-opacity', 0)
				.attr('stroke-opacity', 0)
				.attr('d', function(d) {
					return that._hexLayout.hexagon(0);
				});

			exit.transition().duration(that.options.duration)
				.remove();

		},

		_getExtent: function(bins, valueFn, scaleExtent) {

			// Determine the extent of the values
			let extent = d3.extent(bins, valueFn.bind(this));

			// If either's null, initialize them to 0
			if (null == extent[0]) extent[0] = 0;
			if (null == extent[1]) extent[1] = 0;

			// Now apply the optional clipping of the extent
			if (null != scaleExtent[0]) extent[0] = scaleExtent[0];
			if (null != scaleExtent[1]) extent[1] = scaleExtent[1];

			return extent;

		},

		_project : function(coord) {
			let point = this._map.latLngToLayerPoint(coord);
			return [ point.x, point.y ];
		},

		_getBounds: function(data) {
			if(null == data || data.length < 1) {
				return { min: [ 0, 0 ], max: [ 0, 0 ]};
			}

			// bounds is [[min long, min lat], [max long, max lat]]
			let bounds = [ [ 999, 999 ], [ -999, -999 ] ];

			data.forEach(function(element) {
				let x = element.point[0];
				let y = element.point[1];

				bounds[0][0] = Math.min(bounds[0][0], x);
				bounds[0][1] = Math.min(bounds[0][1], y);
				bounds[1][0] = Math.max(bounds[1][0], x);
				bounds[1][1] = Math.max(bounds[1][1], y);
			});

			return { min: bounds[0], max: bounds[1] };
		},

		_linearlySpace: function(from, to, length) {
			let arr = new Array(length);
			let step = (to - from) / Math.max(length - 1, 1);

			for (let i = 0; i < length; ++i) {
				arr[i] = from + (i * step);
			}

			return arr;
		},


		// ------------------------------------
		// Public API
		// ------------------------------------

		radius: function(v) {
			if (!arguments.length) { return this.options.radius; }

			this.options.radius = v;
			this._hexLayout.radius(v);

			return this;
		},

		opacity: function(v) {
			if (!arguments.length) { return this.options.opacity; }
			this.options.opacity = v;

			return this;
		},

		duration: function(v) {
			if (!arguments.length) { return this.options.duration; }
			this.options.duration = v;

			return this;
		},

		colorScaleExtent: function(v) {
			if (!arguments.length) { return this.options.colorScaleExtent; }
			this.options.colorScaleExtent = v;

			return this;
		},

		radiusScaleExtent: function(v) {
			if (!arguments.length) { return this.options.radiusScaleExtent; }
			this.options.radiusScaleExtent = v;

			return this;
		},

		colorRange: function(v) {
			if (!arguments.length) { return this.options.colorRange; }
			this.options.colorRange = v;
			this._scale.color.range(v);

			return this;
		},

		radiusRange: function(v) {
			if (!arguments.length) { return this.options.radiusRange; }
			this.options.radiusRange = v;
			this._scale.radius.range(v);

			return this;
		},

		colorScale: function(v) {
			if (!arguments.length) { return this._scale.color; }
			this._scale.color = v;

			return this;
		},

		radiusScale: function(v) {
			if (!arguments.length) { return this._scale.radius; }
			this._scale.radius = v;

			return this;
		},

		lng: function(v) {
			if (!arguments.length) { return this._fn.lng; }
			this._fn.lng = v;

			return this;
		},

		lat: function(v) {
			if (!arguments.length) { return this._fn.lat; }
			this._fn.lat = v;

			return this;
		},

		colorValue: function(v) {
			if (!arguments.length) { return this._fn.colorValue; }
			this._fn.colorValue = v;

			return this;
		},

		radiusValue: function(v) {
			if (!arguments.length) { return this._fn.radiusValue; }
			this._fn.radiusValue = v;

			return this;
		},

		fill: function(v) {
			if (!arguments.length) { return this._fn.fill; }
			this._fn.fill = v;

			return this;
		},

		data: function(v) {
			if (!arguments.length) { return this._data; }
			this._data = (null != v) ? v : [];

			this.redraw();

			return this;
		},

		/*
		 * Getter for the event dispatcher
		 */
		dispatch: function() {
			return this._dispatch;
		},

		hoverHandler: function(v) {
			if (!arguments.length) { return this._hoverHandler; }
			this._hoverHandler = (null != v) ? v : leaflet.HexbinHoverHandler.none();

			this.redraw();

			return this;
		},

		/*
		 * Returns an array of the points in the path, or nested arrays of points in case of multi-polyline.
		 */
		getLatLngs: function () {
			let that = this;

			// Map the data into an array of latLngs using the configured lat/lng accessors
			return this._data.map(function(d) {
				return leaflet.latLng(that.options.lat(d), that.options.lng(d));
			});
		},

		/*
		 * Get path geometry as GeoJSON
		 */
		toGeoJSON: function () {
			return leaflet.GeoJSON.getFeature(this, {
				type: 'LineString',
				coordinates: leaflet.GeoJSON.latLngsToCoords(this.getLatLngs(), 0)
			});
		}

	});

	// Hover Handlers modify the hexagon and can be combined
	leaflet.HexbinHoverHandler = {

		tooltip: function(options) {

			// merge options with defaults
			options = options || {};
			if (null == options.tooltipContent) { options.tooltipContent = function(d) { return 'Count: ' + d.length; }; }

			// Generate the tooltip
			let tooltip = d3.select('body').select('.hexbin-tooltip');
			if (tooltip.empty()) {
				tooltip = d3.select("body").append('div')
					.attr('class', 'hexbin-tooltip')
					.style('z-index', 9999)
					.style('pointer-events', 'none')
					.style('visibility', 'hidden')
					.style('position', 'fixed');
			}


			tooltip.append('div').attr('class', 'tooltip-content');

			// return the handler instance
			return {
				mouseover: function (hexLayer, data) {
					let event = d3.event;
					let gCoords = d3.mouse(this);

					tooltip
						.style('visibility', 'visible')
						.html(options.tooltipContent(data, hexLayer));

					let div = null;
					if (null != tooltip._groups && tooltip._groups.length > 0 && tooltip._groups[0].length > 0) {
						div = tooltip._groups[0][0];
					}
					let h = div.clientHeight, w = div.clientWidth;

					tooltip
						.style('top', '' + event.clientY - h - 16 + 'px')
						// 	.style('top', '' + event.clientY - gCoords[1] - h - 16 + 'px')
						.style('left', '' + event.clientX - w/2 + 'px');
					// 	.style('left', '' + event.clientX - gCoords[0] - w/2 + 'px');
				},
				mouseout: function (hexLayer, data) {
					tooltip
						.style('visibility', 'hidden')
						.html();
				}
			};

		},

		resizeFill: function() {

			// return the handler instance
			return {
				mouseover: function (hexLayer, data) {
					let o = d3.select(this.parentNode);
					o.select('path.hexbin-hexagon')
						.attr('d', function (d) {
							return hexLayer._hexLayout.hexagon(hexLayer.options.radius);
						});
				},
				mouseout: function (hexLayer, data) {
					let o = d3.select(this.parentNode);
					o.select('path.hexbin-hexagon')
						.attr('d', function (d) {
							return hexLayer._hexLayout.hexagon(hexLayer._scale.radius(hexLayer._fn.radiusValue.call(hexLayer, d)));
						});
				}
			};

		},

		resizeScale: function(options) {

			// merge options with defaults
			options = options || {};
			if (null == options.radiusScale) options.radiusScale = 0.5;

			// return the handler instance
			return {
				mouseover: function (hexLayer, data) {
					let o = d3.select(this.parentNode);
					o.select('path.hexbin-hexagon')
						.attr('d', function (d) {
							return hexLayer._hexLayout.hexagon(hexLayer._scale.radius.range()[1] * (1 + options.radiusScale));
						});
				},
				mouseout: function (hexLayer, data) {
					let o = d3.select(this.parentNode);
					o.select('path.hexbin-hexagon')
						.attr('d', function (d) {
							return hexLayer._hexLayout.hexagon(hexLayer._scale.radius(hexLayer._fn.radiusValue.call(hexLayer, d)));
						});
				}
			};

		},

		compound: function(options) {

			options = options || {};
			if (null == options.handlers) options.handlers = [ leaflet.HexbinHoverHandler.none() ];

			return {
				mouseover: function (hexLayer, data) {
					let that = this;
					options.handlers.forEach(function(h) { h.mouseover.call(that, hexLayer, data); });
				},
				mouseout: function (hexLayer, data) {
					let that = this;
					options.handlers.forEach(function(h) { h.mouseout.call(that, hexLayer, data); });
				}
			};

		},

		none: function() {
			return {
				mouseover: function () {},
				mouseout: function () {}
			};
		}
	};

	leaflet.hexbinLayer = function(options) {
		return new leaflet.HexbinLayer(options);
	};
}
