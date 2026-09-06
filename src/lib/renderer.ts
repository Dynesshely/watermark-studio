import type { WmSettings } from './types'
import { fontCss } from './fonts'

export interface ImageLike {
  el: CanvasImageSource
  width: number
  height: number
}

export interface TextLayout {
  lines: string[]
  count: number
  fontPx: number
  lineHeightPx: number
  blockW: number
  blockH: number
}

/** 绘制单元数超过该值直接报错（防止把页面卡死） */
const MAX_CELLS = 120_000

export class WatermarkTooDenseError extends Error {
  constructor() {
    super('平铺间距过小，绘制开销过大，请增大间距后重试')
    this.name = 'WatermarkTooDenseError'
  }
}

let scratchCanvas: HTMLCanvasElement | null = null
let scratchCtx: CanvasRenderingContext2D | null = null

function getScratchCtx(): CanvasRenderingContext2D {
  if (!scratchCtx) {
    scratchCanvas = document.createElement('canvas')
    scratchCanvas.width = 8
    scratchCanvas.height = 8
    const c = scratchCanvas.getContext('2d')
    if (!c) throw new Error('Canvas 2D 不可用')
    scratchCtx = c
  }
  return scratchCtx
}

/** percent 模式所有长度都相对图片宽度，px 模式为像素 */
export function unitToPx(ws: WmSettings, v: number, widthPx: number): number {
  return ws.unit === 'percent' ? (widthPx * v) / 100 : v
}

export function resolveFontPx(ws: WmSettings, widthPx: number): number {
  return Math.max(1, unitToPx(ws, ws.fontSize, widthPx))
}

