import React, { useEffect, ReactNode } from 'react';
import { Labels, PanelProps, DataHoverEvent, DataHoverClearEvent } from '@grafana/data';
import { Position, TrackMapOptions, AntData } from 'types';
import { css, cx } from '@emotion/css';
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap, useMapEvent } from 'react-leaflet';
import { DivIcon, heatLayer, HeatMapOptions, latLng, LatLng, hexbinLayer, HexbinLayerConfig, Icon, LatLngBounds, LatLngBoundsExpression, PointExpression, CircleMarker, circleMarker } from 'leaflet';
import './leaflet.css';
import 'leaflet/dist/leaflet.css';
import styled from 'styled-components';
import { getLocationSrv } from '@grafana/runtime';
import { stylesFactory } from '@grafana/ui';
import ReactHtmlParser from 'html-react-parser';

const { antPath } = require('leaflet-ant-path');
import 'leaflet.heat';
import '@asymmetrik/leaflet-d3';


const StyledPopup = styled(Popup)`
  .leaflet-popup-content-wrapper {
    white-space: pre-wrap;
  }

  .leaflet-popup-tip-container {
    visibility: hidden;
  }
`;

export const TrackMapPanel = ({ options, data, width, height, eventBus }: PanelProps<TrackMapOptions>) => {
  const styles = getStyles();

  const primaryIcon: string = require('img/marker.png');
  const secondaryIcon: string = require('img/marker_secondary.png');

  const hoverCircles: CircleMarker[] = [];

  const MapBounds = (props: { options: typeof options.map }) => {
    const mapInstance = useMap();
    useEffect(() => {
      if (props.options.zoomToDataBounds) {
        const bounds = getBoundsFromPositions(positions);
        mapInstance.fitBounds(bounds, { animate: false });
      }
      const bounds = mapInstance.getBounds();
      updateMap(bounds);
    }, [mapInstance, props.options]);
    return null;
  };

  const isLatitudeName = (name: string | undefined): boolean => {
    const customLatitudeName =
      options.coordinates.customLatitudeColumnName !== '' ? options.coordinates.customLatitudeColumnName : '';
    return name !== '' && (name === 'latitude' || name === 'lat' || name === customLatitudeName);
  };

  const isLongitudeName = (name: string | undefined): boolean => {
    const customLongitudeName =
      options.coordinates.customLongitudeColumnName !== '' ? options.coordinates.customLongitudeColumnName : '';
    return name !== '' && (name === 'longitude' || name === 'lon' || name === customLongitudeName);
  };

  const isTimestampName = (name: string | undefined): boolean => {
    return name === 'Time' || name === 'time';
  };

  const isIntensityName = (name: string | undefined): boolean => {
    return name === 'intensity';
  };

  const isPopupName = (name: string | undefined): boolean => {
    return name === 'popup' || name === 'text' || name === 'desc';
  };

  const isTooltipName = (name: string | undefined): boolean => {
    return name === 'tooltip';
  };

  const getValues = <T,>(filterFunc: (s: string | undefined) => boolean): T[][] => {
    let values = data.series.map(
      (s) => s.fields.find((f) => filterFunc(f.name))?.values.toArray() as T[]
    );

    //time series
    if (!values?.some((l) => l !== undefined)) {
      values = data.series
        .filter((f) => filterFunc(f.name))
        ?.map((f1) => f1.fields.find((f) => f.name === 'Value')?.values?.toArray() as T[]);
    }
    return values;
  }

  const latitudes: number[][] = getValues(isLatitudeName);
  const longitudes: number[][] = getValues(isLongitudeName);
  const timestamps: number[][] = getValues(isTimestampName);
  const intensities: number[][] = getValues(isIntensityName);
  const markerPopups: string[][] = getValues(isPopupName);
  const markerTooltips: string[][] = getValues(isTooltipName);

  const labels: Array<Labels | undefined> = data.series
  .filter((f) => isLatitudeName(f.name))
  ?.map((f1) => f1.fields.find((f) => f.name === 'Value')?.labels);

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

  const getAntPathColorOverrides = getAntPathColorOverridesMemoized();
  const getMarkerHtmlOverrides = getMarkerHtmlOverridesMemoized();

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

  const filterZeroOrNull = (positionSeries: Position[]) => {
    return positionSeries.filter((pos) => {
      const isNotExactlyZero = pos.longitude !== 0 || pos.latitude !== 0;
      const isNotNullOrUndefined =
        pos.longitude !== null && pos.latitude !== null && pos.longitude !== undefined && pos.latitude !== undefined;
      return !options.discardZeroOrNull || (options.discardZeroOrNull && isNotExactlyZero && isNotNullOrUndefined);
    });
  };

  let positions: Position[][] | undefined = latitudes
    ?.map((lats, index1) => {
      return lats.map((latitude, index2) => {
        const longitude =
          longitudes !== undefined && longitudes.length && longitudes[index1] !== undefined
            ? longitudes[index1][index2]
            : 0;

        const timestamp =
          timestamps !== undefined && timestamps.length && timestamps[index1] !== undefined
            ? timestamps[index1][index2]
            : 0;
        const timestampPrint = timestamp !== 0 ? `<br/>Timestamp: ${timestamp}` : '';

        const trackLabels = labels && labels[index1] ? labels[index1] : undefined;
        const trackLabelsPrint =
          trackLabels !== undefined ? `<br/>Labels: ${JSON.stringify(trackLabels, null, 2)}` : '';

        const popup =
          markerPopups !== undefined && markerPopups.length && markerPopups[index1] !== undefined
            ? markerPopups[index1][index2]
            : `${latitude},${longitude}${timestampPrint}${trackLabelsPrint}`;

        const tooltip =
          markerTooltips !== undefined && markerTooltips.length && markerTooltips[index1] !== undefined
            ? markerTooltips[index1][index2]
            : undefined;

        return {
          latitude,
          longitude,
          timestamp,
          popup,
          tooltip,
          labels: trackLabels,
        };
      });
    })
    .map((pos) => filterZeroOrNull(pos));

  if (!positions || positions.length === 0) {
    positions = [[{ latitude: 0, longitude: 0 }]];
  }

  const latLngs: LatLng[] = [];
  const antData: AntData[] = [];

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
      hardwareAccelerated: options.ant.hardwareAccelerated,
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

    positionSeries.forEach((position, j) => {
      // These may be null for alignment purposes in the timeseries data
      if (position.latitude && position.longitude) {
        latLngs.push(latLng(
          position.latitude,
          position.longitude,
          intensities !== undefined && intensities[i] && intensities[i][j] ? intensities[i][j] : 0
        ));
        antDatas.push([position.latitude, position.longitude]);
      }
    });
    antData.push({
      options: antOptions,
      data: antDatas,
    });
  });

  const createDivIcon = (html: string) => {
    if (options.marker.customIconHeight !== undefined && options.marker.customIconWidth !== undefined) {
      return new DivIcon({ html, iconSize: [options.marker.customIconWidth, options.marker.customIconHeight] });
    }
    return new DivIcon({ html });
  };

  const getOffset = (option: string | undefined, defaultValue: PointExpression): PointExpression => {
    return option === undefined || option.trim() === ''
      ? defaultValue
      : [parseInt(option.split(',')[0], 10), parseInt(option.split(',')[1], 10)];
  };

  const createIcon = (url: string, size: number) => {
    return new Icon({
      iconUrl: url,
      iconSize: [size, size],
      iconAnchor: getOffset(options.marker.iconOffset, [size * 0.5, size]),
      popupAnchor: getOffset(options.marker.popupOffset, [0, -size]),
    });
  };

  const createPopups = (index: number): ReactNode[] => {
    const popups: ReactNode[] = [];

    const popup = positions ? positions[index].find((p) => p.latitude && p.longitude)?.popup : undefined;
    if (popup !== undefined) {
      popups.push(<StyledPopup>{popup}</StyledPopup>);
    }
    return popups;
  }

  const createAntPaths = (): ReactNode[] => {
    let antpaths: ReactNode[] = [];

    antData.forEach((ant, index) => {
      antpaths.push(
        <AntPath ant={ant}>
          {createPopups(index)}
        </AntPath>
        );
    });

    return antpaths;
  }

  const createMarkers = (): ReactNode[] => {
    let markers: ReactNode[] = [];

    if (positions && positions.length > 0) {
      positions.forEach((positionSeries, i) => {
        positionSeries.forEach((position, j) => {
          const isLastPosition = j + 1 === positionSeries.length;
          const useSecondaryIcon =
            options.marker.useSecondaryIconForAllMarkers ||
            (options.marker.useSecondaryIconForLastMarker && isLastPosition);

          let html = options.marker.defaultHtml;
          if (iconHtml && iconHtml.length) {
            const maybeHtml = iconHtml[i];
            if (maybeHtml !== undefined) {
              html = maybeHtml;
            }
          }

          let icon: DivIcon = createDivIcon(html);
          if (!options.marker.useHTMLForMarkers) {
            icon = createIcon(
              useSecondaryIcon ? secondaryIcon : primaryIcon,
              isLastPosition ? options.marker.sizeLast : options.marker.size
            );
          }

          let shouldHide = options.marker.showOnlyLastMarker && !isLastPosition;

          //TODO: Feature "Live track", concept of a "non-live" track, where lat/lon data is null for the latest timestamp, but exists within the panel's time window
          /*if (options.marker.showOnlyLiveTracks && !liveness[i]) {
            //change shouldHide/shouldShow
          }*/

          if (!shouldHide) {
            markers.push(
              <Marker
                key={i + '-' + j}
                position={[position.latitude, position.longitude]}
                icon={icon}
                title={position.popup}
              >
                <StyledPopup>{ReactHtmlParser(position.popup || '')}</StyledPopup>
                {position.tooltip && (
                  <Tooltip
                    offset={getOffset(options.marker.tooltipOffset, [0, 0])}
                    permanent={options.marker.alwaysShowTooltips}
                  >
                    {position.tooltip}
                  </Tooltip>
                )}
              </Marker>
            );
          }
        });
      });
    }
    return markers;
  };

  const MapMove = () => {
    const map = useMapEvent('moveend', () => {
      map.invalidateSize();
      updateMap(map.getBounds());
    });
    return null;
  }

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

  const AntPath = (props: { children: ReactNode[], ant: AntData} ) => {
    const mapInstance = useMap();
    useEffect(() => {
      const antPolylines: any[] = [];
      if (options.viewType === 'ant' || options.viewType === 'ant-marker') {
        const antPolyline = antPath(props.ant.data, props.ant.options);
        mapInstance.addLayer(antPolyline)

        return () => {
          mapInstance.removeLayer(antPolyline)
        }
      }
      return () => {}
    }, [mapInstance, props.ant.data, props.ant.options]);
    return null;
  };

  const Heat = (props: { positions: LatLng[], options: typeof options.heat }) => {
    const mapInstance = useMap();

    let maxValue: number | undefined = undefined;
    let minValue: number | undefined = undefined;
    props.positions.forEach((d) => {

      if (d.alt && (!maxValue || d.alt > maxValue)) {
        maxValue = d.alt;
      }
      if (d.alt && (!minValue || d.alt < minValue)) {
        minValue = d.alt;
      }
    });

    useEffect( () => {
      const heatOptions: HeatMapOptions = {
        max: options.heat.maxValue !== 0 ? options.heat.maxValue : maxValue,
      };

      if (options.viewType !== 'heat') {
        return;
      }
      const heat = heatLayer(props.positions, heatOptions).addTo(mapInstance);
      return () => {
        mapInstance.removeLayer(heat);
      }
    }, [mapInstance, props.positions, maxValue]);

    return null;
  }

  const HexBin = (props: { positions: LatLng[], options: typeof options.hex }) => {
    const mapInstance = useMap();

    useEffect ( () => {
      if (options.viewType !== 'hex') {
        return;
      }
      const hexData = props.positions.map( d => [ d.lng, d.lat ]);
      const hexOptions: HexbinLayerConfig = {
        opacity: props.options.opacity,
        radiusRange: [ props.options.radiusRangeFrom, props.options.radiusRangeTo ],
        colorRange: [ props.options.colorRangeFrom, props.options.colorRangeTo ]
      };
      const hexLayer = hexbinLayer(hexOptions);
      hexLayer.addTo(mapInstance);
      hexLayer.data(hexData);

      return () => {
        mapInstance.removeLayer(hexLayer);
      }
    }, [mapInstance, props.positions, props.options]);
    return null;
  }

  const HoverMarker = (props: { options: typeof options.hoverMarker }) => {
    const mapInstance = useMap();

    useEffect(() => {
      const eventHoverHandler = (event: DataHoverEvent) => {
        if (event.payload?.point?.time) {
          let circleIndex = 0;
          positions?.forEach(positionSeries => {

            if (!positionSeries.some(position => position.timestamp && position.timestamp <= event.payload.point.time) ) {
              return;
            }

            const circlePosition = positionSeries.find( position => position.timestamp && position.timestamp >= event.payload.point.time );
            if (circlePosition) {
              const circleLatitude = circlePosition.latitude;
              const circleLongitude = circlePosition.longitude;

              const existingCircle = hoverCircles.at(circleIndex);
              if (existingCircle) {
                existingCircle.setLatLng([circleLatitude, circleLongitude]);
              } else {
                hoverCircles.push(circleMarker([circleLatitude, circleLongitude], {
                  color: props.options.color,
                  fillColor: props.options.fillColor,
                  fillOpacity: props.options.fillOpacity,
                  weight: props.options.weight,
                  radius: props.options.radius,
                }).addTo(mapInstance));
                circleIndex++;
              }
            }
          });
        }
      }

      const eventHoverClearHandler = (event: DataHoverClearEvent) => {
        while(hoverCircles.length > 0) {
          const hoverCircle = hoverCircles.pop();
          hoverCircle?.remove();
        }
      }

      eventBus.subscribe(DataHoverEvent, eventHoverHandler);
      eventBus.subscribe(DataHoverClearEvent, eventHoverClearHandler);
      return () => {
        eventBus.removeAllListeners();
      }
    }, [mapInstance, props.options]);

  return null;
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
      <MapContainer
        center={[mapCenter.latitude, mapCenter.longitude]}
        zoom={options.map.zoom}
        zoomSnap={0.5}
      >
        {(options.viewType === 'ant' || options.viewType === 'ant-marker') && createAntPaths()}
        {(options.viewType === 'marker' || options.viewType === 'ant-marker') && createMarkers()}
        {options.viewType === 'heat' && <Heat positions={latLngs} options={options.heat}/>}
        {options.viewType === 'hex' && <HexBin positions={latLngs} options={options.hex}/>}
        {options.displayHoverMarker && <HoverMarker options={options.hoverMarker} />}
        <MapBounds options={options.map} />
        <MapMove />
        <TileLayer attribution={options.map.tileAttribution} url={options.map.tileUrlSchema} />
      </MapContainer>
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
