import { PanelPlugin } from '@grafana/data';
import { TrackMapPanel } from './TrackMapPanel';
import { TrackMapOptions } from './types';
import { optionsBuilder } from './options';

export const plugin = new PanelPlugin<TrackMapOptions>(TrackMapPanel).setPanelOptions(optionsBuilder);
