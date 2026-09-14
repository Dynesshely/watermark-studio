import { useRef } from 'react'
import type { ThemePref } from '../lib/types'
import { useSettings } from '../store/settings'
import { Button, Icon, Segmented } from './ui'
import { Logo } from './Logo'

export function TopBar({ onPick, onPaste }: { onPick: (files: File[]) => void; onPaste: () => void }) {
  const { s, set } = useSettings()
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-200/80 bg-white/80 px-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-center gap-2">
        <Logo className="h-7 w-7 drop-shadow-sm" />
        <div className="leading-tight">
          <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">水印工坊</h1>
          <p className="hidden text-[10px] text-slate-400 sm:block dark:text-slate-500">
            图片水印 · 完全在本地浏览器处理
          </p>
        </div>
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
    </header>
  )
}
