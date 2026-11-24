import {
  Box3, Color, CylinderGeometry, DirectionalLight, GridHelper, Group, HemisphereLight,
  InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshPhysicalMaterial,
  OrthographicCamera, PlaneGeometry, Scene, ShadowMaterial, Texture, Vector3,
  WebGLRenderer,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { brickColor, type BrickAppearance } from '../data/appearances'
import type { Brick } from './coordinates'

const layerHeight = 1.2
const studHeight = 0.21
export const workbenchBackground = '#232c37'
export const studioBackground = '#e3e0da'

export type BrickTexture = { color: Texture; normal: Texture }

function projectTexture(material: MeshPhysicalMaterial, scale: { value: number }) {
  const varyings = 'varying vec3 vBrickPoint;\nvarying vec3 vBrickNormal;'
  material.onBeforeCompile = shader => {
    shader.uniforms.brickTextureScale = scale
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${varyings}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vBrickPoint = (instanceMatrix * vec4(transformed, 1.0)).xyz;
        vBrickNormal = normal;
      `)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${varyings}\nuniform float brickTextureScale;`)
      .replace('#include <map_fragment>', `
        #ifdef USE_MAP
          // Model-space projection keeps the grain aligned across adjacent bricks.
          vec3 weights = pow(abs(normalize(vBrickNormal)), vec3(6.0));
          weights /= weights.x + weights.y + weights.z;
          vec3 p = vBrickPoint * brickTextureScale;
          vec4 grain = texture2D(map, p.zy) * weights.x
                     + texture2D(map, p.xz) * weights.y
                     + texture2D(map, p.xy) * weights.z;
          diffuseColor *= grain;
        #endif
      `)
  }
}

export function createBrickModel(bricks: Brick[]) {
  const minimum = new Vector3(Infinity, Infinity, Infinity)
  const maximum = new Vector3(-Infinity, -Infinity, -Infinity)
  for (const { x, y, z, width, depth } of bricks) {
    minimum.set(Math.min(minimum.x, x), Math.min(minimum.y, y), Math.min(minimum.z, z))
    maximum.set(Math.max(maximum.x, x + width), Math.max(maximum.y, y + depth), Math.max(maximum.z, z + 1))
  }
  const { x: width, y: depth, z: layers } = maximum.sub(minimum)
  const height = layers * layerHeight
  const bounds = new Box3(
    new Vector3(-width / 2, 0, -depth / 2),
    new Vector3(width / 2, height + studHeight, depth / 2),
  )

  const group = new Group()
  const material = new MeshPhysicalMaterial({ color: '#b1b048', roughness: 0.64 })
  const textureScale = { value: 0.19 }
  projectTexture(material, textureScale)
  const bodyGeometry = new RoundedBoxGeometry(1, 1, 1, 1, 0.024)
  const studGeometry = new CylinderGeometry(0.292, 0.306, studHeight, 14)
  const bodies = new InstancedMesh(bodyGeometry, material, bricks.length)
  const totalStuds = bricks.reduce((sum, brick) => sum + brick.width * brick.depth, 0)
  const studs = new InstancedMesh(studGeometry, material, totalStuds <= 90000 ? totalStuds : 0)

  const matrix = new Matrix4()
  const studCounts = [0]
  const gap = 0.026
  let studIndex = 0

  bricks.forEach((brick, index) => {
    const x = (brick.x - minimum.x) - width / 2
    const y = (brick.z - minimum.z) * layerHeight
    const z = depth / 2 - (brick.y - minimum.y)
    matrix.makeScale(brick.width - gap, layerHeight - gap, brick.depth - gap)
    matrix.setPosition(x + brick.width / 2, y + layerHeight / 2, z - brick.depth / 2)
    bodies.setMatrixAt(index, matrix)

    if (totalStuds <= 90000) {
      for (let dx = 0; dx < brick.width; dx += 1) {
        for (let dy = 0; dy < brick.depth; dy += 1) {
          matrix.makeTranslation(x + dx + 0.5, y + layerHeight + studHeight / 2 - gap, z - dy - 0.5)
          studs.setMatrixAt(studIndex++, matrix)
        }
      }
    }
    studCounts.push(studIndex)
  })

  for (const mesh of [bodies, studs]) {
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.frustumCulled = false
  }
  group.add(bodies, studs)

  return {
    group,
    bounds,
    show(count: number) {
      bodies.count = count
      studs.count = studCounts[count]
    },
    setAppearance(style?: BrickAppearance, texture?: BrickTexture) {
      material.color.set(style ? '#ffffff' : '#b1b048')
      material.map = texture?.color ?? null
      material.normalMap = texture?.normal ?? null
      material.normalScale.setScalar(style?.surface === 'linen' ? 0.12 : 0.19)
      material.roughness = style?.surface === 'linen' ? 0.88 : style ? 0.40 : 0.64
      material.clearcoat = style?.surface === 'plastic' ? 0.46 : 0
      material.clearcoatRoughness = 0.29
      textureScale.value = style?.surface === 'linen' ? 0.43 : 0.17
      if (style || bodies.instanceColor) {
        const color = new Color()
        bricks.forEach((brick, index) => {
          const z = (brick.z + 0.5 - minimum.z) / layers
          color.set(style ? brickColor(brick, style, z) : '#ffffff')
          bodies.setColorAt(index, color)
          for (let stud = studCounts[index]; stud < studCounts[index + 1]; stud += 1) {
            studs.setColorAt(stud, color)
          }
        })
        if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true
        if (studs.instanceColor) studs.instanceColor.needsUpdate = true
      }
      material.needsUpdate = true
    },
    dispose() {
      bodies.dispose()
      studs.dispose()
      bodyGeometry.dispose()
      studGeometry.dispose()
      material.dispose()
    },
  }
}

