import { PanelPlugin } from '@grafana/data';
import { TrackMapPanel } from './TrackMapPanel';
import { TrackMapOptions } from './types';

export const plugin = new PanelPlugin<TrackMapOptions>(TrackMapPanel).setPanelOptions(builder => {
  return (
    builder
      .addBooleanSwitch({
        path: 'map.useCenterFromFirstPos',
        name: 'Map center to first position',
        defaultValue: false,
        showIf: config => !config.map.useCenterFromLastPos && !config.map.zoomToDataBounds,
      })
      .addBooleanSwitch({
        path: 'map.useCenterFromLastPos',
        name: 'Map center to last position',
        defaultValue: false,
        showIf: config => !config.map.useCenterFromFirstPos && !config.map.zoomToDataBounds,
      })
      .addBooleanSwitch({
        path: 'map.zoomToDataBounds',
        name: 'Zoom map to fit data bounds',
        defaultValue: false,
        showIf: config =>
          !config.map.useCenterFromFirstPos && !config.map.useCenterFromLastPos && !config.map.useBoundsInQuery,
      })
      .addNumberInput({
        path: 'map.centerLatitude',
        name: 'Map center latitude',
        defaultValue: 56.17203,
        showIf: config =>
          !config.map.useCenterFromFirstPos && !config.map.useCenterFromLastPos && !config.map.zoomToDataBounds,
      })
      .addNumberInput({
        path: 'map.centerLongitude',
        name: 'Map center longitude',
        defaultValue: 10.1865203,
        showIf: config =>
          !config.map.useCenterFromFirstPos && !config.map.useCenterFromLastPos && !config.map.zoomToDataBounds,
      })
      .addNumberInput({
        path: 'map.zoom',
        name: 'Map Zoom',
        defaultValue: 10,
        showIf: config => !config.map.zoomToDataBounds,
      })
      .addBooleanSwitch({
        path: 'map.useBoundsInQuery',
        name: 'Use map bounds in query',
        defaultValue: false,
        showIf: config => !config.map.zoomToDataBounds,
      })
      .addSelect({
        path: 'viewType',
        defaultValue: 'marker',
        name: 'Visualisation type',
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
        defaultValue: 400,
        showIf: config => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      .addNumberInput({
        path: 'ant.weight',
        name: 'Weight',
        defaultValue: 5,
        showIf: config => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      .addColorPicker({
        path: 'ant.color',
        name: 'Color',
        defaultValue: 'rgb(0, 100, 255)',
        showIf: config => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      .addColorPicker({
        path: 'ant.pulseColor',
        name: 'Pulse color',
        defaultValue: 'rgb(0, 0, 0)',
        showIf: config => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      .addBooleanSwitch({
        path: 'ant.paused',
        name: 'Paused',
        defaultValue: false,
        showIf: config => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      .addBooleanSwitch({
        path: 'ant.reverse',
        name: 'Reverse',
        defaultValue: false,
        showIf: config => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      //heat
      .addBooleanSwitch({
        path: 'heat.fitBoundsOnLoad',
        name: 'Fit bounds on load',
        defaultValue: false,
        showIf: config => config.viewType === 'heat',
      })
      .addBooleanSwitch({
        path: 'heat.fitBoundsOnUpdate',
        name: 'Fit bounds on update',
        defaultValue: false,
        showIf: config => config.viewType === 'heat',
      })
      //marker
      .addNumberInput({
        path: 'marker.size',
        name: 'Size',
        defaultValue: 25,
        showIf: config => config.viewType === 'marker' || config.viewType === 'ant-marker',
      })
      .addNumberInput({
        path: 'marker.sizeLast',
        name: 'Size of last marker',
        defaultValue: 25,
        showIf: config => config.viewType === 'marker' || config.viewType === 'ant-marker',
      })
      .addBooleanSwitch({
        path: 'marker.showOnlyLastMarker',
        name: 'Show only last marker',
        defaultValue: false,
        showIf: config => config.viewType === 'marker' || config.viewType === 'ant-marker',
      })
      .addBooleanSwitch({
        path: 'marker.useSecondaryIconForLastMarker',
        name: 'Use secondary icon for last marker',
        defaultValue: false,
        showIf: config => config.viewType === 'marker' || config.viewType === 'ant-marker',
      })
      .addBooleanSwitch({
        path: 'marker.useSecondaryIconForAllMarkers',
        name: 'Use secondary icon for all markers',
        defaultValue: false,
        showIf: config => config.viewType === 'marker' || config.viewType === 'ant-marker',
      })
      .addBooleanSwitch({
        path: 'marker.alwaysShowTooltips',
        name: 'Always show tooltips',
        defaultValue: false,
        showIf: config => config.viewType === 'marker' || config.viewType === 'ant-marker',
      })
      //hex
      .addNumberInput({
        path: 'hex.opacity',
        name: 'Opacity',
        defaultValue: 0.6,
        showIf: config => config.viewType === 'hex',
      })
      .addTextInput({
        path: 'hex.colorRangeFrom',
        name: 'Color range from (hex)',
        defaultValue: '#f7fbff',
        showIf: config => config.viewType === 'hex',
      })
      .addTextInput({
        path: 'hex.colorRangeTo',
        name: 'Color range to (hex)',
        defaultValue: '#ff0000',
        showIf: config => config.viewType === 'hex',
      })
      .addNumberInput({
        path: 'hex.radiusRangeFrom',
        name: 'Radius range from',
        defaultValue: 5,
        showIf: config => config.viewType === 'hex',
      })
      .addNumberInput({
        path: 'hex.radiusRangeTo',
        name: 'Radius range to',
        defaultValue: 12,
        showIf: config => config.viewType === 'hex',
      })
  );
});
