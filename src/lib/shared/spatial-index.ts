import KDBush from 'kdbush';
import { around } from 'geokdbush';
import settings from './settings';

import type { Feature, Point } from 'geojson';
import type { LngLatBounds, LngLat, GeoJSONFeatureDiff } from 'maplibre-gl';
import type { FeatureWithId } from '$lib/shared/types';

export function getIndex(points: Array<Feature<Point>>) {
	const pointIndex = new KDBush(points.length);
	for (const point of points) {
		pointIndex.add(point.geometry.coordinates[0], point.geometry.coordinates[1]);
	}
	pointIndex.finish();
	return pointIndex;
}

export function getNearestPoints(
	index: KDBush,
	points: Array<Feature<Point>>,
	center: LngLat,
	bounds: LngLatBounds,
	maxResults = settings.maxPoints
): string[] {
	const incides = around(index, center.lng, center.lat, maxResults, undefined, (index) => {
		const [pointLng, pointLat] = points[index].geometry.coordinates;
		const [[minLng, minLat], [maxLng, maxLat]] = bounds.toArray();
		return pointLng >= minLng && pointLng <= maxLng && pointLat >= minLat && pointLat <= maxLat;
	});
	return incides.map((index) => points[index].id as string);
}

export function updateFeature(feature: FeatureWithId, selected = true): GeoJSONFeatureDiff {
	return {
		id: feature.id,
		addOrUpdateProperties: [
			{
				key: 'selected',
				value: selected
			}
		]
	};
}
