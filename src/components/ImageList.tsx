import { useEffect, useMemo, useRef, useState } from 'react'
import type { ImageItem, WmSettings } from '../lib/types'
import { KIND_LABEL } from '../lib/types'
import { decodeSmall } from '../lib/imaging'
import { renderWatermarked } from '../lib/renderer'
import { formatBytes } from '../lib/imaging'
import { cx, Icon, toast } from './ui'

export interface ImageListProps {
  items: ImageItem[]
  activeId: string | null
  wm: WmSettings
  layout: 'vertical' | 'strip'
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onClear: () => void
  onReorder: (from: number, to: number) => void
}

/**
 * 图片列表。vertical：左侧完整列表（支持排序、结果缩略图）；
 * strip：窄屏横向条（点击选中 / 移除）。
 */
export function ImageList({
  items,
  activeId,
  wm,
  layout,
  onSelect,
  onRemove,
  onClear,
  onReorder,
}: ImageListProps) {
  const [showRes, setShowRes] = useState<Record<string, boolean>>({})
  const [resUrl, setResUrl] = useState<Record<string, string>>({})
  const showResRef = useRef(showRes)
  showResRef.current = showRes

  const itemsKey = useMemo(
    () => items.map((i) => `${i.id}:${i.name}:${i.size}`).join('|'),
    [items],
  )
  const shownKey = useMemo(
    () =>
      Object.keys(showRes)
        .filter((id) => showRes[id])
        .sort()
        .join(','),
    [showRes],
  )

  // 参数或“结果视图”开关变化后，重新为处于结果视图的图片生成水印缩略图
  const genRef = useRef(0)
  useEffect(() => {
    const gen = ++genRef.current
    const timer = window.setTimeout(async () => {
      for (const id of shownKey ? shownKey.split(',').filter(Boolean) : []) {
        if (genRef.current !== gen) return
        const item = items.find((i) => i.id === id)
        if (!item) continue
        try {
          const small = await decodeSmall(item.file, 560)
          if (genRef.current !== gen) continue
          const canvas = renderWatermarked(small.el, small.width, small.height, wm, 1)
          const url = canvas.toDataURL('image/png')
          if (genRef.current !== gen) continue
          setResUrl((p) => {
            if (p[id] === url) return p
            return { ...p, [id]: url }
          })
        } catch {
          toast(`「${item.name}」缩略图渲染失败，已显示原图`, 'error')
        }
      }
    }, 160)
    return () => {
      window.clearTimeout(timer)
      genRef.current++
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wm, shownKey, itemsKey])

  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dropTo, setDropTo] = useState<number | null>(null)

  const isVertical = layout === 'vertical'

  const finishDrop = (to: number) => {
    if (dragFrom !== null && dragFrom !== to) onReorder(dragFrom, to)
    setDragFrom(null)
    setDropTo(null)
  }

  return (
    <div className={cx('flex min-h-0 flex-col', isVertical ? 'hidden lg:flex' : 'lg:hidden')}>
      {isVertical && (
        <div className="flex items-center justify-between border-b border-slate-200/80 px-3 py-2 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            图片列表
            <span className="ml-1.5 rounded bg-indigo-50 px-1.5 py-px text-[11px] font-medium text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
              {items.length}
            </span>
          </span>
          <button
            type="button"
            disabled={items.length === 0}
            onClick={onClear}
            title="清空全部"
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-rose-500/10"
          >
            <Icon name="trash" className="h-3 w-3" />
            清空
          </button>
        </div>
      )}

      <ul
        className={cx(
          'nice-scroll min-h-0 flex-1 overflow-y-auto p-2',
          isVertical ? 'flex flex-col gap-1' : 'flex gap-2 overflow-x-auto p-2',
        )}
      >
        {items.map((item, idx) => {
          const active = item.id === activeId
          const res = !!showRes[item.id]
          return (
            <li
              key={item.id}
              draggable={isVertical}
              onDragStart={(e) => {
                if (!isVertical) return
                setDragFrom(idx)
                e.dataTransfer.effectAllowed = 'move'
                try {
                  e.dataTransfer.setData('text/plain', String(idx))
                } catch {
                  /* 忽略 */
                }
              }}
              onDragOver={(e) => {
                if (!isVertical || dragFrom === null) return
                e.preventDefault()
                if (dropTo !== idx) setDropTo(idx)
              }}
              onDrop={(e) => {
                e.preventDefault()
                finishDrop(idx)
              }}
              onDragEnd={() => finishDrop(idx)}
              className={cx(
                'group relative shrink-0',
                isVertical ? 'w-full' : 'w-24',
                dropTo === idx && dragFrom !== null && dragFrom !== idx && 'opacity-60',
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                title={`${item.name}（${KIND_LABEL[item.kind]} · ${formatBytes(item.size)}）`}
                className={cx(
                  'flex w-full items-center gap-2 rounded-lg border p-1 text-left transition-colors',
                  isVertical ? 'min-h-[64px]' : 'flex-col items-start gap-1',
                  active
                    ? 'border-indigo-400 bg-indigo-50/70 ring-1 ring-indigo-400 dark:border-indigo-500 dark:bg-indigo-500/10'
                    : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80',
                  dropTo === idx && dragFrom !== null && dragFrom !== idx &&
                    'border-dashed border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10',
                )}
              >
                <span
                  className={cx(
                    'relative flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800',
                    isVertical ? 'h-[54px] w-[54px]' : 'h-16 w-full',
                  )}
                >
                  <img
                    src={res && resUrl[item.id] ? resUrl[item.id] : item.thumbUrl}
                    alt={item.name}
                    draggable={false}
                    className="h-full w-full object-contain"
                  />
                  {res && resUrl[item.id] && (
                    <span className="absolute bottom-0.5 right-0.5 rounded-sm bg-indigo-600/90 px-1 text-[9px] font-medium text-white">
                      水印
                    </span>
                  )}
                </span>
                <span className={cx('flex min-w-0 flex-col', isVertical ? 'flex-1' : 'w-full')}>
                  <span className="truncate text-[11px] text-slate-600 dark:text-slate-300">
                    {item.name}
                  </span>
                  <span className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                    {KIND_LABEL[item.kind]} · {formatBytes(item.size)}
                  </span>
                </span>
              </button>

              <span
                className={cx(
                  'absolute z-10 flex overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800',
                  isVertical ? 'right-1 top-1/2 -translate-y-1/2' : 'right-0.5 top-0.5',
                  !isVertical && 'flex-col',
                  isVertical
                    ? 'opacity-0 transition-opacity group-hover:opacity-100'
                    : 'opacity-100',
                )}
              >
                <button
                  type="button"
                  title={res ? '显示原图' : '预览水印效果'}
                  aria-label="原图/效果切换"
                  onClick={() => setShowRes((p) => ({ ...p, [item.id]: !p[item.id] }))}
                  className={cx(
                    'flex h-6 w-6 items-center justify-center transition-colors',
                    res
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700',
                  )}
                >
                  <Icon name={res ? 'eyeOff' : 'eye'} className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  title="移除"
                  aria-label="移除图片"
                  onClick={() => onRemove(item.id)}
                  className="flex h-6 w-6 items-center justify-center text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                >
                  <Icon name="close" className="h-3 w-3" />
                </button>
              </span>
            </li>
          )
        })}
      </ul>
      {isVertical && items.length > 1 && (
        <p className="border-t border-slate-200/80 px-3 py-1.5 text-[10px] leading-relaxed text-slate-400 dark:border-slate-800 dark:text-slate-500">
          拖拽卡片可调整导出顺序 · 悬停卡片可切换水印效果
        </p>
      )}
    </div>
  )
}
