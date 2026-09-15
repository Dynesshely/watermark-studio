import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../store/i18n'
import { Logo } from './Logo'
import { Button, Icon } from './ui'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 py-1.5">
      <span className="w-20 shrink-0 whitespace-nowrap pt-px text-[11px] text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        {children}
      </span>
    </div>
  )
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-slate-300 bg-slate-100 px-1 py-px font-sans text-[10px] text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {children}
    </kbd>
  )
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-1.5">
      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
      <span>{children}</span>
    </li>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
      {children}
    </h3>
  )
}

/**
 * 「关于」模态弹窗：由顶栏品牌区点击触发。
 * 行为：Esc 关闭、点击遮罩关闭、打开时锁定页面滚动、关闭后焦点归位。
 */
export function AboutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const restoreRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const timer = window.setTimeout(() => closeRef.current?.focus(), 0)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      window.clearTimeout(timer)
      restoreRef.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  // 必须 portal 到 body：顶栏带 backdrop-blur，而 backdrop-filter 会成为
  // position: fixed 后代的包含块，直接写在 <header> 里会让遮罩只覆盖顶栏高度。
  return createPortal(
    <div
      className="wm-modal-backdrop fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        className="wm-modal-panel flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        {/* 头部 */}
        <div className="flex items-start gap-3 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800">
          <Logo className="h-10 w-10 shrink-0 drop-shadow-sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 id="about-title" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {t('app.name')}
              </h2>
              <span className="rounded-full bg-indigo-50 px-2 py-px text-[10px] font-medium text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                v{__APP_VERSION__}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              {t('about.subtitle')}
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
        <div className="nice-scroll min-h-0 flex-1 overflow-y-auto px-5 py-3">
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {t('about.intro')}
          </p>

          <SectionTitle>{t('about.features')}</SectionTitle>
          <ul className="mt-1.5 flex flex-col gap-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <Bullet>{t('about.feature1')}</Bullet>
            <Bullet>{t('about.feature2')}</Bullet>
            <Bullet>{t('about.feature3')}</Bullet>
            <Bullet>{t('about.feature4')}</Bullet>
            <Bullet>{t('about.feature5')}</Bullet>
          </ul>

          <SectionTitle>{t('about.shortcuts')}</SectionTitle>
          <div className="mt-1">
            <Row label={t('about.sc.paste')}>
              <Kbd>Ctrl</Kbd> / <Kbd>⌘</Kbd> + <Kbd>V</Kbd>
              <span className="ml-1 text-slate-400 dark:text-slate-500">{t('about.sc.pasteNote')}</span>
            </Row>
            <Row label={t('about.sc.zoom')}>
              <Kbd>Ctrl</Kbd> / <Kbd>⌘</Kbd> + <Kbd>{t('about.kbd.wheel')}</Kbd>
            </Row>
            <Row label={t('about.sc.close')}>
              <Kbd>Esc</Kbd>
            </Row>
          </div>

          <SectionTitle>{t('about.specs')}</SectionTitle>
          <div className="mt-1">
            <Row label={t('about.spec.formats')}>{t('about.spec.formatsValue')}</Row>
            <Row label={t('about.spec.export')}>{t('about.spec.exportValue')}</Row>
            <Row label={t('about.spec.privacy')}>{t('about.spec.privacyValue')}</Row>
            <Row label={t('about.spec.meta')}>{t('about.spec.metaValue')}</Row>
            <Row label={t('about.spec.langs')}>{t('about.spec.langsValue')}</Row>
            <Row label={t('about.spec.stack')}>{t('about.spec.stackValue')}</Row>
          </div>
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200/80 px-5 py-3 dark:border-slate-800">
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
            <Icon name="shield" className="h-3.5 w-3.5" />
            {t('about.footer.privacy')}
          </span>
          <Button variant="primary" onClick={onClose}>
            {t('about.close')}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
