import { useRef, useState } from 'react'
import {
  SOLID_IMAGE_BOUNDS,
  createSolidImage,
  isBigImage,
  solidImageSizeValid,
} from '../lib/imaging'
import { useI18n } from '../store/i18n'
import { Modal } from './Modal'
import { Button, ColorField, Icon, Switch, cx, toast } from './ui'

/** 常用画布尺寸 */
const PRESETS: [number, number][] = [
  [1920, 1080],
  [1080, 1080],
  [1080, 1920],
  [2560, 1440],
  [3840, 2160],
]

/**
 * 「从颜色开始」：生成纯色或全透明底图并直接进入编辑。
 * 透明模式输出 alpha=0 的 PNG（浏览器 canvas 默认即全透明）。
 */
export function NewFromColorDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (file: File) => void
}) {
  const { t } = useI18n()
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const [color, setColor] = useState('#4f46e5')
  const [transparent, setTransparent] = useState(false)
  const [wText, setWText] = useState('1920')
  const [hText, setHText] = useState('1080')
  const [busy, setBusy] = useState(false)

  const width = Number.parseInt(wText, 10)
  const height = Number.parseInt(hText, 10)
  const valid = solidImageSizeValid(width, height)
  const mp = ((Math.max(0, width) * Math.max(0, height)) / 1_000_000).toFixed(1)
  const large = valid && isBigImage(width, height)

  const clampSide = (raw: string): string => {
    const v = Number.parseInt(raw, 10)
    if (!Number.isFinite(v)) return String(SOLID_IMAGE_BOUNDS.min)
    return String(Math.max(SOLID_IMAGE_BOUNDS.min, Math.min(SOLID_IMAGE_BOUNDS.max, v)))
  }

  const normalizeOnBlur = () => {
    setWText((v) => clampSide(v))
    setHText((v) => clampSide(v))
  }

  const applyPreset = (w: number, h: number) => {
    setWText(String(w))
    setHText(String(h))
  }

  const swap = () => {
    setWText(hText)
    setHText(wText)
  }

  const create = async () => {
    if (!valid || busy) return
    setBusy(true)
    try {
      const file = await createSolidImage(width, height, transparent ? null : color)
      toast(
        t('color.toast', {
          w: width,
          h: height,
          kind: transparent ? t('color.kind.transparent') : t('color.kind.solid'),
        }),
        'success',
      )
      onClose()
      onCreated(file)
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('common.unknownError')
      toast(t('color.failed', { msg }), 'error')
    } finally {
      setBusy(false)
    }
  }

  const sideInputClass =
    'h-8 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 font-mono text-xs tabular-nums text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'

  return (
    <Modal open={open} onClose={onClose} labelledBy="color-title" initialFocusRef={closeRef}>
      {/* 头部 */}
      <div className="flex items-start gap-3 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
          <Icon name="palette" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="color-title" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {t('color.title')}
          </h2>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            {t('color.subtitle')}
          </p>
        </div>
        <button
          ref={closeRef}
          type="button"
          aria-label={t('about.closeAria')}
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <Icon name="close" className="h-4 w-4" />
        </button>
      </div>

      {/* 正文 */}
      <div className="nice-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {/* 预览色块（透明时显示棋盘格） */}
        <div className="checker relative h-20 w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <div
            className="absolute inset-0"
            style={{ background: transparent ? 'transparent' : color }}
            data-testid="color-swatch"
          />
          <span className="absolute bottom-1.5 left-1.5 rounded bg-slate-900/70 px-1.5 py-px font-mono text-[10px] text-white">
            {transparent ? t('color.kind.transparent') : color}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2.5">
          <ColorField
            label={t('color.color')}
            value={color}
            onChange={setColor}
            disabled={transparent}
          />

          <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-100/70 px-2 py-1.5 dark:bg-slate-800/60">
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-slate-600 dark:text-slate-300">
                {t('color.transparent')}
              </span>
              <span className="mt-0.5 block text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
                {t('color.transparentHint')}
              </span>
            </span>
            <Switch
              checked={transparent}
              onChange={setTransparent}
              label={t('color.transparent')}
            />
          </div>

          {/* 分辨率 */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('color.size')}</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                inputMode="numeric"
                aria-label={t('color.width')}
                value={wText}
                min={SOLID_IMAGE_BOUNDS.min}
                max={SOLID_IMAGE_BOUNDS.max}
                onChange={(e) => setWText(e.target.value)}
                onBlur={normalizeOnBlur}
                className={sideInputClass}
              />
              <span className="shrink-0 text-xs text-slate-400">×</span>
              <input
                type="number"
                inputMode="numeric"
                aria-label={t('color.height')}
                value={hText}
                min={SOLID_IMAGE_BOUNDS.min}
                max={SOLID_IMAGE_BOUNDS.max}
                onChange={(e) => setHText(e.target.value)}
                onBlur={normalizeOnBlur}
                className={sideInputClass}
              />
              <button
                type="button"
                onClick={swap}
                title={t('color.swap')}
                aria-label={t('color.swap')}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 dark:hover:text-indigo-300"
              >
                <Icon name="swap" className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 常用尺寸 */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('color.presets')}</span>
            <div className="flex flex-wrap gap-1">
              {PRESETS.map(([w, h]) => {
                const active = String(w) === wText && String(h) === hText
                return (
                  <button
                    key={`${w}x${h}`}
                    type="button"
                    onClick={() => applyPreset(w, h)}
                    className={cx(
                      'h-6 rounded-md px-2 font-mono text-[11px] transition-colors',
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700',
                    )}
                  >
                    {w}×{h}
                  </button>
                )
              })}
            </div>
          </div>

          {valid ? (
            <p
              className={cx(
                'text-[11px]',
                large ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500',
              )}
            >
              {large
                ? t('color.large', { w: width, h: height })
                : t('color.pixels', { mp })}
            </p>
          ) : (
            <p className="text-[11px] text-rose-500 dark:text-rose-400">
              {t('color.invalid', {
                min: SOLID_IMAGE_BOUNDS.min,
                max: SOLID_IMAGE_BOUNDS.max,
                mp: SOLID_IMAGE_BOUNDS.maxPixels / 1_000_000,
              })}
            </p>
          )}
        </div>
      </div>

      {/* 底部 */}
      <div className="flex items-center justify-end gap-2 border-t border-slate-200/80 px-5 py-3 dark:border-slate-800">
        <Button variant="ghost" onClick={onClose}>
          {t('color.cancel')}
        </Button>
        <Button variant="primary" icon="palette" disabled={!valid || busy} onClick={() => void create()}>
          {t('color.create')}
        </Button>
      </div>
    </Modal>
  )
}
