<script lang="ts">
	import places from '$lib/assets/places.json';

	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { bbox, featureCollection, getCoord } from '@turf/turf';

	import { getIndex, getNearestPoints, updateFeature } from '$lib/shared/spatial-index';
	import appState from '$lib/shared/state.svelte';
	import settings from '$lib/shared/settings';

	import type { LngLatLike } from 'maplibre-gl';
	import type { FeatureWithId } from '$lib/shared/types';
	import type { GeoJSONFeatureDiff, LngLatBoundsLike, Map, GeoJSONSource } from 'maplibre-gl';

	const currentComponent = 'map';

	let container: HTMLDivElement;
	let features = places.features as FeatureWithId[];
	let index = getIndex(features);
	let map: Map;
	let bothMapsLoaded = $derived(appState.loaded === 2);
	let selectedPoints = $derived(appState.selectedPoints);
	let previousSelectedPoints: string[] = [];
	let animating = true;
	let center: LngLatLike | undefined = $state(undefined);
	let maxZoom = 14;

	const initialFeature = features.find(({ id }) => id === appState.selectedPoints[0]);
	if (initialFeature) {
		center = getCoord(initialFeature) as LngLatLike;
	}

	$effect(() => {
		if (bothMapsLoaded) {
			// Prepare features to update
			const featuresToSelect = features.filter(({ id }) => selectedPoints.includes(id));
			const selectDiff: GeoJSONFeatureDiff[] = featuresToSelect.map((feature) =>
				updateFeature(feature, true)
			);
			const deselectDiff = features
				.filter(({ id }) => previousSelectedPoints.includes(id) && !selectedPoints.includes(id))
				.map((feature) => updateFeature(feature, false));
			const update = selectDiff.concat(deselectDiff);

			// Update source
			const source = map.getSource('places') as GeoJSONSource;
			source.updateData({ update });

			// Update variable
			previousSelectedPoints = selectedPoints;

			// Change view
			if (appState.lastMoved !== currentComponent && featuresToSelect.length) {
				const bounds = bbox(featureCollection(featuresToSelect)) as LngLatBoundsLike;
				const camera = map.cameraForBounds(bounds, { maxZoom, padding: settings.padding });
				if (camera) {
					map.flyTo(camera);
					animating = true;
				}
			}
		}
	});

	$effect(() => {
		if (center) {
			map = new maplibregl.Map({
				container,
				style: 'https://api.protomaps.com/styles/v5/light/en.json?key=ca7652ec836f269a',
				maxPitch: 0,
				center,
				zoom: maxZoom - 5,
				bearingSnap: 0,
				keyboard: false,
				attributionControl: {
					compact: true,
					customAttribution:
						'<a href="https://github.com/protomaps/basemaps">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>'
				}
			});

			map.on('load', () => {
				map.setGlyphs(settings.glyphsUrl);

				map.addSource('places', {
					type: 'geojson',
					data: places
				});

				map.addLayer({
					id: 'places',
					type: 'circle',
					source: 'places',
					paint: {
						'circle-radius': 6,
						'circle-color': ['case', ['==', ['get', 'selected'], true], '#ff56ba', '#64c18f'],
						'circle-opacity': 0.8
					}
				});

				map.addLayer({
					id: 'places-labels',
					type: 'symbol',
					source: 'places',
					layout: {
						'text-field': ['get', 'label'],
						'text-font': ['Noto Sans SemiBold'],
						'text-size': settings.labelSize,
						'text-offset': [0, 1.2],
						'text-anchor': 'top'
					},
					paint: {
						'text-color': '#222',
						'text-halo-color': '#fff',
						'text-halo-width': 1
					}
				});

				appState.loaded++;
			});

			map.on('moveend', () => {
				if (animating) {
					animating = false;
				} else {
					const center = map.getCenter();
					const bounds = map.getBounds();
					const nearestPoints = getNearestPoints(index, features, center, bounds);
					appState.selectedPoints = nearestPoints;
					appState.lastMoved = currentComponent;
				}
			});
		}
	});
</script>

<div class="h-full min-h-0 w-full min-w-0" bind:this={container}></div>
