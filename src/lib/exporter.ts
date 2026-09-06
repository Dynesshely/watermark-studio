import JSZip from 'jszip'
import type { AppSettings, ImageItem } from './types'
import { KIND_EXPORT } from './types'
import { decodeToSource, hasJpegMetadata } from './imaging'
import { canvasToBlob, renderWatermarked } from './renderer'
import { buildFileName, dedupeNames } from './filename'

export type ExportMode = 'one' | 'all' | 'zip'

export interface ExportProgress {
  done: number
  total: number
  phase: string
}

export interface ExportResult {
  okNames: string[]
  failed: { name: string; error: string }[]
  exifWarning: boolean
  pngFallbackNames: string[]
  emptyContent: boolean
  bmpNames: string[]
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function stamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

/**
 * 逐个处理图片：解码 → 全分辨率渲染水印 → 编码 → 下载（one/all）或打包 ZIP。
 * 逐张顺序处理以避免同时解码多张大图导致内存爆炸。
 */
export async function processImages(
  items: ImageItem[],
  settings: AppSettings,
  mode: ExportMode,
  targetId: string | null,
  onProgress: (p: ExportProgress) => void,
): Promise<ExportResult> {
  const wm = settings.wm
  const quality = settings.jpegQuality
  const targets = mode === 'one' ? items.filter((i) => i.id === targetId) : items
  const result: ExportResult = {
    okNames: [],
    failed: [],
    exifWarning: false,
    pngFallbackNames: [],
    emptyContent: false,
    bmpNames: [],
  }
  if (targets.length === 0) return result

  result.emptyContent = wm.content.split('\n').every((l) => !l.trim())

  // JPEG 元数据扫描（仅提示用，读取文件头很快）
  if (mode !== 'one' && targets.some((t) => t.kind === 'jpeg')) {
    try {
      const flags = await Promise.all(
        targets.map((t) => (t.kind === 'jpeg' ? hasJpegMetadata(t.file) : Promise.resolve(false))),
      )
      result.exifWarning = flags.some(Boolean)
    } catch {
      /* 忽略扫描失败 */
    }
  }

  const outputs: { blob: Blob; name: string }[] = []
  let done = 0
  for (const item of targets) {
    onProgress({ done, total: targets.length, phase: `正在处理 ${item.name}` })
    try {
      const src = await decodeToSource(item.file)
      try {
        const canvas = renderWatermarked(src.el, src.width, src.height, wm, 1)
        const fmt = KIND_EXPORT[item.kind]
        const isLossy = item.kind === 'jpeg' || item.kind === 'webp'
        let mime = fmt.mime
        let blob: Blob | null = await canvasToBlob(canvas, mime, isLossy ? quality : undefined)
        if (!blob && item.kind === 'webp') {
          // 个别浏览器不支持 WebP 编码 → PNG 兜底
          mime = 'image/png'
          blob = await canvasToBlob(canvas, mime)
          result.pngFallbackNames.push(item.name)
        }
        if (!blob) throw new Error('Canvas 编码失败')
        if (item.kind === 'bmp') {
          result.bmpNames.push(item.name)
          result.pngFallbackNames.push(item.name)
        }
        const ext = item.kind === 'bmp' ? 'png' : fmt.ext
        outputs.push({ blob, name: buildFileName(settings.filenameTemplate, item.name, ext) })
      } finally {
        src.dispose?.()
      }
    } catch (e) {
      result.failed.push({ name: item.name, error: e instanceof Error ? e.message : String(e) })
    }
    done++
    onProgress({ done, total: targets.length, phase: `正在处理 ${item.name}` })
  }

  const names = dedupeNames(outputs.map((o) => o.name))
  outputs.forEach((o, idx) => {
    o.name = names[idx]
  })

  if (mode === 'zip') {
    onProgress({ done: 0, total: 100, phase: '正在压缩打包 ZIP…' })
    const zip = new JSZip()
    for (const o of outputs) zip.file(o.name, o.blob)
    const zipBlob = await zip.generateAsync(
      { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
      (meta) => {
        if (meta.percent % 5 === 0 || meta.percent === 100) {
          onProgress({ done: Math.round(meta.percent), total: 100, phase: '正在压缩打包 ZIP…' })
        }
      },
    )
    downloadBlob(zipBlob, `水印图片_${stamp()}.zip`)
    result.okNames.push('ZIP 包')
  } else {
    for (const o of outputs) downloadBlob(o.blob, o.name)
  }
  return result
}
