import { parseCoordinates, type Model } from '../lib/coordinates'
import chair from './chair.txt?raw'
import piano from './piano.txt?raw'
import sofa from './sofa.txt?raw'
import bookshelf from './bookshelf.txt?raw'
import compactCar from './compact-car.txt?raw'
import table from './table.txt?raw'
import bench from './bench.txt?raw'
import bunkBed from './bunk-bed.txt?raw'
import bottle from './bottle.txt?raw'
import squareTable from './square-table.txt?raw'
import guitar from './guitar.txt?raw'
import highBackChair from './high-back-chair.txt?raw'
import backlessBench from './backless-bench.txt?raw'
import openBookshelf from './open-bookshelf.txt?raw'
import wideArmSofa from './wide-arm-sofa.txt?raw'
import narrowVessel from './narrow-vessel.txt?raw'
import steppedCar from './stepped-car.txt?raw'
import slimLegTable from './slim-leg-table.txt?raw'
import endPanelBench from './end-panel-bench.txt?raw'
import tallBookcase from './tall-bookcase.txt?raw'
import ablationCsv from './ablation-paired.csv?raw'

const demoSources: Omit<Model, 'bricks'>[] = [
  {
    id: 'example-chair',
    name: '四腿椅',
    filename: 'chair.txt',
    source: chair,
    prompt: 'A basic chair with four legs.',
    seed: 42,
    instability: 0.0627,
  },
  {
    id: 'example-piano',
    name: '积木钢琴',
    filename: 'piano.txt',
    source: piano,
    prompt: 'Grand piano shape with angular body, flat top, and vertical supports.',
    seed: 42,
    instability: 0.11305,
  },
  {
    id: 'example-sofa',
    name: '双扶手沙发',
    filename: 'sofa.txt',
    source: sofa,
    prompt: 'The sofa possesses symmetrical armrests and a backrest, each forming vertical planes. The seating area is parallel to the base.',
    seed: 42,
    instability: 0.00938,
  },
  {
    id: 'example-bookshelf',
    name: '分层书架',
    filename: 'bookshelf.txt',
    source: bookshelf,
    prompt: 'Vertical bookshelf with zigzagging compartments, alternating in height and position.',
    seed: 42,
    instability: 0.02216,
  },
  {
    id: 'example-compact-car',
    name: '方形小车',
    filename: 'compact-car.txt',
    source: compactCar,
    prompt: 'Compact vehicle with defined geometric contours and blocky form.',
    seed: 42,
    instability: 0.016003,
  },
  {
    id: 'example-table',
    name: '四腿桌',
    filename: 'table.txt',
    source: table,
    prompt: 'Table featuring a flat rectangular surface over four evenly spaced legs.',
    seed: 42,
    instability: 0.038206,
  },
  {
    id: 'example-bunk-bed',
    name: '双层床',
    filename: 'bunk-bed.txt',
    source: bunkBed,
    prompt: 'Bunk bed featuring two stacked sleeping platforms and four upright posts.',
    seed: 42,
    instability: 0.251976,
  },
  {
    id: 'example-bench',
    name: '靠背长椅',
    filename: 'bench.txt',
    source: bench,
    prompt: 'Compact bench with layered seat and backrest.',
    seed: 42,
    instability: 0.034819,
  },
  {
    id: 'example-square-table',
    name: '方形边桌',
    filename: 'square-table.txt',
    source: squareTable,
    prompt: 'Square table with a flat surface and multiple legs.',
    seed: 42,
    instability: 0.085856,
  },
  {
    id: 'example-bottle',
    name: '窄颈瓶',
    filename: 'bottle.txt',
    source: bottle,
    prompt: 'Bottle with an extended cylindrical body and tiered top structure.',
    seed: 42,
    instability: 0.001494,
  },
  {
    id: 'example-guitar',
    name: '长颈吉他',
    filename: 'guitar.txt',
    source: guitar,
    prompt: 'The guitar exhibits a tall neck with evenly spaced rectangular sections attached to a pronounced angular body.',
    seed: 42,
    instability: 0.02095,
  },
  {
    id: 'example-high-back-chair',
    name: '高背椅',
    filename: 'high-back-chair.txt',
    source: highBackChair,
    prompt: 'A chair with a tall vertical backrest and square seat. The seat is supported by four thick rectangular legs, evenly positioned at each corner, and a horizontal cross brace connects the back legs, providing additional support.',
    seed: 42,
    instability: 0.026344,
  },
  {
    id: 'example-backless-bench',
    name: '无靠背长凳',
    filename: 'backless-bench.txt',
    source: backlessBench,
    prompt: 'Bench consists of a long, flat upper section and two angular end supports. Each support has a wider base for stability, seamlessly integrated with the flat top.',
    seed: 42,
    instability: 0.029483,
  },
  {
    id: 'example-open-bookshelf',
    name: '开放式书架',
    filename: 'open-bookshelf.txt',
    source: openBookshelf,
    prompt: 'Bookshelf with multiple open shelves and vertical framework.',
    seed: 42,
    instability: 0.651583,
  },
  {
    id: 'example-wide-arm-sofa',
    name: '宽扶手沙发',
    filename: 'wide-arm-sofa.txt',
    source: wideArmSofa,
    prompt: 'Box-like couch featuring a long seat, sturdy backrest, and thick armrests.',
    seed: 42,
    instability: 0.007916,
  },
  {
    id: 'example-narrow-vessel',
    name: '窄身船',
    filename: 'narrow-vessel.txt',
    source: narrowVessel,
    prompt: 'A narrow, elongated vessel featuring a streamlined base topped by a prominent vertical column extending from the center, flanked by stepped shapes at each end.',
    seed: 42,
    instability: 0,
  },
  {
    id: 'example-stepped-car',
    name: '阶梯车顶小车',
    filename: 'stepped-car.txt',
    source: steppedCar,
    prompt: 'This car consists of a boxy main body, layered with stepped segments on the roof and rear, and recessed front and rear sections.',
    seed: 42,
    instability: 0.010813,
  },
  {
    id: 'example-slim-leg-table',
    name: '细腿小桌',
    filename: 'slim-leg-table.txt',
    source: slimLegTable,
    prompt: 'Small table with four straight legs.',
    seed: 42,
    instability: 0.580666,
  },
  {
    id: 'example-end-panel-bench',
    name: '双端挡板长凳',
    filename: 'end-panel-bench.txt',
    source: endPanelBench,
    prompt: 'A bench with raised sides extending slightly above the seat. The structure rests on four equally spaced legs for stability.',
    seed: 42,
    instability: 0.016981,
  },
  {
    id: 'example-tall-bookcase',
    name: '窄型多层书架',
    filename: 'tall-bookcase.txt',
    source: tallBookcase,
    prompt: 'Tall bookcase featuring evenly spaced horizontal sections for storage.',
    seed: 42,
    instability: 0.001084,
  },
]

export const demos: Model[] = demoSources.map(model => ({
  ...model,
  bricks: parseCoordinates(model.source),
}))

const modes: Record<string, { label: string; detail: string }> = {
  unconstrained: {
    label: '无拒绝采样与回退',
    detail: '仅使用语法掩码。',
  },
  rejection_only: {
    label: '仅拒绝采样',
    detail: '使用语法掩码和拒绝采样。',
  },
  scip_rollback: {
    label: '拒绝采样 + SCIP 回退',
    detail: '使用语法掩码、拒绝采样和基于 SCIP 的物理回退。',
  },
}

const [header, ...records] = ablationCsv.trim().split(/\r?\n/)
const columns = header.split(',')

export const ablation = records.map(record => {
  const fields = record.split(',')
  const get = (name: string) => fields[columns.indexOf(name)]
  const mode = get('mode')

  return {
    mode,
    ...modes[mode],
    completed: Number(get('completed')),
    generated: Number(get('generated')),
    valid: Number(get('valid')),
    stable: Number(get('stable')),
    checked: Number(get('physics_checked')),
    duration: Number(get('median_generation_seconds')),
  }
})
