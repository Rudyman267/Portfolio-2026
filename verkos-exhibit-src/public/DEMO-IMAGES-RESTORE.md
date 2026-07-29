# public/demo was intentionally removed from this vendored copy

The 25 demo frames are byte-identical to the ones already committed at
`public/verkos-demo/demo/`, so keeping a second copy here doubled ~3.7 MB
of images in the repo for no benefit.

Before rebuilding, restore them:

    cp -r ../public/verkos-demo/demo ./public/demo

(from this folder's root, i.e. `verkos-exhibit-src/`)

Their uncompressed originals are NOT in the repo either. Sources:
`E:\Grad Project@Flytbase\Flinks\Verkos\Demo data\Demo images\`
The ffmpeg recipes that produced the compressed + derived frames (thermal
false-colour, night grades, 14 patrol crops) are in PROJECT_LOG.md §6,
"VERKOS APP EXHIBIT".
