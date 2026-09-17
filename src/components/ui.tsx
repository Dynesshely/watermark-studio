import { useEffect, useState, type ReactNode, type ButtonHTMLAttributes } from 'react'

/* ---------------- classnames ---------------- */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/* ---------------- Toast（模块级单例） ---------------- */

export type ToastKind = 'info' | 'success' | 'error'

interface ToastItem {
  id: number
  msg: string
  kind: ToastKind
}

let pushToast: ((t: ToastItem) => void) | null = null
let toastSeq = 0

export function toast(msg: string, kind: ToastKind = 'info'): void {
  if (pushToast) pushToast({ id: ++toastSeq, msg, kind })
  else console.info(`[toast] ${msg}`)
}

export function Toaster() {
  const [list, setList] = useState<ToastItem[]>([])
  useEffect(() => {
    pushToast = (t) => {
      setList((p) => [...p.slice(-3), t])
      window.setTimeout(() => {
        setList((p) => p.filter((x) => x.id !== t.id))
      }, 4500)
    }
    return () => {
      pushToast = null
    }
  }, [])
  const style = {
    info: 'bg-slate-800/95 text-slate-50 dark:bg-slate-100 dark:text-slate-900',
    success: 'bg-emerald-600/95 text-white',
    error: 'bg-rose-600/95 text-white',
  } as const
  return (
    <div className="pointer-events-none fixed left-1/2 top-14 z-[100] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4">
      {list.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cx(
            'pointer-events-auto flex max-w-full items-center gap-2 rounded-lg px-3.5 py-2 text-xs leading-relaxed shadow-lg backdrop-blur',
            style[t.kind],
          )}
        >
          <Icon name={t.kind === 'error' ? 'alert' : t.kind === 'success' ? 'check' : 'info'} className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 break-words">{t.msg}</span>
        </div>
      ))}
    </div>
  )
}

/* ---------------- Icons（feather 风格） ---------------- */

export type IconName =
  | 'image'
  | 'download'
  | 'archive'
  | 'upload'
  | 'trash'
  | 'close'
  | 'eye'
  | 'eyeOff'
  | 'sun'
  | 'moon'
  | 'monitor'
  | 'grip'
  | 'chevron'
  | 'move'
  | 'hand'
  | 'refresh'
  | 'check'
  | 'alert'
  | 'info'
  | 'clipboard'
  | 'sliders'
  | 'plus'
  | 'minus'
  | 'zoomIn'
  | 'zoomOut'
  | 'expand'
  | 'shield'
  | 'palette'
  | 'swap'
  | 'file'
  | 'copy'
  | 'search'
  | 'github'

const PATHS: Record<IconName, ReactNode> = {
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </>
  ),
  download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
  archive: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M8 10h8M8 14h5" />
    </>
  ),
  upload: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
  trash: (
    <>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </>
  ),
  close: <path d="M18 6 6 18M6 6l12 12" />,
  eye: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <path d="m1 1 22 22" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </>
  ),
  moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />,
  monitor: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  grip: (
    <>
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="19" r="1" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  move: (
    <>
      <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" />
    </>
  ),
  hand: (
    <>
      <path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6" />
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </>
  ),
  refresh: (
    <>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  alert: (
    <>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  clipboard: (
    <>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
      <path d="M1 14h6M9 8h6M17 16h6" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  zoomIn: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
    </>
  ),
  zoomOut: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35M8 11h6" />
    </>
  ),
  expand: (
    <>
      <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  palette: (
    <>
      <circle cx="13.5" cy="6.5" r="1.2" />
      <circle cx="17.5" cy="10.5" r="1.2" />
      <circle cx="8.5" cy="7.5" r="1.2" />
      <circle cx="6.5" cy="12.5" r="1.2" />
      <path d="M12 2a10 10 0 0 0 0 20c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01a1.5 1.5 0 0 1 1.13-2.49H16a6 6 0 0 0 6-6c0-4.97-4.48-9-10-9Z" />
    </>
  ),
  swap: <path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4" />,
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  // 品牌图标是**实心**的：自身覆盖 fill/stroke，不受外层 stroke 图标风格影响。
  // 路径取自 Simple Icons 的官方 github 图标（CC0-1.0，24×24 与其它图标同画布）。
  github: (
    <path
      fill="currentColor"
      stroke="none"
      d="M12 .297c-6.63 0-12 5.373-12 12c0 5.303 3.438 9.8 8.205 11.385c.6.113.82-.258.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729c1.205.084 1.838 1.236 1.838 1.236c1.07 1.835 2.809 1.305 3.495.998c.108-.776.417-1.305.76-1.605c-2.665-.3-5.466-1.332-5.466-5.93c0-1.31.465-2.38 1.235-3.22c-.135-.303-.54-1.523.105-3.176c0 0 1.005-.322 3.3 1.23c.96-.267 1.98-.399 3-.405c1.02.006 2.04.138 3 .405c2.28-1.552 3.285-1.23 3.285-1.23c.645 1.653.24 2.873.12 3.176c.765.84 1.23 1.91 1.23 3.22c0 4.61-2.805 5.625-5.475 5.92c.42.36.81 1.096.81 2.22c0 1.606-.015 2.896-.015 3.286c0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
    />
  ),
}

export function Icon({ name, className = 'h-4 w-4' }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}

/* ---------------- Button ---------------- */

type BtnVariant = 'primary' | 'soft' | 'ghost' | 'outline' | 'danger'

const BTN_STYLE: Record<BtnVariant, string> = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm disabled:hover:bg-indigo-600',
  soft: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25',
  ghost: 'text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-700/60',
  outline:
    'border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700/50',
  danger: 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10',
}

export function Button({
  variant = 'soft',
  icon,
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; icon?: IconName }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 dark:focus-visible:ring-offset-slate-900',
        BTN_STYLE[variant],
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} className="h-3.5 w-3.5" />}
      {children}
    </button>
  )
}

