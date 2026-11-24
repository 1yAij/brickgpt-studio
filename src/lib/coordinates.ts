export type Brick = {
  width: number
  depth: number
  x: number
  y: number
  z: number
}

export type Model = {
  id: string
  name: string
  filename: string
  source: string
  bricks: Brick[]
  prompt?: string
  seed?: number
  instability?: number
  thumbnail?: string
  importedAt?: number
}

const coordinateLine = /^(\d+)\s*[xX×]\s*(\d+)\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)$/

export function parseCoordinates(source: string): Brick[] {
  const bricks: Brick[] = []
  for (const [index, raw] of source.split(/\r\n|\n|\r/).entries()) {
    const line = raw.trim()
    if (!line) continue

    const match = coordinateLine.exec(line)
    if (!match) throw new Error(`第 ${index + 1} 行格式有误，应为 1x2 (7,18,0) 这样的坐标。`)

    const [width, depth, x, y, z] = match.slice(1).map(Number)
    if (
      width < 1 ||
      depth < 1 ||
      ![width, depth, x, y, z, x + width, y + depth, z + 1].every(Number.isSafeInteger)
    ) {
      throw new Error(`第 ${index + 1} 行的积木尺寸或坐标无效。`)
    }
    bricks.push({ width, depth, x, y, z })
  }

  if (bricks.length === 0) throw new Error('文件里没有积木坐标。')
  return bricks
}

export function partTypeCount(bricks: Brick[]) {
  return new Set(bricks.map(({ width, depth }) =>
    `${Math.min(width, depth)}x${Math.max(width, depth)}`,
  )).size
}

export async function readCoordinateFile(file: File): Promise<Model> {
  if (!/\.txt$/i.test(file.name)) throw new Error('请选择 BrickGPT 的 .txt 坐标文件。')
  if (file.size > 2 * 1024 * 1024) throw new Error('单个坐标文件最多 2 MB。')

  const source = await file.text()
  const bricks = parseCoordinates(source)
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(
    JSON.stringify([file.name, bricks]),
  ))
  const id = Array.from(new Uint8Array(hash), value => value.toString(16).padStart(2, '0')).join('')

  return {
    id,
    name: file.name.replace(/\.txt$/i, ''),
    filename: file.name,
    source,
    bricks,
    importedAt: performance.timeOrigin + performance.now(),
  }
}
