/** Editable ranges in the native sprite coordinate system. Smaller Y is higher. */
export const GEOMETRY_LIMITS = {
  spacing: { min: -25, max: 43, step: 2 },
  apex: { min: 18, max: 183, step: 8 },
} as const;

export const NEUTRAL_APEX = 79;

export function compareArcHeight(apex: number): 'above' | 'at' | 'below' {
  if (apex < NEUTRAL_APEX - 8) return 'above';
  if (apex > NEUTRAL_APEX + 8) return 'below';
  return 'at';
}

/** Up/down set height; left/right set width wherever hand spacing is editable. */
export function geometryArrow(key: string, fine: boolean, geometry: { apex: number; spacing?: number }) {
  let field: 'spacing' | 'apex';
  switch (key) {
    case 'ArrowUp': case 'ArrowDown': field = 'apex'; break;
    case 'ArrowLeft': case 'ArrowRight': field = 'spacing'; break;
    default: return;
  }
  const current = geometry[field];
  if (current === undefined) return;
  const limits = GEOMETRY_LIMITS[field];
  const step = fine ? 1 : limits.step;
  const sign = key === 'ArrowUp' || key === 'ArrowLeft' ? -1 : 1;
  return { field, value: Math.max(limits.min, Math.min(limits.max, current + sign * step)) };
}
