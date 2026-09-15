import type { UnitMode, WmMode } from '../lib/types'
import { ANCHOR_POINTS } from '../lib/renderer'
import { FONT_OPTIONS } from '../lib/fonts'
import type { DictKey } from '../i18n'
import { useSettings } from '../store/settings'
import { useI18n } from '../store/i18n'
import { Button, ColorField, Group, Segmented, SelectField, Slider, Switch, toast } from './ui'
import { PresetPanel } from './PresetPanel'

/** 九宫格锚点名称的文案键（顺序与 ANCHOR_POINTS 的 3×3 展开一致） */
const ANCHOR_KEYS: DictKey[] = [
  'panel.anchor.tl',
  'panel.anchor.tc',
  'panel.anchor.tr',
  'panel.anchor.ml',
  'panel.anchor.mc',
  'panel.anchor.mr',
  'panel.anchor.bl',
  'panel.anchor.bc',
  'panel.anchor.br',
]

export function SettingsPanel() {
  const { s, setWm, resetWm } = useSettings()
  const { t, lang } = useI18n()
  const wm = s.wm
  const unitPct = wm.unit === 'percent'

  // 字号/间距等控件量程随单位切换
  const fontRange = unitPct ? { min: 0.5, max: 25, step: 0.1 } : { min: 8, max: 600, step: 2 }
  const spaceRange = unitPct ? { min: 2, max: 300, step: 0.5 } : { min: 24, max: 3000, step: 8 }
  const offsetRange = unitPct ? { min: -100, max: 100, step: 0.5 } : { min: -1500, max: 1500, step: 10 }

  const switchUnit = (u: UnitMode) => {
    // 切换单位时给一个该单位下的合理默认字号，避免数值语义错乱
    if (u === 'percent')
      setWm({ unit: u, fontSize: 4, spacingX: 18, spacingY: 18, tileOffsetX: 0, tileOffsetY: 0 })
    else setWm({ unit: u, fontSize: 48, spacingX: 200, spacingY: 200, tileOffsetX: 0, tileOffsetY: 0 })
  }

  const setMode = (m: WmMode) => {
    setWm({ mode: m })
    if (m === 'single' && wm.unit === 'percent' && wm.fontSize < 2) {
      setWm({ fontSize: 4 })
    }
  }

  const dim = (v: string) => `${v}${unitPct ? '%' : 'px'}`
  const anchorTitle = ANCHOR_KEYS.map((k) => t(k))
  const anchorCell = (xPct: number) => (xPct < 33.4 ? 0 : xPct < 66.7 ? 1 : 2)

  return (
    <div className="flex flex-col pb-6">
      {/* 水印预设：保存 / 套用 / 导出 JSON / ZIP */}
      <PresetPanel />

      {/* 布局模式 */}
      <Group
        title={t('panel.mode.title')}
        extra={
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {wm.mode === 'tile' ? t('panel.mode.tileHint') : t('panel.mode.singleHint')}
          </span>
        }
      >
        <Segmented<WmMode>
          value={wm.mode}
          onChange={setMode}
          options={[
            { value: 'tile', label: t('panel.mode.tile'), title: t('panel.mode.tileTitle') },
            { value: 'single', label: t('panel.mode.single'), title: t('panel.mode.singleTitle') },
          ]}
        />

        {wm.mode === 'tile' ? (
          <>
            <Slider
              label={t('panel.tile.spacingX')}
              value={wm.spacingX}
              min={spaceRange.min}
              max={spaceRange.max}
              step={spaceRange.step}
              onChange={(v) => setWm({ spacingX: v })}
              display={dim(String(wm.spacingX))}
              title={t('panel.tile.spacingXTitle')}
            />
            <Slider
              label={t('panel.tile.spacingY')}
              value={wm.spacingY}
              min={spaceRange.min}
              max={spaceRange.max}
              step={spaceRange.step}
              onChange={(v) => setWm({ spacingY: v })}
              display={dim(String(wm.spacingY))}
              title={t('panel.tile.spacingYTitle')}
            />
            <div className="mt-0.5 rounded-lg bg-slate-100/80 px-2 py-1.5 text-[11px] leading-relaxed text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
              {t('panel.tile.note')}
            </div>
            <Slider
              label={t('panel.tile.offsetX')}
              value={wm.tileOffsetX}
              min={offsetRange.min}
              max={offsetRange.max}
              step={offsetRange.step}
              onChange={(v) => setWm({ tileOffsetX: v })}
              display={dim(String(wm.tileOffsetX))}
            />
            <Slider
              label={t('panel.tile.offsetY')}
              value={wm.tileOffsetY}
              min={offsetRange.min}
              max={offsetRange.max}
              step={offsetRange.step}
              onChange={(v) => setWm({ tileOffsetY: v })}
              display={dim(String(wm.tileOffsetY))}
            />
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t('panel.single.position')}
              </span>
              <span className="flex gap-1">
                {[0, 1, 2].map((row) =>
                  [0, 1, 2].map((col) => {
                    const idx = row * 3 + col
                    const x = ANCHOR_POINTS[col] * 100
                    const y = ANCHOR_POINTS[row] * 100
                    const active = anchorCell(wm.posXPct) === col && anchorCell(wm.posYPct) === row
                    return (
                      <button
                        key={idx}
                        type="button"
                        title={t('panel.single.anchorTitle', { name: anchorTitle[idx] })}
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
                            active
                              ? 'bg-indigo-600 dark:bg-indigo-400'
                              : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        />
                      </button>
                    )
                  }),
                )}
              </span>
            </div>
            <Slider
              label={t('panel.single.x')}
              value={wm.posXPct}
              min={0}
              max={100}
              step={0.1}
              onChange={(v) => setWm({ posXPct: v })}
              display={t('panel.display.pct', { v: wm.posXPct.toFixed(1) })}
            />
            <Slider
              label={t('panel.single.y')}
              value={wm.posYPct}
              min={0}
              max={100}
              step={0.1}
              onChange={(v) => setWm({ posYPct: v })}
              display={t('panel.display.pct', { v: wm.posYPct.toFixed(1) })}
            />
            <p className="rounded-lg bg-indigo-50/70 px-2 py-1.5 text-[11px] leading-relaxed text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300">
              {t('panel.single.hint')}
            </p>
          </>
        )}
      </Group>

      {/* 文字内容 */}
      <Group
        title={t('panel.text.title')}
        extra={
          <Segmented<UnitMode>
            value={wm.unit}
            onChange={switchUnit}
            options={[
              {
                value: 'percent',
                label: t('panel.unit.percent'),
                title: t('panel.unit.percentTitle'),
              },
              { value: 'px', label: t('panel.unit.px'), title: t('panel.unit.pxTitle') },
            ]}
          />
        }
      >
        <textarea
          value={wm.content}
          onChange={(e) => setWm({ content: e.target.value })}
          rows={3}
          spellCheck={false}
          placeholder={t('panel.text.placeholder')}
          className="w-full resize-y rounded-lg border border-slate-300 bg-slate-50/70 px-2.5 py-1.5 text-xs leading-relaxed text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200 dark:focus:bg-slate-800"
        />
        <SelectField
          label={t('panel.text.font')}
          value={wm.fontFamily}
          options={FONT_OPTIONS.map((f) => ({
            label: lang === 'en' ? f.labelEn : f.label,
            value: f.value,
          }))}
          onChange={(v) => setWm({ fontFamily: v })}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">{t('panel.text.weight')}</span>
          <Segmented<'400' | '700'>
            value={String(wm.fontWeight) as '400' | '700'}
            onChange={(v) => setWm({ fontWeight: Number(v) as 400 | 700 })}
            options={[
              { value: '400', label: t('panel.text.weight.regular') },
              { value: '700', label: t('panel.text.weight.bold') },
            ]}
          />
        </div>
        <Slider
          label={t('panel.text.size')}
          value={wm.fontSize}
          min={fontRange.min}
          max={fontRange.max}
          step={fontRange.step}
          onChange={(v) => setWm({ fontSize: v })}
          display={
            unitPct
              ? t('panel.display.pctWidth', { v: wm.fontSize.toFixed(1) })
              : t('panel.display.px', { v: Math.round(wm.fontSize) })
          }
        />
        <Slider
          label={t('panel.text.lineHeight')}
          value={wm.lineHeightRatio}
          min={0.8}
          max={3}
          step={0.05}
          onChange={(v) => setWm({ lineHeightRatio: v })}
          display={t('panel.display.lineHeight', { v: wm.lineHeightRatio.toFixed(2) })}
          title={t('panel.text.lineHeightTitle')}
        />
      </Group>

      {/* 外观样式 */}
      <Group title={t('panel.style.title')}>
        <ColorField
          label={t('panel.style.color')}
          value={wm.color}
          onChange={(v) => setWm({ color: v })}
        />
        <Slider
          label={t('panel.style.opacity')}
          value={Math.round(wm.opacity * 100)}
          min={1}
          max={100}
          step={1}
          onChange={(v) => setWm({ opacity: v / 100 })}
          display={t('panel.display.pct', { v: Math.round(wm.opacity * 100) })}
        />
        <div className="flex items-center justify-between gap-2 border-t border-dashed border-slate-200 pt-2.5 dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400">{t('panel.style.stroke')}</span>
          <Switch
            checked={wm.strokeEnabled}
            onChange={(v) => setWm({ strokeEnabled: v })}
            label={t('panel.style.strokeEnable')}
          />
        </div>
        {wm.strokeEnabled && (
          <>
            <ColorField
              label={t('panel.style.strokeColor')}
              value={wm.strokeColor}
              onChange={(v) => setWm({ strokeColor: v })}
            />
            <Slider
              label={t('panel.style.strokeWidth')}
              value={wm.strokeRatio * 100}
              min={0.5}
              max={20}
              step={0.5}
              onChange={(v) => setWm({ strokeRatio: v / 100 })}
              display={t('panel.display.pctOfFont', { v: (wm.strokeRatio * 100).toFixed(1) })}
            />
          </>
        )}
        <div className="flex items-center justify-between gap-2 border-t border-dashed border-slate-200 pt-2.5 dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400">{t('panel.style.shadow')}</span>
          <Switch
            checked={wm.shadowEnabled}
            onChange={(v) => setWm({ shadowEnabled: v })}
            label={t('panel.style.shadowEnable')}
          />
        </div>
        {wm.shadowEnabled && (
          <>
            <ColorField
              label={t('panel.style.shadowColor')}
              value={wm.shadowColor}
              onChange={(v) => setWm({ shadowColor: v })}
            />
            <Slider
              label={t('panel.style.shadowBlur')}
              value={wm.shadowBlurEm}
              min={0}
              max={1.5}
              step={0.01}
              onChange={(v) => setWm({ shadowBlurEm: v })}
              display={t('panel.display.emOfFont', { v: wm.shadowBlurEm.toFixed(2) })}
            />
            <Slider
              label={t('panel.style.shadowOffsetX')}
              value={wm.shadowOffsetXEm}
              min={-0.6}
              max={0.6}
              step={0.01}
              onChange={(v) => setWm({ shadowOffsetXEm: v })}
              display={t('panel.display.signedEm', {
                sign: wm.shadowOffsetXEm >= 0 ? '+' : '',
                v: wm.shadowOffsetXEm.toFixed(2),
              })}
            />
            <Slider
              label={t('panel.style.shadowOffsetY')}
              value={wm.shadowOffsetYEm}
              min={-0.6}
              max={0.6}
              step={0.01}
              onChange={(v) => setWm({ shadowOffsetYEm: v })}
              display={t('panel.display.signedEm', {
                sign: wm.shadowOffsetYEm >= 0 ? '+' : '',
                v: wm.shadowOffsetYEm.toFixed(2),
              })}
            />
          </>
        )}
      </Group>

      {/* 旋转 */}
      <Group title={t('panel.rotation.title')}>
        <div className="flex items-center gap-2">
          <Slider
            label={t('panel.rotation.angle')}
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
            toast(t('panel.resetToast'), 'success')
          }}
        >
          {t('panel.reset')}
        </Button>
        <p className="text-center text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
          {t('panel.persistHint')}
        </p>
      </div>
    </div>
  )
}
