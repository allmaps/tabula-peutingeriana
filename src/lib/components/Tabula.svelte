<script lang="ts">
	import places from '$lib/assets/places.json';
	import annotation from '$lib/assets/annotation-helmert.json';

	import maplibregl from 'maplibre-gl';
	import { WarpedMapLayer } from '@allmaps/maplibre';
	import { WarpedMapList } from '@allmaps/render';
	import { point as turfPoint, bbox, featureCollection, getCoord } from '@turf/turf';

	import { getIndex, getNearestPoints, updateFeature } from '$lib/shared/spatial-index';
	import appState from '$lib/shared/state.svelte';
	import settings from '$lib/shared/settings';

	import type { FeatureWithId } from '$lib/shared/types';
	import type {
		GeoJSONFeatureDiff,
		StyleSpecification,
		GeoJSONSource,
		LngLatLike,
		LngLatBoundsLike,
		Map
	} from 'maplibre-gl';
	import type KDBush from 'kdbush';

	import 'maplibre-gl/dist/maplibre-gl.css';

	const currentComponent = 'tabula';

	let container: HTMLDivElement;
	let warpedMapList = new WarpedMapList();
	let warpedMapLayer = new WarpedMapLayer({ warpedMapList });
	let features: FeatureWithId[];
	let center: LngLatLike | undefined = $state(undefined);
	let index: KDBush;
	let map: Map;
	let selectedPoints = $derived(appState.selectedPoints);
	let bothMapsLoaded = $derived(appState.loaded === 2);
	let previousSelectedPoints: string[] = [];
	let animating = true;
	let maxZoom = 10;

	const style = {
		version: 8,
		glyphs: settings.glyphsUrl,
		sources: {},
		layers: []
	} satisfies StyleSpecification;

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

	// Load annotation
	const [id] = warpedMapList.addGeoreferenceAnnotation(annotation, {
		transformationType: 'straight'
		// removeColor: true,
		// removeColorColor: '#ffffff',
		// removeColorThreshold: 0.3,
		// removeColorHardness: 1
	});

	// Transform resource coordinates [x,y] to [lng,lat]
	if (typeof id === 'string') {
		const warpedMap = warpedMapList.getWarpedMap(id);
		if (warpedMap) {
			const transformer = warpedMap.projectedTransformer;
			const transformedFeatures = places.features.map((feature) => {
				const properties = feature.properties;
				const transformedCoords = transformer.transformToGeo(properties.resourceCoords);
				return turfPoint(transformedCoords, properties, { id: feature.id }) as FeatureWithId;
			});
			features = transformedFeatures as FeatureWithId[];

			// Create spatial index
			index = getIndex(features);

			// Set initial center coordinate
			const initialFeature = features.find(({ id }) => id === appState.selectedPoints[0]);
			if (initialFeature) {
				center = getCoord(initialFeature) as LngLatLike;
			}
		}
	}

	$effect(() => {
		if (center) {
			map = new maplibregl.Map({
				container,
				style,
				maxPitch: 0,
				center,
				zoom: maxZoom - 5,
				bearingSnap: 0,
				keyboard: false,
				attributionControl: {
					compact: true,
					customAttribution:
						'Tabula Peutingeriana from <a href="https://www.ku.de/ggf/geschichte/alte-geschichte/forschung/datenbank-tp-online">Datenbank tp-online</a>'
				}
			});

			map.on('load', async () => {
				map.addLayer(warpedMapLayer);

				map.addSource('places', {
					type: 'geojson',
					data: featureCollection(features)
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
