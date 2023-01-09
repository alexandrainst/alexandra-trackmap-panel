import { PanelOptionsEditorBuilder, standardEditorsRegistry } from '@grafana/data';
import { TrackMapOptions } from './types';
import ColorMapEditor from './colorMapEditor';
import StringMapEditor from './stringMapEditor';

export const optionsBuilder = (builder: PanelOptionsEditorBuilder<TrackMapOptions>) => {
  return (
    builder
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
      .addBooleanSwitch({
        path: 'map.useCenterFromFirstPos',
        name: 'Map center to first position',
        defaultValue: false,
        showIf: (config) => !config.map.useCenterFromLastPos && !config.map.zoomToDataBounds,
      })
      .addBooleanSwitch({
        path: 'map.useCenterFromLastPos',
        name: 'Map center to last position',
        defaultValue: false,
        showIf: (config) => !config.map.useCenterFromFirstPos && !config.map.zoomToDataBounds,
      })
      .addBooleanSwitch({
        path: 'map.zoomToDataBounds',
        name: 'Zoom map to fit data bounds',
        defaultValue: false,
        showIf: (config) =>
          !config.map.useCenterFromFirstPos && !config.map.useCenterFromLastPos && !config.map.useBoundsInQuery,
      })
      .addNumberInput({
        path: 'map.centerLatitude',
        name: 'Map center latitude',
        defaultValue: 56.17203,
        showIf: (config) =>
          !config.map.useCenterFromFirstPos && !config.map.useCenterFromLastPos && !config.map.zoomToDataBounds,
      })
      .addNumberInput({
        path: 'map.centerLongitude',
        name: 'Map center longitude',
        defaultValue: 10.1865203,
        showIf: (config) =>
          !config.map.useCenterFromFirstPos && !config.map.useCenterFromLastPos && !config.map.zoomToDataBounds,
      })
      .addNumberInput({
        path: 'map.zoom',
        name: 'Map Zoom',
        defaultValue: 10,
        showIf: (config) => !config.map.zoomToDataBounds,
      })
      .addBooleanSwitch({
        path: 'map.useBoundsInQuery',
        name: 'Use map bounds in query',
        defaultValue: false,
        showIf: (config) => !config.map.zoomToDataBounds,
      })
      .addTextInput({
        path: 'map.tileUrlSchema',
        name: 'Custom map tiles URL schema',
        defaultValue: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      })
      .addTextInput({
        path: 'map.tileAttribution',
        name: 'Attribution HTML for tiles',
        defaultValue: '&copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      })
      .addTextInput({
        path: 'coordinates.customLatitudeColumnName',
        name: 'Custom latitude column name',
        defaultValue: '',
      })
      .addTextInput({
        path: 'coordinates.customLongitudeColumnName',
        name: 'Custom longitude column name',
        defaultValue: '',
      })
      .addBooleanSwitch({
        path: 'discardZeroOrNull',
        name: 'Discard positions that contain null or exactly 0',
        defaultValue: true,
      })
      //ant
      .addNumberInput({
        category: ['Ant Path'],
        path: 'ant.delay',
        name: 'Delay',
        defaultValue: 400,
        showIf: (config) => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      .addNumberInput({
        category: ['Ant Path'],
        path: 'ant.weight',
        name: 'Weight',
        defaultValue: 5,
        showIf: (config) => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      .addColorPicker({
        category: ['Ant Path'],
        path: 'ant.color',
        name: 'Color',
        defaultValue: 'rgba(0, 100, 255, 1)',
        showIf: (config) => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      .addColorPicker({
        category: ['Ant Path'],
        path: 'ant.pulseColor',
        name: 'Pulse color',
        defaultValue: 'rgba(0, 100, 255, 0.2)',
        showIf: (config) => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      .addBooleanSwitch({
        category: ['Ant Path'],
        path: 'ant.paused',
        name: 'Paused',
        defaultValue: false,
        showIf: (config) => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      /*TODO: Feature "Live track", concept of a "non-live" track, where lat/lon data is null for the latest timestamp, but exists within the panel's time window
      .addBooleanSwitch({
        category: ['Ant Path'],
        path: 'ant.pauseNonLiveTracks',
        name: 'Pause non-live tracks',
        defaultValue: true,
        showIf: config => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })*/
      .addBooleanSwitch({
        category: ['Ant Path'],
        path: 'ant.reverse',
        name: 'Reverse',
        defaultValue: false,
        showIf: (config) => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      .addBooleanSwitch({
        category: ['Ant Path'],
        path: 'ant.hardwareAccelerated',
        name: 'Hardware Acceleration',
        defaultValue: true,
        showIf: (config) => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      .addTextInput({
        category: ['Ant Path'],
        path: 'ant.labelName',
        name: 'Override label',
        description:
          'If a timeseries has a label with this key, it will be used to lookup an alternative color based on the label value',
        defaultValue: '',
        showIf: (config) => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      .addCustomEditor({
        id: 'ant.colorOverridesByLabel',
        category: ['Ant Path'],
        path: 'ant.colorOverridesByLabel',
        name: 'Color overrides by label',
        editor: ColorMapEditor as any,
        defaultValue: [],
        showIf: (config: TrackMapOptions) => config.viewType === 'ant' || config.viewType === 'ant-marker',
      })
      //heat
      .addNumberInput({
        category: ['Heat Map'],
        path: 'heat.maxValue',
        name: 'Maximum intensity',
        description: 'Value that is considered maximum intensity for heat map. Use 0 to autodetect.',
        defaultValue: 1.0,
        showIf: (config) => config.viewType === 'heat',
      })
      //marker
      .addNumberInput({
        category: ['Markers'],
        path: 'marker.size',
        name: 'Size',
        defaultValue: 25,
        showIf: (config) =>
          (config.viewType === 'marker' || config.viewType === 'ant-marker') && !config.marker.useHTMLForMarkers,
      })
      .addNumberInput({
        category: ['Markers'],
        path: 'marker.sizeLast',
        name: 'Size of last marker',
        defaultValue: 25,
        showIf: (config) =>
          (config.viewType === 'marker' || config.viewType === 'ant-marker') && !config.marker.useHTMLForMarkers,
      })
      .addBooleanSwitch({
        category: ['Markers'],
        path: 'marker.showOnlyLastMarker',
        name: 'Show only last marker',
        defaultValue: false,
        showIf: (config) => config.viewType === 'marker' || config.viewType === 'ant-marker',
      })
      .addBooleanSwitch({
        category: ['Markers'],
        path: 'marker.useSecondaryIconForLastMarker',
        name: 'Use secondary icon for last marker',
        defaultValue: false,
        showIf: (config) =>
          (config.viewType === 'marker' || config.viewType === 'ant-marker') && !config.marker.useHTMLForMarkers,
      })
      .addBooleanSwitch({
        category: ['Markers'],
        path: 'marker.useSecondaryIconForAllMarkers',
        name: 'Use secondary icon for all markers',
        defaultValue: false,
        showIf: (config) =>
          (config.viewType === 'marker' || config.viewType === 'ant-marker') && !config.marker.useHTMLForMarkers,
      })
      .addBooleanSwitch({
        category: ['Markers'],
        path: 'marker.useHTMLForMarkers',
        name: 'Use HTML for markers',
        defaultValue: false,
        showIf: (config) => config.viewType === 'marker' || config.viewType === 'ant-marker',
      })
      .addNumberInput({
        category: ['Markers'],
        path: 'marker.customIconWidth',
        name: 'Custom icon width (empty if using HTML/SVG with inline size)',
        defaultValue: undefined,
        showIf: (config) =>
          (config.viewType === 'marker' || config.viewType === 'ant-marker') && config.marker.useHTMLForMarkers,
      })
      .addNumberInput({
        category: ['Markers'],
        path: 'marker.customIconHeight',
        name: 'Custom icon height (empty if using HTML/SVG with inline size)',
        defaultValue: undefined,
        showIf: (config) =>
          (config.viewType === 'marker' || config.viewType === 'ant-marker') && config.marker.useHTMLForMarkers,
      })
      .addTextInput({
        category: ['Markers'],
        path: 'marker.defaultHtml',
        name: 'Default marker HTML',
        description:
          'If the timeseries does not have a label with the key from the "Override label", the default marker will be used',
        defaultValue: `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="25px" height="25px" viewBox="0 0 25 25" version="1.1"><g id="surface1"><path style=" stroke:none;fill-rule:nonzero;fill:rgb(100%,50%,50%);fill-opacity:0.8;" d="M 12.515625 0 L 12.480469 0 C 8.164062 0 4.652344 3.511719 4.652344 7.828125 C 4.652344 10.65625 5.941406 14.386719 8.480469 18.921875 C 10.363281 22.285156 12.273438 24.859375 12.292969 24.882812 C 12.347656 24.957031 12.429688 24.996094 12.519531 24.996094 C 12.523438 24.996094 12.523438 24.996094 12.527344 24.996094 C 12.617188 24.996094 12.703125 24.949219 12.753906 24.871094 C 12.773438 24.84375 14.667969 21.980469 16.539062 18.476562 C 19.066406 13.75 20.347656 10.164062 20.347656 7.828125 C 20.347656 3.511719 16.832031 0 12.515625 0 Z M 16.128906 8.019531 C 16.128906 10.019531 14.5 11.648438 12.5 11.648438 C 10.496094 11.648438 8.867188 10.019531 8.867188 8.019531 C 8.867188 6.015625 10.496094 4.386719 12.5 4.386719 C 14.5 4.386719 16.128906 6.015625 16.128906 8.019531 Z M 16.128906 8.019531 "/></g></svg>`,
        showIf: (config) =>
          (config.viewType === 'marker' || config.viewType === 'ant-marker') && config.marker.useHTMLForMarkers,
      })
      .addTextInput({
        category: ['Markers'],
        path: 'marker.labelName',
        name: 'Override label',
        description:
          'If a timeseries has a label with this key, it will be used to lookup an alternative HTML marker based on the label value',
        defaultValue: '',
        showIf: (config) =>
          (config.viewType === 'marker' || config.viewType === 'ant-marker') && config.marker.useHTMLForMarkers,
      })
      .addCustomEditor({
        category: ['Markers'],
        id: 'marker.markerHtmlByLabel',
        path: 'marker.markerHtmlByLabel',
        name: 'Marker HTML overrides by label',
        editor: StringMapEditor as any,
        defaultValue: [],
        showIf: (config) =>
          (config.viewType === 'marker' || config.viewType === 'ant-marker') && config.marker.useHTMLForMarkers,
      })
      /*TODO: Feature "Live track", concept of a "non-live" track, where lat/lon data is null for the latest timestamp, but exists within the panel's time window
      .addBooleanSwitch({
        category: ['Markers'],
        path: 'marker.showOnlyLiveTracks',
        name: 'Show last marker only for tracks still present at the end of the time window (i.e. still live)',
        defaultValue: true,
        showIf: config => config.viewType === 'marker' || config.viewType === 'ant-marker',
      })*/
      .addBooleanSwitch({
        category: ['Markers'],
        path: 'marker.alwaysShowTooltips',
        name: 'Always show tooltips',
        defaultValue: false,
        showIf: (config) => config.viewType === 'marker' || config.viewType === 'ant-marker',
      })
      .addTextInput({
        category: ['Markers'],
        path: 'marker.tooltipOffset',
        name: 'Tooltip offset: x,y',
        defaultValue: '',
        showIf: (config) => config.viewType === 'marker',
      })
      .addTextInput({
        category: ['Markers'],
        path: 'marker.popupOffset',
        name: 'Popup offset: x,y',
        defaultValue: '',
        showIf: (config) => config.viewType === 'marker',
      })
      .addTextInput({
        category: ['Markers'],
        path: 'marker.iconOffset',
        name: 'Icon offset: x,y',
        defaultValue: '',
        showIf: (config) => config.viewType === 'marker',
      })
      //hex
      .addNumberInput({
        category: ['HexBin'],
        path: 'hex.opacity',
        name: 'Opacity',
        defaultValue: 0.6,
        showIf: (config) => config.viewType === 'hex',
      })
      .addTextInput({
        category: ['HexBin'],
        path: 'hex.colorRangeFrom',
        name: 'Color range from (hex)',
        defaultValue: '#f7fbff',
        showIf: (config) => config.viewType === 'hex',
      })
      .addTextInput({
        category: ['HexBin'],
        path: 'hex.colorRangeTo',
        name: 'Color range to (hex)',
        defaultValue: '#ff0000',
        showIf: (config) => config.viewType === 'hex',
      })
      .addNumberInput({
        category: ['HexBin'],
        path: 'hex.radiusRangeFrom',
        name: 'Radius range from',
        defaultValue: 5,
        showIf: (config) => config.viewType === 'hex',
      })
      .addNumberInput({
        category: ['HexBin'],
        path: 'hex.radiusRangeTo',
        name: 'Radius range to',
        defaultValue: 12,
        showIf: (config) => config.viewType === 'hex',
      })
  );
};
