import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import pkg from './package.json'

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
