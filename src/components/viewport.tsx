import { Component, Suspense, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Canvas, useLoader, useThree } from '@react-three/fiber'
import { Camera, Move, Palette, RotateCcw } from 'lucide-react'
import {
  Fog, OrthographicCamera, PCFShadowMap, PMREMGenerator, RepeatWrapping,
  SRGBColorSpace, TextureLoader, Vector3, type Box3,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { getAppearance } from '../data/appearances'
import { createBrickModel, createFloor, createLighting, frameCamera, studioBackground, workbenchBackground } from '../lib/brick-scene'
import type { Model } from '../lib/coordinates'

const textureUrls = [
  new URL('../data/textures/oak-color.jpg', import.meta.url).href,
  new URL('../data/textures/oak-normal.jpg', import.meta.url).href,
  new URL('../data/textures/linen-color.jpg', import.meta.url).href,
  new URL('../data/textures/linen-normal.jpg', import.meta.url).href,
]
type CaptureFrame = () => Promise<Blob | null>

function drawAxes(canvas: HTMLCanvasElement | null, camera: OrthographicCamera) {
  const ctx = canvas?.getContext('2d')
  if (!ctx || !canvas) return

  const scale = 2
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.clearRect(0, 0, canvas.width / scale, canvas.height / scale)
  ctx.font = '11px system-ui, sans-serif'
  ctx.lineCap = 'round'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const rotation = camera.quaternion.clone().invert()
  const originX = 40
  const originY = 44
  const axes = [
    { name: 'X', color: '#eb726d', axis: new Vector3(1, 0, 0) },
    { name: 'Y', color: '#78a4f1', axis: new Vector3(0, 0, -1) },
    { name: 'Z', color: '#98c675', axis: new Vector3(0, 1, 0) },
  ].map(item => ({ ...item, axis: item.axis.applyQuaternion(rotation) }))

  for (const { name, color, axis } of axes.sort((a, b) => a.axis.z - b.axis.z)) {
    const endX = originX + 29 * axis.x
    const endY = originY - 29 * axis.y
    const angle = Math.atan2(-axis.y, axis.x)

    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = 1.7
    ctx.beginPath()
    ctx.moveTo(originX, originY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(endX, endY)
    ctx.lineTo(endX - 7 * Math.cos(angle - 0.53), endY - 7 * Math.sin(angle - 0.53))
    ctx.lineTo(endX - 7 * Math.cos(angle + 0.53), endY - 7 * Math.sin(angle + 0.53))
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#dce4ee'
    ctx.fillText(name, endX + 10 * Math.cos(angle), endY + 10 * Math.sin(angle))
  }

  ctx.fillStyle = '#c9d3e2'
  ctx.beginPath()
  ctx.arc(originX, originY, 2, 0, Math.PI * 2)
  ctx.fill()
}

function CameraRig({ bounds, reset, orbit, axes }: {
  bounds: Box3
  reset: number
  orbit: boolean
  axes: RefObject<HTMLCanvasElement | null>
}) {
  const { camera, gl, invalidate, size } = useThree()
  const orthographic = camera as OrthographicCamera
  const controls = useRef<OrbitControls | null>(null)
  const aspect = size.width / Math.max(1, size.height)

  useLayoutEffect(() => {
    const controller = new OrbitControls(orthographic, gl.domElement)
    controls.current = controller
    controller.maxPolarAngle = Math.PI * 0.54
    controller.minPolarAngle = 0.03
    controller.minZoom = 0.28
    controller.maxZoom = 8

    function refresh() {
      drawAxes(axes.current, orthographic)
      invalidate()
    }
    controller.addEventListener('change', refresh)
    return () => {
      controller.removeEventListener('change', refresh)
      controller.dispose()
      controls.current = null
    }
  }, [axes, gl, invalidate, orthographic])

  useLayoutEffect(() => {
    const controller = controls.current
    if (!controller || !Number.isFinite(aspect) || aspect <= 0) return
    controller.target.copy(frameCamera(orthographic, bounds, aspect, aspect < 1 ? 0.89 : 0.975))
    controller.update()
    drawAxes(axes.current, orthographic)
    invalidate()
  }, [aspect, axes, bounds, invalidate, orthographic, reset])

  useLayoutEffect(() => {
    if (controls.current) controls.current.enabled = orbit
  }, [orbit])

  return null
}

function SceneContents({ model, step, reset, orbit, axes, styled, capture }: {
  model: Model
  step: number
  reset: number
  orbit: boolean
  axes: RefObject<HTMLCanvasElement | null>
  styled: boolean
  capture: RefObject<CaptureFrame | null>
}) {
  const maps = useLoader(TextureLoader, textureUrls)
  const textures = useMemo(() => {
    const [oak, oakNormal, linen, linenNormal] = maps
    for (const color of [oak, linen]) color.colorSpace = SRGBColorSpace
    for (const map of maps) {
      map.wrapS = map.wrapT = RepeatWrapping
      map.anisotropy = 4
      map.needsUpdate = true
    }
    return { wood: { color: oak, normal: oakNormal }, linen: { color: linen, normal: linenNormal }, plastic: undefined }
  }, [maps])
  const bricks = useMemo(() => createBrickModel(model.bricks), [model.bricks])
  const floor = useMemo(() => createFloor(bricks.bounds, styled), [bricks, styled])
  const lighting = useMemo(() => createLighting(bricks.bounds, true, styled), [bricks, styled])
  const { gl, scene, camera, invalidate } = useThree()
  const background = styled ? studioBackground : workbenchBackground
  const fog = useMemo(() => {
    const distance = Math.max(4, bricks.bounds.getSize(new Vector3()).length())
    return new Fog(background, distance * 3, distance * 6)
  }, [background, bricks])

  useLayoutEffect(() => {
    const style = styled ? getAppearance(model.id) : undefined
    bricks.setAppearance(style, style && textures[style.surface])
    invalidate()
  }, [bricks, invalidate, model.id, styled, textures])

  useLayoutEffect(() => {
    if (!styled) return
    const room = new RoomEnvironment()
    const generator = new PMREMGenerator(gl)
    const reflection = generator.fromScene(room, 0.04)
    room.dispose()
    generator.dispose()
    scene.environment = reflection.texture
    scene.environmentIntensity = 0.57
    invalidate()
    return () => {
      scene.environment = null
      reflection.dispose()
    }
  }, [gl, invalidate, scene, styled])

  useLayoutEffect(() => {
    bricks.show(step)
    invalidate()
  }, [bricks, invalidate, step])

  useLayoutEffect(() => {
    capture.current = () => new Promise(resolve => {
      gl.render(scene, camera)
      gl.domElement.toBlob(resolve, 'image/png')
    })
    return () => { capture.current = null }
  }, [camera, capture, gl, scene])

  useLayoutEffect(() => () => bricks.dispose(), [bricks])
  useLayoutEffect(() => () => floor.dispose(), [floor])
  useLayoutEffect(() => () => lighting.key.shadow.dispose(), [lighting])

  return (
    <>
      <color attach="background" args={[background]} />
      <primitive object={fog} attach="fog" />
      {lighting.lights.map(light => <primitive key={light.uuid} object={light} />)}
      <primitive object={floor.group} />
      <primitive object={bricks.group} />
      <CameraRig bounds={bricks.bounds} reset={reset} orbit={orbit} axes={axes} />
    </>
  )
}

function NoWebGL() {
  return <p className="viewport-fallback">3D 查看需要 WebGL 2。你仍可浏览模型库和实验数据。</p>
}

class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? <NoWebGL /> : this.props.children
  }
}

