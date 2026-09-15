import { useRef, type ReactNode } from 'react'
import type { DictKey } from '../i18n'
import { useI18n } from '../store/i18n'
import { Button, Icon } from './ui'
import { Logo } from './Logo'

/** 能力清单（卡片页脚，以 · 分隔为一行） */
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
 * 待命界面（欢迎页）：左侧文案 + 右侧竖排动作 + 左下能力清单 + 右下背景装饰。
 *
 * 整卡即拖放/点击区：卡片内铺一层覆盖整卡的透明按钮承担点击与键盘操作
 * （内容层 pointer-events-none，仅动作按钮 pointer-events-auto）。
 * 这样既保留"点哪里都能选文件"，又不会出现「按钮里套按钮」的语义问题。
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
      <div className="group relative w-full max-w-3xl overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-8 text-left shadow-sm transition-colors hover:border-indigo-400 hover:bg-white/90 sm:px-10 sm:py-10 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-indigo-500/70 dark:hover:bg-slate-900/70">
        {/* 底部背景装饰（斜向水印条纹 + 柔光，向上渐隐；窄屏内容已占满故不显示） */}
        <span
          aria-hidden="true"
          className="wm-hero-decor pointer-events-none absolute inset-x-0 bottom-0 hidden h-28 md:block"
        />

        {/* 整卡点击/键盘入口（透明覆盖层） */}
        <button
          type="button"
          onClick={openPicker}
          aria-label={t('hero.pick')}
          className="absolute inset-0 z-0 cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset"
        />

        <div className="pointer-events-none relative z-10">
          {/* 左上角品牌 LOGO */}
          <Logo className="h-14 w-14 drop-shadow-md transition-transform duration-200 group-hover:scale-[1.03]" />

          {/* 左文案 + 右动作（窄屏自动堆叠） */}
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:justify-between md:gap-10">
            <div className="flex min-w-0 flex-1 flex-col">
              <h2 className="text-xl font-semibold tracking-tight text-slate-800 sm:text-2xl dark:text-slate-100">
                {t('hero.headline')}
              </h2>
              <p className="mt-3 flex items-start gap-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                <Icon name="shield" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>{t('hero.privacy')}</span>
              </p>
              <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                {t('hero.kbdPrefix')} <Kbd>Ctrl</Kbd> + <Kbd>V</Kbd> {t('hero.kbdSuffix')}
              </p>
            </div>

            {/* 右侧竖排动作：主操作实心，其余描边 */}
            <div className="pointer-events-auto flex w-full shrink-0 flex-col gap-2 md:w-[196px]">
              <Button
                variant="primary"
                icon="upload"
                className="h-10 w-full text-sm shadow-sm"
                onClick={openPicker}
              >
                {t('hero.pick')}
              </Button>
              <Button variant="outline" icon="clipboard" className="h-10 w-full text-sm" onClick={onPaste}>
                {t('hero.paste')}
              </Button>
              <Button variant="outline" icon="palette" className="h-10 w-full text-sm" onClick={onNewColor}>
                {t('hero.color')}
              </Button>
            </div>
          </div>

          {/* 能力清单：卡片级块，仅占左侧一段宽度（不横贯整卡）；
              桌面落在左下角（右下留给背景装饰），窄屏自然排到按钮之后 */}
          <p className="mt-7 max-w-md border-t border-slate-200/70 pt-3 text-[11px] leading-relaxed text-slate-400 md:mt-10 dark:border-slate-800 dark:text-slate-500">
            {CAPABILITIES.map((k) => t(k)).join(' · ')}
          </p>
        </div>

        {/* 文件输入必须放在 pointer-events-none 的内容层之外：
            否则程序化 click() 不会弹出文件选择框（会连带影响「选择图片」按钮） */}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/bmp,image/avif,.jpg,.jpeg,.png,.webp,.bmp,.avif"
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
    </div>
  )
}
