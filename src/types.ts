type ViewType = 'ant' | 'hex' | 'heat' | 'marker' | 'ant-marker';

export interface TrackMapOptions {
  text: string;
  map: Map;
  viewType: ViewType;
  ant: AntOptions;
  heat: HeatOptions;
  marker: MarkerOptions;
  hex: HexOptions;
}

interface Map {
  centerLatitude: number;
  centerLongitude: number;
  zoom: number;
  useBoundsInQuery: boolean;
  useCenterFromFirstPos: boolean;
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
}
