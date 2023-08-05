import { TileLayerOptions } from 'leaflet';

const optionDefaults: TileLayerOptions = {
    detectRetina: true,
}

interface TileLayerOptionsWithLabel extends TileLayerOptions {
    readonly label: string;
}

interface SchemaType {
    readonly [url: string]: TileLayerOptionsWithLabel | undefined;
}

export const urlSchemas: SchemaType = {
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png': {
        ...optionDefaults,
        label: 'OpenStreetMap',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
    },
    'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png': {
        ...optionDefaults,
        label: 'OpenTopoMap',
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        subdomains: 'abc',
        maxZoom: 17,
    },
    'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png': {
        ...optionDefaults,
        label: 'Stadia Alidade Smooth',
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
        maxZoom: 20,
    },
    'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png': {
        ...optionDefaults,
        label: 'Stadia Alidade Smooth Dark',
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
        maxZoom: 20,
    },
    'https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png': {
        ...optionDefaults,
        label: 'Stamen Toner',
        attribution: 'Map tiles by <a href="http://stamen.com/">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org/">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
        subdomains: 'abcd',
        maxZoom: 18,
    },
    'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png': {
        ...optionDefaults,
        label: 'Stamen Toner Lite',
        attribution: 'Map tiles by <a href="http://stamen.com/">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org/">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
        subdomains: 'abcd',
        maxZoom: 18,
    },
};
