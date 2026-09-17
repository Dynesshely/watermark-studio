<p align="center">
  <img src="public/favicon.svg" width="104" height="104" alt="水印工坊图标：靛蓝渐变圆角底板上叠着一张照片卡片（太阳与山峰），斜向平铺的白色水印条纹压过卡片">
</p>

<h1 align="center">水印工坊 · Watermark Studio</h1>

<p align="center">
  <b>在浏览器里给图片加水印，图片不出本机</b><br />
  零后端 · 不联网 · 参数实时预览 · 批量导出与 ZIP 打包
</p>

<p align="center">
  <code>React 18</code>&nbsp; <code>TypeScript</code>&nbsp; <code>Vite</code>&nbsp; <code>Tailwind CSS v4</code>&nbsp;
  <code>Canvas 2D</code>&nbsp; <code>jszip</code>
</p>

<p align="center">
  <sub>许可 <a href="./LICENSE">AGPL-3.0-only</a> · 版权归 Dynesshely 所有</sub>
</p>

---

选好图片，调好文字、颜色、透明度、间距与角度，导出即可。所有计算都在你自己的浏览器里完成，
没有任何接口把图片传出去 —— 想验证的话，打开开发者工具的 Network 面板再导入一张图，
除了静态资源不会出现任何请求。参数存在 `localStorage`，刷新后照旧；界面中英双语，首次访问按浏览器语言自动选择。

## 特性

### 导入与起点

- **三种导入方式**：文件选择（可多选）、把文件拖到页面上、剪贴板粘贴（`Ctrl/⌘ + V`，焦点不在输入框时；列表底部也有「粘贴」按钮手动读取）；
- **从颜色开始**：待命界面的「从颜色开始」或编辑界面列表底部的「新建图片」—— 取色器 + 分辨率输入（含常用尺寸、宽高一键交换），
  还可以生成**完全透明**底图（alpha=0 的 PNG，方便之后叠加到别的图片上）；
- **格式**：JPG / PNG / WebP / BMP / AVIF，**按文件头嗅探**（不信扩展名），并自动应用 EXIF 方向；
  动图、HEIC、SVG 会明确提示不支持，重复导入同一张图会被跳过。

### 水印参数

- **两种模式**：平铺重复（铺满整图，防盗用）与单个水印（九宫格 + 滑杆，或直接在画布上拖拽）；
- **文字**：多行（回车换行）、16 种系统字体、字重、行距、颜色、不透明度；
- **描边与阴影**：可分别开关；描边宽度按字号百分比、阴影模糊/偏移按 `em` 计 —— 换字号时视觉比例不变；
- **字号基准**：`按宽度 %`（多张图之间视觉比例一致）或 `固定像素`，间距与偏移随之联动；
- **角度**：-180°~180° 连续调节，另有常用角度快捷按钮；
- **平铺专属**：横向/纵向间距分开调节、网格整体偏移（把水印避开画面主体）；
- **单个专属**：九宫格按钮或位置滑杆定位，也可以直接在预览图上拖水印（松手靠近锚点自动吸附）。

### 预览

- 全分辨率实时渲染，**所见即所得**：导出结果与预览一致（同一套绘制代码）；
- 缩放与平移：`Ctrl/⌘ + 滚轮` 缩放、按住拖动平移、`+` / `-` 缩放、`0` 或 `F` 适配窗口；
- 原图 / 效果一键切换，用来核对水印有没有压到主体；
- 拖动水印时显示**中心线 + 三分线**对齐辅助线。

### 批量与导出

- 列表：单击选中、单张移除、清空、拖拽排序、卡片上原图/效果缩略图切换；窄屏下自动变成顶部横向条；
- **导出**：逐张下载 / 全部逐张下载 / **ZIP 打包**（带百分比进度、剩余时间估算与「取消导出」）；
- **导出尺寸上限**可选（原尺寸 / 4096 / 2048 / 1280 / 800，按最长边等比缩放）—— 要发公众号或当头像时先缩好再下载，省得事后二次处理；
- JPEG / WebP 质量可调；文件名模板可配（`{name}` 原名 / `{ext}` 扩展名，默认 `{name}_wm.{ext}`）；
- 导出是**重新编码**，原图的 EXIF 等元数据不会保留（界面会提示，这是浏览器安全限制）。

### 水印预设

把当前这套参数命名保存下来，之后一键套用：

