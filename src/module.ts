import { PanelPlugin } from '@grafana/data';
import { TrackMapPanel } from './TrackMapPanel';
import { TrackMapOptions } from './types';

export const plugin = new PanelPlugin<TrackMapOptions>(TrackMapPanel).setPanelOptions((builder) => {
  return (
    builder
      .addBooleanSwitch({
        path: 'discardZeroOrNull',
        name: 'Discard positions that contains null (avoid plugin crash) or exactly 0 (inconsistent) coordinates.',
        category: ['Tack Map: General'],
        defaultValue: true,
      })
      .addBooleanSwitch({
        path: 'map.useCenterFromFirstPos',
        name: 'Map center to first position',
        category: ['Tack Map: General'],
        defaultValue: false,
        showIf: (config) => !config.map.useCenterFromLastPos && !config.map.zoomToDataBounds,
      })
      .addBooleanSwitch({
        path: 'map.useCenterFromLastPos',
        name: 'Map center to last position',
        category: ['Tack Map: General'],
        defaultValue: false,
        showIf: (config) => !config.map.useCenterFromFirstPos && !config.map.zoomToDataBounds,
      })
      .addNumberInput({
        path: 'map.centerLatitude',
        name: 'Map center latitude',
        category: ['Tack Map: General'],
        defaultValue: 56.17203,
        showIf: (config) =>
          !config.map.useCenterFromFirstPos && !config.map.useCenterFromLastPos && !config.map.zoomToDataBounds,
      })
      .addNumberInput({
        path: 'map.centerLongitude',
        name: 'Map center longitude',
        category: ['Tack Map: General'],
        defaultValue: 10.1865203,
        showIf: (config) =>
          !config.map.useCenterFromFirstPos && !config.map.useCenterFromLastPos && !config.map.zoomToDataBounds,
      })
      .addBooleanSwitch({
        path: 'map.zoomToDataBounds',
        name: 'Zoom map to fit data bounds',
        category: ['Tack Map: General'],
        defaultValue: false,
        showIf: (config) =>
          !config.map.useCenterFromFirstPos && !config.map.useCenterFromLastPos && !config.map.useBoundsInQuery,
      })
      .addNumberInput({
        path: 'map.zoom',
        name: 'Map Zoom',
        category: ['Tack Map: General'],
        defaultValue: 10,
        showIf: (config) => !config.map.zoomToDataBounds,
      })
      .addBooleanSwitch({
        path: 'map.useBoundsInQuery',
        name: 'Use map bounds in query',
        category: ['Tack Map: General'],
        defaultValue: false,
        showIf: (config) => !config.map.zoomToDataBounds,
      })
      .addSelect({
        path: 'viewType',
        defaultValue: 'marker',
        name: 'Visualisation type',
        category: ['Tack Map: General'],
        settings: {
          options: [
            {
              value: 'marker',
              label: 'Markers',
            },
            {
              value: 'ant',
              label: 'Ant Path',
            },
            {
              value: 'ant-marker',
              label: 'Ant Path With Markers',
            },
            {
              value: 'hex',
              label: 'Hexbin',
            },
            {
              value: 'heat',
              label: 'Heatmap',
            },
          ],
        },
      })
      //ant
      .addNumberInput({
        path: 'ant.delay',
        name: 'Delay',
        category: ['Tack Map: Ant Path'],
        defaultValue: 400,
        showIf: (config) => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      .addNumberInput({
        path: 'ant.weight',
        name: 'Weight',
        category: ['Tack Map: Ant Path'],
        defaultValue: 5,
        showIf: (config) => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      .addColorPicker({
        path: 'ant.color',
        name: 'Color',
        category: ['Tack Map: Ant Path'],
        defaultValue: 'rgb(0, 100, 255)',
        showIf: (config) => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      .addColorPicker({
        path: 'ant.pulseColor',
        name: 'Pulse color',
        category: ['Tack Map: Ant Path'],
        defaultValue: 'rgb(0, 0, 0)',
        showIf: (config) => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      .addBooleanSwitch({
        path: 'ant.paused',
        name: 'Paused',
        category: ['Tack Map: Ant Path'],
        defaultValue: false,
        showIf: (config) => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      .addBooleanSwitch({
        path: 'ant.reverse',
        name: 'Reverse',
        category: ['Tack Map: Ant Path'],
        defaultValue: false,
        showIf: (config) => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      //heat
      .addBooleanSwitch({
        path: 'heat.fitBoundsOnLoad',
        name: 'Fit bounds on load',
        category: ['Tack Map: Heatmap'],
        defaultValue: false,
        showIf: (config) => config.viewType === 'heat',
      })
      .addBooleanSwitch({
        path: 'heat.fitBoundsOnUpdate',
        name: 'Fit bounds on update',
        category: ['Tack Map: Heatmap'],
        defaultValue: false,
        showIf: (config) => config.viewType === 'heat',
      })
      //marker
      .addNumberInput({
        path: 'marker.size',
        name: 'Size',
        category: ['Tack Map: Markers'],
        defaultValue: 25,
        showIf: (config) => config.viewType === 'marker' || config.viewType === 'ant-marker',
      })
      .addNumberInput({
        path: 'marker.sizeLast',
        name: 'Size of last marker',
        category: ['Tack Map: Markers'],
        defaultValue: 25,
        showIf: (config) => config.viewType === 'marker' || config.viewType === 'ant-marker',
      })
      .addBooleanSwitch({
        path: 'marker.showOnlyLastMarker',
        name: 'Show only last marker',
        category: ['Tack Map: Markers'],
        defaultValue: false,
        showIf: (config) => config.viewType === 'marker' || config.viewType === 'ant-marker',
      })
      .addBooleanSwitch({
        path: 'marker.alwaysShowTooltips',
        name: 'Always show tooltips',
        category: ['Tack Map: Markers'],
        defaultValue: false,
        showIf: (config) => config.viewType === 'marker' || config.viewType === 'ant-marker',
      })
      .addColorPicker({
        path: 'marker.defaultMarkerIconColor',
        name: 'Default Marker Icon Color',
        category: ['Tack Map: Markers'],
        defaultValue: '#F2495C',
        showIf: (config) => (config.viewType === 'marker' || config.viewType === 'ant-marker') && !config.marker.defaultMarkerIconUrl,
      })
      .addTextInput({
        path: 'marker.defaultMarkerIconUrl',
        name: 'Default Marker Icon URL',
        description: 'If you use a custom icon URL, the color option is no longer usable.',
        category: ['Tack Map: Markers'],
        defaultValue: '',
        showIf: (config) => config.viewType === 'marker' || config.viewType === 'ant-marker',
      })
      .addColorPicker({
        path: 'marker.secondaryMarkerIconColor',
        name: 'Secondary Marker Icon Color',
        category: ['Tack Map: Markers'],
        defaultValue: '#5794F2',
        showIf: (config) => (config.viewType === 'marker' || config.viewType === 'ant-marker') && !config.marker.secondaryMarkerIconUrl,
      })
      .addTextInput({
        path: 'marker.secondaryMarkerIconUrl',
        name: 'Secondary Marker Icon URL',
        description: 'If you use a custom icon URL, the color option is no longer usable.',
        category: ['Tack Map: Markers'],
        defaultValue: '',
        showIf: (config) => config.viewType === 'marker' || config.viewType === 'ant-marker',
      })
      .addBooleanSwitch({
        path: 'marker.useSecondaryForLastMarker',
        name: 'Use secondary style for last marker',
        category: ['Tack Map: Markers'],
        defaultValue: false,
        showIf: (config) => config.viewType === 'marker' || config.viewType === 'ant-marker',
      })
      .addBooleanSwitch({
        path: 'marker.useSecondaryForAllMarkers',
        name: 'Use secondary style for all markers',
        category: ['Tack Map: Markers'],
        defaultValue: false,
        showIf: (config) => config.viewType === 'marker' || config.viewType === 'ant-marker',
      })
      //hex
      .addNumberInput({
        path: 'hex.opacity',
        name: 'Opacity',
        category: ['Tack Map: Hexbin'],
        defaultValue: 0.6,
        showIf: (config) => config.viewType === 'hex',
      })
      .addTextInput({
        path: 'hex.colorRangeFrom',
        name: 'Color range from (hex)',
        category: ['Tack Map: Hexbin'],
        defaultValue: '#f7fbff',
        showIf: (config) => config.viewType === 'hex',
      })
      .addTextInput({
        path: 'hex.colorRangeTo',
        name: 'Color range to (hex)',
        category: ['Tack Map: Hexbin'],
        defaultValue: '#ff0000',
        showIf: (config) => config.viewType === 'hex',
      })
      .addNumberInput({
        path: 'hex.radiusRangeFrom',
        name: 'Radius range from',
        category: ['Tack Map: Hexbin'],
        defaultValue: 5,
        showIf: (config) => config.viewType === 'hex',
      })
      .addNumberInput({
        path: 'hex.radiusRangeTo',
        name: 'Radius range to',
        category: ['Tack Map: Hexbin'],
        defaultValue: 12,
        showIf: (config) => config.viewType === 'hex',
      })
  );
});
