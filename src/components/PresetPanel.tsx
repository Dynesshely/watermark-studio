import { useRef, useState } from 'react'
import type { WmSettings } from '../lib/types'
import type { WmPreset } from '../lib/wmSerialize'
import { parsePresetJson, safePresetFileName, serializePreset } from '../lib/wmSerialize'
import { buildPresetsZip, presetsZipName } from '../lib/presets'
import { downloadBlob } from '../lib/exporter'
import { useSettings } from '../store/settings'
import { usePresets } from '../store/presets'
import { Button, Group, Icon, cx, toast, type IconName } from './ui'

/** 列表行右侧的小图标按钮 */
function RowIcon({
  icon,
  title,
  onClick,
  danger,
}: {
  icon: IconName
  title: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cx(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 opacity-70 transition-all hover:opacity-100',
        danger
          ? 'hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10'
          : 'hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 dark:hover:text-indigo-300',
      )}
    >
      <Icon name={icon} className="h-3.5 w-3.5" />
    </button>
  )
}

/** 副行摘要：模式 · 字号 · 角度 · 文字片段 */
function metaLine(wm: WmSettings): string {
  const size = wm.unit === 'percent' ? `${wm.fontSize.toFixed(1)}%` : `${Math.round(wm.fontSize)}px`
  const head = wm.content.split('\n')[0].trim()
  const text = head.length > 12 ? `${head.slice(0, 12)}…` : head
  return `${wm.mode === 'tile' ? '平铺' : '单次'} · ${size} · ${wm.angleDeg}°${text ? ` · “${text}”` : ''}`
}

function suggestName(wm: WmSettings, count: number): string {
  const head = wm.content.split('\n')[0].trim()
  if (!head) return `预设 ${count + 1}`
  return head.length > 12 ? head.slice(0, 12) : head
}

/**
 * 水印预设面板：保存 / 套用 / 重命名 / 覆盖 / 导出 JSON / 导出全部 ZIP / 导入 JSON。
 * 放在参数面板顶部，便于边看预览边套用。
 */
