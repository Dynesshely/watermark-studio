# ── 阶段 1：构建静态产物 ─────────────────────────────────────────────
FROM node:24-alpine AS builder

# pnpm 版本与 package.json 的 packageManager 字段保持一致，
# 避免「本地 / CI / 镜像」三处工具链漂移
RUN npm i -g pnpm@11.25.0

WORKDIR /app

# 先只拷依赖清单：源码变动时这一层仍能命中缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# tsc --noEmit + vite build。这里用默认 base（'/'）—— 容器在根路径托管，
# 与 GitHub Pages 的 build:pages（相对 base）是两条不同的产物路径
RUN pnpm build

# ── 阶段 2：运行（Caddy 托管静态文件，无后端） ───────────────────────
FROM caddy:2-alpine

# 只带走产物：构建阶段的源码、node_modules、pnpm store 都不进最终镜像
COPY --from=builder /app/dist /srv/www
COPY Caddyfile /etc/caddy/Caddyfile

# 容器内监听端口 = 本地 dev 端口(50011) + 10000
EXPOSE 60011

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
