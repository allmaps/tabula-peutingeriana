import { env } from '$env/dynamic/public';

export default {
	padding: 50,
	maxPoints: 8,
	glyphsUrl: `${env.PUBLIC_URL}/fonts/{fontstack}/{range}.pbf`,
	labelSize: 13
};