/* ---------------- 表单控件 ---------------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  disabled,
  className,
  size = 'md',
}: {
  options: { value: T; label: ReactNode; title?: string }[]
  value: T
  onChange: (v: T) => void
  disabled?: boolean
  className?: string
  /** sm：去掉最小宽度，适合顶栏等空间紧张处 */
  size?: 'md' | 'sm'
}) {
  return (
    <div
      className={cx(
        'inline-flex rounded-lg bg-slate-200/70 p-0.5 dark:bg-slate-800',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
      role="tablist"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cx(
            'flex items-center justify-center gap-1 rounded-md text-xs transition-colors',
            size === 'sm' ? 'h-6 min-w-0 px-1.5' : 'h-6.5 min-w-14 px-2',
            o.value === value
              ? 'bg-white font-medium text-indigo-600 shadow-sm dark:bg-slate-600 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative h-[18px] w-8 shrink-0 rounded-full transition-colors disabled:opacity-40',
        checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600',
      )}
    >
      <span
        className={cx(
          'absolute top-[2px] h-3.5 w-3.5 rounded-full bg-white shadow transition-all',
          checked ? 'left-[16px]' : 'left-[2px]',
        )}
      />
    </button>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  display,
  disabled,
  title,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  display?: string
  disabled?: boolean
  title?: string
}) {
  return (
    <div className="flex flex-col gap-1" title={title}>
      <div className="flex items-center justify-between gap-2">
        <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{label}</span>
        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-px font-mono text-[11px] tabular-nums text-slate-600 dark:bg-slate-700/70 dark:text-slate-300">
          {display ?? value}
        </span>
      </div>
      <input
        type="range"
        className="h-1.5 w-full cursor-pointer disabled:opacity-40"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

export function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  const commit = (raw: string) => {
    let v = raw.trim()
    if (/^[0-9a-fA-F]{6}$/.test(v)) {
      v = `#${v.toLowerCase()}`
    } else if (!/^#[0-9a-fA-F]{3,6}$/.test(v) || v.length > 7) {
      setText(value)
      return
    }
    setText(v)
    onChange(v)
  }
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={text}
          disabled={disabled}
          spellCheck={false}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit((e.target as HTMLInputElement).value)
          }}
          className="h-6.5 w-[74px] rounded-md border border-slate-300 bg-transparent px-1.5 font-mono text-[11px] text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-600 dark:text-slate-200"
        />
        <span className="relative inline-flex h-6.5 w-9 items-center justify-center rounded-md border border-slate-300 dark:border-slate-600">
          <input
            type="color"
            value={/^#[0-9a-fA-F]{3,6}$/.test(value) ? value : '#000000'}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <span className="h-4 w-6 rounded-sm border border-black/10" style={{ background: value }} />
        </span>
      </div>
    </div>
  )
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string
  value: string
  options: { label: string; value: string }[]
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-6.5 max-w-[190px] rounded-md border border-slate-300 bg-transparent px-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/* ---------------- 可折叠分组 ---------------- */

export function Group({
  title,
  extra,
  children,
  defaultOpen = true,
}: {
  title: ReactNode
  extra?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-b border-slate-200/80 px-3 py-2.5 dark:border-slate-800">
      <div className="mb-1 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        >
          <Icon
            name="chevron"
            className={cx('h-3 w-3 transition-transform', open && 'rotate-180')}
          />
          {title}
        </button>
        {extra}
      </div>
      {open && <div className="flex flex-col gap-2.5 pt-1">{children}</div>}
    </section>
  )
}
