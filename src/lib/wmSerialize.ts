import type { WmSettings } from './types'
import { WM_DEFAULTS } from './types'

/** 预设文件格式标识（导入时会校验，避免误吞其它 JSON） */
export const PRESET_FILE_TYPE = 'watermark-studio.preset'
export const PRESET_FILE_VERSION = 1

export interface WmPreset {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  wm: WmSettings
}

/** 导出到 .json 的文件结构（自描述，便于外部识别与再导入） */
export interface PresetFile {
  type: string
  version: number
  name: string
  createdAt: string
  updatedAt: string
  app: { name: string; version: string }
  watermark: WmSettings
}

export function makePresetId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function appVersion(): string {
  // 构建期由 vite define 注入；非构建环境（如直接跑脚本）时降级
  try {
    return typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev'
  } catch {
    return 'dev'
  }
}

/* ---------------- 数值/类型钳制：localStorage 或导入的 JSON 都不可信 ---------------- */

const num = (v: unknown, fallback: number, min: number, max: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback

const str = (v: unknown, fallback: string, maxLen = 2000): string =>
  typeof v === 'string' ? v.slice(0, maxLen) : fallback

const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback)

const hex = (v: unknown, fallback: string): string => {
  const s = str(v, fallback, 7)
  return /^#[0-9a-fA-F]{3,6}$/.test(s) ? s.toLowerCase() : fallback
}

/** 把任意来源的值规整为合法的水印参数（缺失/越界字段回落到默认值） */
export function normalizeWm(raw: unknown): WmSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const d = WM_DEFAULTS
  return {
    mode: r.mode === 'single' || r.mode === 'tile' ? r.mode : d.mode,
    unit: r.unit === 'px' || r.unit === 'percent' ? r.unit : d.unit,
    content: str(r.content, d.content),
    fontFamily: str(r.fontFamily, d.fontFamily, 100),
    fontWeight: r.fontWeight === 700 ? 700 : 400,
    fontSize: num(r.fontSize, d.fontSize, 0.1, 2000),
    lineHeightRatio: num(r.lineHeightRatio, d.lineHeightRatio, 0.5, 5),
    color: hex(r.color, d.color),
    opacity: num(r.opacity, d.opacity, 0, 1),
    strokeEnabled: bool(r.strokeEnabled, d.strokeEnabled),
    strokeColor: hex(r.strokeColor, d.strokeColor),
    strokeRatio: num(r.strokeRatio, d.strokeRatio, 0, 1),
    shadowEnabled: bool(r.shadowEnabled, d.shadowEnabled),
    shadowColor: hex(r.shadowColor, d.shadowColor),
    shadowBlurEm: num(r.shadowBlurEm, d.shadowBlurEm, 0, 5),
    shadowOffsetXEm: num(r.shadowOffsetXEm, d.shadowOffsetXEm, -5, 5),
    shadowOffsetYEm: num(r.shadowOffsetYEm, d.shadowOffsetYEm, -5, 5),
    angleDeg: num(r.angleDeg, d.angleDeg, -360, 360),
    spacingX: num(r.spacingX, d.spacingX, 0.5, 20000),
    spacingY: num(r.spacingY, d.spacingY, 0.5, 20000),
    tileOffsetX: num(r.tileOffsetX, d.tileOffsetX, -20000, 20000),
    tileOffsetY: num(r.tileOffsetY, d.tileOffsetY, -20000, 20000),
    posXPct: num(r.posXPct, d.posXPct, 0, 100),
    posYPct: num(r.posYPct, d.posYPct, 0, 100),
  }
}

/* ---------------- 序列化 / 反序列化 ---------------- */

export function toPresetFile(p: WmPreset): PresetFile {
  return {
    type: PRESET_FILE_TYPE,
    version: PRESET_FILE_VERSION,
    name: p.name,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    app: { name: '水印工坊', version: appVersion() },
    watermark: p.wm,
  }
}

export function serializePreset(p: WmPreset): string {
  return `${JSON.stringify(toPresetFile(p), null, 2)}\n`
}

const WM_KEYS = ['mode', 'unit', 'content', 'fontSize', 'color', 'opacity']

function looksLikeWm(v: unknown): boolean {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return WM_KEYS.some((k) => k in o)
}

export interface ParsedPreset {
  name: string | null
  wm: WmSettings
}

/**
 * 解析预设 JSON。兼容三种输入：
 * 1. 本工具导出的完整文件（含 watermark 字段）
 * 2. 仅含水印参数的对象（裸 WmSettings）
 * 3. 带 wm 字段的简化结构
 */
export function parsePresetJson(text: string): ParsedPreset {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('JSON 解析失败')
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('不是有效的配置对象')
  }
  const obj = raw as Record<string, unknown>
  const source = 'watermark' in obj ? obj.watermark : 'wm' in obj ? obj.wm : obj
  if (!looksLikeWm(source)) {
    throw new Error('缺少水印参数字段')
  }
  const name = typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim().slice(0, 60) : null
  return { name, wm: normalizeWm(source) }
}

export function safePresetFileName(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
  return cleaned || 'preset'
}

/** 预设名称去重：重名时追加序号 */
export function uniquePresetName(base: string, existing: string[]): string {
  const name = base.trim() || '未命名预设'
  if (!existing.includes(name)) return name
  let i = 2
  while (existing.includes(`${name} ${i}`)) i++
  return `${name} ${i}`
}
