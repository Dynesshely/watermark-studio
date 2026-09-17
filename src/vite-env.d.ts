/// <reference types="vite/client" />

/** 由 vite.config.ts 注入的应用版本（单一来源：package.json） */
declare const __APP_VERSION__: string

/** 由 vite.config.ts 注入的源码仓库地址（单一来源：package.json 的 repository） */
declare const __REPO_URL__: string
