import { useMemo, useState } from 'react'
import * as Collapsible from '@radix-ui/react-collapsible'
import { Box, ChevronDown, Download, FileText, Search, X } from 'lucide-react'
import { ablation } from '../data/demos'
import { partTypeCount, type Model } from '../lib/coordinates'

export function ModelLibrary({ models, selected, select }: {
  models: Model[]
  selected: string
  select: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return models.filter(model => `${model.name} ${model.filename}`.toLowerCase().includes(needle))
  }, [models, query])

  return (
    <aside className="library" aria-labelledby="library-heading">
      <h2 className="panel-heading" id="library-heading">模型库</h2>
      {models.length > 2 && (
        <label className="library-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            aria-label="搜索模型"
            placeholder="搜索模型"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
          {query && (
            <button className="bare-icon" type="button" aria-label="清除搜索" onClick={() => setQuery('')}>
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </label>
      )}
      <ul className="library-list">
        {filtered.map(model => (
          <li key={model.id}>
            <button
              type="button"
              className="model-row"
              aria-pressed={selected === model.id}
              onClick={() => select(model.id)}
            >
              <span className="thumbnail">
                {model.thumbnail
                  ? <img src={model.thumbnail} width="72" height="64" alt="" loading="lazy" />
                  : <Box size={24} aria-hidden="true" />}
              </span>
              <span className="model-row-copy">
                <span className="model-name" title={model.name}>{model.name}</span>
                <span className="model-count">{model.bricks.length} 块积木</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && <p className="library-empty">没有找到匹配的模型。</p>}
    </aside>
  )
}

function downloadCoordinates(model: Model) {
  const url = URL.createObjectURL(new Blob([model.source], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = model.filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function Inspector({ model, step }: { model: Model; step: number }) {
  const parts = useMemo(() => partTypeCount(model.bricks), [model.bricks])
  const current = step < model.bricks.length ? model.bricks[step - 1] : undefined

  return (
    <aside className="inspector" aria-labelledby="inspector-heading">
      <h2 className="panel-heading" id="inspector-heading">模型属性</h2>
      <div className="inspector-detail">
        <h3>{model.name}</h3>
        {model.prompt && (
          <div className="inspector-field">
            <span>原始提示词</span>
            <p className="field-box" lang="en">{model.prompt}</p>
          </div>
        )}
        <div className="inspector-field">
          <span>坐标源文件</span>
          <button
            type="button"
            className="field-box source-button"
            aria-label={`下载 ${model.filename}`}
            onClick={() => downloadCoordinates(model)}
          >
            <FileText size={16} aria-hidden="true" />
            <span title={model.filename}>{model.filename}</span>
            <Download size={14} className="download-icon" aria-hidden="true" />
          </button>
        </div>
        <dl className="inspector-stats">
          <div><dt>积木总数</dt><dd>{model.bricks.length}</dd></div>
          <div><dt>积木规格数</dt><dd>{parts}</dd></div>
          <div><dt>随机种子</dt><dd>{model.seed ?? '—'}</dd></div>
          <div><dt>SCIP 最大不稳定分数</dt><dd>{model.instability ?? '—'}</dd></div>
        </dl>
        {current && (
          <section className="current-brick" aria-label="当前积木">
            <h4>第 {step} 块积木</h4>
            <code>{current.width}×{current.depth} ({current.x}, {current.y}, {current.z})</code>
          </section>
        )}
      </div>
    </aside>
  )
}

export function Ablation({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Collapsible.Root className="ablation" open={open} onOpenChange={onOpenChange}>
      <Collapsible.Trigger asChild>
        <button className="ablation-trigger" type="button">
          <ChevronDown size={18} aria-hidden="true" />
          <span>A2 · 消融实验</span>
          <small>{ablation[0].completed} 条配对提示词</small>
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content className="ablation-content">
        <div className="table-scroll">
          <table className="data-table">
            <caption className="sr-only">A2 消融实验结果。合法和稳定的计数均以全部配对提示词为分母。</caption>
            <thead>
              <tr><th scope="col">实验设置</th><th scope="col">合法</th><th scope="col">稳定</th><th scope="col">生成耗时中位数</th></tr>
            </thead>
            <tbody>
              {ablation.map(row => (
                <tr key={row.mode}>
                  <th scope="row" title={row.detail}>{row.label}</th>
                  <td>{row.valid}/{row.completed}</td>
                  <td title={`经 SCIP 检查的合法结构为 ${row.checked}/${row.valid}。`}>{row.stable}/{row.completed}</td>
                  <td>{row.duration.toFixed(2)} s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <details className="experiment-notes">
          <summary>统计口径与数据来源</summary>
          <p>各组均以 250 条配对提示词为分母，生成失败的样本也计入分母。三组都启用了语法掩码。</p>
          <ul>
            {ablation.map(row => (
              <li key={row.mode}><strong>{row.label}</strong>。{row.detail}经 SCIP 检查的合法结构为 {row.checked}/{row.valid}。</li>
            ))}
          </ul>
          <a href={new URL('../data/ablation-paired.csv', import.meta.url).href} download="ablation_paired.csv">下载原始 CSV</a>
        </details>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
