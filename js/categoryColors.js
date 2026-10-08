// Fixed, category-keyed color map for the pie charts - a given category
// always renders the same color (personal pie, joint pie, any month),
// following the project's dataviz color-formula: categorical hues assigned
// in fixed order, never cycled or reassigned by a slice's rank.
//
// Custom palette: the user supplied 12 specific colors (a soft, muted
// reference swatch set) and asked for those to be used directly, in place
// of the skill-derived pastel formula above. They're assigned here in the
// order she gave them; 3 more slots needed (Készpénzfelvét, Egyéb, Bevétel)
// got new colors in the same soft/muted family, filling hue gaps her 12
// didn't cover.
//
// Run through `scripts/validate_palette.js`: several of her colors are
// inherently near-gray (chroma well under the 0.10 floor) and the set reads
// as a continuous warm-to-cool gradient, so a full pass on every adjacent
// pair isn't achievable without changing their character. Two pairs came
// back hard-indistinguishable even for normal color vision (Sport/
// Közlekedés at ΔE 6.2, and Szolgáltatások/Orvos/Sport - Orvos sat between
// two neighbors with nowhere to go) - both were nudged (hue/lightness, same
// hue family) until they cleared the >=15 normal-vision floor; Egyéb was
// also nudged against Készpénzfelvét for the same reason. The remaining
// worst adjacent light-mode pair (Egészség/szépség vs Ruházat/bevásárlás,
// both in her original warm-orange swatches, ΔE 9.0) was left as she gave
// it - same "best-effort, mitigated by the pie's visible labels" standard
// already applied to the rest of this app's extended category set. Dark
// variants are a mechanical deepen+saturate of each light value and were
// not individually re-tuned pair-by-pair (the app currently ships light
// mode only). See PLANNING_LOG.md, 2026-10-08.
export const CATEGORY_COLORS = {
  Élelmiszer: { light: '#f2cfc9', dark: '#ab6459' },
  'Eating out': { light: '#dea2a6', dark: '#c0505f' },
  'Ruházat/bevásárlás': { light: '#dd785b', dark: '#d43e00' },
  'Egészség/szépség': { light: '#ea994d', dark: '#a73f00' },
  Szolgáltatások: { light: '#fbca39', dark: '#b68700' },
  Orvos: { light: '#708600', dark: '#799400' },
  Sport: { light: '#94a773', dark: '#688800' },
  Közlekedés: { light: '#b4e4e3', dark: '#008c8c' },
  'Számlák/előfizetés': { light: '#80a4aa', dark: '#198998' },
  Megtakarítás: { light: '#d2cbe3', dark: '#9987bd' },
  Szórakozás: { light: '#a299b8', dark: '#6d519e' },
  Utalás: { light: '#c4b28e', dark: '#9a740f' },
  Készpénzfelvét: { light: '#92bedd', dark: '#0083bf' },
  Egyéb: { light: '#a2897c', dark: '#a16340' },
  Bevétel: { light: '#87c0a1', dark: '#00915f' },
};

const FALLBACK_COLOR = { light: '#898781', dark: '#898781' };

export function isDarkMode() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function categoryColor(category, dark = isDarkMode()) {
  const entry = CATEGORY_COLORS[category] || FALLBACK_COLOR;
  return dark ? entry.dark : entry.light;
}
