import JSZip from 'jszip'
import type { WmPreset } from './wmSerialize'
import { safePresetFileName, serializePreset } from './wmSerialize'
import { dedupeNames } from './filename'
import { t } from '../i18n'

/**
 * 把所有预设打包为 ZIP（内含逐个 .json 文件）。
 * 说明：jszip 会被打进主 chunk（与图片导出共用），此处不做额外拆分。
 */
export async function buildPresetsZip(presets: WmPreset[]): Promise<Blob> {
  const zip = new JSZip()
  const names = dedupeNames(presets.map((p) => `${safePresetFileName(p.name)}.json`))
  presets.forEach((p, i) => {
    zip.file(names[i], serializePreset(p))
  })
  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
}

export function presetsZipName(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}`
  return t('preset.zipName', { stamp })
}