- 保存 / 套用 / 重命名（双击名称）/ 用当前参数覆盖 / **复制一份**；
- **导出单个 `.json`**、**全部打包为 `.zip`**（内含逐个 `.json`）、从 `.json` 导入（可多选）；
- 预设达到 5 条时，列表顶部出现搜索框，按**名称或水印文字**过滤；
- 导出文件自描述（`type` / `version` / `app.version` / `watermark`），导入时逐字段做类型与范围钳制，坏文件不会污染当前设置。

### 界面

- **中英双语**，顶栏一键切换；切换时同步 `<html lang>`、页面标题与描述，选择随设置持久化；
- **深浅主题**：跟随系统 / 亮 / 暗；
- 顶栏语言控件**左侧**是 GitHub 图标：新窗口打开本仓库（地址由 `package.json` 的 `repository` 在构建期注入，单一来源）；
- 点顶栏品牌区打开「**关于**」面板：版本号（构建期从 `package.json` 注入）、核心能力、快捷键表、规格与隐私说明；
- 弹窗支持 `Esc` 关闭与**焦点循环**（`Tab` 不会跑到弹窗外面去），待命界面整卡可键盘操作。

## 快速开始

```bash
pnpm install
pnpm dev        # 开发模式 http://0.0.0.0:50011（局域网设备可直接访问）
pnpm build      # tsc --noEmit + vite 构建到 dist/
pnpm preview    # 预览生产构建
```

> 请通过 **http** 访问（dev / preview / 任意静态服务器），不要用 `file://` ——
> 不同浏览器对 `file://` 页面的 `localStorage` 支持不一致。
> 反向代理到自定义域名时，要把域名加进 `vite.config.ts` 顶部的 `ALLOWED_HOSTS`
> （`server` 与 `preview` 共用），否则 Vite 的 Host 校验会返回 403。

## 使用

### 导入与「从颜色开始」

待命界面点整张卡片、右侧「选择图片」，或直接把文件拖到页面上；编辑时用左侧列表**底部固定的操作条**（新建图片 / 打开 / 粘贴）。

「从颜色开始」用来从零造一张底图，常用于先做一张空白水印图再叠加到别的图上：

| 项 | 取值 |
| --- | --- |
| 尺寸 | 16 ~ 8000 px，且不超过 3200 万像素（常用尺寸有一键按钮，宽高可交换） |
| 颜色 | 任意取色；也可选**完全透明**（alpha = 0 的 PNG） |
| 产物 | PNG，生成后直接进入正常编辑流程 |

### 水印参数速查

| 分组 | 参数 |
| --- | --- |
| 布局 | 平铺重复 / 单个水印；字号基准（宽度 % 或固定像素） |
| 文字 | 内容（多行）、字体（16 种）、字重、字号、行距、颜色、不透明度 |
| 效果 | 描边（开关 / 颜色 / 宽度比例）、阴影（开关 / 颜色 / 模糊 / 偏移 X·Y） |
| 角度 | -180° ~ 180°，含常用角度按钮 |
| 平铺 | 横向间距、纵向间距、网格偏移 X·Y |
| 单个 | 位置 X / Y 百分比（九宫格 + 滑杆 + 画布拖拽） |

### 快捷键

| 操作 | 按键 |
| --- | --- |
| 粘贴图片 | `Ctrl/⌘ + V`（焦点不在输入框时） |
| 缩放预览 | `Ctrl/⌘ + 滚轮`；`+` / `-` 逐档缩放 |
| 适配窗口 | `0` 或 `F` |
| 关闭弹窗 | `Esc` |
| 弹窗内切换焦点 | `Tab` / `Shift + Tab`（焦点被限制在弹窗内） |

### 导出

| 导入格式 | 导出格式 | 说明 |
| --- | --- | --- |
| JPG | JPG | 质量可调（默认 0.92） |
| PNG | PNG | 无损，像素尺寸与原图一致 |
| WebP | WebP | 质量可调；浏览器不支持编码时回退 PNG |
| BMP | PNG | 浏览器没有可靠的 BMP 编码器，统一按 PNG 导出 |
| AVIF | PNG | 同上（AVIF 只支持导入） |

- 选了「导出尺寸上限」时，按最长边等比缩小，不会放大；
- ZIP 打包**以主操作呈现**：进度条带百分比与剩余时间，随时可「取消导出」——
  压缩阶段取消同样生效（不会留下半包文件，也不会触发下载）；
- 文件名模板用 `{name}`（原名，不含扩展名）与 `{ext}` 组合，重名会自动去重追加序号。

## 数据与存储

数据全部在浏览器本地，`localStorage` 里只有两个键：

