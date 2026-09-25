// Fixed, category-keyed color map for the pie charts - a given category
// always renders the same color (personal pie, joint pie, any month),
// following the project's dataviz color-formula: categorical hues assigned
// in fixed order, never cycled or reassigned by a slice's rank.
//
// Slots 1-8 are the project's validated 8-hue categorical palette (see
// dataviz skill references/palette.md) - `scripts/validate_palette.js`
// confirms both the light and dark sets clear the lightness band, chroma
// floor, CVD-separation, and normal-vision floors (light mode also carries
// the documented contrast WARN, mitigated here since pie legends already
// show visible direct labels, not just on hover).
//
// This app can show up to 14 simultaneous categories (12 spending +
// Készpénzfelvét + Egyéb), more than the validated 8-hue set covers - per
// the skill's own rule, a 9th+ series is never just a generated hue, but
// folding a real spending category into "Other" isn't an option here (each
// one is a distinct, user-meaningful bucket). Slots 9-14 are therefore a
// best-effort extension (spaced away from the 8 validated hues and from
// each other) - not run through the full CVD validator, and a slightly
// weaker guarantee than slots 1-8. Bevétel never appears on a pie today
// (categoryTotals always excludes it) but gets a color anyway for
// completeness.
export const CATEGORY_COLORS = {
  Élelmiszer: { light: '#2a78d6', dark: '#3987e5' },
  'Eating out': { light: '#eb6834', dark: '#d95926' },
  'Ruházat/bevásárlás': { light: '#1baf7a', dark: '#199e70' },
  'Egészség/szépség': { light: '#eda100', dark: '#c98500' },
  Szolgáltatások: { light: '#e87ba4', dark: '#d55181' },
  Orvos: { light: '#008300', dark: '#16a34a' },
  Sport: { light: '#4a3aa7', dark: '#9085e9' },
  Közlekedés: { light: '#e34948', dark: '#e66767' },
  'Számlák/előfizetés': { light: '#92400e', dark: '#d97706' },
  Megtakarítás: { light: '#0f7a6e', dark: '#14b8a6' },
  Szórakozás: { light: '#be185d', dark: '#f472b6' },
  Utalás: { light: '#4338ca', dark: '#818cf8' },
  Készpénzfelvét: { light: '#4d7c0f', dark: '#a3e635' },
  Egyéb: { light: '#475569', dark: '#94a3b8' },
  Bevétel: { light: '#059669', dark: '#34d399' },
};

const FALLBACK_COLOR = { light: '#898781', dark: '#898781' };

export function isDarkMode() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function categoryColor(category, dark = isDarkMode()) {
  const entry = CATEGORY_COLORS[category] || FALLBACK_COLOR;
  return dark ? entry.dark : entry.light;
}
