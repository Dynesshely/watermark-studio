import type { AppSettings } from './types'
import { APP_DEFAULTS } from './types'
import { normalizeWm } from './wmSerialize'

const KEY = 'wmstudio.settings.v1'

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return APP_DEFAULTS
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      ...APP_DEFAULTS,
      ...parsed,
      // 走统一的钳制校验：本地存储被改坏/写入越界值时也能正常启动
      wm: normalizeWm(parsed.wm),
    }
  } catch {
    return APP_DEFAULTS
  }
}

export function saveSettings(s: AppSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* 隐私模式等场景静默失败 */
  }
}

export function resetWatermark(): AppSettings {
  return { ...loadSettings(), wm: { ...APP_DEFAULTS.wm } }
}

export function applyTheme(theme: AppSettings['theme']): void {
  const dark =
    theme === 'dark' ||
    (theme !== 'light' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', !!dark)
}
