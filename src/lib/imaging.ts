import type { ImgKind } from './types'
import { t } from '../i18n'
import { canvasToBlob } from './renderer'

export interface Decoded {
  /** 已按 EXIF 方向校正过的图像源 */
  el: CanvasImageSource
  width: number
  height: number
  dispose?: () => void
}

const MAX_SNIFF = 16

/** 按文件头字节识别真实格式（比 MIME 更可靠） */
export async function sniffKind(file: Blob): Promise<ImgKind | null> {
  try {
    const buf = new Uint8Array(await file.slice(0, MAX_SNIFF).arrayBuffer())
    if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg'
    if (
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47
    )
      return 'png'
    if (
      buf.length >= 12 &&
      buf[0] === 0x52 && // RIFF
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x46 &&
      buf[8] === 0x57 && // WEBP
      buf[9] === 0x45 &&
      buf[10] === 0x42 &&
      buf[11] === 0x50
    )
      return 'webp'
    if (buf.length >= 2 && buf[0] === 0x42 && buf[1] === 0x4d) return 'bmp'
    // AVIF：ISO BMFF 容器，'ftyp' 后紧跟主品牌 'avif' / 'avis'
    if (
      buf.length >= 12 &&
      buf[4] === 0x66 && // f
      buf[5] === 0x74 && // t
      buf[6] === 0x79 && // y
      buf[7] === 0x70 && // p
      buf[8] === 0x61 && // a
      buf[9] === 0x76 && // v
      buf[10] === 0x69 && // i
      buf[11] === 0x66
    )
      return 'avif'
  } catch {
    /* 读取失败走 MIME 兜底 */
  }
  const m = file.type.toLowerCase()
  if (m === 'image/jpeg') return 'jpeg'
  if (m === 'image/png') return 'png'
  if (m === 'image/webp') return 'webp'
  if (m === 'image/bmp') return 'bmp'
  if (m === 'image/avif') return 'avif'
  return null
}

export function isSupportedFile(file: File): boolean {
  return /\.(jpe?g|png|webp|bmp|avif)$/i.test(file.name) || file.type.startsWith('image/')
}

export async function sniffMeta(file: File): Promise<{ kind: ImgKind | null; mime: string }> {
  const kind = await sniffKind(file)
  if (kind === 'jpeg') return { kind, mime: 'image/jpeg' }
  if (kind === 'png') return { kind, mime: 'image/png' }
  if (kind === 'webp') return { kind, mime: 'image/webp' }
  if (kind === 'bmp') return { kind, mime: 'image/bmp' }
  if (kind === 'avif') return { kind, mime: 'image/avif' }
  return { kind: null, mime: file.type }
}

/** 粗略判断文件是否可解码为位图（动图/HEIC 等在解码时才暴露，这里只做前缀提示） */
export const UNSUPPORTED_HINTS = [
  { re: /\.gif$/i, hint: 'GIF' },
  { re: /\.heic$/i, hint: 'HEIC' },
  { re: /\.heif$/i, hint: 'HEIF' },
  { re: /\.svg$/i, hint: 'SVG' },
]

export function unsupportedHint(name: string): string | null {
  for (const u of UNSUPPORTED_HINTS) if (u.re.test(name)) return u.hint
  return null
}

/** 解码文件为图像源；优先 createImageBitmap 并应用 EXIF 方向 */
export async function decodeToSource(file: File | Blob): Promise<Decoded> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions)
    return {
      el: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      dispose: () => bitmap.close(),
    }
  } catch {
    // 兜底：HTMLImageElement + canvas（浏览器会应用 EXIF 方向）
    const url = URL.createObjectURL(file)
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image()
        el.onload = () => resolve(el)
        el.onerror = () => reject(new Error(t('err.decode')))
        el.src = url
      })
      const w = img.naturalWidth
      const h = img.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error(t('err.canvas'))
      ctx.drawImage(img, 0, 0)
      return { el: canvas, width: w, height: h }
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

