import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { cx } from './ui'

/** 可在弹窗内聚焦的元素（用于 Tab 焦点循环） */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * 通用模态基座：Esc 关闭、点击遮罩关闭、打开时锁定页面滚动、关闭后焦点归位，
 * 并且 **Tab 焦点在弹窗内循环**（焦点陷阱，避免 Tab 跑到背后的界面上）。
 *
 * 必须 portal 到 body：顶栏带 backdrop-blur，而 backdrop-filter 会成为
 * position: fixed 后代的包含块，直接写在 <header> 内会让遮罩只覆盖顶栏高度。
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  initialFocusRef,
  maxWidthClass = 'max-w-lg',
  children,
}: {
  open: boolean
  onClose: () => void
  labelledBy?: string
  /** 打开后要聚焦的元素（通常是关闭按钮或首个输入框） */
  initialFocusRef?: RefObject<HTMLElement | null>
  maxWidthClass?: string
  children: ReactNode
}) {
  const restoreRef = useRef<HTMLElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement as HTMLElement | null

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const root = panelRef.current
      if (!root) return
      // 只考虑可见元素（getClientRects 对 display:none / 折叠内容返回空）
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
      )
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement as HTMLElement | null
      const inside = !!active && root.contains(active)
      if (e.shiftKey) {
        if (!inside || active === first) {
          e.preventDefault()
          last.focus()
        }
      } else if (!inside || active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const timer = window.setTimeout(() => initialFocusRef?.current?.focus(), 0)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      window.clearTimeout(timer)
      restoreRef.current?.focus?.()
    }
  }, [open, onClose, initialFocusRef])

  if (!open) return null

  return createPortal(
    <div
      className="wm-modal-backdrop fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cx(
          'wm-modal-panel flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900',
          maxWidthClass,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
