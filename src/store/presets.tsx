import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { WmSettings } from '../lib/types'
import type { WmPreset } from '../lib/wmSerialize'
import { makePresetId, normalizeWm, uniquePresetName } from '../lib/wmSerialize'

const KEY = 'wmstudio.presets.v1'

interface PresetsApi {
  presets: WmPreset[]
  /** 新增预设，返回实际使用的（去重后的）名称 */
  add: (name: string, wm: WmSettings) => string
  /** 批量新增（导入用），返回成功加入的名称列表 */
  addMany: (items: { name: string; wm: WmSettings }[]) => string[]
  remove: (id: string) => void
  rename: (id: string, name: string) => void
  /** 用当前参数覆盖指定预设 */
  overwrite: (id: string, wm: WmSettings) => void
}

const Ctx = createContext<PresetsApi | null>(null)

function sanitize(raw: unknown): WmPreset | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const now = new Date().toISOString()
  const name =
    typeof o.name === 'string' && o.name.trim() ? o.name.trim().slice(0, 60) : '未命名预设'
  return {
    id: typeof o.id === 'string' && o.id ? o.id : makePresetId(),
    name,
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : now,
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : now,
    wm: normalizeWm(o.wm ?? o.watermark),
  }
}

function load(): WmPreset[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr: unknown = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr.map(sanitize).filter((p): p is WmPreset => p !== null)
  } catch {
    return []
  }
}

export function PresetsProvider({ children }: { children: ReactNode }) {
  const [presets, setPresets] = useState<WmPreset[]>(load)
  // 事件处理里需要读取“最新的预设名列表”做去重；updater 不是同步执行的，故用 ref 镜像
  const presetsRef = useRef(presets)
  useEffect(() => {
    presetsRef.current = presets
  }, [presets])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(presets))
    } catch {
      /* 隐私模式等场景静默失败 */
    }
  }, [presets])

  const add = useCallback((name: string, wm: WmSettings) => {
    const now = new Date().toISOString()
    const used = uniquePresetName(name, presetsRef.current.map((p) => p.name))
    setPresets((prev) => [
      ...prev,
      { id: makePresetId(), name: used, createdAt: now, updatedAt: now, wm },
    ])
    return used
  }, [])

  const addMany = useCallback((items: { name: string; wm: WmSettings }[]) => {
    const now = new Date().toISOString()
    const taken = presetsRef.current.map((p) => p.name)
    const created: WmPreset[] = []
    for (const item of items) {
      const name = uniquePresetName(item.name, taken)
      taken.push(name)
      created.push({ id: makePresetId(), name, createdAt: now, updatedAt: now, wm: item.wm })
    }
    if (created.length > 0) setPresets((prev) => [...prev, ...created])
    return created.map((p) => p.name)
  }, [])

  const remove = useCallback((id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const rename = useCallback((id: string, name: string) => {
    const clean = name.trim().slice(0, 60)
    if (!clean) return
    setPresets((prev) => {
      const others = prev.filter((p) => p.id !== id).map((p) => p.name)
      const unique = uniquePresetName(clean, others)
      return prev.map((p) =>
        p.id === id ? { ...p, name: unique, updatedAt: new Date().toISOString() } : p,
      )
    })
  }, [])

  const overwrite = useCallback((id: string, wm: WmSettings) => {
    setPresets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, wm, updatedAt: new Date().toISOString() } : p)),
    )
  }, [])

  return (
    <Ctx.Provider value={{ presets, add, addMany, remove, rename, overwrite }}>
      {children}
    </Ctx.Provider>
  )
}

export function usePresets(): PresetsApi {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePresets 必须在 PresetsProvider 内使用')
  return v
}
