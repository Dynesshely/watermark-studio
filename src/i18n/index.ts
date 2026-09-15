import type { Lang } from '../lib/types'
import { en } from './en'
import { zh, type DictKey } from './zh'

export type { DictKey, Lang }

export type TParams = Record<string, string | number>

/** 语言选择器的候选项（标签用各自语言书写，符合惯例） */
export const LANGS: { value: Lang; label: string; title: string }[] = [
  { value: 'zh', label: '中', title: '中文' },
  { value: 'en', label: 'EN', title: 'English' },
]

const DICTS: Record<Lang, Record<DictKey, string>> = { zh, en }

export function isLang(v: unknown): v is Lang {
  return v === 'zh' || v === 'en'
}

/** 依据浏览器偏好语言推断：命中 zh 用中文，其余（含未知语言）用英文 */
export function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'en'
  const list =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language]
  for (const l of list) {
    if (!l) continue
    if (/^zh\b/i.test(l)) return 'zh'
    if (/^en\b/i.test(l)) return 'en'
  }
  return 'en'
}

export function translate(lang: Lang, key: DictKey, params?: TParams): string {
  let s: string = DICTS[lang][key] ?? key
  if (params) {
    for (const k of Object.keys(params)) {
      s = s.split(`{${k}}`).join(String(params[k]))
    }
  }
  return s
}

/**
 * 模块级当前语言，供非 React 代码使用（lib 抛错文案、store 默认名等）。
 * React 组件请使用 useI18n()，以保证语言切换时重新渲染。
 */
let currentLangValue: Lang = typeof navigator !== 'undefined' ? detectLang() : 'en'

export function setCurrentLang(lang: Lang): void {
  currentLangValue = lang
}

export function getCurrentLang(): Lang {
  return currentLangValue
}

/** 非 React 场景的翻译；语言由 I18nProvider 同步 */
export function t(key: DictKey, params?: TParams): string {
  return translate(currentLangValue, key, params)
}
