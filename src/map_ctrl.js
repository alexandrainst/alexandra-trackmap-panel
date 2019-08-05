import { MetricsPanelCtrl } from 'grafana/app/plugins/sdk';
import {defaults} from 'lodash';
import 'leaflet';
import 'leaflet-ant-path';
import './lib/hexbinLayer.js';
import './lib/leaflet-heat.js';
import './css/hexbin.css';
import './css/map-panel.css';

const panelDefaults = {
  mapOptions: {
    latlon: [
      56.146,
      10.19
    ],
    zoom: 12,
    url: "https://{s}.tile.osm.org/{z}/{x}/{y}.png",
    attribution: "&copy; <a href='http://osm.org/copyright'>OpenSteetMap</a> contributors",
    maxZoom: 18,
  },
  mode: 'Hexbin',
  hexbin: {
    colorScaleExtent: [1, undefined],
    radiusScaleExtent: [1, undefined],
    colorRange: ['#f7fbff', '#ff0000'],
    radiusRange: [5, 12]
  },
  antpath: {
    delay: 400,
    dashArray: [10,20],
    weight: 5,
    color: "#0000FF",
    pulseColor: "#FFFFFF",
    paused: false,
    reverse: false
  }
};

export class MapCtrl extends MetricsPanelCtrl {
  constructor($scope, $injector) {
    super($scope, $injector);
    defaults(this.panel, panelDefaults);

    this.map = null;
    this.mapLayer = null;
    this.points = [];
    this.modeTypes = ['Hexbin', 'Heatmap', 'Antpath'];

    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('panel-initialized', this.onPanelInitialized.bind(this));
    this.events.on('panel-teardown', this.onPanelTeardown.bind(this));
  }

  onDataReceived(data) {
    this.points = [];

    if (Array.isArray(data) && data.length > 0) {
      if (data[0].type === "table") {
        let lat = -1;
        let lon = -1;
        let location = -1;

        data[0].columns.forEach((c, i) => {
          if (c.text === "lat") {
            lat = i;
          } else if (c.text === "lon") {
            lon = i;
          } else if (c.text === "location") {
            location = i;
          }
        });

        if (lat !== -1 && lon !== -1) {
          data[0].rows.forEach(r => {
            this.points.push([r[lat], r[lon], 1]);
          });
        } else if (location !== -1) {
          data[0].rows.forEach(r => {
            let l = r[location];
            if (typeof l === "string") {
              l = JSON.parse(l);
            }
            if (l && l.type === "geo:json" && l.value && l.value.coordinates) {
              const coord = l.value.coordinates;
              this.points.push([coord[0], coord[1], 1]);
            }
          });
        }
      }
    }

    this.addLayer();
  }

  addLayer() {
    if (this.mapLayer) {
      this.mapLayer.removeFrom(this.map);
      this.mapLayer = null;
    }
    if (this.points.length > 0) {
      if (this.panel.mode === this.modeTypes[0]) {
        this.mapLayer = L.hexbinLayer(this.panel.hexbin).hoverHandler(L.HexbinHoverHandler.tooltip());
        this.mapLayer.data(this.points);
      } else if (this.panel.mode === this.modeTypes[1]) {
        this.mapLayer = L.heatLayer(this.points);
      } else if (this.panel.mode === this.modeTypes[2]) {
        this.mapLayer = L["polyline"].antPath(this.points, this.panel.antpath);
      } else {
        console.log("invalid mode type, defaulting to hexbin");
        this.mapLayer = L.hexbinLayer(this.panel.hexbin).hoverHandler(L.HexbinHoverHandler.tooltip());
        this.mapLayer.data(this.points);
      }
      this.mapLayer.addTo(this.map);
    }

    this.render();
  }

  onDataError(data) {
    this.points = [];
    if (this.mapLayer) {
      this.mapLayer.removeFrom(this.map);
      this.mapLayer = null;
    }
    this.render();
  }

  onInitEditMode() {
    this.addEditorTab('Options', 'public/plugins/alexandra-trackmap-panel/partials/options.html', 2)
  }

  onPanelInitialized() {
    this.map = L["map"]('map_' + this.panel.id).setView(this.panel.mapOptions.latlon, this.panel.mapOptions.zoom);
    L["tileLayer"](this.panel.mapOptions.url, {
      attribution: this.panel.mapOptions.attribution,
      maxZoom: this.panel.mapOptions.maxZoom
    }).addTo(this.map);
    this.render();
  }

  onPanelTeardown() {
    this.map.remove();
    this.map = null;
  }

  setMapCenter() {
    const latlon = this.map.getCenter();
    this.panel.mapOptions.latlon = [latlon.lat, latlon.lng];
  }

  setStartZoom() {
    this.panel.mapOptions.zoom = this.map.getZoom();
  }

  centerMap() {
    this.map.setView(this.panel.mapOptions.latlon, this.panel.mapOptions.zoom);
  }

  maxZoomChanged() {
    this.map.setMaxZoom(this.panel.mapOptions.maxZoom);
  }

  link(scope, elem) {
    this.events.on('render', () => {
      if (this.map) {
        this.map.invalidateSize();
      }

      const $panelContainer = elem.find('.panel-container');
      if (this.panel.bgColor) {
        $panelContainer.css('background-color', this.panel.bgColor);
      } else {
        $panelContainer.css('background-color', '');
      }
    });
  }
}

MapCtrl.templateUrl = "partials/module.html";
