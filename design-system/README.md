# QuizBot Design System

The source of truth for QuizBot's look lives in
[`client/src/styles/theme.css`](../client/src/styles/theme.css). This folder
mirrors it as a small, standalone **design system** that's synced to a
[Claude Design](https://claude.ai/design) project so the components can be
browsed and reused on their own.

## Contents

- `theme.css` — design tokens (color, radius, shadow, type) + component classes
  (buttons, cards, tabs, fields, chips, banners, spinner). Copied verbatim from
  the app's theme.
- `cards/*.html` — standalone preview cards, each rendering real components
  against the live `theme.css`. Each file starts with a `@dsCard` marker so the
  Claude Design pane indexes it automatically:

  ```html
  <!-- @dsCard group="Components" name="Buttons" -->
  ```

  | Card | Group |
  | --- | --- |
  | Color tokens, Typography | Foundations |
  | Buttons, Inputs & controls, Tabs/chips/banners | Components |
  | Quiz option states, Score ring & result card | Patterns |

## Previewing locally

Open any card in a browser, or serve the folder:

```bash
cd design-system && python3 -m http.server 8080
# then open http://localhost:8080/cards/buttons.html
```

## Keeping it in sync

When `client/src/styles/theme.css` changes, refresh the copy and re-push:

```bash
cp client/src/styles/theme.css design-system/theme.css
```

Then sync to the Claude Design project (`QuizBot Design System`) with the
`/design-sync` workflow — incrementally, one component at a time, rather than a
wholesale replace.
