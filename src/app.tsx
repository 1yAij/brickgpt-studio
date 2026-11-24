import { useRef, useState, type ChangeEvent } from 'react'
import { Box, Upload, X } from 'lucide-react'
import { demos } from './data/demos'
import type { Model } from './lib/coordinates'
import { useLibrary, type ImportNotice } from './lib/use-library'
import { Ablation, Inspector, ModelLibrary } from './components/workbench-panels'
import { Playback, usePlayback } from './components/playback'
import { Viewport } from './components/viewport'

const selectionKey = 'brickgpt-studio:selected'

function restoreSelection() {
  try {
    return localStorage.getItem(selectionKey) ?? demos[0].id
  } catch {
    return demos[0].id
  }
}

function StatusNotice({ notice, close }: { notice: ImportNotice; close: () => void }) {
  return (
    <section className="notice" aria-label="导入结果">
      <button className="bare-icon notice-close" type="button" aria-label="关闭导入结果" onClick={close}>
        <X size={17} aria-hidden="true" />
      </button>
      <div role="status">
        <strong>{notice.title}</strong>
        {notice.details.length > 0 && <ul>{notice.details.map((message, index) => <li key={index}>{message}</li>)}</ul>}
      </div>
    </section>
  )
}

function ActiveModel({ model, resultsOpen, setResultsOpen, styled, toggleStyle }: {
  model: Model
  resultsOpen: boolean
  setResultsOpen: (open: boolean) => void
  styled: boolean
  toggleStyle: () => void
}) {
  const playback = usePlayback(model.bricks.length)
  const [reset, setReset] = useState(0)
  const [orbit, setOrbit] = useState(true)

  return (
    <>
      <main className="workspace">
        <Viewport
          model={model}
          step={playback.step}
          reset={reset}
          onReset={() => setReset(current => current + 1)}
          orbit={orbit}
          onOrbit={() => setOrbit(enabled => !enabled)}
          styled={styled}
          onStyle={toggleStyle}
        />
        <Playback {...playback} />
        <Ablation open={resultsOpen} onOpenChange={setResultsOpen} />
      </main>
      <Inspector model={model} step={playback.step} />
    </>
  )
}

export default function App() {
  const library = useLibrary()
  const input = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState(restoreSelection)
  const [resultsOpen, setResultsOpen] = useState(true)
  const [styled, setStyled] = useState(true)
  const model = library.models.find(entry => entry.id === selected) ?? library.models[0]

  function select(id: string) {
    setSelected(id)
    try {
      localStorage.setItem(selectionKey, id)
    } catch {
      // Selection still works during this session.
    }
  }

  async function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? [])
    event.currentTarget.value = ''
    const first = await library.importFiles(files)
    if (first) select(first)
  }

  return (
    <>
      <header className="site-header">
        <h1 className="brand"><Box size={33} strokeWidth={1.55} aria-hidden="true" />BrickGPT Studio</h1>
        <input ref={input} className="sr-only" type="file" tabIndex={-1} aria-label="BrickGPT 坐标文件" accept=".txt,text/plain" multiple onChange={onFiles} />
        <button
          type="button"
          className="button import-button"
          disabled={!library.ready || library.importing}
          onClick={() => input.current?.click()}
        >
          <Upload size={17} aria-hidden="true" />
          {library.importing ? '正在导入…' : '导入坐标'}
        </button>
      </header>
      <div className="workbench" data-expanded={resultsOpen}>
        <ModelLibrary models={library.models} selected={model.id} select={select} />
        <ActiveModel
          key={model.id}
          model={model}
          resultsOpen={resultsOpen}
          setResultsOpen={setResultsOpen}
          styled={styled}
          toggleStyle={() => setStyled(enabled => !enabled)}
        />
      </div>
      {library.notice && <StatusNotice notice={library.notice} close={() => library.setNotice(null)} />}
    </>
  )
}