/** JPEG 中是否含 EXIF 等元数据（扫描 APP1 段中的 'Exif\0\0'） */
export async function hasJpegMetadata(file: File): Promise<boolean> {
  try {
    const head = new Uint8Array(await file.slice(0, 65536).arrayBuffer())
    // 找 "Exif\0\0"
    for (let i = 0; i + 5 < head.length; i++) {
      if (
        head[i] === 0x45 && // E
        head[i + 1] === 0x78 && // x
        head[i + 2] === 0x69 && // i
        head[i + 3] === 0x66 && // f
        head[i + 4] === 0x00 &&
        head[i + 5] === 0x00
      )
        return true
    }
  } catch {
    /* 忽略 */
  }
  return false
}

export const BIG_IMAGE_SIDE = 6000

export function isBigImage(w: number, h: number): boolean {
  return Math.max(w, h) > BIG_IMAGE_SIDE || w * h > 40_000_000
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

export function makeItemId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function toFileFromBlob(blob: Blob, name: string): File {
  return new File([blob], name, { type: blob.type || 'image/png' })
}

/* ---------------- 从颜色开始：生成纯色 / 全透明底图 ---------------- */

/** 合成底图的尺寸约束（与超大图提示阈值保持一致的量级） */
export const SOLID_IMAGE_BOUNDS = { min: 16, max: 8000, maxPixels: 32_000_000 }

export function solidImageSizeValid(width: number, height: number): boolean {
  const b = SOLID_IMAGE_BOUNDS
  if (!Number.isFinite(width) || !Number.isFinite(height)) return false
  if (width < b.min || height < b.min) return false
  if (width > b.max || height > b.max) return false
  return width * height <= b.maxPixels
}

/**
 * 生成一张纯色或全透明的 PNG 图片。
 * color 传 null 时输出 alpha=0 的完全透明图片（PNG 保留透明通道）。
 */
export async function createSolidImage(
  width: number,
  height: number,
  color: string | null,
): Promise<File> {
  const b = SOLID_IMAGE_BOUNDS
  const w = Math.round(Math.min(b.max, Math.max(b.min, width)))
  const h = Math.round(Math.min(b.max, Math.max(b.min, height)))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error(t('err.canvas'))
  if (color) {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, w, h)
  }
  // color 为 null 时不绘制任何内容，canvas 默认即全透明
  const blob = await canvasToBlob(canvas, 'image/png')
  if (!blob) throw new Error(t('err.canvasEncode'))
  return new File([blob], t('app.solidFileName', { w, h }), { type: 'image/png' })
}

/* ---------------- 小尺寸解码缓存（供列表缩略图水印预览） ---------------- */

interface SmallEntry {
  d: Decoded
  last: number
}

const smallCache = new Map<File, SmallEntry>()
const SMALL_CACHE_CAP = 16
let smallSeq = 0

/**
 * 解码为 maxSide 以内的位图并做 LRU 缓存。
 * 返回的 Decoded.width/height 为小图自身尺寸（渲染水印缩略图按比例绘制）。
 */
export async function decodeSmall(file: File, maxSide = 560): Promise<Decoded> {
  const hit = smallCache.get(file)
  if (hit) {
    hit.last = ++smallSeq
    return hit.d
  }
  const full = await decodeToSource(file)
  const scale = Math.min(1, maxSide / Math.max(full.width, full.height))
  if (scale >= 1) {
    const d: Decoded = { el: full.el, width: full.width, height: full.height, dispose: full.dispose }
    smallCache.set(file, { d, last: ++smallSeq })
    evictSmall()
    return d
  }
  const w = Math.max(1, Math.round(full.width * scale))
  const h = Math.max(1, Math.round(full.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error(t('err.canvas'))
  ctx.drawImage(full.el, 0, 0, w, h)
  full.dispose?.()
  const d: Decoded = { el: canvas, width: w, height: h }
  smallCache.set(file, { d, last: ++smallSeq })
  evictSmall()
  return d
}

function evictSmall(): void {
  while (smallCache.size > SMALL_CACHE_CAP) {
    let oldest: File | null = null
    let oldestSeq = Infinity
    for (const [k, v] of smallCache) {
      if (v.last < oldestSeq) {
        oldestSeq = v.last
        oldest = k
      }
    }
    if (!oldest) break
    const entry = smallCache.get(oldest)
    smallCache.delete(oldest)
    entry?.d.dispose?.()
  }
}
