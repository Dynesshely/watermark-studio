import type { UnitMode, WmMode } from '../lib/types'
import { ANCHOR_POINTS } from '../lib/renderer'
import { FONT_OPTIONS } from '../lib/fonts'
import { useSettings } from '../store/settings'
import { Button, ColorField, Group, Segmented, SelectField, Slider, Switch, toast } from './ui'
import { PresetPanel } from './PresetPanel'

export function SettingsPanel() {
  const { s, setWm, resetWm } = useSettings()
  const wm = s.wm
  const unitPct = wm.unit === 'percent'

  // 字号/间距等控件量程随单位切换
  const fontRange = unitPct ? { min: 0.5, max: 25, step: 0.1 } : { min: 8, max: 600, step: 2 }
  const spaceRange = unitPct ? { min: 2, max: 300, step: 0.5 } : { min: 24, max: 3000, step: 8 }
  const offsetRange = unitPct
    ? { min: -100, max: 100, step: 0.5 }
    : { min: -1500, max: 1500, step: 10 }

  const switchUnit = (u: UnitMode) => {
    // 切换单位时给一个该单位下的合理默认字号，避免数值语义错乱
    if (u === 'percent') setWm({ unit: u, fontSize: 4, spacingX: 18, spacingY: 18, tileOffsetX: 0, tileOffsetY: 0 })
    else setWm({ unit: u, fontSize: 48, spacingX: 200, spacingY: 200, tileOffsetX: 0, tileOffsetY: 0 })
  }

  const setMode = (m: WmMode) => {
    setWm({ mode: m })
    if (m === 'single' && wm.unit === 'percent' && wm.fontSize < 2) {
      setWm({ fontSize: 4 })
    }
  }

  const anchorTitle = ['左上', '上方居中', '右上', '左侧居中', '正中央', '右侧居中', '左下', '下方居中', '右下']
  const anchorCell = (xPct: number) => (xPct < 33.4 ? 0 : xPct < 66.7 ? 1 : 2)

  return (
    <div className="flex flex-col pb-6">
      {/* 水印预设：保存 / 套用 / 导出 JSON / ZIP */}
      <PresetPanel />

      {/* 布局模式 */}
      <Group
        title="布局模式"
        extra={
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {wm.mode === 'tile' ? '平铺覆盖全图' : '单个水印'}
          </span>
        }
      >
        <Segmented<WmMode>
          value={wm.mode}
          onChange={setMode}
          options={[
            { value: 'tile', label: '平铺重复', title: '水印按网格铺满整张图片（防盗用）' },
            { value: 'single', label: '单个水印', title: '只在指定位置放一个水印' },
          ]}
        />

        {wm.mode === 'tile' ? (
          <>
            <Slider
              label="横向间距"
              value={wm.spacingX}
              min={spaceRange.min}
              max={spaceRange.max}
              step={spaceRange.step}
              onChange={(v) => setWm({ spacingX: v })}
              display={`${wm.spacingX}${unitPct ? '%' : 'px'}`}
              title="相邻两列水印中心的间距（相对图片宽度）"
            />
            <Slider
              label="纵向间距"
              value={wm.spacingY}
              min={spaceRange.min}
              max={spaceRange.max}
              step={spaceRange.step}
              onChange={(v) => setWm({ spacingY: v })}
              display={`${wm.spacingY}${unitPct ? '%' : 'px'}`}
              title="相邻两行水印中心的间距（相对图片宽度）"
            />
            <div className="mt-0.5 rounded-lg bg-slate-100/80 px-2 py-1.5 text-[11px] leading-relaxed text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
              水印按网格铺满全图。若想避开画面主体，可整体平移网格：
            </div>
            <Slider
              label="网格水平偏移"
              value={wm.tileOffsetX}
              min={offsetRange.min}
              max={offsetRange.max}
              step={offsetRange.step}
              onChange={(v) => setWm({ tileOffsetX: v })}
              display={`${wm.tileOffsetX}${unitPct ? '%' : 'px'}`}
            />
            <Slider
              label="网格垂直偏移"
              value={wm.tileOffsetY}
              min={offsetRange.min}
              max={offsetRange.max}
              step={offsetRange.step}
              onChange={(v) => setWm({ tileOffsetY: v })}
              display={`${wm.tileOffsetY}${unitPct ? '%' : 'px'}`}
            />
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">位置</span>
              <span className="flex gap-1">
                {[0, 1, 2].map((row) =>
                  [0, 1, 2].map((col) => {
                    const idx = row * 3 + col
                    const x = ANCHOR_POINTS[col] * 100
                    const y = ANCHOR_POINTS[row] * 100
                    const active =
                      anchorCell(wm.posXPct) === col && anchorCell(wm.posYPct) === row
                    return (
                      <button
                        key={idx}
                        type="button"
                        title={`${anchorTitle[idx]}（也可在预览中直接拖动水印）`}
                        aria-label={anchorTitle[idx]}
                        onClick={() => setWm({ posXPct: x, posYPct: y })}
                        className={`flex h-6.5 w-6.5 items-center justify-center rounded-md border transition-colors ${
                          active
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20'
                            : 'border-slate-300 hover:border-indigo-400 dark:border-slate-600'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            active ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        />
                      </button>
                    )
                  }),
                )}
              </span>
            </div>
            <Slider
              label="水平位置"
              value={wm.posXPct}
              min={0}
              max={100}
              step={0.1}
              onChange={(v) => setWm({ posXPct: v })}
              display={`${wm.posXPct.toFixed(1)}%`}
            />
            <Slider
              label="垂直位置"
              value={wm.posYPct}
              min={0}
              max={100}
              step={0.1}
              onChange={(v) => setWm({ posYPct: v })}
              display={`${wm.posYPct.toFixed(1)}%`}
            />
            <p className="rounded-lg bg-indigo-50/70 px-2 py-1.5 text-[11px] leading-relaxed text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300">
              提示：切换到「拖动水印」工具，可在预览图上直接拖拽水印到任意位置，松手靠近九宫格时会自动吸附。
            </p>
          </>
        )}
      </Group>

      {/* 文字内容 */}
      <Group
        title="文字内容"
        extra={
          <Segmented<UnitMode>
            value={wm.unit}
            onChange={switchUnit}
            options={[
              { value: 'percent', label: '按宽度 %', title: '字号与间距相对图片宽度，批量图片上视觉比例一致' },
              { value: 'px', label: '固定像素', title: '所有图片使用相同的绝对像素尺寸' },
            ]}
          />
        }
      >
        <textarea
          value={wm.content}
          onChange={(e) => setWm({ content: e.target.value })}
          rows={3}
          spellCheck={false}
          placeholder="输入水印文字，支持多行（回车换行）"
          className="w-full resize-y rounded-lg border border-slate-300 bg-slate-50/70 px-2.5 py-1.5 text-xs leading-relaxed text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200 dark:focus:bg-slate-800"
        />
        <SelectField
          label="字体"
          value={wm.fontFamily}
          options={FONT_OPTIONS}
          onChange={(v) => setWm({ fontFamily: v })}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">字重</span>
          <Segmented<'400' | '700'>
            value={String(wm.fontWeight) as '400' | '700'}
            onChange={(v) => setWm({ fontWeight: Number(v) as 400 | 700 })}
            options={[
              { value: '400', label: '常规' },
              { value: '700', label: '加粗' },
            ]}
          />
        </div>
        <Slider
          label="字号"
          value={wm.fontSize}
          min={fontRange.min}
          max={fontRange.max}
          step={fontRange.step}
          onChange={(v) => setWm({ fontSize: v })}
          display={unitPct ? `${wm.fontSize.toFixed(1)}%（宽）` : `${Math.round(wm.fontSize)}px`}
        />
        <Slider
          label="行距"
          value={wm.lineHeightRatio}
          min={0.8}
          max={3}
          step={0.05}
          onChange={(v) => setWm({ lineHeightRatio: v })}
          display={`${wm.lineHeightRatio.toFixed(2)}× 字号`}
          title="多行文字的行间距倍率"
        />
      </Group>

      {/* 外观样式 */}
      <Group title="外观样式">
        <ColorField label="文字颜色" value={wm.color} onChange={(v) => setWm({ color: v })} />
        <Slider
          label="不透明度"
          value={Math.round(wm.opacity * 100)}
          min={1}
          max={100}
          step={1}
          onChange={(v) => setWm({ opacity: v / 100 })}
          display={`${Math.round(wm.opacity * 100)}%`}
        />
        <div className="flex items-center justify-between gap-2 border-t border-dashed border-slate-200 pt-2.5 dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400">描边</span>
          <Switch checked={wm.strokeEnabled} onChange={(v) => setWm({ strokeEnabled: v })} label="启用文字描边" />
        </div>
        {wm.strokeEnabled && (
          <>
            <ColorField label="描边颜色" value={wm.strokeColor} onChange={(v) => setWm({ strokeColor: v })} />
            <Slider
              label="描边粗细"
              value={wm.strokeRatio * 100}
              min={0.5}
              max={20}
              step={0.5}
              onChange={(v) => setWm({ strokeRatio: v / 100 })}
              display={`${(wm.strokeRatio * 100).toFixed(1)}% 字号`}
            />
          </>
        )}
        <div className="flex items-center justify-between gap-2 border-t border-dashed border-slate-200 pt-2.5 dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400">阴影</span>
          <Switch checked={wm.shadowEnabled} onChange={(v) => setWm({ shadowEnabled: v })} label="启用文字阴影" />
        </div>
        {wm.shadowEnabled && (
          <>
            <ColorField label="阴影颜色" value={wm.shadowColor} onChange={(v) => setWm({ shadowColor: v })} />
            <Slider
              label="阴影模糊"
              value={wm.shadowBlurEm}
              min={0}
              max={1.5}
              step={0.01}
              onChange={(v) => setWm({ shadowBlurEm: v })}
              display={`${wm.shadowBlurEm.toFixed(2)}× 字号`}
            />
            <Slider
              label="阴影横向偏移"
              value={wm.shadowOffsetXEm}
              min={-0.6}
              max={0.6}
              step={0.01}
              onChange={(v) => setWm({ shadowOffsetXEm: v })}
              display={`${wm.shadowOffsetXEm >= 0 ? '+' : ''}${wm.shadowOffsetXEm.toFixed(2)}× 字号`}
            />
            <Slider
              label="阴影纵向偏移"
              value={wm.shadowOffsetYEm}
              min={-0.6}
              max={0.6}
              step={0.01}
              onChange={(v) => setWm({ shadowOffsetYEm: v })}
              display={`${wm.shadowOffsetYEm >= 0 ? '+' : ''}${wm.shadowOffsetYEm.toFixed(2)}× 字号`}
            />
          </>
        )}
      </Group>

      {/* 旋转 */}
      <Group title="旋转角度">
        <div className="flex items-center gap-2">
          <Slider
            label="角度"
            value={wm.angleDeg}
            min={-180}
            max={180}
            step={1}
            onChange={(v) => setWm({ angleDeg: v })}
            display={`${wm.angleDeg}°`}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {[-90, -45, -30, 0, 30, 45, 90].map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setWm({ angleDeg: a })}
              className={`h-6 rounded-md px-2 text-[11px] font-medium transition-colors ${
                wm.angleDeg === a
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              {a}°
            </button>
          ))}
        </div>
      </Group>

      <div className="flex flex-col gap-1.5 px-3 pt-3">
        <Button
          variant="outline"
          icon="refresh"
          onClick={() => {
            resetWm()
            toast('已恢复默认水印参数', 'success')
          }}
        >
          恢复默认水印参数
        </Button>
        <p className="text-center text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
          所有参数自动保存在本地浏览器，下次打开自动恢复
        </p>
      </div>
    </div>
  )
}