| 键 | 内容 |
| --- | --- |
| `wmstudio.settings.v1` | 主题、界面语言、水印参数、JPEG/WebP 质量、导出尺寸上限、文件名模板 |
| `wmstudio.presets.v1` | 水印预设（名称 + 完整参数 + 创建/更新时间） |

- **图片从不落盘也不上传**：导入后只在内存里解码、绘制、导出，刷新页面即清空；
- 读取时统一走 `normalizeWm()` 钳制，localStorage 被改坏或存入越界值时也能正常启动；
- **数据按浏览器源（origin）隔离**：换端口、换域名打开都看不到原来的设置与预设 ——
  需要迁移时用预设的「导出全部 ZIP」，在新地址「导入 JSON」。

## 开发

### 目录结构

```
src/
├── App.tsx                  # 应用装配：导入/解码/导出编排、三栏布局与拖拽
├── components/
│   ├── ui.tsx               # 图标、按钮、滑块、取色、开关等控件 + Toast
│   ├── TopBar.tsx           # 顶栏（品牌区/主题/语言/关于入口）
│   ├── Hero.tsx             # 待命界面（整卡可点、可键盘操作）
│   ├── ImageList.tsx        # 批量列表（排序/移除/缩略图）与底部固定操作条
│   ├── PreviewPane.tsx      # 全分辨率画布（缩放平移、水印拖拽、对齐辅助线）
│   ├── SettingsPanel.tsx    # 水印参数面板
│   ├── PresetPanel.tsx      # 水印预设（保存/套用/复制/搜索/导入导出）
│   ├── ExportPanel.tsx      # 导出面板（质量/尺寸上限/模板/进度/取消）
│   ├── NewFromColorDialog.tsx / AboutDialog.tsx / Modal.tsx / Logo.tsx
├── store/                   # settings.tsx / presets.tsx / i18n.tsx（状态 + 持久化）
├── i18n/                    # zh.ts（基准字典）/ en.ts / index.ts
└── lib/
    ├── types.ts             # 参数模型、默认值与可选值
    ├── renderer.ts          # 水印绘制引擎（平铺网格/单次定位/旋转/描边阴影）
    ├── imaging.ts           # 解码（EXIF 方向）、格式嗅探、缩略图缓存、纯色底图
    ├── exporter.ts          # 批量处理流水线、缩放与 ZIP 打包
    ├── wmSerialize.ts       # 预设/参数的规范化与（反）序列化
    ├── presets.ts           # 预设打包
    ├── filename.ts          # 命名模板与去重
    └── fonts.ts / storage.ts
```

### 端到端冒烟测试

测试脚本用真实 Chromium 跑，不依赖测试框架（只用到 `playwright` + Node 内置模块）：

```bash
node e2e/smoke.mjs        # 82 项检查：核心链路（需 dev 或 preview 已在跑）
node e2e/logo-shot.mjs    # 品牌区 / LOGO / 关于弹窗截图
node e2e/i18n-shot.mjs    # 英文界面截图（英文文案更长，重点看溢出与截断）
```

冒烟覆盖导入与嗅探、待命界面与「从颜色开始」、水印平铺渲染、单个水印与对齐辅助线、
列表底部操作条、导出（逐张 / ZIP / 尺寸缩放 / 取消）、预设的保存套用复制搜索导入导出、
i18n 与主题、弹窗焦点陷阱等。断言尽量落在**几何与像素**上（例如导出 PNG 的 HDR 宽高、
列表底部操作条相对列表面板的 y 坐标），截图只作为产物留在 `e2e/artifacts/`（不入库）。

### 约定

- **提交信息**：`<type>(<scope>): <subject>`，空行后列正文要点，并附验证方式与结果。
- **i18n**：`src/i18n/zh.ts` 是基准字典，`en.ts` 的类型由它约束 —— 漏译或多余键会在 `tsc` 阶段报错，
  新增文案必须两处同时加。
- **参数钳制**：来自 localStorage 与导入 JSON 的值一律先过 `normalizeWm()`，越界字段回落到默认值。
- **Tailwind 扫描范围**：`src/index.css` 用 `@import "tailwindcss" source(none)` + `@source`
  显式指定 `index.html` 与 `src/`。默认的「扫全仓库」会把 e2e 脚本里的 Playwright 选择器
  （`[data-testid="x"]:visible`）乃至 README 里引用它的那句话当成候选类名，
  产出非法 CSS、触发构建告警，还会让同一份源码随文档改动构建出不同的产物。

