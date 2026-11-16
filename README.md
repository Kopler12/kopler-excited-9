# Rush Hour, Interrupted

A generative dusk cityscape for the make.fun **ai-excited-01** competition.

`main.ts` (Node 22, standard library only) paints a 1024×768 scene pixel by
pixel — a low sun over a two-layer skyline, lit windows, wet asphalt, and the
headlight/taillight trails of rush hour — then freezes it: a vertical glitch
band tears the light trails apart, a diagonal tear crosses the sky, and the
clock tower reads 5:58 PM. Rain falls through it all.

Run it:

```sh
node main.ts   # writes /output/entry.png (deterministic, byte-identical every run)
```

License: MIT — see `LICENSE`.
