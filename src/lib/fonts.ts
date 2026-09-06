export const FONT_STACK = `'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'SimHei', 'Heiti SC', sans-serif`

export interface FontOption {
  label: string
  value: string
}

export const FONT_OPTIONS: FontOption[] = [
  { label: '苹方（PingFang SC）', value: 'PingFang SC' },
  { label: '微软雅黑', value: 'Microsoft YaHei' },
  { label: '思源黑体（Noto Sans SC）', value: 'Noto Sans SC' },
  { label: '黑体（SimHei）', value: 'SimHei' },
  { label: '宋体（SimSun）', value: 'SimSun' },
  { label: '思源宋体（Noto Serif SC）', value: 'Noto Serif SC' },
  { label: '楷体（KaiTi）', value: 'KaiTi' },
  { label: '仿宋（FangSong）', value: 'FangSong' },
  { label: '华文行楷（STXingkai）', value: 'STXingkai' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Helvetica Neue', value: 'Helvetica Neue' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Impact', value: 'Impact' },
  { label: 'Courier New', value: 'Courier New' },
]

/** 构造 canvas 可用的 font 字符串（带中文字体回退栈） */
export function fontCss(family: string, weight: number, sizePx: number): string {
  const safe = family.trim().replace(/['"]/g, '')
  const quoted = /[^a-zA-Z0-9-]/.test(safe) ? `'${safe}'` : safe || 'sans-serif'
  return `${weight} ${sizePx}px ${quoted}, ${FONT_STACK}`
}
