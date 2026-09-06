import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AppSettings, WmSettings } from '../lib/types'
import { APP_DEFAULTS } from '../lib/types'
import { applyTheme, loadSettings, saveSettings } from '../lib/storage'

interface SettingsApi {
  s: AppSettings
  set: (patch: Partial<AppSettings>) => void
  setWm: (patch: Partial<WmSettings>) => void
  resetWm: () => void
}

const Ctx = createContext<SettingsApi | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<AppSettings>(loadSettings)
  const timer = useRef<number | undefined>(undefined)

  const set = useCallback((patch: Partial<AppSettings>) => {
    setS((prev) => ({ ...prev, ...patch }))
  }, [])
  const setWm = useCallback((patch: Partial<WmSettings>) => {
    setS((prev) => ({ ...prev, wm: { ...prev.wm, ...patch } }))
  }, [])
  const resetWm = useCallback(() => {
    setS((prev) => ({ ...prev, wm: { ...APP_DEFAULTS.wm } }))
  }, [])

  // 应用主题
  useEffect(() => {
    applyTheme(s.theme)
  }, [s.theme])

  // 跟随系统主题变化
  useEffect(() => {
    if (s.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const fn = () => applyTheme('system')
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [s.theme])

  // 防抖持久化
  useEffect(() => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => saveSettings(s), 250)
    return () => window.clearTimeout(timer.current)
  }, [s])

  return <Ctx.Provider value={{ s, set, setWm, resetWm }}>{children}</Ctx.Provider>
}

export function useSettings(): SettingsApi {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSettings 必须在 SettingsProvider 内使用')
  return v
}
