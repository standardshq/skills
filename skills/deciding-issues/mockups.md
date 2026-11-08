# Mockups

A mockup decides an interface, so it must look like the product: the real screen, in its own
design system, with the change in it. A gray wireframe hides exactly what a ruling weighs: density,
hierarchy, what draws the eye.

## Build it from the product

1. **The screen.** Read the page or component the change lands in, in the repository checkout, and
   rebuild its layout from that source: the same regions, order, controls and copy. Real labels in
   the product's language and plausible data, never a gray bar where a word belongs.
2. **The theme.** Find the stylesheet that app loads (its `globals.css` and the chain it
   `@import`s) and paste its token blocks (`@theme`, `:root`, and the dark block only if you draw
   dark mode) into the mockup, dropping the `@import` lines. Style with the theme's own semantic
   classes (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`,
   `bg-primary`…), never raw colors.
3. **The page.** One HTML file per option:

   ```html
   <!doctype html>
   <html><head><meta charset="utf-8">
   <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap">
   <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
   <style type="text/tailwindcss">
     /* the app's token blocks, pasted */
   </style>
   </head><body class="bg-background text-foreground antialiased">…</body></html>
   ```

   Use the font the theme names, Inter when it names Inter. Icons: the ones the app uses (lucide
   when it does: `https://unpkg.com/lucide@latest`), never emoji.

## Mark the change, not the rest

Everything is drawn in full color, as the product would show it. The change alone carries one
accent: a 2px `ring-primary` with a little offset around it, and a small label outside the screen
chrome naming what changed (a short pill in `bg-primary text-primary-foreground`). Keep the
surroundings sharp and in color: the reader judges the change in its real context.

Draw only what the decision needs: the screen region the change lives in, cropped where nothing
changes. One option, one file; options differ only where they disagree.

## Render and check

```bash
npx -y playwright install --only-shell chromium   # no-op once cached
npx -y playwright screenshot --device "Desktop Chrome HiDPI" --viewport-size 1440,900 \
  --wait-for-timeout 1500 "file://$PWD/option-1.html" option-1.png
```

Open each PNG and correct it until, side by side with the real screen, only the change differs, and
the change reads at a glance. Washed-out colors mean the theme did not load: check the pasted blocks
and the `text/tailwindcss` type.

*Done when* each option is one PNG, attached to the issue's `mockups` (`option` its number,
`status: proposed`) and to the Decision.
