import type { ExportMode, ExportProgress } from '../lib/exporter'
import { TEMPLATE_DEFAULT } from '../lib/filename'
import { useSettings } from '../store/settings'
import { useI18n } from '../store/i18n'
import { Button, Icon, Slider, toast } from './ui'

export interface ExportPanelProps {
  count: number
  canDownloadOne: boolean
  busy: boolean
  progress: ExportProgress | null
  onExport: (mode: ExportMode) => void
}

export function ExportPanel({ count, canDownloadOne, busy, progress, onExport }: ExportPanelProps) {
  const { s, set } = useSettings()
  const { t } = useI18n()
  const pct = progress ? Math.round((progress.done / Math.max(1, progress.total)) * 100) : 0

  return (
    <div className="shrink-0 border-t border-slate-200/80 bg-slate-50/70 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
        <Icon name="download" className="h-3.5 w-3.5 text-indigo-500" />
        {t('export.title')}
        <span className="ml-auto rounded bg-slate-200/80 px-1.5 py-px text-[10px] font-medium text-slate-500 dark:bg-slate-700/80 dark:text-slate-400">
          {t('export.localBadge')}
        </span>
      </div>

      <Slider
        label={t('export.quality')}
        value={Math.round(s.jpegQuality * 100)}
        min={50}
        max={100}
        step={1}
        onChange={(v) => set({ jpegQuality: v / 100 })}
        display={t('panel.display.pct', { v: Math.round(s.jpegQuality * 100) })}
      />

      <div className="mt-1 flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          {t('export.template')}
          <button
            type="button"
            title={t('export.templateReset', { name: '{name}', ext: '{ext}' })}
            onClick={() => {
              set({ filenameTemplate: TEMPLATE_DEFAULT })
              toast(t('export.templateResetToast'), 'success')
            }}
            className="ml-auto flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-indigo-600 dark:hover:bg-slate-700"
          >
            <Icon name="refresh" className="h-3 w-3" />
          </button>
        </label>
        <input
          type="text"
          value={s.filenameTemplate}
          spellCheck={false}
          onChange={(e) => set({ filenameTemplate: e.target.value })}
          className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 font-mono text-[11px] text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        />
        <p className="-mt-0.5 text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
          {t('export.templateHint', { name: '{name}', ext: '{ext}' })}
        </p>
      </div>

      <div className="mt-2.5 flex flex-col gap-1.5">
        <Button
          variant="primary"
          icon="download"
          disabled={!canDownloadOne || busy}
          onClick={() => onExport('one')}
        >
          {t('export.downloadCurrent')}
        </Button>
        <div className="flex gap-1.5">
          <Button
            variant="soft"
            icon="download"
            disabled={count === 0 || busy}
            onClick={() => onExport('all')}
            className="flex-1"
          >
            {t('export.downloadAll')}
          </Button>
          <Button
            variant="outline"
            icon="archive"
            disabled={count === 0 || busy}
            onClick={() => onExport('zip')}
            className="flex-1"
          >
            {t('export.zipAll')}
          </Button>
        </div>
      </div>

      {progress && (
        <div className="mt-2.5 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span className="truncate">{progress.phase}</span>
            <span className="shrink-0 tabular-nums">{pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {count > 0 && !busy && (
        <p className="mt-2 text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
          {t('export.summary', { n: count })}
        </p>
      )}
    </div>
  )
}
