# Trackmap Panel for Grafana

[![license](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)

> Map plugin to visualize timeseries data from geo:json or NGSIv2 sources as either a Ant-path, Hexbin, or Heatmap.

## Usage

### Queries
To use the plugin the data needs to be formatted as a table with either contains `location` in NGSIv2 format:
```javascript
{
  ...,
  "location": {
    "type": "geo:json",
    "value": {
      "coordinates": [55.96086,9.75394],
      "type": "Point"
    }
  }
}
```
Or simply a `lat` and `lon`.

A example of a query for location against a crateDB/PostgreSQL:
```sql
SELECT time_index, location
FROM doc.table_name
WHERE $__timeFilter(time_index)
ORDER BY time_index
```

And a example query for lat and lon against a crateDB/PostgreSQL:
```sql
SELECT time_index, latitude as lat, longitude as lon
FROM doc.table_name
WHERE $__timeFilter(time_index)
ORDER BY time_index
```

To only get specific entities from the database a query could look like this:
```sql
SELECT location, time_index
FROM doc.table_name
WHERE $__timeFilter(time_index)
AND (entity_id = 'vehicle:WasteManagement:id1' OR entity_id = 'vehicle:WasteManagement:id2')
ORDER BY time_index
```

### Settings
You can change the starting zoom and center of the map, as well as the maximum zoom under the map options:

![map](https://github.com/alexandrainst/alexandra-trackmap-panel/raw/master/images/map_settings.png)

There is a options to enable the use of the maps min and max coordinates.
This adds or updates `$maxLat`, `$minLat`, `$maxLon` and `$minLon` with the maps bounding box.
Which can then be used in the query, as an example for crateDB/PostgreSQL:

```sql
SELECT time_index, latitude as lat, longitude as lon
FROM doc.table_name
WHERE $__timeFilter(time_index)
AND latitude >= $minLat
AND latitude <= $maxLat
AND longitude >= $minLon
AND longitude <= $maxLon
ORDER BY time_index
```

To use this with NGSIv2 data, is abit more complex, an example for crateDB/PostgreSQL:
```sql
SELECt coordinates[1] as lat, coordinates[2] as lon, time_index
FROM (
  SELECT location['value']['coordinates'] as coordinates, time_index
  FROM doc.table_name
  WHERE $__timeFilter(time_index)
) AS Array
WHERE coordinates[1] >= $minLat
AND coordinates[1] <= $maxLat
AND coordinates[2] >= $minLon
AND coordinates[2] <= $maxLon
ORDER BY 3
```

> The first time this is enabled does it require a move/zoom on the map for it to create the variables.

An option for the map to update the data after moving/zooming, is available when using the maps min and max coordinates. Do note that enabling this might make it spam your database, and can queue op request to it.

There are three visualization options to choose from, Hexbin, Heatmap and Antpath.

#### Hexbin
![hexbin](https://github.com/alexandrainst/alexandra-trackmap-panel/raw/master/images/hexbin.png)

The hexbin have 2 options.
- `Color range` which lets you set the colors of the hexbin based on there value (number of datapoints with the hexbin), with the left color being the lowest count, and the right color being the highest count.
- And `Radius range` with the first field being the initial size of the hexbin changing to the size of the second field.


![hexbin_settings](https://github.com/alexandrainst/alexandra-trackmap-panel/raw/master/images/hexbin_settings.png)

#### Heatmap
![heatmap](https://github.com/alexandrainst/alexandra-trackmap-panel/raw/master/images/heatmap.png)

There are no settings available for Heatmap

#### Antpath
![antpath](https://github.com/alexandrainst/alexandra-trackmap-panel/raw/master/images/antpath.png)

The antpath have the following options available:
- `Delay`: The delay of the animation flux
- `Dash array`: The size of the animated dashes
- `Weight`: The weight of the path
- `Color`: The color of the path
- `Pulse color`: Adds a color to the dashed flux
- `Paused`: Toggle stop/start of the animation
- `Reverse`: Reverses the animation flow

![antpath_settings](https://github.com/alexandrainst/alexandra-trackmap-panel/raw/master/images/antpath_settings.png)

## Build
To build the plugin, you need either `yarn` or `npm`.

First you need to install the dependencies by running:
```
npm install
```
After the dependencies are installed, you can build the plugin by running the following command:
```
npm run build
```
You can also run the code in development with the following command:
```
npm run dev
```

## Install
If you are running grafana locally, you can clone or download the repository directly into the plugin directory of grafana, and then reset the grafana-server, and the plugin should be automatically detected.

Or if you are using docker, a guide can be found [here](https://grafana.com/docs/installation/docker/#installing-plugins-from-other-sources).

There are more ways to install plugins for grafana, which can be found on their website.

## Contributing

A guide on how to contribute can be found [here](https://docs.synchronicity-iot.eu/docs/contributing/contribution)

## Acknowledgements

This plugin was developed as part of the the [SynchroniCity Project](https://synchronicity-iot.eu/) by The Alexandra Institute. The SynchroniCity project has received funding from the European Union’s Horizon 2020 research and innovation programme under grant agreement No 732240

## License

[MIT © Alexandra Institute.](./LICENSE)
