# 8xMeetly interface rules

These rules keep the marketing site and signed-in workspace coherent as new screens are added. The source of truth for colors and global behavior is `app/globals.css`; shared controls live in `components/ui/`.

## Visual foundation

- Use the warm off-white page background, near-white cards, and warm neutral borders from the theme tokens. Keep dark ink for headings and primary navigation emphasis.
- Reserve the coral primary color for the main action, selected navigation, and small emphasis. Use green, amber, and blue only to communicate status or category.
- Use Figtree throughout. Page titles are bold, tightly tracked, and responsive; supporting text stays muted, readable, and comfortably line-spaced.
- Use a spacing rhythm based on 4px increments. Give major sections 24–36px of separation and form fields 20–24px.
- Use 12–16px radii for controls and navigation items, 20–24px for cards, and pill shapes only for status badges or compact actions.
- Prefer subtle borders and restrained shadows. Cards should be distinct from the canvas without looking raised heavily.

## Layout and responsive behavior

- Keep the signed-in shell centered and capped at 1440px. Give reading and form content a narrower measure than dashboards and meeting lists.
- At desktop widths, use the persistent sidebar and top bar. At mobile widths, hide the sidebar, show the bottom navigation, and leave enough page padding for it.
- Use two columns for compact dashboard metrics on phones and four columns when there is room. Let content cards and controls fill their available width.
- Avoid horizontal overflow. Let long meeting titles, transcript text, and metadata wrap or truncate at intentional boundaries.
- Keep primary page actions near their page heading; on narrow screens allow the heading and action to stack naturally.

## Interaction and accessibility

- Every interactive element needs a visible keyboard focus indicator and a comfortable touch target (about 44px high for primary controls).
- Use one clear primary action per view. Keep secondary navigation and actions visually quieter.
- Provide hover, active, disabled, loading, success, and error states where the interaction supports them. Do not communicate status by color alone; include a label or icon.
- Label every input, associate help and error copy with its field, and announce asynchronous feedback with a live region when appropriate.
- Use semantic headings in order, descriptive link text, `aria-current` for selected navigation, and decorative icons hidden from assistive technology.
- Respect `prefers-reduced-motion`; keep transitions short and avoid motion that is required to understand state.

## Content and empty states

- Use sentence case and concise, task-oriented labels. Explain the next step in plain language when a list or result is empty.
- Keep dates, durations, counts, and status labels consistent across dashboard cards and meeting details.
- Do not show placeholder metrics as real data. Add a useful empty state instead when there is no underlying content.

## Reference guidance

- [Carbon empty states](https://www.carbondesignsystem.com/building-blocks/core/patterns/empty-states): explain what belongs in the empty space and give the user one clear next step.
- [Material adaptive layouts](https://developer.android.com/codelabs/adaptive-material-guidance): adapt component placement to available screen width instead of forcing one layout everywhere.
- [GOV.UK focus states](https://design-system.service.gov.uk/get-started/focus-states/): keyboard focus must stay clearly visible against every surface.
