export const TEMPLATE_DEFAULT = '{name}_wm.{ext}'

const ILLEGAL = /[\\/:*?"<>|\u0000-\u001f]/g

/** 依据模板生成导出文件名，{name}=原名（不含扩展名），{ext}=导出扩展名 */
export function buildFileName(template: string, name: string, ext: string): string {
  const base = name.replace(/\.[^.]*$/, '')
  let out = template
    .replaceAll('{name}', base)
    .replaceAll('{ext}', ext)
    .replace(ILLEGAL, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.{2,}/g, '.')
  if (!out) out = `${base || 'image'}_wm.${ext}`
  if (!out.toLowerCase().endsWith(`.${ext}`)) out = `${out}.${ext}`
  return out
}

/** 批量场景下同名文件追加序号，避免覆盖 */
export function dedupeNames(names: string[]): string[] {
  const seen = new Map<string, number>()
  return names.map((n) => {
    const count = seen.get(n) ?? 0
    seen.set(n, count + 1)
    if (count === 0) return n
    const dot = n.lastIndexOf('.')
    const stem = dot > 0 ? n.slice(0, dot) : n
    const suffix = dot > 0 ? n.slice(dot) : ''
    return `${stem}-${count + 1}${suffix}`
  })
}
