/**
 * 品牌 LOGO（与 public/favicon.svg 同源同稿）：
 * 照片卡片 + 斜向平铺水印条纹，表达「图片水印」语义。
 */
import { useI18n } from '../store/i18n'

export function Logo({ className = 'h-7 w-7' }: { className?: string }) {
  const { t } = useI18n()
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-label={t('app.logoAlt')}
      role="img"
    >
      <defs>
        <linearGradient id="wm-logo-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
        <clipPath id="wm-logo-mask">
          <rect width="64" height="64" rx="14" />
        </clipPath>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#wm-logo-bg)" />
      <g clipPath="url(#wm-logo-mask)">
        <g transform="rotate(-18 32 32)" fill="#FFFFFF">
          <rect x="-6" y="13" width="34" height="5" rx="2.5" fillOpacity="0.45" />
          <rect x="8" y="24" width="52" height="5" rx="2.5" fillOpacity="0.8" />
          <rect x="22" y="35" width="52" height="5" rx="2.5" fillOpacity="0.55" />
          <rect x="36" y="46" width="34" height="5" rx="2.5" fillOpacity="0.35" />
        </g>
        <g transform="rotate(-5 32 33)">
          <rect
            x="16"
            y="19"
            width="32"
            height="25"
            rx="4.5"
            fill="#F5F7FF"
            stroke="#C7D2FE"
            strokeWidth="1.2"
          />
          <circle cx="23.5" cy="27" r="3" fill="#A5B4FC" />
          <path d="M16 44l9-11 7 7 10-11 6 6.5V44H16z" fill="#818CF8" />
        </g>
        <g transform="rotate(-18 32 32)">
          <rect x="14" y="33.4" width="40" height="4.4" rx="2.2" fill="#FFFFFF" fillOpacity="0.88" />
        </g>
      </g>
    </svg>
  )
}
