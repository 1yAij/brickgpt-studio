import { useEffect, useRef, useState } from 'react'
import { demos } from '../data/demos'
import { createThumbnailRenderer } from './brick-scene'
import { readCoordinateFile, type Model } from './coordinates'
import { loadModels, saveModels } from './library-db'

export type ImportNotice = {
  title: string
  details: string[]
}

function withThumbnails(models: Model[]) {
  if (models.length === 0) return models

  let renderer: ReturnType<typeof createThumbnailRenderer> | undefined
  try {
    renderer = createThumbnailRenderer()
    const activeRenderer = renderer
    return models.map(model => {
      try {
        return { ...model, thumbnail: activeRenderer.render(model.bricks) }
      } catch {
        return model
      }
    })
  } catch {
    return models
  } finally {
    renderer?.dispose()
  }
}

export function useLibrary() {
  const [examples, setExamples] = useState(demos)
  const [imports, setImports] = useState<Model[]>([])
  const [ready, setReady] = useState(false)
  const [importing, setImporting] = useState(false)
  const [notice, setNotice] = useState<ImportNotice | null>(null)
  const activeImport = useRef(false)

  useEffect(() => {
    let cancelled = false
    loadModels()
      .then(saved => {
        if (!cancelled) setImports(saved)
      })
      .catch(() => {
        if (!cancelled) setNotice({
          title: '无法打开本地模型库',
          details: ['仍可浏览内置示例，本次会话也可以临时导入模型。'],
        })
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })

    const timer = window.setTimeout(() => {
      if (!cancelled) setExamples(withThumbnails(demos))
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  async function importFiles(files: File[]): Promise<string | null> {
    if (!ready || activeImport.current || files.length === 0) return null

    activeImport.current = true
    setImporting(true)
    setNotice(null)
    try {
      const known = new Set(imports.map(model => model.id))
      const accepted: Model[] = []
      const errors: string[] = []
      let duplicates = 0

      for (const file of files) {
        try {
          const model = await readCoordinateFile(file)
          if (known.has(model.id)) {
            duplicates += 1
            continue
          }
          known.add(model.id)
          accepted.push(model)
        } catch (error) {
          errors.push(`${file.name} · ${error instanceof Error ? error.message : '无法读取文件。'}`)
        }
      }

      const next = withThumbnails(accepted)
      const details = [...errors]
      if (duplicates) details.push(`已跳过 ${duplicates} 个重复模型。`)
      if (next.some(model => !model.thumbnail)) details.push('部分模型暂时无法生成缩略图。')

      let saved = true
      try {
        await saveModels(next)
      } catch {
        saved = false
        details.push('本地保存不可用，导入的模型仅在本次会话中保留。')
      }

      setImports(current => [...current, ...next])
      setNotice({
        title: next.length ? `已${saved ? '导入并保存' : '临时导入'} ${next.length} 个模型` : '未导入新模型',
        details,
      })
      return next[0]?.id ?? null
    } finally {
      activeImport.current = false
      setImporting(false)
    }
  }

  return { models: [...examples, ...imports], ready, importing, importFiles, notice, setNotice }
}
