/**
 * 英文界面视觉检查：顶栏、空状态、参数面板（英文文案更长，重点看是否溢出/截断）。
 * 用法：node e2e/i18n-shot.mjs [baseURL]
 * 说明：脚本自带极简 PNG 生成（与 smoke.mjs 同思路但保持独立，便于单独运行）。
 */
import { chromium } from 'playwright'
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.argv[2] ?? 'http://127.0.0.1:50011'
const ART = join(dirname(fileURLToPath(import.meta.url)), 'artifacts')
mkdirSync(ART, { recursive: true })

/* 极简 PNG 编码器 */
const CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
const crc32 = (b) => {
  let c = 0xffffffff
  for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
function makePng(w, h, path) {
  const raw = Buffer.alloc(h * (w * 3 + 1))
  for (let y = 0; y < h; y++) {
    const row = y * (w * 3 + 1)
    raw[row] = 0
    for (let x = 0; x < w; x++) {
      const o = row + 1 + x * 3
      raw[o] = 30 + (x / w) * 180
      raw[o + 1] = 60 + (y / h) * 120
      raw[o + 2] = 190 - (x / w) * 120
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 6 })),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  )
  return path
}

const fixture = makePng(880, 560, join(ART, 'fixture-en.png'))

const browser = await chromium.launch()
try {
  // locale: en-US → 应用首次访问自动检测为英文
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    colorScheme: 'light',
  })
  const page = await ctx.newPage()

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  const lang = await page.evaluate(() => document.documentElement.lang)
  console.log('html lang =', lang, '| title =', await page.title())
  await page.screenshot({ path: join(ART, 'i18n-en-hero.png') })

  // 上传图片 → 参数面板出现（英文长文案最容易溢出的地方）
  await page.setInputFiles('input[type="file"]', fixture)
  await page.waitForTimeout(1200)
  await page.screenshot({ path: join(ART, 'i18n-en-workspace.png') })

  // 「关于」弹窗（英文）
  await page.locator('[data-testid="brand-button"]').click()
  await page.waitForSelector('[role="dialog"]')
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(ART, 'i18n-en-about.png') })
  await page.keyboard.press('Escape')

  // 深色主题下的英文界面
  await page.getByTitle('Dark theme').click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(ART, 'i18n-en-dark.png') })

  console.log('done')
} finally {
  await browser.close()
}
