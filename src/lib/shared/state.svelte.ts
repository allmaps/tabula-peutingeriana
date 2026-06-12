import points from '$lib/assets/places.json';

function getRandomInt(max: number) {
	return Math.floor(Math.random() * max);
}

const features = points.features;
const initialIndex = getRandomInt(features.length - 1);
const initialId = features[initialIndex].id;

const appState: {
	loaded: number;
	selectedPoints: string[];
	lastMoved: 'tabula' | 'map' | undefined;
	zoom: number | undefined;
} = $state({
	loaded: 0,
	selectedPoints: [initialId],
	lastMoved: undefined,
	zoom: undefined
});

export default appState;