## 部署（GitHub Pages）

仓库自带两条工作流，都在 `.github/workflows/`：

| 工作流 | 触发 | 做什么 |
| --- | --- | --- |
| `ci.yml` | push 到 `main`、任何 PR、手动 | `pnpm build` 与 `pnpm build:pages` 各构建一遍，再用**真实 Chromium** 跑 `e2e/smoke.mjs`；失败时上传 `e2e/artifacts` 里的截图 |
| `pages.yml` | push 到 `main`、手动 | `pnpm build:pages` → 上传 Pages 产物 → 发布到 `https://<user>.github.io/<repo>/` |

首次部署时，如果仓库还没启用 Pages，工作流里的 `actions/configure-pages@v5`
会通过 `enablement: true` 自动启用；也可以提前在 **Settings → Pages → Build and
deployment → Source** 里手动选「GitHub Actions」。
（选「Deploy from a branch」就需要自己维护 `gh-pages` 分支，官方 artifact 流程不用。）
CI 里的 pnpm 版本取自 `package.json` 的 `packageManager` 字段，不在工作流里重复写死。

**为什么用相对 base**：Pages 的项目站点挂在 `/<repo>/` 子路径下，而 `--base=./` 产出的资源引用是相对的
（`./assets/index-xxx.js`）—— 子路径、绑定的自定义域名、以及本地任意静态服务器都成立。
因此本文件不写死 `base`：本地 `dev` / `build` / `preview` 继续从 `/` 提供资源，只有 Pages 构建走
`pnpm build:pages`。

本地验证 Pages 产物：

```bash
pnpm build:pages
grep -n 'assets/' dist/index.html      # 应看到 ./assets/... 而不是 /assets/...
pnpm exec vite preview                 # 相对路径在根路径下同样能跑
```

冒烟脚本接受任意 baseURL，所以部署之后也可以拿它复验线上站点（脚本只在本地读写，不会改动线上数据）：

```bash
node e2e/smoke.mjs https://<user>.github.io/<repo>/
```

## 已知边界

- 导出为重新编码，**EXIF 等元数据不会保留**（浏览器安全限制，界面会提示）；
- 动图（GIF）、HEIC / HEIF、SVG 不支持，导入时会提示；
- BMP / AVIF 只能导入，导出统一回退为 PNG；
- 超大图（单边 > 6000px 或超过 4000 万像素）全分辨率处理占内存较高，导入后会有提示；
- 界面语言目前只有简体中文与 English 两套。

## 许可

本项目以 **[GNU Affero General Public License v3.0](./LICENSE)（AGPL-3.0，SPDX：`AGPL-3.0-only`）** 授权，
版权归 Dynesshely 所有。`LICENSE` 是 GNU/SPDX 发布的**协议原文，未作任何改动**。

用大白话说清它对你意味着什么：

- **自己用、改、部署** —— 随便，包括商用；改完也不必公开；
- **把改过的版本部署成给别人用的网络服务** —— 这时候 AGPL 的 §13 生效：必须让使用者能拿到
  你那份修改版的完整对应源码（典型做法是在界面上放一个指向源码仓库的链接）；
- **只是原样 fork 部署**（没改）—— 同样建议保留源码链接，成本极低；
- **想闭源集成** —— 不行，需要另行取得商业授权（版权人保留这个选项）。

依赖侧没有障碍：进产物的 React / React-DOM（MIT）与 JSZip（`MIT OR GPL-3.0-or-later`）都是宽松许可，
与 AGPL 兼容；构建期的 Vite / Tailwind（MIT）、TypeScript / Playwright（Apache-2.0）不参与分发。
产物里也保留了它们的版权声明（`dist` 中可见 `@license React …` 与 JSZip 的双许可横幅），无需额外的第三方声明文件。

## 第三方组件

| 组件 | 用途 | 许可 |
| --- | --- | --- |
| [React 18](https://react.dev) | 视图层 | MIT |
| [Vite](https://vite.dev) + [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | 构建与开发服务器 | MIT |
| [Tailwind CSS v4](https://tailwindcss.com) | 样式（无组件库，控件手写） | MIT |
| [jszip](https://github.com/Stuk/jszip) | ZIP 打包（批量导出与预设导出共用） | MIT 或 GPLv3（双许可） |
| [Playwright](https://playwright.dev) | 端到端冒烟测试（开发依赖） | Apache-2.0 |
| [Simple Icons](https://simpleicons.org) | 顶栏 GitHub 图标的官方路径数据 | CC0-1.0 |

