import React, { ReactElement, useEffect, useMemo } from 'react';
import { PanelProps, getColorFromHexRgbOrName, getColorForTheme } from '@grafana/data';
import { getLocationSrv } from '@grafana/runtime';
import { TrackMapOptions, Position } from 'types';
import { css, cx } from 'emotion';
import { stylesFactory, getTheme } from '@grafana/ui';
import { FeatureCollection, Feature } from 'geojson';
import { Map, TileLayer, Marker, Popup, Tooltip, withLeaflet } from 'react-leaflet';
import { Icon, LeafletEvent, LatLngBounds, LatLngBoundsExpression, DivIcon, DivIconOptions } from 'leaflet';
import './leaflet.css';
import 'leaflet/dist/leaflet.css';
import { useRef } from 'react';

const AntPath = require('react-leaflet-ant-path').default;
const HeatmapLayer = require('react-leaflet-heatmap-layer').default;
const HexbinLayer = require('react-leaflet-d3').HexbinLayer;

interface Props extends PanelProps<TrackMapOptions> {}

export const TrackMapPanel: React.FC<Props> = ({ options, data, width, height }) => {
  const styles = getStyles();
  const theme = getTheme();
  const mapRef = useRef<Map | null>(null);

  const WrappedHexbinLayer: any = withLeaflet(HexbinLayer);

  useEffect(() => {
    if (mapRef.current !== null) {
      if (options.map.zoomToDataBounds) {
        const bounds = getBoundsFromPositions(positions);
        mapRef.current.leafletElement.fitBounds(bounds, { animate: false });
      }
      const bounds = mapRef.current.leafletElement.getBounds();
      updateMap(bounds);
    }
    // eslint-disable-next-line
  }, []);

  let latitudes: number[] | undefined = data.series
    .find((f) => f.name === 'latitude' || f.name === 'lat')
    ?.fields.find((f) => f.name === 'Value')
    ?.values?.toArray();

  let longitudes: number[] | undefined = data.series
    .find((f) => f.name === 'longitude' || f.name === 'lon')
    ?.fields.find((f) => f.name === 'Value')
    ?.values?.toArray();

  let intensities: number[] | undefined = data.series
    .find((f) => f.name === 'intensity')
    ?.fields.find((f) => f.name === 'Value')
    ?.values?.toArray();

  let markerPopups: string[] | undefined = data.series
    .find((f) => f.name === 'popup' || f.name === 'text' || f.name === 'desc')
    ?.fields.find((f) => f.name === 'Value')
    ?.values?.toArray();

  let markerTooltips: string[] | undefined = data.series
    .find((f) => f.name === 'tooltip')
    ?.fields.find((f) => f.name === 'Value')
    ?.values?.toArray();

    let markerIconColors: string[] | undefined = data.series
      .find((f) => f.name === 'iconColor')
      ?.fields.find((f) => f.name === 'Value')
      ?.values?.toArray();

    let markerIconUrls: string[] | undefined = data.series
      .find((f) => f.name === 'iconUrl')
      ?.fields.find((f) => f.name === 'Value')
      ?.values?.toArray();

  if (!latitudes && data.series?.length) {
    latitudes = data.series[0].fields.find((f) => f.name === 'latitude' || f.name === 'lat')?.values.toArray();
  }

  if (!longitudes && data.series?.length) {
    longitudes = data.series[0].fields.find((f) => f.name === 'longitude' || f.name === 'lon')?.values.toArray();
  }

  if (!intensities && data.series?.length) {
    intensities = data.series[0].fields.find((f) => f.name === 'intensity')?.values.toArray();
  }

  if (!markerPopups && data.series?.length) {
    markerPopups = data.series[0].fields
      .find((f) => f.name === 'popup' || f.name === 'text' || f.name === 'desc')
      ?.values.toArray();
  }

  if (!markerTooltips && data.series?.length) {
    markerTooltips = data.series[0].fields.find((f) => f.name === 'tooltip')?.values.toArray();
  }

  if (!markerIconColors && data.series?.length) {
    markerIconColors = data.series[0].fields.find((f) => f.name === 'iconColor')?.values.toArray();
  }

  if (!markerIconUrls && data.series?.length) {
    markerIconUrls = data.series[0].fields.find((f) => f.name === 'iconUrl')?.values.toArray();
  }
  
  let positions: Position[] = [];

  let timeLatitudes: number[] | undefined = data.series
    .find((f) => f.name === 'latitude' || f.name === 'lat')
    ?.fields.find((f) => f.name === 'Time')
    ?.values?.toArray();

  let timeLongitudes: number[] | undefined = data.series
    .find((f) => f.name === 'longitude' || f.name === 'lon')
    ?.fields.find((f) => f.name === 'Time')
    ?.values?.toArray();

  latitudes?.forEach((latitude, i) => {
    const longitude = longitudes !== undefined ? longitudes[i] : 0;
    const popup = markerPopups !== undefined ? markerPopups[i] : `${latitude}, ${longitude}`;
    const tooltip = markerTooltips !== undefined ? markerTooltips[i] : undefined;
    const iconColor = markerIconColors !== undefined ? markerIconColors[i] : undefined;
    const iconUrl = markerIconUrls !== undefined ? markerIconUrls[i] : undefined;

    if (!options.discardZeroOrNull && (typeof longitude !== 'number' || longitude === 0)) {
      const time = timeLongitudes !== undefined ? timeLongitudes[i] : 0;
      throw new Error(`Longitude is null or equal to 0 at time ${new Date(time)} and index ${i + 1}`);
    }
    if (!options.discardZeroOrNull && (typeof latitude !== 'number' || latitude === 0)) {
      const time = timeLatitudes !== undefined ? timeLatitudes[i] : 0;
      throw new Error(`Latitude is null or equal to 0 at time ${new Date(time)} and at index ${i + 1}`);
    }

    if (
      !options.discardZeroOrNull ||
      (options.discardZeroOrNull &&
        typeof longitude === 'number' &&
        typeof latitude === 'number' &&
        longitude !== 0 &&
        latitude !== 0)
    ) {
      positions.push({
        latitude,
        longitude,
        popup,
        tooltip,
        iconColor,
        iconUrl
      });
    }
  });

  if (!positions || positions.length === 0) {
    positions = [{ latitude: 0, longitude: 0 }];
  }
  
  const heatData: any[] = [];
  const antData: number[][] = [];
  const hexData: FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };

  positions?.forEach((p, i) => {
    heatData.push([p.latitude, p.longitude, intensities !== undefined ? intensities[i] : '']);
    antData.push([p.latitude, p.longitude]);
    hexData.features.push({
      type: 'Feature',
      id: i,
      geometry: {
        type: 'Point',
        coordinates: [p.longitude, p.latitude],
      },
    } as Feature);
  });

  const createIcon = (size: number, url: string|undefined = undefined, color: string|undefined = undefined) => {
    const svgColor = (color) ? getColorForTheme(color, theme) : '#F2495C';
    let iconConfig: DivIconOptions = {
      iconUrl: url,
      iconSize: [size, size],
      iconAnchor: [size * 0.5, size],
      popupAnchor: [0, -size],
      html: `
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 15 15" >
          <path stroke="rgba(0,0,0,0.2)" stroke-width="0.5px" fill="${svgColor}" d="
            M7.5,0C5.1,0,2.2,1.5,2.2,5.3c0,2.6,4.1,8.2,5.3,9.7c1.1-1.5,5.3-7,5.3-9.7C12.8,1.5,9.9,0,7.5,0z
            M7.5,7.4c-1.3,0-2.3-1-2.3-2.3c0-1.3,1-2.3,2.3-2.3s2.3,1,2.3,2.3C9.8,6.3,8.8,7.4,7.5,7.4z
          " />
        </svg>
      `
    }
    return (!!url) ? new Icon(iconConfig) : new DivIcon(iconConfig);
  };

  const markers: ReactElement[] = useMemo((): ReactElement[] => {
    let markers: ReactElement[] = [];
    if (positions?.length > 0) {
      positions.forEach((p, i) => {
        const isLastPosition = i + 1 === positions?.length;
        const useSecondary= options.marker.useSecondaryForAllMarkers || (options.marker.useSecondaryForLastMarker && isLastPosition);
        const icon: Icon | DivIcon = createIcon(
          isLastPosition ? options.marker.sizeLast : options.marker.size,
          p.iconUrl || (!useSecondary ? options.marker.defaultMarkerIconUrl : options.marker.secondaryMarkerIconUrl),
          p.iconColor || (!useSecondary ? options.marker.defaultMarkerIconColor : options.marker.secondaryMarkerIconColor)
        );
        markers.push(
          <Marker key={i} position={[p.latitude, p.longitude]} icon={icon} title={p.popup}>
            <Popup>{p.popup}</Popup>
            {p.tooltip && <Tooltip permanent={options.marker.alwaysShowTooltips}>{p.tooltip}</Tooltip>}
          </Marker>
        );
      });
    }
    return options.marker.showOnlyLastMarker ? [markers[markers.length - 1]] : markers;
  }, [positions, options.marker]);

  const antOptions = {
    delay: options.ant.delay,
    dashArray: [10, 20],
    weight: options.ant.weight,
    color: getColorForTheme(options.ant.color, theme),
    pulseColor: options.ant.pulseColor,
    paused: options.ant.paused,
    reverse: options.ant.reverse,
  };

  const hexbinOptions = {
    opacity: options.hex.opacity,
    colorScaleExtent: [1, undefined],
    radiusScaleExtent: [1, undefined],
    colorRange: [options.hex.colorRangeFrom, options.hex.colorRangeTo],
    radiusRange: [options.hex.radiusRangeFrom, options.hex.radiusRangeTo],
  };

  const onMapMoveEnd = (event: LeafletEvent) => {
    if (mapRef.current !== null) {
      mapRef.current.leafletElement.invalidateSize();
    }
    updateMap(event.target.getBounds());
  };

  const updateQueryVariables = (minLat: number, minLon: number, maxLat: number, maxLon: number) => {
    getLocationSrv().update({
      query: {
        'var-minLat': minLat,
        'var-maxLat': maxLat,
        'var-minLon': minLon,
        'var-maxLon': maxLon,
      },
      partial: true,
      replace: true,
    });
  };

  const updateMap = (bounds: LatLngBounds) => {
    const minLat = bounds.getSouthWest().lat;
    const minLon = bounds.getSouthWest().lng;
    const maxLat = bounds.getNorthEast().lat;
    const maxLon = bounds.getNorthEast().lng;
    if (options.map.useBoundsInQuery) {
      updateQueryVariables(minLat, minLon, maxLat, maxLon);
    }
  };

  const getBoundsFromPositions = (positions: Position[] | undefined): LatLngBoundsExpression => {
    if (positions === undefined) {
      return [
        [0, 0],
        [0, 0],
      ];
    }

    const minLon = positions
      .map((p) => p.longitude)
      .reduce((previousValue, currentValue) => Math.min(previousValue, currentValue), 0);
    const maxLon = positions
      .map((p) => p.longitude)
      .reduce((previousValue, currentValue) => Math.max(previousValue, currentValue), 0);
    const minLat = positions
      .map((p) => p.latitude)
      .reduce((previousValue, currentValue) => Math.min(previousValue, currentValue), 0);
    const maxLat = positions
      .map((p) => p.latitude)
      .reduce((previousValue, currentValue) => Math.max(previousValue, currentValue), 0);

    return [
      [minLat, minLon],
      [maxLat, maxLon],
    ];
  };

  const mapCenter: Position = {
    latitude: options.map.centerLatitude,
    longitude: options.map.centerLongitude,
  };

  if (options.map.useCenterFromFirstPos && positions?.length && positions[0].latitude) {
    mapCenter.latitude = positions[0].latitude;
    mapCenter.longitude = positions[0].longitude;
  }

  if (positions?.length) {
    if (options.map.useCenterFromFirstPos && positions[0].latitude) {
      mapCenter.latitude = positions[0].latitude;
      mapCenter.longitude = positions[0].longitude;
    }
    if (
      !options.map.useCenterFromFirstPos &&
      options.map.useCenterFromLastPos &&
      positions[positions.length - 1].latitude
    ) {
      mapCenter.latitude = positions[positions.length - 1].latitude;
      mapCenter.longitude = positions[positions.length - 1].longitude;
    }
  }

  return (
    <div
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
        `
      )}
    >
      <Map
        ref={mapRef}
        center={[mapCenter.latitude, mapCenter.longitude]}
        zoom={options.map.zoom}
        zoomSnap={0.5}
        onmoveend={(event: LeafletEvent) => {
          onMapMoveEnd(event);
        }}
      >
        {(options.viewType === 'ant' || options.viewType === 'ant-marker') && (
          <AntPath positions={antData} options={antOptions} />
        )}
        {options.viewType === 'heat' && (
          <HeatmapLayer
            fitBoundsOnLoad={options.heat.fitBoundsOnLoad}
            fitBoundsOnUpdate={options.heat.fitBoundsOnUpdate}
            points={heatData}
            longitudeExtractor={(m: any) => m[1]}
            latitudeExtractor={(m: any) => m[0]}
            intensityExtractor={(m: any) => parseFloat(m[2])}
          />
        )}
        {options.viewType === 'hex' && <WrappedHexbinLayer {...hexbinOptions} data={hexData} />}
        {(options.viewType === 'marker' || options.viewType === 'ant-marker') && markers}
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </Map>
    </div>
  );
};

const getStyles = stylesFactory(() => {
  return {
    wrapper: css`
      position: relative;
    `,
  };
});
