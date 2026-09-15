/**
 * 冒烟测试：真实 Chromium 中验证 水印工坊 核心链路
 * 运行前提：dev 服务器已启动（默认 http://127.0.0.1:50011）
 * 用法：node e2e/smoke.mjs [baseURL]
 */
import { chromium } from 'playwright'
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const JSZip = require('jszip')

const BASE = process.argv[2] ?? 'http://127.0.0.1:50011'
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ART = join(ROOT, 'e2e', 'artifacts')
mkdirSync(ART, { recursive: true })

/* ---------- 极简 PNG 编码器（node 内置 zlib，免第三方） ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
function makePng(w, h, pixelFn, path) {
  const raw = Buffer.alloc(h * (w * 3 + 1))
  for (let y = 0; y < h; y++) {
    const rowStart = y * (w * 3 + 1)
    raw[rowStart] = 0
    for (let x = 0; x < w; x++) {
      const [r, g, b] = pixelFn(x, y)
      const o = rowStart + 1 + x * 3
      raw[o] = r
      raw[o + 1] = g
      raw[o + 2] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type RGB
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
  writeFileSync(path, png)
  return path
}

const f1 = join(ART, 'fixture-a.png')
const f2 = join(ART, 'fixture-b.png')
makePng(900, 600, (x, y) => [40 + (x / 900) * 200, 60 + (y / 600) * 180, 200 - (x / 900) * 120], f1)
makePng(640, 480, (x, y) => [220 - (x / 640) * 120, 30 + (y / 480) * 90, 70 + (x / 640) * 120], f2)

/* ---------- 工具 ---------- */
let failures = 0
function check(name, cond, extra = '') {
  if (cond) console.log(`  ✔ ${name}`)
  else {
    failures++
    console.error(`  ✘ ${name} ${extra}`)
  }
}

/* ---------- 测试 ---------- */
const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  acceptDownloads: true,
  colorScheme: 'light',
})
const page = await ctx.newPage()
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(String(e)))
page.on('console', (m) => {
  if (m.type() === 'error') pageErrors.push(m.text())
})