export function PresetPanel() {
  const { s, setWm } = useSettings()
  const { presets, add, addMany, remove, rename, overwrite } = usePresets()
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const importRef = useRef<HTMLInputElement | null>(null)

  const startSave = () => {
    setSaving(true)
    setDraft(suggestName(s.wm, presets.length))
  }

  const commitSave = () => {
    const used = add(draft, s.wm)
    setSaving(false)
    toast(`已保存预设「${used}」`, 'success')
  }

  const applyPreset = (p: WmPreset) => {
    setWm(p.wm)
    toast(`已套用预设「${p.name}」`, 'success')
  }

  const exportOne = (p: WmPreset) => {
    const blob = new Blob([serializePreset(p)], { type: 'application/json' })
    downloadBlob(blob, `${safePresetFileName(p.name)}.json`)
    toast(`已导出「${p.name}」`, 'success')
  }

  const exportAll = async () => {
    if (presets.length === 0) return
    setBusy(true)
    try {
      const blob = await buildPresetsZip(presets)
      downloadBlob(blob, presetsZipName())
      toast(`已导出 ${presets.length} 个预设为 ZIP`, 'success')
    } catch (e) {
      toast(`导出失败：${e instanceof Error ? e.message : '未知错误'}`, 'error')
    } finally {
      setBusy(false)
    }
  }

  const importFiles = async (files: File[]) => {
    const ok: { name: string; wm: WmSettings }[] = []
    const failed: string[] = []
    for (const file of files) {
      try {
        const parsed = parsePresetJson(await file.text())
        ok.push({ name: parsed.name ?? file.name.replace(/\.json$/i, ''), wm: parsed.wm })
      } catch (e) {
        failed.push(`${file.name}（${e instanceof Error ? e.message : '解析失败'}）`)
      }
    }
    if (ok.length > 0) {
      const names = addMany(ok)
      toast(
        `已导入 ${names.length} 个预设：${names.slice(0, 3).join('、')}${names.length > 3 ? ' 等' : ''}`,
        'success',
      )
    }
    if (failed.length > 0) {
      toast(
        `导入失败 ${failed.length} 个：${failed.slice(0, 2).join('、')}${failed.length > 2 ? ' 等' : ''}`,
        'error',
      )
    }
  }

  const commitRename = (id: string, value: string) => {
    const v = value.trim()
    if (v) rename(id, v)
    setEditingId(null)
  }

  return (
    <Group
      title={
        <span className="flex items-center gap-1.5">
          水印预设
          {presets.length > 0 && (
            <span className="rounded bg-indigo-50 px-1.5 py-px text-[10px] font-medium text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
              {presets.length}
            </span>
          )}
        </span>
      }
      extra={
        <button
          type="button"
          onClick={startSave}
          title="把当前水印参数保存为预设"
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-300"
        >
          <Icon name="plus" className="h-3 w-3" />
          保存当前
        </button>
      }
    >
      {saving && (
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            value={draft}
            placeholder="预设名称"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitSave()
              if (e.key === 'Escape') setSaving(false)
            }}
            className="h-7 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          />
          <Button variant="primary" onClick={commitSave} className="h-7 px-2 text-[11px]">
            保存
          </Button>
          <Button variant="ghost" onClick={() => setSaving(false)} className="h-7 px-2 text-[11px]">
            取消
          </Button>
        </div>
      )}

      {presets.length === 0 ? (
        <p className="rounded-lg bg-slate-100/80 px-2 py-1.5 text-[11px] leading-relaxed text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
          暂无预设。调好水印参数后点右上「保存当前」命名保存；套用、重命名（双击名称）、导出 JSON / ZIP
          都在这里。
        </p>
      ) : (
        <ul data-testid="preset-list" className="flex flex-col gap-1">
          {presets.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-slate-200 px-2 py-1.5 transition-colors hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-600/60"
            >
              <div className="flex items-center gap-1.5">
                {editingId === p.id ? (
                  <input
                    autoFocus
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onBlur={(e) => commitRename(p.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(p.id, editDraft)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    className="h-6 min-w-0 flex-1 rounded border border-indigo-400 bg-white px-1.5 text-xs text-slate-700 outline-none dark:bg-slate-800 dark:text-slate-200"
                  />
                ) : (
                  <button
                    type="button"
                    title="双击重命名"
                    onDoubleClick={() => {
                      setEditingId(p.id)
                      setEditDraft(p.name)
                    }}
                    className="min-w-0 flex-1 truncate text-left text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    {p.name}
                  </button>
                )}
                <Button
                  variant="soft"
                  onClick={() => applyPreset(p)}
                  title="把该预设的参数套用到当前编辑"
                  className="h-6 shrink-0 px-2 text-[11px]"
                >
                  套用
                </Button>
              </div>
              <div className="mt-0.5 flex items-center gap-0.5">
                <span className="min-w-0 flex-1 truncate text-[10px] text-slate-400 dark:text-slate-500">
                  {metaLine(p.wm)}
                </span>
                <RowIcon
                  icon="refresh"
                  title="用当前参数更新此预设"
                  onClick={() => {
                    overwrite(p.id, s.wm)
                    toast(`已用当前参数更新「${p.name}」`, 'success')
                  }}
                />
                <RowIcon icon="download" title="导出为 JSON" onClick={() => exportOne(p)} />
                <RowIcon
                  icon="trash"
                  title="删除"
                  danger
                  onClick={() => {
                    remove(p.id)
                    toast(`已删除「${p.name}」`)
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-1.5 pt-0.5">
        <Button
          variant="outline"
          icon="archive"
          disabled={presets.length === 0 || busy}
          onClick={() => void exportAll()}
          className="flex-1"
          title="把所有预设打包为 ZIP（内含逐个 .json）"
        >
          导出全部 ZIP
        </Button>
        <Button
          variant="ghost"
          icon="upload"
          onClick={() => importRef.current?.click()}
          className="flex-1"
          title="从 .json 文件导入预设"
        >
          导入 JSON
        </Button>
        <input
          ref={importRef}
          type="file"
          accept=".json,application/json"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            e.target.value = ''
            if (files.length > 0) void importFiles(files)
          }}
        />
      </div>
    </Group>
  )
}
