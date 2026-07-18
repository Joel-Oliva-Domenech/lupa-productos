# Design QA — Lupa

## Evidence

- Selected source: C:\Users\Joel\.codex\generated_images\019f760f-4c89-7fa0-9caf-b7c659503eb3\exec-304f6245-f1f3-43aa-a23f-0fe35dd04f71.png
- Implementation screenshot: docs/lupa-result.png
- Requested viewport: 390 × 844 px
- Browser content viewport: 375 × 844 px after the browser scrollbar; scroll width is also
  375 px, so there is no horizontal overflow.
- State: result screen using the clearly labelled fictional oat-drink example, with no personal
  preference alert active.

The selected source and final implementation were loaded together in one comparison input.
Focused visual checks covered the header, product hero, important-summary block, three evidence
rows, data-confidence row, and primary/secondary actions.

## Iteration history

### Pass 1

Issues found:

- P2: generated product image showed a pale rectangular background.
- P2: summary copy was too long and used too much vertical space.
- P2: four evidence rows pushed all actions below the first viewport.

Changes:

- Regenerated the product on a flat chroma background, removed it locally, and used the
  transparent result.
- Shortened the summary without adding a health verdict.
- Combined additives and listed allergens into a single composition row.

### Pass 2

Issues found:

- P2: the data-confidence block was taller than the source.
- P2: the first call to action was visible but the second started below the fold.

Changes:

- Replaced the decorative confidence card with a compact bordered row.
- Removed the redundant visible progress track while retaining the numeric confidence and
  expandable “qué sabemos / qué falta” control.
- Tightened evidence-row spacing and aligned the mobile density with the reference.

### Final pass

- Header, product hierarchy, paper texture, serif display type, olive/amber palette, evidence
  grouping, confidence treatment and button hierarchy match the selected editorial direction.
- Both main actions begin within the 844 px mobile viewport.
- Product asset has no visible rectangle or stretched crop.
- No horizontal overflow: client width 375 px, scroll width 375 px.
- Stable main opacity is 1.

## Functional checks

- Ingredients sheet opens, exposes the full ingredient list and seven nutrition values, and
  closes correctly.
- Comparison screen opens and keeps the “sin ganador automático” explanation.
- Invalid manual code 123 is rejected with an accessible validation alert.
- Manual input and its error are cleared when leaving the comparison flow.
- Preferences save locally, detect a literal match, and can be cleared.
- Viewing the example through the normal flow adds it to the local history.
- Fresh production session reports zero console errors and zero console warnings.
- Vitest: 2 files passed, 6 tests passed.
- Production build: passed; PWA generated with 27 precached entries.

## Remaining intentional differences

- The demo product is an original fictional asset, not the branded product shown in the visual
  reference.
- Lupa avoids claims such as “alto para su categoría” and “sin alerta oficial” unless an
  authoritative live source supports them.
- The results page adds an expandable data-completeness explanation because transparent
  uncertainty is a core product feature.

Final result: passed
