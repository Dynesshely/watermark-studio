import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import {
  detectLang,
  isLang,
  setCurrentLang,
  translate,
  type DictKey,
  type Lang,
  type TParams,
} from '../i18n'
import { useSettings } from './settings'

interface I18nApi {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: DictKey, params?: TParams) => string
}

const Ctx = createContext<I18nApi | null>(null)

/**
 * 语言上下文。语言值存放在 settings（随其它设置一起持久化），
 * 并提供绑定到当前语言的 t()，保证切换语言时消费者必然重渲染。
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const { s, set } = useSettings()
  const lang: Lang = isLang(s.lang) ? s.lang : detectLang()

  // 同步给模块级 t()（供 lib/store 使用）。幂等的纯赋值，不触发 React 更新。
  setCurrentLang(lang)

  const t = useCallback(
    (key: DictKey, params?: TParams) => translate(lang, key, params),
    [lang],
  )
  const setLang = useCallback((next: Lang) => set({ lang: next }), [set])

  // 同步 <html lang> / 标题 / 描述，兼顾无障碍与浏览器标签页
  useEffect(() => {
    document.documentElement.lang = lang
    document.title = translate(lang, 'app.title')
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', translate(lang, 'app.description'))
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n(): I18nApi {
  const v = useContext(Ctx)
  if (!v) throw new Error('useI18n must be used within I18nProvider')
  return v
}
