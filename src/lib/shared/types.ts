import type { Feature, FeatureCollection, Point } from 'geojson';

export type FeatureWithId = Feature<Point> & { id: string };
export type FeatureCollectionWithIds = Omit<FeatureCollection<Point>, 'features'> & {
	features: FeatureWithId[];
};
