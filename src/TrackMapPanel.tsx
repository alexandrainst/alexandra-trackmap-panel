import React, { ReactElement, useEffect } from 'react';
import { PanelProps } from '@grafana/data';
import { getLocationSrv } from '@grafana/runtime';
import { TrackMapOptions, Position } from 'types';
import { css, cx } from 'emotion';
import { stylesFactory } from '@grafana/ui';
import { FeatureCollection, Feature } from 'geojson';
import { Map, TileLayer, Marker, Popup, withLeaflet } from 'react-leaflet';
import { Icon, LeafletEvent, LatLngBounds } from 'leaflet';
import './leaflet.css';
import 'leaflet/dist/leaflet.css';
import { useRef } from 'react';

const AntPath = require('react-leaflet-ant-path').default;
const HeatmapLayer = require('react-leaflet-heatmap-layer').default;
const HexbinLayer = require('react-leaflet-d3').HexbinLayer;

interface Props extends PanelProps<TrackMapOptions> {}

export const TrackMapPanel: React.FC<Props> = ({ options, data, width, height }) => {
  const styles = getStyles();
  const mapRef = useRef<Map | null>(null);

  const WrappedHexbinLayer: any = withLeaflet(HexbinLayer);

  const mark = new Icon({
    iconUrl: require('img/marker.png'),
    iconSize: [options.marker.size, options.marker.size],
  });

  useEffect(() => {
    if (mapRef.current !== null) {
      const bounds = mapRef.current.leafletElement.getBounds();
      updateMap(bounds);
    }
    // eslint-disable-next-line
  }, []);
  
  let latitudes: number[] | undefined = data.series
    .find(f => f.name === 'latitude' || f.name === 'lat')
    ?.fields.find(f => f.name === 'Value')?.values?.toArray();
  
  let longitudes: number[] | undefined = data.series
    .find(f => f.name === 'longitude' || f.name === 'lon')
    ?.fields.find(f => f.name === 'Value')?.values?.toArray();
  
  let intensities: number[] | undefined = data.series
    .find(f => f.name === 'intensity')
    ?.fields.find(f => f.name === 'Value')?.values?.toArray();
  
  if(!latitudes && data.series?.length) {
    latitudes = data.series[0].fields
    .find(f => f.name === 'latitude' || f.name === 'lat')
    ?.values.toArray();
  }

  if(!longitudes && data.series?.length) {
    longitudes = data.series[0].fields
    .find(f => f.name === 'longitude' || f.name === 'lon')
    ?.values.toArray();
  }

  if(!intensities && data.series?.length)
  {
    intensities = data.series[0].fields.find(f => f.name === 'intensity')?.values.toArray();
  }

  let positions: Position[] | undefined = latitudes?.map((latitude, index) => {
    return {
      latitude,
      longitude: longitudes !== undefined ? longitudes[index] : 0,
    };
  });

  if (!positions || positions.length == 0) {
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

  const markers: ReactElement[] = [];
  positions?.forEach((p, i) => {
    markers.push(
      <Marker key={i} position={[p.latitude, p.longitude]} icon={mark}>
        <Popup>
          {p.latitude}, {p.longitude}
        </Popup>
      </Marker>
    );
  });

  const antOptions = {
    delay: options.ant.delay,
    dashArray: [10, 20],
    weight: options.ant.weight,
    color: options.ant.color,
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

  const onMapLoad = (event: LeafletEvent) => {
    updateMap(event.target.getBounds());
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
  const mapCenter = {lat:options.map.centerLatitude, lon: options.map.centerLongitude};

  if (options.map.useCenterFromFirstPos && positions?.length && positions[0].latitude) {
    mapCenter.lat =  positions[0].latitude;
    mapCenter.lon = positions[0].longitude;
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
        center={[mapCenter.lat, mapCenter.lon]}
        zoom={options.map.zoom}
        onload={(event: LeafletEvent) => {
          onMapLoad(event);
        }}
        onmoveend={(event: LeafletEvent) => {
          onMapMoveEnd(event);
        }}
      >
        {(options.viewType === 'ant' || options.viewType === 'ant-marker') && <AntPath positions={antData} options={antOptions} />}
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
