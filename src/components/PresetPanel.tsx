import { useMemo, useRef, useState } from 'react'
import type { WmSettings } from '../lib/types'
import type { WmPreset } from '../lib/wmSerialize'
import { parsePresetJson, safePresetFileName, serializePreset } from '../lib/wmSerialize'
import { buildPresetsZip, presetsZipName } from '../lib/presets'
import { downloadBlob } from '../lib/exporter'
import type { DictKey, TParams } from '../i18n'
import { useSettings } from '../store/settings'
import { usePresets } from '../store/presets'
import { useI18n } from '../store/i18n'
import { Button, Group, Icon, cx, toast, type IconName } from './ui'

type TFn = (key: DictKey, params?: TParams) => string

/** 预设数量达到该阈值才显示搜索框（少量预设时搜索框只是噪声） */
const SEARCH_MIN = 5

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
function metaLine(t: TFn, wm: WmSettings): string {
  const size =
    wm.unit === 'percent'
      ? t('panel.display.pct', { v: wm.fontSize.toFixed(1) })
      : t('panel.display.px', { v: Math.round(wm.fontSize) })
  const mode = wm.mode === 'tile' ? t('preset.mode.tile') : t('preset.mode.single')
  const head = wm.content.split('\n')[0].trim()
  if (!head) return t('preset.metaNoText', { mode, size, angle: wm.angleDeg })
  const text = head.length > 12 ? `${head.slice(0, 12)}…` : head
  return t('preset.meta', { mode, size, angle: wm.angleDeg, text })
}

function suggestName(t: TFn, wm: WmSettings, count: number): string {
  const head = wm.content.split('\n')[0].trim()
  if (!head) return t('preset.nameDefault', { n: count + 1 })
  return head.length > 12 ? head.slice(0, 12) : head
}

/**
 * 水印预设面板：保存 / 套用 / 重命名 / 覆盖 / 导出 JSON / 导出全部 ZIP / 导入 JSON。
 * 放在参数面板顶部，便于边看预览边套用。
 */