try {
  console.log('· 打开页面')
  await page.goto(BASE, { waitUntil: 'networkidle' })
  check('标题与空状态可见', await page.getByText('水印工坊', { exact: true }).isVisible())
  check('空状态引导可见', await page.getByText(/把图片拖到这里/).isVisible())

  console.log('· 主题切换（深色）')
  await page.getByTitle('深色主题').click()
  check('html.dark 生效', await page.evaluate(() => document.documentElement.classList.contains('dark')))
  await page.getByTitle('浅色主题').click()

  console.log('· 品牌区交互与「关于」弹窗')
  const brand = page.getByRole('button', { name: /关于/ })
  const brandBox = await brand.boundingBox()
  check('品牌区是可点击控件', !!brandBox && brandBox.width > 100, JSON.stringify(brandBox))
  const bgIdle = await brand.evaluate((el) => getComputedStyle(el).backgroundColor)
  await brand.hover()
  await page.waitForTimeout(200)
  const bgHover = await brand.evaluate((el) => getComputedStyle(el).backgroundColor)
  check('hover 时显现交互区域（背景变化）', bgIdle !== bgHover, `${bgIdle} → ${bgHover}`)

  await brand.click()
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
  const dlgBox = await page.locator('[role="dialog"]').boundingBox()
  check(
    '弹窗完整位于视口内（未被顶栏 backdrop-filter 裁切）',
    !!dlgBox && dlgBox.y > 10 && dlgBox.y + dlgBox.height < 900,
    JSON.stringify(dlgBox),
  )
  const backdropBox = await page.locator('[role="dialog"]').evaluate((el) => {
    const bd = el.parentElement
    const r = bd.getBoundingClientRect()
    return {
      w: Math.round(r.width),
      h: Math.round(r.height),
      parent: bd.parentElement ? bd.parentElement.tagName : '',
    }
  })
  check(
    '遮罩覆盖整个视口并挂在 body 上',
    backdropBox.w === 1440 && backdropBox.h === 900 && backdropBox.parent === 'BODY',
    JSON.stringify(backdropBox),
  )
  check('弹窗显示版本号', (await page.getByText(/^v\d+\.\d+\.\d+$/).count()) > 0)
  await page.screenshot({ path: join(ART, '05-about.png') })

  await page.keyboard.press('Escape')
  await page.waitForTimeout(250)
  check('Esc 可关闭弹窗', (await page.locator('[role="dialog"]').count()) === 0)

  await brand.click()
  await page.waitForSelector('[role="dialog"]')
  await page.mouse.click(40, 780)
  await page.waitForTimeout(250)
  check('点击遮罩可关闭弹窗', (await page.locator('[role="dialog"]').count()) === 0)

  console.log('· 上传两张图片')
  await page.setInputFiles('input[type="file"]', [f1, f2])
  await page.getByText(/已添加 2 张图片/).waitFor({ timeout: 8000 })
  const cardCount = await page.locator('[data-testid="image-list"] li:visible').count()
  check('列表出现 2 张卡片', cardCount === 2, `actual=${cardCount}`)
  await page.waitForFunction(
    () => {
      // 精确等待全分辨率绘制完成：canvas 元素在 rAF 首帧前是默认 300×150
      const c = document.querySelector('canvas')
      return !!c && c.width === 900 && c.height === 600
    },
    undefined,
    { timeout: 10000 },
  )
  const dims = await page.evaluate(() => {
    const c = document.querySelector('canvas')
    return [c.width, c.height]
  })
  check('主预览全分辨率解码 (900×600)', dims[0] === 900 && dims[1] === 600, `actual=${dims}`)

  console.log('· 水印预设：保存 / 套用 / 导出 JSON / 导出 ZIP / 导入 / 删除')
  const presetRows = page.locator('[data-testid="preset-list"] li')

  // 设定一组可识别的参数并保存为预设
  await page.locator('textarea').fill('预设甲')
  await page.getByRole('button', { name: '45°', exact: true }).click()
  await page.waitForTimeout(200)
  await page.getByTitle('把当前水印参数保存为预设').click()
  await page.locator('input[placeholder="预设名称"]').fill('测试预设A')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  check('预设已保存并出现在列表', (await presetRows.count()) === 1)

  // 改参后套用预设，验证参数被还原
  await page.locator('textarea').fill('被改掉的文字')
  await page.getByRole('button', { name: '0°', exact: true }).click()
  await page.waitForTimeout(200)
  check('改参后文本确实变化', (await page.locator('textarea').inputValue()) === '被改掉的文字')
  await presetRows.first().getByRole('button', { name: '套用' }).click()
  await page.waitForTimeout(250)
  check('套用预设还原文字', (await page.locator('textarea').inputValue()) === '预设甲')
  const angleRestored = await page
    .getByRole('button', { name: '45°', exact: true })
    .evaluate((el) => el.className.includes('bg-indigo-600'))
  check('套用预设还原角度', angleRestored)

  // 导出单个 JSON
  const jsonDl = page.waitForEvent('download', { timeout: 15000 })
  await presetRows.first().getByTitle('导出为 JSON').click()
  const presetDownload = await jsonDl
  check(
    'JSON 文件名取自预设名',
    presetDownload.suggestedFilename() === '测试预设A.json',
    presetDownload.suggestedFilename(),
  )
  const presetJson = JSON.parse(readFileSync(await presetDownload.path(), 'utf8'))
  check(
    'JSON 自描述且内容与预设一致',
    presetJson.type === 'watermark-studio.preset' &&
      presetJson.version === 1 &&
      presetJson.name === '测试预设A' &&
      presetJson.watermark.content === '预设甲' &&
      presetJson.watermark.angleDeg === 45 &&
      typeof presetJson.app?.version === 'string',
    JSON.stringify(presetJson).slice(0, 120),
  )

  // 再存一个「单次」预设，让 ZIP 内含多条
  await page.getByRole('tab', { name: '单个水印' }).click()
  await page.locator('textarea').fill('单次签名')
  await page.getByTitle('把当前水印参数保存为预设').click()
  await page.locator('input[placeholder="预设名称"]').fill('测试预设B')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  check('两个预设并存', (await presetRows.count()) === 2)

  // 导出全部为 ZIP
  const zipDl = page.waitForEvent('download', { timeout: 20000 })
  await page.getByRole('button', { name: /导出全部 ZIP/ }).click()
  const presetZipDl = await zipDl
  const presetZip = await JSZip.loadAsync(readFileSync(await presetZipDl.path()))
  const presetEntries = Object.keys(presetZip.files).filter((n) => !presetZip.files[n].dir)
  check(
    'ZIP 内含两个 .json 文件',
    presetEntries.length === 2 && presetEntries.every((n) => n.endsWith('.json')),
    presetEntries.join(','),
  )
  const zipInnerRaw = await presetZip.file(presetEntries.find((n) => n.includes('测试预设A'))).async('string')
  check('ZIP 内 JSON 内容正确', JSON.parse(zipInnerRaw).watermark?.content === '预设甲')

  // 导入外部 JSON 并套用
  const importPath = join(ART, 'imported-preset.json')
  writeFileSync(
    importPath,
    JSON.stringify(
      {
        type: 'watermark-studio.preset',
        version: 1,
        name: '导入预设C',
        watermark: { ...presetJson.watermark, mode: 'tile', content: '来自导入', angleDeg: -15 },
      },
      null,
      2,
    ),
  )
  await page.setInputFiles('input[accept=".json,application/json"]', importPath)
  await page.waitForTimeout(500)
  const importedRow = presetRows.filter({ hasText: '导入预设C' })
  check('导入的预设出现在列表', (await importedRow.count()) === 1)
  await importedRow.getByRole('button', { name: '套用' }).click()
  await page.waitForTimeout(250)
  check('套用导入的预设生效', (await page.locator('textarea').inputValue()) === '来自导入')
  await importedRow.getByTitle('删除').click()
  await page.waitForTimeout(250)
  check('删除后从列表移除', (await presetRows.filter({ hasText: '导入预设C' }).count()) === 0)
  await page.screenshot({ path: join(ART, '06-presets.png') })

  console.log('· 平铺水印渲染（默认参数）')
  const hash = () =>
    page.evaluate(() => {
      const c = document.querySelector('canvas')
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
      let s = 0
      for (let i = 0; i < d.length; i += 97) s += d[i]
      return s
    })
  const wmHash = await hash()
  await page.getByTitle('查看原始图片').click()
  await page.waitForTimeout(150)
  const rawHash = await hash()
  check('效果/原图 渲染确有差异（水印已绘制）', Math.abs(wmHash - rawHash) > 2000, `d=${Math.abs(wmHash - rawHash)}`)
  await page.getByTitle('带水印效果预览（所见即所得）').click()
  await page.waitForTimeout(250)
  await page.screenshot({ path: join(ART, '01-tile-default.png') })

  console.log('· 修改水印文字与角度')
  await page.locator('textarea').fill('测试水印 © 2025')
  await page.getByRole('button', { name: '45°', exact: true }).click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: join(ART, '02-tile-custom.png') })

  console.log('· 切换单个水印 + 拖拽定位')
  await page.getByRole('tab', { name: '单个水印' }).click()
  await page.waitForTimeout(200)
  await page.getByRole('tab', { name: '拖动水印' }).click()
  const box = await page.locator('canvas').boundingBox()
  check('画布有可见区域', !!box && box.width > 200, JSON.stringify(box))
  await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.55)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.38, box.y + box.height * 0.32, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(250)
  await page.screenshot({ path: join(ART, '03-single-dragged.png') })

  console.log('· 平铺模式间距与不透明度调整（回归 UI 控件）')
  await page.getByRole('tab', { name: '平铺重复' }).click()
  await page.waitForTimeout(150)
  await page.screenshot({ path: join(ART, '04-back-tile.png') })

  console.log('· 逐张导出全部（PNG 同格式）')
  // 说明：Chromium 对同一手势内的多次程序化下载会拦截第 2 个（真实浏览器会询问“允许下载多个文件”）
  const dl1 = page.waitForEvent('download', { timeout: 20000 })
  await page.getByRole('button', { name: /逐张导出全部/ }).click()
  const d1 = await dl1
  check(`下载文件名符合模板: ${d1.suggestedFilename()}`, /_wm\.png$/.test(d1.suggestedFilename()))
  const head1 = readFileSync(await d1.path()).subarray(0, 8)
  check('下载 1 为 PNG 格式', head1.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))

  console.log('· ZIP 打包导出')
  const dz = page.waitForEvent('download', { timeout: 40000 })
  await page.getByRole('button', { name: /ZIP 打包全部/ }).click()
  const zipPath = await (await dz).path()
  const zip = await JSZip.loadAsync(readFileSync(zipPath))
  const entryNames = Object.keys(zip.files).filter((n) => !zip.files[n].dir)
  check('ZIP 含 2 个文件', entryNames.length === 2, entryNames.join(','))
  check('ZIP 内文件名正确', entryNames.includes('fixture-a_wm.png') && entryNames.includes('fixture-b_wm.png'), entryNames.join(','))

  console.log('· 批量列表管理：移除一张')
  const li = page.locator('[data-testid="image-list"] li:visible').first()
  await li.hover()
  await li.getByTitle('移除').click()
  await page.waitForTimeout(150)
  const left = await page.locator('[data-testid="image-list"] li:visible').count()
  check('移除后剩 1 张', left === 1, `actual=${left}`)

  check('无页面运行时错误', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '))
} finally {
  await browser.close()
}

console.log(failures === 0 ? '\n✅ 冒烟测试全部通过' : `\n❌ ${failures} 项失败`)
process.exit(failures === 0 ? 0 : 1)
