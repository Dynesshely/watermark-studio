import { useRef, type ReactNode } from 'react'
import { useI18n } from '../store/i18n'
import { Logo } from './Logo'
import { Modal } from './Modal'
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

/** 「关于」模态弹窗：由顶栏品牌区点击触发 */
export function AboutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const closeRef = useRef<HTMLButtonElement | null>(null)

  return (
    <Modal open={open} onClose={onClose} labelledBy="about-title" initialFocusRef={closeRef}>
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
    </Modal>
  )
}
