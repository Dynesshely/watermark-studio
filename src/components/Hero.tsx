import { useRef, type ReactNode } from 'react'
import type { DictKey } from '../i18n'
import { useI18n } from '../store/i18n'
import { Button, Icon } from './ui'
import { Logo } from './Logo'

/** 能力清单（卡片页脚，以 · 分隔为一行，避免多个 pill 换行造成的视觉不平衡） */
const CAPABILITIES: DictKey[] = [
  'hero.chip.formats',
  'hero.chip.text',
  'hero.chip.batch',
  'hero.chip.preset',
  'hero.chip.export',
]

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-slate-300 bg-slate-100 px-1 py-px font-sans text-[10px] text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
      {children}
    </kbd>
  )
}

/**
 * 待命界面（欢迎页）：整卡即拖放/点击区，与文案「把图片拖到这里，或点击选择文件」一致。
 * 排版层级：品牌 LOGO → 主标题 → 隐私说明 → 主次分明的三个入口 → 快捷键提示 → 能力清单页脚。
 */
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
  const openPicker = () => inputRef.current?.click()

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-6">
      <div
        onClick={openPicker}
        className="group w-full max-w-xl cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center shadow-sm transition-colors hover:border-indigo-400 hover:bg-white/90 sm:px-10 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-indigo-500/70 dark:hover:bg-slate-900/70"
      >
        {/* 品牌 LOGO（本身就是「圆角渐变方块 + 照片水印标记」，与 favicon 同源） */}
        <Logo className="mx-auto h-16 w-16 drop-shadow-md transition-transform duration-200 group-hover:scale-[1.03]" />

        <h2 className="mt-6 text-xl font-semibold tracking-tight text-slate-800 sm:text-2xl dark:text-slate-100">
          {t('hero.headline')}
        </h2>

        <p className="mx-auto mt-3 flex max-w-md items-center justify-center gap-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
          <Icon name="shield" className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
          {t('hero.privacy')}
        </p>

        {/* 主次分明：主操作为实心按钮，其余两个为描边按钮 */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          <Button
            variant="primary"
            icon="upload"
            className="h-10 px-5 text-sm shadow-sm"
            onClick={(e) => {
              e.stopPropagation()
              openPicker()
            }}
          >
            {t('hero.pick')}
          </Button>
          <Button
            variant="outline"
            icon="clipboard"
            className="h-10 px-5 text-sm"
            onClick={(e) => {
              e.stopPropagation()
              onPaste()
            }}
          >
            {t('hero.paste')}
          </Button>
          <Button
            variant="outline"
            icon="palette"
            className="h-10 px-5 text-sm"
            onClick={(e) => {
              e.stopPropagation()
              onNewColor()
            }}
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

        <p className="mt-4 text-[11px] text-slate-400 dark:text-slate-500">
          {t('hero.kbdPrefix')} <Kbd>Ctrl</Kbd> + <Kbd>V</Kbd> {t('hero.kbdSuffix')}
        </p>

        {/* 页脚：能力清单，用分隔符连成一行，比多个胶囊更克制 */}
        <p className="mx-auto mt-8 max-w-lg border-t border-slate-200/70 pt-4 text-[11px] leading-relaxed text-slate-400 dark:border-slate-800 dark:text-slate-500">
          {CAPABILITIES.map((k) => t(k)).join(' · ')}
        </p>
      </div>
    </div>
  )
}