function esc(family: string): string {
  return family.replace(/['"]/g, '')
}

export function layoutText(ws: WmSettings, widthPx: number): TextLayout {
  const ctx = getScratchCtx()
  const lines = ws.content.split('\n')
  const fontPx = resolveFontPx(ws, widthPx)
  ctx.font = fontCss(esc(ws.fontFamily), ws.fontWeight, fontPx)
  let blockW = 0
  for (const line of lines) {
    const w = ctx.measureText(line).width
    if (w > blockW) blockW = w
  }
  const lineHeightPx = fontPx * ws.lineHeightRatio
  const count = lines.filter((l) => l.trim().length > 0).length
  return {
    lines,
    count,
    fontPx,
    lineHeightPx,
    blockW,
    blockH: Math.max(fontPx, (lines.length - 1) * lineHeightPx),
  }
}

/** hex 颜色 + alpha → rgba 字符串 */
export function hexWithAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  const r = parseInt(full.slice(0, 2), 16) || 0
  const g = parseInt(full.slice(2, 4), 16) || 0
  const b = parseInt(full.slice(4, 6), 16) || 0
  return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, alpha))})`
}

/**
 * 以 (cx, cy) 为中心绘制整个文字块（含旋转）。
 * 坐标系为“图像像素空间”，调用方负责 ctx.scale。
 */
export function drawWatermarkBlock(
  ctx: CanvasRenderingContext2D,
  ws: WmSettings,
  layout: TextLayout,
  cx: number,
  cy: number,
): void {
  if (layout.count === 0) return
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate((ws.angleDeg * Math.PI) / 180)
  ctx.font = fontCss(esc(ws.fontFamily), ws.fontWeight, layout.fontPx)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.globalAlpha = ws.opacity

  const strokeWidth = layout.fontPx * ws.strokeRatio
  if (ws.strokeEnabled && strokeWidth > 0) {
    ctx.lineWidth = strokeWidth
    ctx.lineJoin = 'round'
    ctx.strokeStyle = ws.strokeColor
  }

  const startY = ((layout.lines.length - 1) / 2) * layout.lineHeightPx
  const withShadow =
    ws.shadowEnabled &&
    (ws.shadowBlurEm > 0 || ws.shadowOffsetXEm !== 0 || ws.shadowOffsetYEm !== 0)
  if (withShadow) {
    ctx.shadowColor = hexWithAlpha(ws.shadowColor, ws.opacity)
    ctx.shadowBlur = layout.fontPx * ws.shadowBlurEm
    ctx.shadowOffsetX = layout.fontPx * ws.shadowOffsetXEm
    ctx.shadowOffsetY = layout.fontPx * ws.shadowOffsetYEm
  }

  for (let i = 0; i < layout.lines.length; i++) {
    const text = layout.lines[i]
    if (!text.trim()) continue
    const y = startY - i * layout.lineHeightPx
    if (ws.strokeEnabled && strokeWidth > 0) {
      // 描边不叠加阴影（阴影只随填充渲染一次，避免双层变深）
      ctx.save()
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      ctx.strokeText(text, 0, y)
      ctx.restore()
    }
    ctx.fillStyle = ws.color
    ctx.fillText(text, 0, y)
  }
  ctx.restore()
}

/** 旋转后的包围盒在 X/Y 轴上的半跨度 */
function rotatedExtents(layout: TextLayout, angleRad: number): { ex: number; ey: number } {
  const c = Math.abs(Math.cos(angleRad))
  const s = Math.abs(Math.sin(angleRad))
  const hw = layout.blockW / 2
  const hh = layout.blockH / 2
  return { ex: c * hw + s * hh, ey: s * hw + c * hh }
}

/** 单次模式：将中心限制在画布内（块比画布大时回退到画布中心区间） */
export function clampCenter(
  ws: WmSettings,
  width: number,
  height: number,
  cx: number,
  cy: number,
): { cx: number; cy: number } {
  const layout = layoutText(ws, width)
  const { ex, ey } = rotatedExtents(layout, (ws.angleDeg * Math.PI) / 180)
  const clamp1 = (v: number, half: number, dim: number) => {
    if (dim - 2 * half <= 0) return Math.min(Math.max(v, 0), dim)
    return Math.min(Math.max(v, half), dim - half)
  }
  return { cx: clamp1(cx, ex, width), cy: clamp1(cy, ey, height) }
}

function drawTileMode(
  ctx: CanvasRenderingContext2D,
  ws: WmSettings,
  width: number,
  height: number,
): void {
  const layout = layoutText(ws, width)
  if (layout.count === 0) return
  const angleRad = (ws.angleDeg * Math.PI) / 180
  const { ex, ey } = rotatedExtents(layout, angleRad)
  const sx = Math.max(1, unitToPx(ws, ws.spacingX, width))
  const sy = Math.max(1, unitToPx(ws, ws.spacingY, width))
  const ox = unitToPx(ws, ws.tileOffsetX, width)
  const oy = unitToPx(ws, ws.tileOffsetY, width)

  const i0 = Math.floor((-ex - ox) / sx)
  const i1 = Math.ceil((width + ex - ox) / sx)
  const j0 = Math.floor((-ey - oy) / sy)
  const j1 = Math.ceil((height + ey - oy) / sy)
  const cells = (i1 - i0 + 1) * (j1 - j0 + 1)
  if (cells > MAX_CELLS) throw new WatermarkTooDenseError()

  for (let j = j0; j <= j1; j++) {
    const cy = oy + j * sy
    for (let i = i0; i <= i1; i++) {
      const cx = ox + i * sx
      drawWatermarkBlock(ctx, ws, layout, cx, cy)
    }
  }
}

/**
 * 在已绘制好底图的 ctx 上叠加水印（不清理画布）。
 * 坐标均为图像像素空间；若 ctx 带缩放变换（如缩略图）则按比例缩放。
 */
export function drawWatermarkOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  ws: WmSettings,
): void {
  if (ws.mode === 'single') {
    const c = clampCenter(ws, width, height, (width * ws.posXPct) / 100, (height * ws.posYPct) / 100)
    drawWatermarkBlock(ctx, ws, layoutText(ws, width), c.cx, c.cy)
  } else {
    drawTileMode(ctx, ws, width, height)
  }
}

/**
 * 渲染水印结果。source 为已解码图像（单位：像素）。
 * destScale < 1 时输出小尺寸画布（缩略图），绘制坐标仍使用图像像素空间。
 */
export function renderWatermarked(
  source: CanvasImageSource,
  width: number,
  height: number,
  ws: WmSettings,
  destScale = 1,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * destScale))
  canvas.height = Math.max(1, Math.round(height * destScale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D 不可用')
  ctx.setTransform(destScale, 0, 0, destScale, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(source, 0, 0, width, height)
  drawWatermarkOverlay(ctx, width, height, ws)
  return canvas
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, mime, quality)
  })
}

/** 九宫格锚点预设（中心点占图片宽/高的比例），供面板按钮与拖拽吸附共用 */
export const ANCHOR_POINTS = [0.15, 0.5, 0.85]

/** 位置接近某个九宫格预设时返回该预设（吸附），否则返回 null */
export function nearestAnchor(xPct: number, yPct: number, tolPct = 4): { x: number; y: number } | null {
  let best: { d: number; x: number; y: number } | null = null
  for (const ax of ANCHOR_POINTS) {
    for (const ay of ANCHOR_POINTS) {
      const d = Math.hypot(xPct - ax * 100, yPct - ay * 100)
      if (!best || d < best.d) best = { d, x: ax * 100, y: ay * 100 }
    }
  }
  return best && best.d <= tolPct ? { x: best.x, y: best.y } : null
}
