import { useEffect, useState } from 'react'
import * as Slider from '@radix-ui/react-slider'
import { ChevronDown, Pause, Play, SkipBack, SkipForward } from 'lucide-react'

export function usePlayback(total: number) {
  const [step, setStep] = useState(total)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const playing = running && step < total

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setStep(current => Math.min(total, current + 1))
    }, 330 / speed)
    return () => window.clearInterval(timer)
  }, [playing, speed, total])

  function seek(next: number) {
    setRunning(false)
    setStep(Math.min(total, Math.max(0, next)))
  }

  function toggle() {
    if (playing) {
      setRunning(false)
    } else {
      if (step === total) setStep(0)
      setRunning(true)
    }
  }

  return { total, step, playing, speed, seek, toggle, setSpeed }
}

export function Playback({ step, total, playing, speed, seek, toggle, setSpeed }: ReturnType<typeof usePlayback>) {
  return (
    <section className="playback" aria-labelledby="playback-heading">
      <h2 id="playback-heading">拼装顺序</h2>
      <div className="transport">
        <button type="button" className="button button-icon" title="上一块" aria-label="上一块" disabled={step === 0} onClick={() => seek(step - 1)}>
          <SkipBack size={16} aria-hidden="true" />
        </button>
        <button type="button" className="button button-icon playback-toggle" title={playing ? '暂停' : '播放'} aria-label={playing ? '暂停' : '播放'} onClick={toggle}>
          {playing ? <Pause size={16} fill="currentColor" aria-hidden="true" /> : <Play size={16} fill="currentColor" aria-hidden="true" />}
        </button>
        <button type="button" className="button button-icon" title="下一块" aria-label="下一块" disabled={step === total} onClick={() => seek(step + 1)}>
          <SkipForward size={16} aria-hidden="true" />
        </button>
      </div>
      <Slider.Root className="step-slider" min={0} max={total} step={1} value={[step]} onValueChange={([next]) => seek(next)}>
        <Slider.Track className="slider-track">
          <Slider.Range className="slider-range" />
        </Slider.Track>
        <Slider.Thumb className="slider-thumb" aria-label="拼装进度" aria-valuetext={`已显示 ${step} 块，共 ${total} 块`} />
      </Slider.Root>
      <output className="step-count" aria-label="已显示的积木数">{step} / {total}</output>
      <div className="speed-control">
        <select aria-label="播放速度" value={speed} onChange={event => setSpeed(Number(event.target.value))}>
          {[0.5, 1, 2, 4].map(value => <option value={value} key={value}>{value}×</option>)}
        </select>
        <ChevronDown size={15} aria-hidden="true" />
      </div>
    </section>
  )
}
