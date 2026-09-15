import { useRef } from 'react'
import { useI18n } from '../store/i18n'
import { Button, Icon } from './ui'

export function Hero({
  onPick,
  onPaste,
  onNewColor,
}: {
  onPick: (files: File[]) => void
  onPaste: () => void
  /** 打开「从颜色开始」面板（弹窗由 Shell 统一持有） */
  onNewColor: () => void
}) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/50 sm:px-12">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
          <Icon name="image" className="h-8 w-8" />
        </span>
        <h2 className="mt-5 text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t('hero.headline')}
        </h2>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Icon name="shield" className="h-3.5 w-3.5 text-emerald-500" />
          {t('hero.privacy')}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="primary"
            icon="upload"
            className="h-9 px-5 text-sm"
            onClick={() => inputRef.current?.click()}
          >
            {t('hero.pick')}
          </Button>
          <Button variant="outline" icon="clipboard" className="h-9 px-5 text-sm" onClick={onPaste}>
            {t('hero.paste')}
          </Button>
          <Button
            variant="outline"
            icon="palette"
            className="h-9 px-5 text-sm"
            onClick={onNewColor}
          >
            {t('hero.color')}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/bmp,.jpg,.jpeg,.png,.webp,.bmp"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onPick(Array.from(e.target.files))
                e.target.value = ''
              }
            }}
          />
        </div>
        <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
          {t('hero.kbdPrefix')}{' '}
          <kbd className="rounded border border-slate-300 bg-slate-100 px-1 py-px font-sans text-[10px] dark:border-slate-600 dark:bg-slate-800">
            Ctrl
          </kbd>
          {' + '}
          <kbd className="rounded border border-slate-300 bg-slate-100 px-1 py-px font-sans text-[10px] dark:border-slate-600 dark:bg-slate-800">
            V
          </kbd>{' '}
          {t('hero.kbdSuffix')}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
            {t('hero.chip.formats')}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
            {t('hero.chip.text')}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
            {t('hero.chip.batch')}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
            {t('hero.chip.preset')}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
            {t('hero.chip.export')}
          </span>
        </div>
      </div>
    </div>
  )
}

