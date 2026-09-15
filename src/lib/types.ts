export type UnitMode = 'percent' | 'px'
export type WmMode = 'single' | 'tile'
export type ThemePref = 'light' | 'dark' | 'system'
/** 界面语言 */
export type Lang = 'zh' | 'en'

/** 水印参数（一套参数套用全部图片） */
export interface WmSettings {
  mode: WmMode
  /** 字号基准：percent = 相对图片宽度百分比；px = 固定像素 */
  unit: UnitMode
  /** 水印内容，支持多行（\n） */
  content: string
  fontFamily: string
  fontWeight: 400 | 700
  /** percent 单位时含义为「图片宽度的 %」，px 单位时为像素 */
  fontSize: number
  /** 行距倍率（相对字号） */
  lineHeightRatio: number
  color: string
  /** 0..1 */
  opacity: number
  strokeEnabled: boolean
  strokeColor: string
  /** 描边宽度 = 字号 × 该值 */
  strokeRatio: number
  shadowEnabled: boolean
  shadowColor: string
  /** 以下三个以「字号倍数」为单位，保证两种单位下表现一致 */
  shadowBlurEm: number
  shadowOffsetXEm: number
  shadowOffsetYEm: number
  /** 角度 -180..180 */
  angleDeg: number
  /** 平铺：横向间距（percent 时 = 图片宽度的 %，px 时像素） */
  spacingX: number
  /** 平铺：纵向间距（同上，统一相对图片宽度） */
  spacingY: number
  /** 平铺网格整体偏移（相对图片宽度 % 或 px） */
  tileOffsetX: number
  tileOffsetY: number
  /** 单次模式：水印中心水平位置（图片宽度 %） */
  posXPct: number
  /** 单次模式：水印中心垂直位置（图片高度 %） */
  posYPct: number
}

export interface AppSettings {
  theme: ThemePref
  /** 界面语言（首次访问按浏览器偏好自动检测） */
  lang: Lang
  /** JPEG/WebP 导出质量 */
  jpegQuality: number
  /** 导出文件名模板，支持 {name} {ext} */
  filenameTemplate: string
  wm: WmSettings
}

export const WM_DEFAULTS: WmSettings = {
  mode: 'tile',
  unit: 'percent',
  content: '',
  fontFamily: 'PingFang SC',
  fontWeight: 400,
  fontSize: 4,
  lineHeightRatio: 1.4,
  color: '#ffffff',
  opacity: 0.35,
  strokeEnabled: false,
  strokeColor: '#000000',
  strokeRatio: 0.06,
  shadowEnabled: false,
  shadowColor: '#000000',
  shadowBlurEm: 0,
  shadowOffsetXEm: 0,
  shadowOffsetYEm: 0,
  angleDeg: -30,
  spacingX: 18,
  spacingY: 18,
  tileOffsetX: 0,
  tileOffsetY: 0,
  posXPct: 50,
  posYPct: 50,
}

export const APP_DEFAULTS: AppSettings = {
  theme: 'system',
  lang: 'zh',
  jpegQuality: 0.92,
  filenameTemplate: '{name}_wm.{ext}',
  wm: WM_DEFAULTS,
}

/** 导出的图片类型（原始 kind 到导出的映射） */
export type ImgKind = 'jpeg' | 'png' | 'webp' | 'bmp'

export const KIND_EXPORT: Record<ImgKind, { mime: string; ext: string }> = {
  jpeg: { mime: 'image/jpeg', ext: 'jpg' },
  png: { mime: 'image/png', ext: 'png' },
  webp: { mime: 'image/webp', ext: 'webp' },
  // 浏览器无法可靠编码 BMP，导出按 PNG 兜底
  bmp: { mime: 'image/png', ext: 'png' },
}

export const KIND_LABEL: Record<ImgKind, string> = {
  jpeg: 'JPG',
  png: 'PNG',
  webp: 'WebP',
  bmp: 'BMP',
}

export interface ImageItem {
  id: string
  name: string
  file: File
  kind: ImgKind
  mime: string
  /** 用于列表卡片原图展示的 objectURL */
  thumbUrl: string
  size: number
}