export function PresetPanel() {
  const { s, setWm } = useSettings()
  const { t } = useI18n()
  const { presets, add, addMany, remove, rename, overwrite, duplicate } = usePresets()
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const importRef = useRef<HTMLInputElement | null>(null)

  // 名称 + 水印文字（含多行）都可搜；大小写不敏感
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return presets
    return presets.filter(
      (p) => p.name.toLowerCase().includes(q) || p.wm.content.toLowerCase().includes(q),
    )
  }, [presets, query])

  const startSave = () => {
    setSaving(true)
    setDraft(suggestName(t, s.wm, presets.length))
  }

  const commitSave = () => {
    const used = add(draft, s.wm)
    setSaving(false)
    toast(t('preset.toast.saved', { name: used }), 'success')
  }

  const applyPreset = (p: WmPreset) => {
    setWm(p.wm)
    toast(t('preset.toast.applied', { name: p.name }), 'success')
  }

  const exportOne = (p: WmPreset) => {
    const blob = new Blob([serializePreset(p)], { type: 'application/json' })
    downloadBlob(blob, `${safePresetFileName(p.name)}.json`)
    toast(t('preset.toast.exported', { name: p.name }), 'success')
  }

  const exportAll = async () => {
    if (presets.length === 0) return
    setBusy(true)
    try {
      const blob = await buildPresetsZip(presets)
      downloadBlob(blob, presetsZipName())
      toast(t('preset.toast.exportedZip', { n: presets.length }), 'success')
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('common.unknownError')
      toast(t('preset.toast.exportFailed', { msg }), 'error')
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
        const reason = e instanceof Error ? e.message : t('common.parseFailed')
        failed.push(`${file.name} (${reason})`)
      }
    }
    if (ok.length > 0) {
      const names = addMany(ok)
      const sep = t('common.listSep')
      const listed =
        names.length > 3
          ? t('common.andMore', { items: names.slice(0, 3).join(sep) })
          : names.join(sep)
      toast(t('preset.toast.imported', { n: names.length, names: listed }), 'success')
    }
    if (failed.length > 0) {
      const sep = t('common.listSep')
      const listed =
        failed.length > 2
          ? t('common.andMore', { items: failed.slice(0, 2).join(sep) })
          : failed.join(sep)
      toast(t('preset.toast.importFailed', { n: failed.length, names: listed }), 'error')
    }
  }

  const duplicatePreset = (p: WmPreset) => {
    const name = duplicate(p.id)
    if (name) toast(t('preset.toast.duplicated', { name }), 'success')
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
          {t('preset.title')}
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
          title={t('preset.saveTitle')}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-300"
        >
          <Icon name="plus" className="h-3 w-3" />
          {t('preset.save')}
        </button>
      }
    >
      {saving && (
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            value={draft}
            placeholder={t('preset.namePlaceholder')}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitSave()
              if (e.key === 'Escape') setSaving(false)
            }}
            className="h-7 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          />
          <Button variant="primary" onClick={commitSave} className="h-7 px-2 text-[11px]">
            {t('preset.saveBtn')}
          </Button>
          <Button variant="ghost" onClick={() => setSaving(false)} className="h-7 px-2 text-[11px]">
            {t('preset.cancel')}
          </Button>
        </div>
      )}

      {presets.length >= SEARCH_MIN && (
        <div className="relative flex items-center">
          <Icon
            name="search"
            className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-slate-400"
          />
          <input
            data-testid="preset-search"
            value={query}
            placeholder={t('preset.searchPlaceholder')}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setQuery('')
            }}
            className="h-7 w-full rounded-md border border-slate-300 bg-white pl-7 pr-7 text-xs text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          />
          {query && (
            <button
              type="button"
              title={t('preset.searchClear')}
              aria-label={t('preset.searchClear')}
              onClick={() => setQuery('')}
              className="absolute right-1.5 flex h-5 w-5 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
              <Icon name="close" className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {presets.length === 0 ? (
        <p className="rounded-lg bg-slate-100/80 px-2 py-1.5 text-[11px] leading-relaxed text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
          {t('preset.empty')}
        </p>
      ) : shown.length === 0 ? (
        <p
          data-testid="preset-no-match"
          className="rounded-lg bg-slate-100/80 px-2 py-1.5 text-[11px] leading-relaxed text-slate-500 dark:bg-slate-800/70 dark:text-slate-400"
        >
          {t('preset.noMatch', { q: query.trim() })}
        </p>
      ) : (
        <ul
          data-testid="preset-list"
          className="nice-scroll flex max-h-64 flex-col gap-1 overflow-y-auto pr-0.5"
        >
          {shown.map((p) => (
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
                    title={t('preset.renameTitle')}
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
                  title={t('preset.applyTitle')}
                  className="h-6 shrink-0 px-2 text-[11px]"
                >
                  {t('preset.apply')}
                </Button>
              </div>
              <div className="mt-0.5 flex items-center gap-0.5">
                <span className="min-w-0 flex-1 truncate text-[10px] text-slate-400 dark:text-slate-500">
                  {metaLine(t, p.wm)}
                </span>
                <RowIcon
                  icon="copy"
                  title={t('preset.duplicate')}
                  onClick={() => duplicatePreset(p)}
                />
                <RowIcon
                  icon="refresh"
                  title={t('preset.overwrite')}
                  onClick={() => {
                    overwrite(p.id, s.wm)
                    toast(t('preset.toast.overwritten', { name: p.name }), 'success')
                  }}
                />
                <RowIcon
                  icon="download"
                  title={t('preset.exportOne')}
                  onClick={() => exportOne(p)}
                />
                <RowIcon
                  icon="trash"
                  title={t('preset.delete')}
                  danger
                  onClick={() => {
                    remove(p.id)
                    toast(t('preset.toast.deleted', { name: p.name }))
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
          title={t('preset.exportAllTitle')}
        >
          {t('preset.exportAll')}
        </Button>
        <Button
          variant="ghost"
          icon="upload"
          onClick={() => importRef.current?.click()}
          className="flex-1"
          title={t('preset.importTitle')}
        >
          {t('preset.import')}
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
