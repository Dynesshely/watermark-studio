import { useState } from 'react'
import type { Lang, ThemePref } from '../lib/types'
import { LANGS } from '../i18n'
import { useSettings } from '../store/settings'
import { useI18n } from '../store/i18n'
import { Icon, Segmented } from './ui'
import { Logo } from './Logo'
import { AboutDialog } from './AboutDialog'

/** 顶栏：品牌区（关于）、隐私徽标、界面语言与主题切换；图片入口已移至列表底部操作条 */
export function TopBar() {
  const { s, set } = useSettings()
  const { t, lang, setLang } = useI18n()
  const [aboutOpen, setAboutOpen] = useState(false)

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-200/80 bg-white/80 px-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
      {/* 页面主标题（视觉上由品牌区承载，此处供屏幕阅读器） */}
      <h1 className="sr-only">{t('app.title')}</h1>

      <div className="flex items-center gap-2">
        {/* 品牌区：圆角可点击，hover/focus 时显现交互区域 */}
        <button
          type="button"
          data-testid="brand-button"
          onClick={() => setAboutOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={aboutOpen}
          aria-label={t('topbar.about')}
          title={t('topbar.about')}
          className="group -ml-1 flex items-center gap-2 rounded-xl px-1.5 py-1 text-left ring-1 ring-transparent transition-colors hover:bg-slate-100 hover:ring-slate-200/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-slate-200/70 dark:hover:bg-slate-800/70 dark:hover:ring-slate-700 dark:active:bg-slate-700/60"
        >
          <Logo className="h-7 w-7 drop-shadow-sm" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {t('app.name')}
          </span>
          <Icon
            name="info"
            className="h-3.5 w-3.5 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:text-slate-600"
          />
        </button>

        <span className="ml-1 hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 md:flex dark:bg-emerald-500/10 dark:text-emerald-400">
          <Icon name="shield" className="h-3 w-3" />
          {t('topbar.privacyBadge')}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* 界面语言 */}
        <Segmented<Lang>
          value={lang}
          onChange={setLang}
          size="sm"
          options={LANGS.map((l) => ({ value: l.value, label: l.label, title: l.title }))}
        />
        {/* 主题 */}
        <Segmented<ThemePref>
          value={s.theme}
          onChange={(next) => set({ theme: next })}
          size="sm"
          options={[
            {
              value: 'light',
              label: <Icon name="sun" className="h-3.5 w-3.5" />,
              title: t('topbar.theme.light'),
            },
            {
              value: 'dark',
              label: <Icon name="moon" className="h-3.5 w-3.5" />,
              title: t('topbar.theme.dark'),
            },
            {
              value: 'system',
              label: <Icon name="monitor" className="h-3.5 w-3.5" />,
              title: t('topbar.theme.system'),
            },
          ]}
        />
      </div>

      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </header>
  )
}
