import { useEffect, useMemo, useRef, useState } from 'react'
import type { ImageItem, WmSettings } from '../lib/types'
import { KIND_LABEL } from '../lib/types'
import { decodeSmall } from '../lib/imaging'
import { renderWatermarked } from '../lib/renderer'
import { formatBytes } from '../lib/imaging'
import { useI18n } from '../store/i18n'
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
  /** 「新建图片」：打开从颜色开始面板 */
  onNewImage: () => void
  /** 「打开」：选择本地图片文件 */
  onPick: (files: File[]) => void
  /** 「粘贴」：读取剪贴板图片 */
  onPaste: () => void
}

/**
 * 图片列表。vertical：左侧完整列表（支持排序、结果缩略图）；
 * strip：窄屏横向条（点击选中 / 移除）。
 * 底部固定操作条（新建图片 / 打开 / 粘贴）在两种布局下都可用。
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
  onNewImage,
  onPick,
  onPaste,
}: ImageListProps) {
  const { t } = useI18n()
  const fileRef = useRef<HTMLInputElement | null>(null)
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
          toast(t('toast.thumbFailed', { name: item.name }), 'error')
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
    <div
      data-testid="image-list"
      // flex-1 是必须的：父级是 flex 列容器，否则本容器只有内容高度，
      // 底部操作条会紧跟最后一张卡片而不是贴齐列表底部
      className={cx('flex min-h-0 flex-1 flex-col', isVertical ? 'hidden lg:flex' : 'lg:hidden')}
    >
      {isVertical && (
        <div className="flex items-center justify-between border-b border-slate-200/80 px-3 py-2 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {t('list.title')}
            <span className="ml-1.5 rounded bg-indigo-50 px-1.5 py-px text-[11px] font-medium text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
              {items.length}
            </span>
          </span>
          <button
            type="button"
            disabled={items.length === 0}
            onClick={onClear}
            title={t('list.clearTitle')}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-rose-500/10"
          >
            <Icon name="trash" className="h-3 w-3" />
            {t('list.clear')}
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
                title={t('list.cardTitle', {
                  name: item.name,
                  kind: KIND_LABEL[item.kind],
                  size: formatBytes(item.size),
                })}
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
                      {t('list.badge.watermarked')}
                    </span>
                  )}
                </span>
                <span className={cx('flex min-w-0 flex-col', isVertical ? 'flex-1' : 'w-full')}>
                  <span className="truncate text-[11px] text-slate-600 dark:text-slate-300">
                    {item.name}
                  </span>
                  <span className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                    {t('list.cardMeta', {
                      kind: KIND_LABEL[item.kind],
                      size: formatBytes(item.size),
                    })}
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
                  title={res ? t('list.toggle.showOriginal') : t('list.toggle.showResult')}
                  aria-label={t('list.toggle.aria')}
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
                  title={t('list.remove')}
                  aria-label={t('list.removeAria')}
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
          {t('list.hint')}
        </p>
      )}

      {/* 底部固定操作条：外观是一整个按钮，内部为 新建图片 / 打开 / 粘贴 三个按钮 */}
      <div className="shrink-0 border-t border-slate-200/80 p-1.5 dark:border-slate-800">
        <div className="flex items-stretch overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800">
          <button
            type="button"
            onClick={onNewImage}
            title={t('list.newImageTitle')}
            className="flex min-w-0 flex-1 items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-200 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-300"
          >
            <Icon name="palette" className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t('list.newImage')}</span>
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            title={t('list.addTitle')}
            aria-label={t('list.addTitle')}
            className="flex w-8 shrink-0 items-center justify-center border-l border-slate-300 text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-indigo-300"
          >
            <Icon name="image" className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onPaste}
            title={t('topbar.pasteTitle')}
            aria-label={t('topbar.paste')}
            className="flex w-8 shrink-0 items-center justify-center border-l border-slate-300 text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-indigo-300"
          >
            <Icon name="clipboard" className="h-3.5 w-3.5" />
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/bmp,image/avif,.jpg,.jpeg,.png,.webp,.bmp,.avif"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            e.target.value = ''
            if (files.length > 0) onPick(files)
          }}
        />
      </div>
    </div>
  )
}
