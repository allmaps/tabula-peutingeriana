<script>
	import Map from '$lib/components/Map.svelte';
	import Tabula from '$lib/components/Tabula.svelte';
</script>

<svelte:head>
	<title>Tabula Peutingeriana</title>
	<meta name="description" content="Tabula Peutingeriana compared to OpenStreetMap" />
</svelte:head>

<div
	class="h-app-screen grid w-screen grid-cols-1 grid-rows-2 md:grid-cols-[1fr_1fr] md:grid-rows-1 xl:grid-cols-[1fr_1fr]"
>
	<div class="min-h-0 md:row-span-full">
		<Map />
	</div>
	<div class="min-h-0 md:row-span-full">
		<Tabula />
	</div>
</div>
