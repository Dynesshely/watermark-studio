export const FONT_STACK = `'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'SimHei', 'Heiti SC', sans-serif`

export interface FontOption {
  /** 中文界面下的名称 */
  label: string
  /** 英文界面下的名称（中文名对英文用户无意义，直接给字体名） */
  labelEn: string
  value: string
}

export const FONT_OPTIONS: FontOption[] = [
  { label: '苹方（PingFang SC）', labelEn: 'PingFang SC', value: 'PingFang SC' },
  { label: '微软雅黑', labelEn: 'Microsoft YaHei', value: 'Microsoft YaHei' },
  { label: '思源黑体（Noto Sans SC）', labelEn: 'Noto Sans SC', value: 'Noto Sans SC' },
  { label: '黑体（SimHei）', labelEn: 'SimHei', value: 'SimHei' },
  { label: '宋体（SimSun）', labelEn: 'SimSun', value: 'SimSun' },
  { label: '思源宋体（Noto Serif SC）', labelEn: 'Noto Serif SC', value: 'Noto Serif SC' },
  { label: '楷体（KaiTi）', labelEn: 'KaiTi', value: 'KaiTi' },
  { label: '仿宋（FangSong）', labelEn: 'FangSong', value: 'FangSong' },
  { label: '华文行楷（STXingkai）', labelEn: 'STXingkai', value: 'STXingkai' },
  { label: 'Arial', labelEn: 'Arial', value: 'Arial' },
  { label: 'Helvetica Neue', labelEn: 'Helvetica Neue', value: 'Helvetica Neue' },
  { label: 'Georgia', labelEn: 'Georgia', value: 'Georgia' },
  { label: 'Times New Roman', labelEn: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Verdana', labelEn: 'Verdana', value: 'Verdana' },
  { label: 'Impact', labelEn: 'Impact', value: 'Impact' },
  { label: 'Courier New', labelEn: 'Courier New', value: 'Courier New' },
]

/** 构造 canvas 可用的 font 字符串（带中文字体回退栈） */
export function fontCss(family: string, weight: number, sizePx: number): string {
  const safe = family.trim().replace(/['"]/g, '')
  const quoted = /[^a-zA-Z0-9-]/.test(safe) ? `'${safe}'` : safe || 'sans-serif'
  return `${weight} ${sizePx}px ${quoted}, ${FONT_STACK}`
}
