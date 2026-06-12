# Tabula Peutingeriana

Side-by-side view of the Tabula Peutingeriana and OpenStreetMap.

Source data and IIIF Image taken from the [Omnes Viae](https://omnesviae.org/) project. See [this notebook](https://observablehq.com/d/0d71084a8d3bd39a) for more information.

Inspired by:

- [Rijksdriehoeksmeting](https://tu-delft-heritage.github.io/rijksdriehoeksmeting/)
- [IIIF Georeference Viewer](ttps://github.com/nakamura196/iiif_geo)
- [Allmaps Cursors](https://cursors.allmaps.org/)

## Developing

Once you've created a project and installed dependencies with `pnpm install` or, start a development server:

```sh
pnpm run dev

# or start the server and open the app in a new browser tab
pnpm run dev -- --open
```

## Building

To create a production version of your app:

```sh
pnpm run build
```

You can preview the production build with `pnpm run preview`.
