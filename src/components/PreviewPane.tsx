import { useCallback, useEffect, useRef, useState } from 'react'
import type { ImageItem } from '../lib/types'
import type { Decoded } from '../lib/imaging'
import { KIND_LABEL } from '../lib/types'
import {
  clampCenter,
  drawWatermarkOverlay,
  nearestAnchor,
  WatermarkTooDenseError,
} from '../lib/renderer'
import { useSettings } from '../store/settings'
import { useI18n } from '../store/i18n'
import { cx, Icon, Segmented, toast } from './ui'

export interface PreviewPaneProps {
  item: ImageItem | null
  src: Decoded | null
  loading: boolean
}

type ViewMode = 'wm' | 'raw'
type Tool = 'move' | 'hand'

export function PreviewPane({ item, src, loading }: PreviewPaneProps) {
  const { s, setWm } = useSettings()
  const { t } = useI18n()
  const wm = s.wm
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const [view, setView] = useState<ViewMode>('wm')
  const [tool, setTool] = useState<Tool>('hand')
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [scale, setScale] = useState<number | null>(null) // null = 适应窗口

  const dragRef = useRef<{
    mode: Tool
    startX: number
    startY: number
    grabDX: number
    grabDY: number
    startCX: number
    startCY: number
    lastX: number
    lastY: number
    startScrollL: number
    startScrollT: number
  } | null>(null)
  const lastDenseToast = useRef(0)

  // 跟踪容器尺寸 → “适应窗口”
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setBox({ w: el.clientWidth, h: el.clientHeight })
    })
    ro.observe(el)
    setBox({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [src])

  const fitScale = src
    ? Math.min(1, (box.w - 24) / src.width, (box.h - 24) / src.height, 1) || 0.01
    : 0
  const displayScale = scale === null ? fitScale : scale

  // Ctrl/Cmd + 滚轮缩放（原生滚动留给滚动条）
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const fn = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const f = e.deltaY < 0 ? 1.2 : 1 / 1.2
      setScale((prev) => {
        const base = prev ?? 1
        const next = Math.min(4, Math.max(0.05, base * f))
        return next === 1 ? null : next
      })
    }
    el.addEventListener('wheel', fn, { passive: false })
    return () => el.removeEventListener('wheel', fn)
  }, [])

  // 全分辨率实时绘制（rAF 合并高频参数变化）
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let raf = 0
    const draw = () => {
      if (!src) return
      canvas.width = src.width
      canvas.height = src.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, src.width, src.height)
      ctx.drawImage(src.el, 0, 0, src.width, src.height)
      if (view === 'wm') {
        try {
          drawWatermarkOverlay(ctx, src.width, src.height, wm)
        } catch (e) {
          if (e instanceof WatermarkTooDenseError) {
            const now = Date.now()
            if (now - lastDenseToast.current > 3000) {
              lastDenseToast.current = now
              toast(e.message, 'error')
            }
          } else {
            console.error(e)
          }
        }
      }
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [src, wm, view])

  const pointerToImg = (e: React.PointerEvent) => {
    const canvas = canvasRef.current
    if (!canvas || !src) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) * src.width) / rect.width,
      y: ((e.clientY - rect.top) * src.height) / rect.height,
    }
  }

  const canMoveWm = !!src && wm.mode === 'single' && view === 'wm' && tool === 'move'

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!src || loading || !item) return
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      canvas.setPointerCapture(e.pointerId)
    } catch {
      /* 忽略 */
    }
    const p = pointerToImg(e)
    if (tool === 'move' && wm.mode === 'single') {
      if (view !== 'wm') setView('wm')
      const c = clampCenter(
        wm,
        src.width,
        src.height,
        (src.width * wm.posXPct) / 100,
        (src.height * wm.posYPct) / 100,
      )
      const cxPct = (c.cx / src.width) * 100
      const cyPct = (c.cy / src.height) * 100
      dragRef.current = {
        mode: 'move',
        startX: e.clientX,
        startY: e.clientY,
        grabDX: p.x - c.cx,
        grabDY: p.y - c.cy,
        startCX: c.cx,
        startCY: c.cy,
        lastX: cxPct,
        lastY: cyPct,
        startScrollL: 0,
        startScrollT: 0,
      }
    } else {
      dragRef.current = {
        mode: 'hand',
        startX: e.clientX,
        startY: e.clientY,
        grabDX: 0,
        grabDY: 0,
        startCX: 0,
        startCY: 0,
        lastX: e.clientX,
        lastY: e.clientY,
        startScrollL: scrollRef.current?.scrollLeft ?? 0,
        startScrollT: scrollRef.current?.scrollTop ?? 0,
      }
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    if (!drag || !src) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (drag.mode === 'hand') {
      const el = scrollRef.current
      if (el) {
        el.scrollLeft = drag.startScrollL - dx
        el.scrollTop = drag.startScrollT - dy
      }
      return
    }
    if (wm.mode !== 'single') return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const sclX = src.width / rect.width
    const sclY = src.height / rect.height
    const nx = drag.startCX + dx * sclX
    const ny = drag.startCY + dy * sclY
    const pctX = Math.min(100, Math.max(0, (nx / src.width) * 100))
    const pctY = Math.min(100, Math.max(0, (ny / src.height) * 100))
    drag.lastX = pctX
    drag.lastY = pctY
    setWm({ posXPct: pctX, posYPct: pctY })
  }

  const onPointerUp = () => {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag || drag.mode !== 'move' || wm.mode !== 'single') return
    // 松手时若接近九宫格预设则吸附
    const snap = nearestAnchor(drag.lastX, drag.lastY)
    if (snap) setWm({ posXPct: snap.x, posYPct: snap.y })
  }

  const zoomBy = useCallback((f: number) => {
    setScale((prev) => {
      const base = prev ?? 1
      const next = Math.min(4, Math.max(0.05, base * f))
      return next === 1 ? null : next
    })
  }, [])

  // 键盘快捷键：+ / − 缩放，0 或 F 适应窗口。
  // 输入框聚焦时、或弹窗打开时不拦截（避免与输入/弹窗交互冲突）。
  useEffect(() => {
    if (!src) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (document.querySelector('[role="dialog"]')) return
      const el = document.activeElement
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      ) {
        return
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        zoomBy(1.25)
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        zoomBy(1 / 1.25)
      } else if (e.key === '0' || e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        setScale(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [src, zoomBy])

  const zoomPctLabel = displayScale > 0 ? `${Math.round(displayScale * 100)}%` : '—'

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {/* 工具条 */}
      <div className="flex h-10 shrink-0 items-center gap-2 overflow-x-auto border-b border-slate-200/80 px-2 nice-scroll dark:border-slate-800">
        {src && (
          <Segmented<ViewMode>
            value={view}
            onChange={setView}
            options={[
              { value: 'wm', label: t('preview.view.result'), title: t('preview.view.resultTitle') },
              { value: 'raw', label: t('preview.view.raw'), title: t('preview.view.rawTitle') },
            ]}
          />
        )}
        {src && wm.mode === 'single' && (
          <Segmented<Tool>
            value={tool}
            onChange={setTool}
            options={[
              { value: 'move', label: t('preview.tool.move'), title: t('preview.tool.moveTitle') },
              { value: 'hand', label: t('preview.tool.hand'), title: t('preview.tool.handTitle') },
            ]}
          />
        )}
        {src && (
          <span className="hidden shrink-0 items-center gap-1.5 text-[11px] text-slate-400 md:flex dark:text-slate-500">
            <Icon name="image" className="h-3.5 w-3.5" />
            {t('preview.dims', {
              w: src.width,
              h: src.height,
              kind: item ? KIND_LABEL[item.kind] : '',
            })}
          </span>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            title={t('preview.zoom.out')}
            onClick={() => zoomBy(1 / 1.25)}
            className="flex h-6.5 w-6.5 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200/70 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-700/60"
            disabled={!src}
          >
            <Icon name="zoomOut" className="h-3.5 w-3.5" />
          </button>
          <span className="w-12 text-center text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
            {zoomPctLabel}
          </span>
          <button
            type="button"
            title={t('preview.zoom.in')}
            onClick={() => zoomBy(1.25)}
            className="flex h-6.5 w-6.5 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200/70 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-700/60"
            disabled={!src}
          >
            <Icon name="zoomIn" className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title={t('preview.zoom.fit')}
            onClick={() => setScale(null)}
            className={cx(
              'flex h-6.5 w-6.5 items-center justify-center rounded-md hover:bg-slate-200/70 disabled:opacity-30 dark:hover:bg-slate-700/60',
              scale === null
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400',
            )}
            disabled={!src}
          >
            <Icon name="expand" className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>

      {/* 画布区 */}
      <div className="min-h-0 flex-1 p-3">
        <div ref={scrollRef} className="checker nice-scroll relative h-full overflow-auto rounded-xl border border-slate-200 dark:border-slate-700/80">
          {src ? (
            <>
              <div className="flex min-h-full w-max min-w-full items-center justify-center p-3">
                <canvas
                  ref={canvasRef}
                  draggable={false}
                  style={{
                    width: src.width * displayScale,
                    height: src.height * displayScale,
                    touchAction: 'none',
                  }}
                  className={cx(
                    'block rounded-sm shadow-sm select-none',
                    tool === 'move' && canMoveWm
                      ? 'cursor-move'
                      : tool === 'hand'
                        ? 'cursor-grab active:cursor-grabbing'
                        : 'cursor-default',
                  )}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                />
              </div>
              {loading && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-xs text-slate-600 shadow backdrop-blur dark:bg-slate-900/90 dark:text-slate-300">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    {t('preview.decoding')}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
              <Icon name="image" className="h-10 w-10 opacity-50" />
              <p className="text-sm">
                {item ? t('preview.placeholderLoading') : t('preview.placeholder')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
