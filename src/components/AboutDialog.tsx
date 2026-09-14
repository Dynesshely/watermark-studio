import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Logo } from './Logo'
import { Button, Icon } from './ui'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 py-1.5">
      <span className="w-16 shrink-0 pt-px text-[11px] text-slate-400 dark:text-slate-500">{label}</span>
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

/**
 * 「关于」模态弹窗：由顶栏品牌区点击触发。
 * 行为：Esc 关闭、点击遮罩关闭、打开时锁定页面滚动、关闭后焦点归位。
 */
export function AboutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
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
                水印工坊
              </h2>
              <span className="rounded-full bg-indigo-50 px-2 py-px text-[10px] font-medium text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                v{__APP_VERSION__}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              浏览器端的图片水印工具 · 无需上传，断网可用
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="关闭"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>

        {/* 正文 */}
        <div className="nice-scroll min-h-0 flex-1 overflow-y-auto px-5 py-3">
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            给图片加上文字水印：参数实时预览、所见即所得，全部计算都在你的浏览器里完成，
            图片不会离开本机。
          </p>

          <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            核心能力
          </h3>
          <ul className="mt-1.5 flex flex-col gap-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <Bullet>平铺与单次两种模式；单次水印可直接在画布上拖拽定位并吸附九宫格</Bullet>
            <Bullet>多行文字、字体与字重、描边、阴影、颜色与不透明度</Bullet>
            <Bullet>横纵间距、网格偏移、任意角度；字号可按宽度百分比或固定像素</Bullet>
            <Bullet>批量处理：拖拽排序、逐张下载或 ZIP 打包，导出文件名可用模板配置</Bullet>
          </ul>

          <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            快捷键
          </h3>
          <div className="mt-1">
            <Row label="粘贴图片">
              <Kbd>Ctrl</Kbd> / <Kbd>⌘</Kbd> + <Kbd>V</Kbd>
              <span className="ml-1 text-slate-400 dark:text-slate-500">（焦点不在输入框时）</span>
            </Row>
            <Row label="缩放预览">
              <Kbd>Ctrl</Kbd> / <Kbd>⌘</Kbd> + <Kbd>滚轮</Kbd>
            </Row>
            <Row label="关闭弹窗">
              <Kbd>Esc</Kbd>
            </Row>
          </div>

          <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            规格与边界
          </h3>
          <div className="mt-1">
            <Row label="导入格式">JPG / PNG / WebP / BMP（动图、HEIC、SVG、AVIF 暂不支持）</Row>
            <Row label="导出">与原图同格式，像素尺寸不变；JPEG/WebP 质量可调（BMP 回退 PNG）</Row>
            <Row label="隐私">全程本地处理，无任何网络上传；参数仅存于浏览器 localStorage</Row>
            <Row label="元数据">重编码导出会清除 EXIF 等原始元数据（浏览器安全限制）</Row>
            <Row label="技术栈">React 18 · TypeScript · Vite · Tailwind CSS · Canvas 2D</Row>
          </div>
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200/80 px-5 py-3 dark:border-slate-800">
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
            <Icon name="shield" className="h-3.5 w-3.5" />
            图片不离开本机
          </span>
          <Button variant="primary" onClick={onClose}>
            知道了
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
