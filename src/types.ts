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

interface AntOptions {
  delay: number;
  weight: number;
  color: string;
  pulseColor: string;
  paused: boolean;
  reverse: boolean;
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
  alwaysShowTooltips: boolean;
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
}
