import { Labels } from '@grafana/data';
import { LabelColor } from './colorMapEditor';
import { KeyValue } from './stringMapEditor';

type ViewType = 'ant' | 'hex' | 'heat' | 'marker' | 'ant-marker';

export interface TrackMapOptions {
  text: string;
  map: Map;
  viewType: ViewType;
  ant: AntOptions;
  coordinates: CoordinateOptions;
  heat: HeatOptions;
  marker: MarkerOptions;
  hex: HexOptions;
  discardZeroOrNull: boolean;
}

interface Map {
  tileUrl: string;
  tileAttribution: string;
  tileAccessToken: string;
  tileSubdomains: string[];
  centerLatitude: number;
  centerLongitude: number;
  zoomToDataBounds: boolean;
  zoom: number;
  useBoundsInQuery: boolean;
  useCenterFromFirstPos: boolean;
  useCenterFromLastPos: boolean;
  tileUrlSchema: string;
}

interface CoordinateOptions {
  customLatitudeColumnName: string;
  customLongitudeColumnName: string;
}

export interface AntOptions {
  delay: number;
  weight: number;
  color: string;
  pulseColor: string;
  paused: boolean;
  pauseNonLiveTracks: boolean;
  labelName: string;
  colorOverridesByLabel: LabelColor[];
  reverse: boolean;
}

export interface AntData {
  options: any;
  data: number[][];
}

interface HeatOptions {
  fitBoundsOnLoad: boolean;
  fitBoundsOnUpdate: boolean;
}

interface MarkerOptions {
  size: number;
  sizeLast: number;
  showOnlyLastMarker: boolean;
  useSecondaryIconForAllMarkers: boolean;
  useSecondaryIconForLastMarker: boolean;
  useHTMLForMarkers: boolean;
  alwaysShowTooltips: boolean;
  markerHtmlByLabel: KeyValue[];
  labelName: string;
  defaultHtml: string;
  //TODO: Feature "Live track", concept of a "non-live" track, where lat/lon data is null for the latest timestamp, but exists within the panel's time window
  //showOnlyLiveTracks: boolean;
}

interface HexOptions {
  opacity: number;
  colorRangeFrom: string;
  colorRangeTo: string;
  radiusRangeFrom: number;
  radiusRangeTo: number;
}

export interface Position {
  latitude: number;
  longitude: number;
  popup?: string;
  tooltip?: string;
  icon?: string;
  labels?: Labels;
}
