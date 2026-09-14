import { useRef, useState } from 'react'
import type { ThemePref } from '../lib/types'
import { useSettings } from '../store/settings'
import { Button, Icon, Segmented } from './ui'
import { Logo } from './Logo'
import { AboutDialog } from './AboutDialog'

export function TopBar({ onPick, onPaste }: { onPick: (files: File[]) => void; onPaste: () => void }) {
  const { s, set } = useSettings()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [aboutOpen, setAboutOpen] = useState(false)

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-200/80 bg-white/80 px-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
      {/* 页面主标题（视觉上由品牌区承载，此处供屏幕阅读器） */}
      <h1 className="sr-only">水印工坊 · 本地图片水印工具</h1>

      <div className="flex items-center gap-2">
        {/* 品牌区：圆角可点击，hover/focus 时显现交互区域 */}
        <button
          type="button"
          onClick={() => setAboutOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={aboutOpen}
          aria-label="关于 水印工坊"
          title="关于 水印工坊"
          className="group -ml-1 flex items-center gap-2 rounded-xl px-1.5 py-1 text-left ring-1 ring-transparent transition-colors hover:bg-slate-100 hover:ring-slate-200/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:bg-slate-200/70 dark:hover:bg-slate-800/70 dark:hover:ring-slate-700 dark:active:bg-slate-700/60"
        >
          <Logo className="h-7 w-7 drop-shadow-sm" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">水印工坊</span>
          <Icon
            name="info"
            className="h-3.5 w-3.5 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:text-slate-600"
          />
        </button>

        <span className="ml-1 hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 md:flex dark:bg-emerald-500/10 dark:text-emerald-400">
          <Icon name="shield" className="h-3 w-3" />
          图片不上传服务器
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" icon="clipboard" onClick={onPaste} title="读取剪贴板中的图片（Ctrl+V 亦可）" className="hidden sm:inline-flex">
          粘贴图片
        </Button>
        <Button variant="soft" icon="plus" onClick={() => inputRef.current?.click()}>
          添加图片
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
        <Segmented<ThemePref>
          value={s.theme}
          onChange={(t) => set({ theme: t })}
          options={[
            { value: 'light', label: <Icon name="sun" className="h-3.5 w-3.5" />, title: '浅色主题' },
            { value: 'dark', label: <Icon name="moon" className="h-3.5 w-3.5" />, title: '深色主题' },
            { value: 'system', label: <Icon name="monitor" className="h-3.5 w-3.5" />, title: '跟随系统' },
          ]}
        />
      </div>

      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </header>
  )
}