export function Viewport({ model, step, reset, onReset, orbit, onOrbit, styled, onStyle }: {
  model: Model
  step: number
  reset: number
  onReset: () => void
  orbit: boolean
  onOrbit: () => void
  styled: boolean
  onStyle: () => void
}) {
  const axes = useRef<HTMLCanvasElement>(null)
  const capture = useRef<CaptureFrame>(null)
  const [captureError, setCaptureError] = useState('')

  async function saveRender() {
    try {
      const picture = await capture.current?.()
      if (!picture) throw new Error('画面尚未准备好')
      setCaptureError('')
      const url = URL.createObjectURL(picture)
      const link = document.createElement('a')
      link.href = url
      link.download = `${model.filename.replace(/\.txt$/i, '')}-${styled ? 'studio' : 'original'}-${step}.png`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      setCaptureError('暂时无法保存画面，请在模型显示后重试。')
    }
  }

  return (
    <section className="viewport" aria-labelledby="viewport-heading">
      <div className="viewport-toolbar">
        <h2 id="viewport-heading">3D 视图</h2>
        <div className="view-controls">
          <button type="button" className="button tool-button" aria-pressed={styled} onClick={onStyle}>
            <Palette size={16} aria-hidden="true" /><span>材质渲染</span>
          </button>
          <button type="button" className="button tool-button render-save" aria-label="保存渲染图" title="保存渲染图" onClick={saveRender}>
            <Camera size={16} aria-hidden="true" /><span>保存渲染图</span>
          </button>
          <button type="button" className="button tool-button" title={orbit ? '关闭环绕和缩放' : '开启环绕和缩放'} aria-pressed={orbit} onClick={onOrbit}>
            <Move size={16} aria-hidden="true" /><span>环绕</span>
          </button>
          <button type="button" className="button tool-button" onClick={onReset}>
            <RotateCcw size={16} aria-hidden="true" /><span>重置视角</span>
          </button>
        </div>
      </div>
      <div className="scene-frame" data-styled={styled} role="img" aria-label={`${model.name}的 3D 视图，已显示 ${step} 块，共 ${model.bricks.length} 块。${orbit ? "拖动可环绕，滚动可缩放。" : "环绕和缩放已关闭。"}`}>
        <CanvasBoundary>
          <Canvas
            orthographic
            shadows={{ type: PCFShadowMap }}
            dpr={[1, 1.5]}
            frameloop="demand"
            gl={{ antialias: true }}
            fallback={<NoWebGL />}
          >
            <Suspense fallback={null}>
              <SceneContents model={model} step={step} reset={reset} orbit={orbit} axes={axes} styled={styled} capture={capture} />
            </Suspense>
          </Canvas>
        </CanvasBoundary>
        <canvas className="axis-widget" ref={axes} width={172} height={144} aria-hidden="true" />
        {step === 0 && <span className="viewport-hint">待拼装</span>}
      </div>
      {captureError && <p className="render-status" role="status">{captureError}</p>}
    </section>
  )
}
