import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import pkg from './package.json'

/**
 * 部署到 GitHub Pages 的说明：
 *   Pages 的项目站点挂在 `/<repo>/` 子路径下，因此 CI 用 `pnpm build:pages`
 *   （= `vite build --base=./`，相对 base）产出产物 —— 相对路径对子路径、
 *   自定义域名、以及本地任意静态服务器都成立。本文件不写死 base，
 *   因为本地 `dev` / `build` / `preview` 都应继续从 `/` 提供资源。
 */

/**
 * 反代/自定义域名白名单：Vite 会校验 Host 头，未列入的主机返回 403。
 * 需要新增域名时加到这里（以 "." 开头表示同时允许其子域）。
 */
const ALLOWED_HOSTS = ['watermark-studio.dev-u26-001.services.local']

// https://vite.dev/config/
export default defineConfig({
  // 应用版本单一来源：package.json（供「关于」弹窗等界面读取）
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    // 固定五位数端口，dev 与 preview 统一（同一时刻只跑一个）
    port: 50011,
    allowedHosts: ALLOWED_HOSTS,
  },
  preview: {
    host: '0.0.0.0',
    port: 50011,
    allowedHosts: ALLOWED_HOSTS,
  },
})
