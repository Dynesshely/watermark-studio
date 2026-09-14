/**
 * 品牌区 / LOGO / 关于弹窗 视觉检查截图
 * 用法：node e2e/logo-shot.mjs [baseURL]
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.argv[2] ?? 'http://127.0.0.1:50011'
const ART = join(dirname(fileURLToPath(import.meta.url)), 'artifacts')
mkdirSync(ART, { recursive: true })

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })

  // 1) favicon 多尺寸渲染（用 setContent 精确控制尺寸）
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.setContent(`
    <body style="margin:0;padding:24px;background:linear-gradient(90deg,#f8fafc 50%,#0f172a 50%);display:flex;gap:24px;align-items:center">
      <div style="background:#fff;border:1px solid #ddd;border-radius:12px;padding:12px"><img src="/favicon.svg" width="128" height="128"></div>
      <div style="background:#fff;border:1px solid #ddd;border-radius:12px;padding:12px"><img src="/favicon.svg" width="64" height="64"></div>
      <div style="background:#fff;border:1px solid #ddd;border-radius:12px;padding:12px"><img src="/favicon.svg" width="32" height="32"></div>
      <div style="background:#fff;border:1px solid #ddd;border-radius:12px;padding:12px"><img src="/favicon.svg" width="16" height="16"></div>
      <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:12px"><img src="/favicon.svg" width="64" height="64"></div>
    </body>`)
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(ART, 'logo-sizes.png') })

  const brand = page.getByRole('button', { name: /关于/ })

  // 2) 品牌区 hover 态（浅色）
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  await brand.hover()
  await page.waitForTimeout(250)
  await page.screenshot({ path: join(ART, 'brand-hover-light.png'), clip: { x: 0, y: 0, width: 640, height: 52 } })

  // 3) 关于弹窗（浅色）
  await brand.click()
  await page.waitForSelector('[role="dialog"]')
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(ART, 'about-light.png') })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // 4) 关于弹窗（深色）+ 品牌区 hover 态
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  await page.waitForTimeout(200)
  await brand.hover()
  await page.waitForTimeout(200)
  await page.screenshot({ path: join(ART, 'brand-hover-dark.png'), clip: { x: 0, y: 0, width: 640, height: 52 } })
  await brand.click()
  await page.waitForSelector('[role="dialog"]')
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(ART, 'about-dark.png') })
  await page.keyboard.press('Escape')

  console.log('done')
} finally {
  await browser.close()
}
