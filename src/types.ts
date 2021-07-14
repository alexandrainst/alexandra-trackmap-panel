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
  tileSubDomains: string[];
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
  showOnlyLastMarker: boolean;
  showOnlyLiveTracks: boolean;
  alwaysShowTooltips: boolean;
  defaultHtml: string;
  labelName: string;
  markerHtmlByLabel: KeyValue[];
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
