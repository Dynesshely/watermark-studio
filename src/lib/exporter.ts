import JSZip from 'jszip'
import type { AppSettings, ImageItem } from './types'
import { KIND_EXPORT } from './types'
import { decodeToSource, hasJpegMetadata } from './imaging'
import { canvasToBlob, renderWatermarked } from './renderer'
import { buildFileName, dedupeNames } from './filename'
import { t } from '../i18n'

export type ExportMode = 'one' | 'all' | 'zip'

export interface ExportProgress {
  done: number
  total: number
  phase: string
  /** 预计剩余毫秒数（采到足够样本后才有值） */
  etaMs?: number
}

export interface ExportResult {
  okNames: string[]
  failed: { name: string; error: string }[]
  exifWarning: boolean
  pngFallbackNames: string[]
  emptyContent: boolean
  bmpNames: string[]
  /** 用户中途取消 */
  canceled: boolean
}

export interface ProcessOptions {
  /** 返回 true 时停止处理后续图片（已完成的仍会逐张下载；ZIP 不再生成） */
  shouldCancel?: () => boolean
}

/** 按最长边等比缩小导出画布（水印已在原尺寸绘制，缩小后比例自动保持） */
function scaleForExport(canvas: HTMLCanvasElement, maxSide: number): HTMLCanvasElement {
  if (!maxSide || maxSide <= 0) return canvas
  const longest = Math.max(canvas.width, canvas.height)
  if (longest <= maxSide) return canvas
  const s = maxSide / longest
  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.round(canvas.width * s))
  out.height = Math.max(1, Math.round(canvas.height * s))
  const ctx = out.getContext('2d')
  if (!ctx) return canvas
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(canvas, 0, 0, out.width, out.height)
  return out
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
  opts: ProcessOptions = {},
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
    canceled: false,
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
  const startedAt = performance.now()
  for (const item of targets) {
    if (opts.shouldCancel?.()) {
      result.canceled = true
      break
    }
    onProgress({ done, total: targets.length, phase: t('export.busy.processing', { name: item.name }) })
    try {
      const src = await decodeToSource(item.file)
      try {
        const canvas = renderWatermarked(src.el, src.width, src.height, wm, 1)
        const exportCanvas = scaleForExport(canvas, settings.exportMaxSide)
        const fmt = KIND_EXPORT[item.kind]
        const isLossy = item.kind === 'jpeg' || item.kind === 'webp'
        let mime = fmt.mime
        let blob: Blob | null = await canvasToBlob(exportCanvas, mime, isLossy ? quality : undefined)
        if (!blob && item.kind === 'webp') {
          // 个别浏览器不支持 WebP 编码 → PNG 兜底
          mime = 'image/png'
          blob = await canvasToBlob(exportCanvas, mime)
          result.pngFallbackNames.push(item.name)
        }
        if (!blob) throw new Error(t('err.canvasEncode'))
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
    // 用已完成图片的平均耗时估算剩余时间
    const perItem = (performance.now() - startedAt) / Math.max(1, done)
    const remaining = Math.max(0, targets.length - done) * perItem
    onProgress({
      done,
      total: targets.length,
      phase: t('export.busy.processing', { name: item.name }),
      etaMs: done < targets.length ? remaining : 0,
    })
  }

  const names = dedupeNames(outputs.map((o) => o.name))
  outputs.forEach((o, idx) => {
    o.name = names[idx]
  })

  if (mode === 'zip') {
    // 取消后不再生成 ZIP（半包意义不大，避免用户误以为包内齐全）
    if (result.canceled) return result
    onProgress({ done: 0, total: 100, phase: t('export.busy.zipping') })
    const zip = new JSZip()
    for (const o of outputs) zip.file(o.name, o.blob)
    const zipBlob = await zip.generateAsync(
      { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
      (meta) => {
        if (meta.percent % 5 === 0 || meta.percent === 100) {
          onProgress({ done: Math.round(meta.percent), total: 100, phase: t('export.busy.zipping') })
        }
      },
    )
    downloadBlob(zipBlob, t('export.zipName', { stamp: stamp() }))
    result.okNames.push('ZIP')
  } else {
    for (const o of outputs) downloadBlob(o.blob, o.name)
  }
  return result
}
