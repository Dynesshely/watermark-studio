/**
 * 源码仓库地址（顶栏的 GitHub 入口用它）。
 *
 * 单一来源是 `package.json` 的 `repository` 字段（与 `git remote` 一致），
 * 由 `vite.config.ts` 的 define 在构建期注入 —— 与 `__APP_VERSION__` 同一套路。
 * 非构建环境（例如直接拿源码跑脚本）时回落到硬编码地址，避免抛异常。
 */
export function repoUrl(): string {
  try {
    return typeof __REPO_URL__ === 'string' && __REPO_URL__ !== ''
      ? __REPO_URL__
      : 'https://github.com/Dynesshely/watermark-studio'
  } catch {
    return 'https://github.com/Dynesshely/watermark-studio'
  }
}

export const REPO_URL = repoUrl()
