import React, { useEffect, useRef, ReactNode, useMemo } from 'react';
import { Labels, PanelProps } from '@grafana/data';
import { Position, TrackMapOptions, AntData } from 'types';
import { css, cx } from 'emotion';
import { Feature, FeatureCollection } from 'geojson';
import { Map, Marker, Popup, TileLayer, Tooltip, withLeaflet } from 'react-leaflet';
import { DivIcon, LatLngBounds, LatLngBoundsExpression, LeafletEvent } from 'leaflet';
import './leaflet.css';
import 'leaflet/dist/leaflet.css';
import styled from 'styled-components';
import { getLocationSrv } from '@grafana/runtime';
import { stylesFactory } from '@grafana/ui';
import ReactHtmlParser from 'react-html-parser';

const AntPath = require('react-leaflet-ant-path').default;
const HeatmapLayer = require('react-leaflet-heatmap-layer').default;
const HexbinLayer = require('react-leaflet-d3').HexbinLayer;

const StyledPopup = styled(Popup)`
  .leaflet-popup-content-wrapper {
    white-space: pre-wrap;
  }

  .leaflet-popup-tip-container {
    visibility: hidden;
  }
`;

export const TrackMapPanel = ({ options, data, width, height }: PanelProps<TrackMapOptions>) => {
  const styles = getStyles();
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

  const isLatitudeName = (name: string | undefined): boolean => {
    const customLatitudeName = options.coordinates.customLatitudeColumnName !== '' ? options.coordinates.customLatitudeColumnName : ''
    return name !== '' && (name === 'latitude' || name === 'lat' || name === customLatitudeName)
  }

  const isLongitudeName = (name: string | undefined): boolean => {
    const customLongitudeName = options.coordinates.customLongitudeColumnName !== '' ? options.coordinates.customLongitudeColumnName : ''
    return name !== '' && (name === 'longitude' || name === 'lon' || name === customLongitudeName)
  }

  const getAntPathColorOverridesMemoized = (): (() => { [key: string]: string }) => {
    let antPathColorOverrides: { [key: string]: string } = {};
    return () => {
      if (Object.keys(antPathColorOverrides).length === 0) {
        if (options.ant.colorOverridesByLabel?.length) {
          options.ant.colorOverridesByLabel.forEach((labelColor: any) => {
            antPathColorOverrides[labelColor.label] = labelColor.color;
          });
        }
      }
      return antPathColorOverrides;
    };
  };

  const getMarkerHtmlOverridesMemoized = (): (() => { [key: string]: string }) => {
    let markerHtmlOverrides: { [key: string]: string } = {};
    return () => {
      if (Object.keys(markerHtmlOverrides).length === 0) {
        if (options.marker.markerHtmlByLabel?.length) {
          options.marker.markerHtmlByLabel.forEach((keyVal: any) => {
            markerHtmlOverrides[keyVal.key] = keyVal.value;
          });
        }
      }
      return markerHtmlOverrides;
    };
  };

  //TODO: Test
  const getAntPathColorOverrides = getAntPathColorOverridesMemoized();
  const getMarkerHtmlOverrides = getMarkerHtmlOverridesMemoized();

  let latitudes: number[][] | undefined = data.series
    .map(s => s.fields.find(f => isLatitudeName(f.name))?.values.toArray() as number[]);

  //time series
  if (!latitudes?.some(l => l !== undefined)) {
    latitudes = data.series
      .filter(f => isLatitudeName(f.name))
      ?.map(f1 => f1.fields.find(f => f.name === 'Value')?.values?.toArray() as number[]);
  }

  let longitudes: number[][] | undefined = data.series
    .map(s => s.fields.find(f => isLongitudeName(f.name))?.values.toArray() as number[]);
  
  //time series
  if (!longitudes?.some(l => l !== undefined)) {
    longitudes = data.series
      .filter(f => isLongitudeName(f.name))
      ?.map(f1 => f1.fields.find(f => f.name === 'Value')?.values?.toArray() as number[]);
  }

  //TODO: Test/fix timestamps and labels
  const timestamps: number[][] | undefined = data.series
    .filter((f) => isLatitudeName(f.name))
    ?.map((f1) => f1.fields.find((f) => f.name === 'Time')?.values?.toArray() as number[]);

  const labels: Array<Labels | undefined> = data.series
    .filter((f) => isLatitudeName(f.name))
    ?.map((f1) => f1.fields.find((f) => f.name === 'Value')?.labels);

  //TODO: Feature "Live track", concept of a "non-live" track, where lat/lon data is null for the latest timestamp, but exists within the panel's time window
  //const liveness: boolean[] = latitudes.map((ls) => ls[ls.length - 1] !== null);

  const intensities: number[][] | undefined = data.series
    .map(s => s.fields.find((f) => f.name === 'intensity')?.values.toArray() as number[]);

  let markerPopups: string[][] | undefined = data.series
    .map(s => s.fields.find(f => f.name === 'popup' || f.name === 'text' || f.name === 'desc')?.values.toArray() as string[]);

  let markerTooltips: string[][] | undefined = data.series
    .map(s => s.fields.find(f => f.name === 'tooltip')?.values.toArray() as string[]);

  let iconHtml: Array<string | undefined> | undefined;

  if (labels && labels.length) {
    iconHtml = labels.map((l: Labels | undefined) => {
      const overrides = getMarkerHtmlOverrides();
      if (l && l[options.marker.labelName] && overrides[l[options.marker.labelName]]) {
        return overrides[l[options.marker.labelName]];
      }
      return undefined;
    });
  }

  let positions: Position[][] | undefined = latitudes?.map((lats, index1) => {
    return lats.map((latitude, index2) => {
      const longitude = longitudes !== undefined && longitudes.length && longitudes[index1] !== undefined ? longitudes[index1][index2] : 0;

      const timestamp = timestamps !== undefined && timestamps.length && timestamps[index1] !== undefined ? timestamps[index1][index2] : 0;
      const timestampPrint = timestamp !== 0 ? `<br/>Timestamp: ${timestamp}` : '';

      const trackLabels = labels && labels[index1] ? labels[index1] : undefined;
      const trackLabelsPrint = trackLabels !== undefined ? `<br/>Labels: ${JSON.stringify(trackLabels, null, 2)}` : '';

      const popup = markerPopups !== undefined && markerPopups.length && markerPopups[index1] !== undefined
          ? markerPopups[index1][index2]
          : `${latitude},${longitude}${timestampPrint}${trackLabelsPrint}`;

      const tooltip = markerTooltips !== undefined && markerTooltips.length && markerTooltips[index1] !== undefined
          ? markerTooltips[index1][index2]
          : undefined;
          
      //TODO: What is this?
      // const icon = iconNames !== undefined ? iconNames[index1][index2] : undefined;
      return {
        latitude,
        longitude,
        popup,
        tooltip,
        labels: trackLabels,
        // icon,
      };
    });
  });

  if (!positions || positions.length === 0) {
    positions = [[{ latitude: 0, longitude: 0 }]];
  }

  const heatData: any[][] = [];
  const antData: AntData[] = [];
  const hexData: FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };

  positions?.forEach((positionSeries, i) => {
    const antDatas: number[][] = [];

    const antOptions = {
      delay: options.ant.delay,
      dashArray: [10, 20],
      weight: options.ant.weight,
      color: options.ant.color,
      pulseColor: options.ant.pulseColor,
      paused: options.ant.paused,
      reverse: options.ant.reverse,
    };

    //TODO: Feature "Live track", concept of a "non-live" track, where lat/lon data is null for the latest timestamp, but exists within the panel's time window
    /*if (options.ant.pauseNonLiveTracks && !liveness[i]) {
      antOptions.paused = true;
    }*/

    const currentLabels = labels[i];
    if (options.ant.labelName && currentLabels && currentLabels[options.ant.labelName]) {
      const override = getAntPathColorOverrides()[currentLabels[options.ant.labelName]];
      if (override) {
        antOptions.color = override;
      }
    }

    const heatDatas: number[][] = [];
    positionSeries.forEach((position, j) => {
      // These may be null for alignment purposes in the timeseries data
      if (position.latitude && position.longitude) {
        heatDatas.push([position.latitude, position.longitude, (intensities !== undefined && intensities[i] && intensities[i][j]) ? intensities[i][j] : 0]);
        antDatas.push([position.latitude, position.longitude]);
        hexData.features.push({
          type: 'Feature',
          id: i,
          geometry: {
            type: 'Point',
            coordinates: [position.longitude, position.latitude],
          },
        } as Feature);
      }
    });
    heatData.push(heatDatas);
    antData.push({
      options: antOptions,
      data: antDatas,
    });
  });

  //TODO: Fix
  const createIcon = (html: string, size: number) => {
    return new DivIcon({
      html: html,
      //iconSize: [size, size],
      //iconAnchor: [size * 0.5, size],
      //popupAnchor: [0, -size],
    });
  };

  const createMarkers = (): ReactNode[] => {
    let markers: ReactNode[] = [];

    if (positions && positions.length > 0) {
      positions.forEach((positionSeries, i) => {
        positionSeries.forEach((position, j) => {
          
          //TODO: Test
          let html = options.marker.defaultHtml;
          if (iconHtml && iconHtml.length) {
            const maybeHtml = iconHtml[i];
            if (maybeHtml !== undefined) {
              html = maybeHtml;
            }
          }
          const icon: DivIcon = createIcon(html, options.marker.size);
          
          const isLastPosition = j + 1 === positionSeries.length;
          let shouldHide = options.marker.showOnlyLastMarker && !isLastPosition;
          
          //TODO: Feature "Live track", concept of a "non-live" track, where lat/lon data is null for the latest timestamp, but exists within the panel's time window
          /*if (options.marker.showOnlyLiveTracks && !liveness[i]) {
            //set shouldHide/shouldShow
          }*/

          if (!shouldHide) {
            markers.push(
              <Marker key={i + '-' + j} position={[position.latitude, position.longitude]} icon={icon} title={position.popup}>
                <Popup>{ReactHtmlParser(position.popup || '')}</Popup>
                {position.tooltip && <Tooltip permanent={options.marker.alwaysShowTooltips}>{position.tooltip}</Tooltip>}
              </Marker>
            );
          }
        });
      });
    }
    return markers;
  };

  const hexbinOptions = {
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

  const getBoundsFromPositions = (positions: Position[][] | undefined): LatLngBoundsExpression => {
    if (positions) {
      const minLon = Math.min(...positions?.map((ps) => ps.map((p) => p.longitude).flat()).flat());
      const maxLon = Math.max(...positions?.map((ps) => ps.map((p) => p.longitude).flat()).flat());
      const minLat = Math.min(...positions?.map((ps) => ps.map((p) => p.latitude).flat()).flat());
      const maxLat = Math.max(...positions?.map((ps) => ps.map((p) => p.latitude).flat()).flat());
      return [
        [minLat, minLon],
        [maxLat, maxLon],
      ];
    } else {
      return [
        [-180, 180],
        [-180, 180],
      ];
    }
  };

  const mapCenter: Position = {
    latitude: options.map.centerLatitude,
    longitude: options.map.centerLongitude,
  };

  if (options.map.useCenterFromFirstPos && positions?.length && positions[0]?.length && positions[0][0].latitude) {
    mapCenter.latitude = positions[0][0].latitude;
    mapCenter.longitude = positions[0][0].longitude;
  }

  if (positions?.length && positions[0]?.length && positions[0][0]) {
    if (options.map.useCenterFromFirstPos && positions[0][0].latitude) {
      mapCenter.latitude = positions[0][0].latitude;
      mapCenter.longitude = positions[0][0].longitude;
    }
    if (
      !options.map.useCenterFromFirstPos &&
      options.map.useCenterFromLastPos &&
      positions[0][positions[0].length - 1].latitude
    ) {
      mapCenter.latitude = positions[0][positions.length - 1].latitude;
      mapCenter.longitude = positions[0][positions.length - 1].longitude;
    }
  }
  let antPaths = null;
  if (options.viewType === 'ant' || options.viewType === 'ant-marker') {
    antPaths = antData.map((d, i) => {
      if (d.data.length && d.data.length > 1) {
        const popup = positions ? positions[i].find((p) => p.latitude && p.longitude)?.popup : undefined;
        return (
          <AntPath key={i} positions={d.data} options={d.options}>
            {popup ? <StyledPopup>{popup}</StyledPopup> : null}
          </AntPath>
        );
      }
      return null;
    });
  }

  const createHeatMaps = useMemo((): ReactNode[] => {
    return heatData.map(h => 
      <HeatmapLayer
        fitBoundsOnLoad={options.heat.fitBoundsOnLoad}
        fitBoundsOnUpdate={options.heat.fitBoundsOnUpdate}
        points={h}
        longitudeExtractor={(m: any) => m[1]}
        latitudeExtractor={(m: any) => m[0]}
        intensityExtractor={(m: any) => parseFloat(m[2])}
      />)
  }, [heatData])

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
        {antPaths}
        {options.viewType === 'heat' && createHeatMaps}
        {options.viewType === 'hex' && <WrappedHexbinLayer {...hexbinOptions} data={hexData} />}
        {(options.viewType === 'marker' || options.viewType === 'ant-marker') && createMarkers()}
        <TileLayer
          attribution={options.map.tileAttribution}
          url={options.map.tileUrl}
          accessToken={options.map.tileAccessToken !== '' ? options.map.tileAccessToken : undefined}
          maxZoom={25}
          maxNativeZoom={19}
          subdomains={
            options.map.tileSubdomains && options.map.tileSubdomains.length ? options.map.tileSubdomains : undefined
          }
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
