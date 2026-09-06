import { useRef } from 'react'
import { Button, Icon } from './ui'

export function Hero({ onPick, onPaste }: { onPick: (files: File[]) => void; onPaste: () => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/50 sm:px-12">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
          <Icon name="image" className="h-8 w-8" />
        </span>
        <h2 className="mt-5 text-lg font-semibold text-slate-800 dark:text-slate-100">
          把图片拖到这里，或点击选择文件
        </h2>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Icon name="shield" className="h-3.5 w-3.5 text-emerald-500" />
          加水印全程在你的浏览器本地完成，图片不会上传到任何服务器
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="primary"
            icon="upload"
            className="h-9 px-5 text-sm"
            onClick={() => inputRef.current?.click()}
          >
            选择图片
          </Button>
          <Button variant="outline" icon="clipboard" className="h-9 px-5 text-sm" onClick={onPaste}>
            从剪贴板粘贴
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
          也可以直接 <kbd className="rounded border border-slate-300 bg-slate-100 px-1 py-px font-sans text-[10px] dark:border-slate-600 dark:bg-slate-800">Ctrl</kbd>
          {' + '}
          <kbd className="rounded border border-slate-300 bg-slate-100 px-1 py-px font-sans text-[10px] dark:border-slate-600 dark:bg-slate-800">V</kbd>
          {' '}粘贴屏幕截图
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">JPG / PNG / WebP / BMP</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">多行文字 · 平铺 / 单次</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">批量处理 · ZIP 打包</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">同格式导出</span>
        </div>
      </div>
    </div>
  )
}
