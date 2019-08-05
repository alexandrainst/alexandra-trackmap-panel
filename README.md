# Trackmap Panel for Grafana

[![license](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)

> Map plugin using Leaflet and OpenSteetMap to visualize coordinates or geo:json as either a Ant-path, Hexbin, or Heatmap.

## Usage

### Queries
To use the plugin the data need to be formatted as a table with either contains `location` in NGSI format:
```
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

A example of a query using location:
```
SELECT time_index, location
FROM doc.etvehicle
WHERE $__timeFilter(time_index)
ORDER BY time_index
```

### Settings
You can change the starting zoom and center of the map, aswell as the maximum zoom under the map otions:

![map](https://github.com/alexandrainst/alexandra-trackmap-panel/raw/master/images/map_settings.png)

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
