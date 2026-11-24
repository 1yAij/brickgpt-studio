import type { Brick } from '../lib/coordinates'

type Surface = 'wood' | 'linen' | 'plastic'

export type BrickAppearance = {
  surface: Surface
  color: string
  lower?: { height: number; color: string }
  upper?: { height: number; color: string }
  detail?: (brick: Brick) => string | undefined
}

const appearances: Record<string, BrickAppearance> = {
  'example-chair': { surface: 'wood', color: '#ce975f' },
  'example-piano': {
    surface: 'plastic',
    color: '#23212a',
    detail: brick => brick.z === 8 && brick.y + brick.depth <= 16 ? '#f8ead2' : undefined,
  },
  'example-sofa': { surface: 'linen', color: '#558b98', lower: { height: 0.15, color: '#39383a' } },
  'example-bookshelf': { surface: 'wood', color: '#c48a59' },
  'example-compact-car': {
    surface: 'plastic', color: '#b33b30',
    lower: { height: 0.31, color: '#343c43' }, upper: { height: 0.77, color: '#eddec0' },
  },
  'example-table': { surface: 'wood', color: '#ab754d', upper: { height: 0.85, color: '#d1a068' } },
  'example-bunk-bed': {
    surface: 'wood', color: '#bd8c59',
    detail: brick => [6, 13].includes(brick.z) && brick.width * brick.depth >= 8 ? '#e3cda5' : undefined,
  },
  'example-bench': { surface: 'wood', color: '#c4874c', lower: { height: 0.30, color: '#76513d' } },
  'example-square-table': { surface: 'wood', color: '#a97448', upper: { height: 0.77, color: '#deaf75' } },
  'example-bottle': { surface: 'plastic', color: '#34766c', upper: { height: 0.81, color: '#dbb980' } },
  'example-guitar': { surface: 'wood', color: '#cf8549', upper: { height: 0.44, color: '#664431' } },
  'example-high-back-chair': { surface: 'wood', color: '#ad783f' },
  'example-backless-bench': { surface: 'wood', color: '#c79d6e', lower: { height: 0.56, color: '#654b3a' } },
  'example-open-bookshelf': { surface: 'wood', color: '#ba875a' },
  'example-wide-arm-sofa': { surface: 'linen', color: '#b57057', lower: { height: 0.18, color: '#724737' } },
  'example-narrow-vessel': {
    surface: 'plastic', color: '#dfdbca',
    lower: { height: 0.48, color: '#3f6277' }, upper: { height: 0.74, color: '#bd6651' },
  },
  'example-stepped-car': {
    surface: 'plastic', color: '#426e9d',
    lower: { height: 0.24, color: '#303743' }, upper: { height: 0.77, color: '#aac2c8' },
  },
  'example-slim-leg-table': { surface: 'wood', color: '#b08052', upper: { height: 0.80, color: '#ddb67f' } },
  'example-end-panel-bench': { surface: 'wood', color: '#93664c', lower: { height: 0.31, color: '#684e41' } },
  'example-tall-bookcase': { surface: 'wood', color: '#c99864' },
}

const importedAppearance: BrickAppearance = { surface: 'plastic', color: '#b87956' }

export function getAppearance(id: string) {
  return appearances[id] ?? importedAppearance
}

export function brickColor(brick: Brick, style: BrickAppearance, height: number) {
  const detail = style.detail?.(brick)
  if (detail) return detail
  if (style.lower && height < style.lower.height) return style.lower.color
  if (style.upper && height >= style.upper.height) return style.upper.color
  return style.color
}
