import { useCallback, useEffect, useRef, useState } from 'react'
import type { ImageItem } from './lib/types'
import type { Decoded } from './lib/imaging'
import {
  decodeToSource,
  isBigImage,
  makeItemId,
  sniffMeta,
  toFileFromBlob,
  unsupportedHint,
} from './lib/imaging'
import type { ExportMode, ExportProgress } from './lib/exporter'
import { processImages } from './lib/exporter'
import { SettingsProvider, useSettings } from './store/settings'
import { I18nProvider, useI18n } from './store/i18n'
import { PresetsProvider } from './store/presets'
import { TopBar } from './components/TopBar'
import { Hero } from './components/Hero'
import { ImageList } from './components/ImageList'
import { PreviewPane } from './components/PreviewPane'
import { SettingsPanel } from './components/SettingsPanel'
import { ExportPanel } from './components/ExportPanel'
import { NewFromColorDialog } from './components/NewFromColorDialog'
import { cx, Icon, toast, Toaster } from './components/ui'

export default function App() {
  return (
    <SettingsProvider>
      <I18nProvider>
        <PresetsProvider>
          <Shell />
          <Toaster />
        </PresetsProvider>
      </I18nProvider>
    </SettingsProvider>
  )
}

function Shell() {
  const { s } = useSettings()
  const { t } = useI18n()
  const [items, setItems] = useState<ImageItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  /** 汇总列表文案：超过 max 项时截断并追加「等」 */
  const listItems = (list: string[], max: number): string => {
    const sep = t('common.listSep')
    if (list.length <= max) return list.join(sep)
    return t('common.andMore', { items: list.slice(0, max).join(sep) })
  }
  const [src, setSrc] = useState<Decoded | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragOn, setDragOn] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [colorOpen, setColorOpen] = useState(false)
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const bigWarned = useRef<Set<string>>(new Set())
  const busyRef = useRef(false)

  const activeItem = activeId ? (items.find((i) => i.id === activeId) ?? null) : null

  /* ---------------- 导入 ---------------- */

  const addFiles = useCallback(
    async (fileList: File[]) => {
      if (fileList.length === 0) return
      const existing = new Set(items.map((i) => `${i.name}|${i.size}`))
      const added: ImageItem[] = []
      const skipped: string[] = []
      let dup = 0

      for (const file of fileList) {
        if (existing.has(`${file.name}|${file.size}`)) {
          dup++
          continue
        }
        const hint = unsupportedHint(file.name)
        if (hint) {
          skipped.push(t('toast.skipUnsupported', { name: file.name, kind: hint }))
          continue
        }
        const meta = await sniffMeta(file)
        if (!meta.kind) {
          skipped.push(t('toast.skipUnknown', { name: file.name }))
          continue
        }
        const item: ImageItem = {
          id: makeItemId(),
          name: file.name,
          file,
          kind: meta.kind,
          mime: meta.mime,
          thumbUrl: URL.createObjectURL(file),
          size: file.size,
        }
        existing.add(`${file.name}|${file.size}`)
        added.push(item)
      }

      if (added.length > 0) {
        setItems((prev) => [...prev, ...added])
        setActiveId((prev) => prev ?? added[0].id)
      }
      if (dup > 0) skipped.push(t('toast.skipDuplicate', { n: dup }))
      if (added.length > 0 && skipped.length === 0) {
        toast(t('toast.addedCount', { n: added.length }), 'success')
      } else if (added.length > 0) {
        toast(
          t('toast.addedWithSkips', {
            n: added.length,
            items: listItems(skipped, 2),
          }),
        )
      } else {
        toast(t('toast.addFailed', { items: listItems(skipped, 3) }), 'error')
      }
    },
    [items, t],
  )

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const victim = prev.find((i) => i.id === id)
      if (victim) URL.revokeObjectURL(victim.thumbUrl)
      const next = prev.filter((i) => i.id !== id)
      return next
    })
    setActiveId((prev) => {
      if (prev !== id) return prev
      const idx = items.findIndex((i) => i.id === id)
      const rest = items.filter((i) => i.id !== id)
      return rest.length > 0 ? rest[Math.min(idx, rest.length - 1)].id : null
    })
  }, [items])

  const clearAll = useCallback(() => {
    setItems((prev) => {
      for (const i of prev) URL.revokeObjectURL(i.thumbUrl)
      return []
    })
    setActiveId(null)
  }, [])

  const reorder = useCallback((from: number, to: number) => {
    setItems((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }, [])

  /* ---------------- 剪贴板 ---------------- */

  const readClipboard = useCallback(async (): Promise<File[]> => {
    if (!navigator.clipboard?.read) {
      throw new Error('clipboard-unavailable')
    }
    const clipItems = await navigator.clipboard.read()
    const files: File[] = []
    for (const it of clipItems) {
      const type = it.types.find((t) => t.startsWith('image/'))
      if (!type) continue
      const blob = await it.getType(type)
      const ext = type.split('/')[1] ?? 'png'
      const fname = t('app.clipboardFileName', { stamp: Date.now().toString(36), ext })
      files.push(toFileFromBlob(blob, fname))
    }
    return files
  }, [t])

  const pasteManual = useCallback(async () => {
    try {
      const files = await readClipboard()
      if (files.length === 0) {
        toast(t('toast.clipboardEmpty'), 'error')
        return
      }
      await addFiles(files)
    } catch {
      toast(t('toast.clipboardDenied'), 'error')
    }
  }, [readClipboard, addFiles, t])

  // 全局 Ctrl+V
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const el = document.activeElement
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      if (typing) return
      const files: File[] = []
      const items = e.clipboardData?.items
      if (items) {
        for (const it of items) {
          if (it.kind === 'file' && it.type.startsWith('image/')) {
            const f = it.getAsFile()
            if (f) files.push(f)
          }
        }
      }
      if (files.length > 0) {
        e.preventDefault()
        void addFiles(files)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [addFiles])

  /* ---------------- 拖拽导入 ---------------- */

  useEffect(() => {
    let depth = 0
    const onEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        depth++
        setDragOn(true)
      }
    }
    const onLeave = () => {
      depth = Math.max(0, depth - 1)
      if (depth === 0) setDragOn(false)
    }
    const onOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) e.preventDefault()
    }
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      depth = 0
      setDragOn(false)
      const files = Array.from(e.dataTransfer?.files ?? []).filter(
        (f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp)$/i.test(f.name),
      )
      if (files.length > 0) void addFiles(files)
    }
    window.addEventListener('dragenter', onEnter)
    window.addEventListener('dragleave', onLeave)
    window.addEventListener('dragover', onOver)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onEnter)
      window.removeEventListener('dragleave', onLeave)
      window.removeEventListener('dragover', onOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [addFiles])

  /* ---------------- 主预览图解码（懒加载 + 自动释放） ---------------- */

  useEffect(() => {
    const item = activeId ? items.find((i) => i.id === activeId) ?? null : null
    if (!item) {
      setSrc(null)
      setLoading(false)
      return
    }
    let dead = false
    setSrc(null)
    setLoading(true)
    decodeToSource(item.file)
      .then((d) => {
        if (dead) {
          d.dispose?.()
          return
        }
        setSrc(d)
        setLoading(false)
        if (isBigImage(d.width, d.height) && !bigWarned.current.has(item.id)) {
          bigWarned.current.add(item.id)
          toast(
            t('toast.bigImage', { name: item.name, w: d.width, h: d.height }),
            'info',
          )
        }
      })
      .catch(() => {
        if (dead) return
        setLoading(false)
        toast(t('toast.decodeFailed', { name: item.name }), 'error')
      })
    return () => {
      dead = true
      setSrc((prev) => {
        if (prev) {
          prev.dispose?.()
          return null
        }
        return prev
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  /* ---------------- 导出 ---------------- */

  const runExport = useCallback(
    async (mode: ExportMode) => {
      if (busyRef.current) return
      if (mode !== 'one' && items.length === 0) return
      if (mode === 'one' && !activeId) return
      busyRef.current = true
      setProgress({ done: 0, total: 1, phase: t('export.busy.preparing') })
      try {
        const res = await processImages(items, s, mode, activeId, (p) => setProgress(p))
        const zip = mode === 'zip'
        const sent = res.okNames.length - (zip ? 1 : 0)

        if (res.emptyContent) {
          toast(t('toast.emptyWatermark'), 'error')
        }
        if (zip && res.failed.length === 0) {
          toast(t('toast.zipStarted', { n: sent }), 'success')
        } else if (mode === 'one' && res.okNames.length === 1) {
          toast(t('toast.oneStarted'), 'success')
        } else if (mode === 'all' && res.failed.length === 0) {
          toast(t('toast.allStarted', { n: sent }), 'success')
        }
        if (res.failed.length > 0) {
          toast(
            t('toast.failed', {
              n: res.failed.length,
              names: listItems(
                res.failed.map((f) => f.name),
                3,
              ),
              msg: res.failed[0].error,
            }),
            'error',
          )
        }
        if (res.pngFallbackNames.length > 0) {
          toast(t('toast.pngFallback', { n: res.pngFallbackNames.length }), 'info')
        }
        if (res.exifWarning) {
          toast(t('toast.exifWarning'), 'info')
        }
      } catch (e) {
        console.error(e)
        const msg = e instanceof Error ? e.message : t('common.unknownError')
        toast(t('toast.exportFailed', { msg }), 'error')
      } finally {
        busyRef.current = false
        setProgress(null)
      }
    },
    [items, s, activeId, t],
  )

  const busy = progress !== null

  /* ---------------- 渲染 ---------------- */

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-100/70 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <TopBar />

      {dragOn && (
        <div className="pointer-events-none fixed inset-0 z-[90] flex flex-col items-center justify-center gap-3 bg-indigo-600/10 backdrop-blur-[2px]">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl">
            <Icon name="upload" className="h-8 w-8" />
          </span>
          <p className="rounded-full bg-white/90 px-4 py-1.5 text-sm font-medium text-indigo-700 shadow dark:bg-slate-900/90 dark:text-indigo-300">
            {t('drag.overlay')}
          </p>
        </div>
      )}

      {items.length === 0 ? (
        <Hero
          onPick={(files) => void addFiles(files)}
          onPaste={() => void pasteManual()}
          onNewColor={() => setColorOpen(true)}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* 桌面端左侧列表 */}
          <div className="hidden h-full w-56 shrink-0 flex-col border-r border-slate-200/80 bg-white/70 lg:flex dark:border-slate-800 dark:bg-slate-900/40">
            <ImageList
              items={items}
              activeId={activeId}
              wm={s.wm}
              layout="vertical"
              onSelect={setActiveId}
              onRemove={removeItem}
              onClear={clearAll}
              onReorder={reorder}
              onNewImage={() => setColorOpen(true)}
              onPick={(files) => void addFiles(files)}
              onPaste={() => void pasteManual()}
            />
          </div>

          {/* 主区域（含窄屏横向列表条） */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex h-[172px] min-h-0 shrink-0 flex-col border-b border-slate-200/80 bg-white/70 lg:hidden dark:border-slate-800 dark:bg-slate-900/40">
              <ImageList
                items={items}
                activeId={activeId}
                wm={s.wm}
                layout="strip"
                onSelect={setActiveId}
                onRemove={removeItem}
                onClear={clearAll}
                onReorder={reorder}
                onNewImage={() => setColorOpen(true)}
                onPick={(files) => void addFiles(files)}
                onPaste={() => void pasteManual()}
              />
            </div>
            <PreviewPane item={activeItem} src={src} loading={loading} />
          </div>

          {/* 右侧参数 + 导出 */}
          <aside
            className={cx(
              'fixed inset-y-0 right-0 z-40 flex h-full w-[min(88vw,340px)] flex-col border-l border-slate-200/80 bg-white shadow-2xl transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 lg:static lg:inset-auto lg:z-auto lg:w-[340px] lg:translate-x-0 lg:shadow-none',
              panelOpen ? 'translate-x-0' : 'translate-x-full',
            )}
          >
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-200/80 px-3 lg:hidden dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t('panel.drawerTitle')}
              </span>
              <button
                type="button"
                aria-label={t('panel.collapse')}
                onClick={() => setPanelOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>
            <div className="nice-scroll min-h-0 flex-1 overflow-y-auto">
              <SettingsPanel />
            </div>
            <ExportPanel
              count={items.length}
              canDownloadOne={!!activeItem}
              busy={busy}
              progress={progress}
              onExport={(mode) => void runExport(mode)}
            />
          </aside>
        </div>
      )}

      {/* 窄屏：抽屉遮罩与开关按钮 */}
      {items.length > 0 && panelOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setPanelOpen(false)}
        />
      )}
      {items.length > 0 && (
        <button
          type="button"
          aria-label={t('panel.openSettings')}
          onClick={() => setPanelOpen((v) => !v)}
          className="fixed bottom-5 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-transform hover:scale-105 active:scale-95 lg:hidden"
        >
          <Icon name="sliders" className="h-5 w-5" />
        </button>
      )}

      {/* 「从颜色开始」面板：待命界面与列表底部操作条共用 */}
      <NewFromColorDialog
        open={colorOpen}
        onClose={() => setColorOpen(false)}
        onCreated={(file) => void addFiles([file])}
      />
    </div>
  )
}