export function frameCamera(camera: OrthographicCamera, bounds: Box3, aspect: number, fill = 0.975) {
  const target = bounds.getCenter(new Vector3())
  const span = Math.max(4, bounds.getSize(new Vector3()).length())
  // The text uses Z-up. Three.js uses Y-up and maps the text's Y to negative Z.
  camera.position.copy(target).add(new Vector3(0.66, 0.48, 0.82).normalize().multiplyScalar(span * 3))
  camera.near = span * 0.01
  camera.far = span * 20
  camera.zoom = 1
  camera.lookAt(target)
  camera.updateMatrixWorld()

  const projected = bounds.clone().applyMatrix4(camera.matrixWorldInverse)
  const size = projected.getSize(new Vector3())
  const half = Math.max(size.y, size.x / aspect) / (2 * fill)
  camera.left = -half * aspect
  camera.right = half * aspect
  camera.top = half
  camera.bottom = -half
  camera.updateProjectionMatrix()
  return target
}

export function createLighting(bounds: Box3, shadows: boolean, studio = false) {
  const span = Math.max(4, bounds.getSize(new Vector3()).length())
  const hemisphere = new HemisphereLight('#f4f5ff', '#8a8f88', studio ? 1.05 : 1.63)
  const key = new DirectionalLight('#fff6df', studio ? 2.65 : 2.05)
  key.position.set(-0.44 * span, 2.2 * span, 0.66 * span)
  key.castShadow = shadows
  if (shadows) {
    const resolution = studio ? 2048 : 1024
    key.shadow.mapSize.set(resolution, resolution)
    Object.assign(key.shadow.camera, {
      left: -span * 0.72,
      right: span * 0.72,
      top: span * 0.72,
      bottom: -span * 0.72,
      near: span * 0.05,
      far: span * 4,
    })
    key.shadow.normalBias = span * 0.0009
    key.shadow.bias = -0.00018
    key.shadow.radius = 6
  }

  const fill = new DirectionalLight('#dde8ff', studio ? 0.51 : 0.28)
  fill.position.set(0.6 * span, 0.4 * span, -0.4 * span)
  return { lights: [hemisphere, key, fill], key }
}

export function createFloor(bounds: Box3, studio = false) {
  const span = Math.max(12, bounds.getSize(new Vector3()).length())
  const planeGeometry = new PlaneGeometry(span * 9, span * 9)
  const grid = new GridHelper(span * 5, 45, '#3b4857', '#3c4653')
  grid.position.y = -0.035
  grid.material.transparent = true
  grid.material.opacity = 0.46
  grid.material.toneMapped = false
  grid.material.depthWrite = false
  grid.visible = !studio

  const floor = new Mesh(planeGeometry, new MeshBasicMaterial({
    color: studio ? studioBackground : workbenchBackground, toneMapped: false,
  }))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.06

  const shadow = new Mesh(planeGeometry, new ShadowMaterial({ opacity: studio ? 0.34 : 0.24 }))
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = -0.027
  shadow.receiveShadow = true

  const group = new Group().add(floor, grid, shadow)

  return {
    group,
    dispose() {
      planeGeometry.dispose()
      floor.material.dispose()
      shadow.material.dispose()
      grid.dispose()
    },
  }
}

export function createThumbnailRenderer() {
  const renderer = new WebGLRenderer({ alpha: true, antialias: true })
  renderer.setSize(144, 128, false)
  renderer.setClearColor(0x000000, 0)
  const camera = new OrthographicCamera()

  return {
    render(bricks: Brick[]) {
      const model = createBrickModel(bricks)
      const scene = new Scene()
      const { lights } = createLighting(model.bounds, false)
      scene.add(model.group, ...lights)
      frameCamera(camera, model.bounds, 144 / 128, 0.96)

      try {
        renderer.render(scene, camera)
        return renderer.domElement.toDataURL('image/png')
      } finally {
        model.dispose()
      }
    },
    dispose() {
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
