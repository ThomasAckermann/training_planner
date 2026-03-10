import { ICON_CONFIGS, PALETTE_CATEGORIES } from './icons.js'

function PaletteIcon({ type, config }) {
  function handleDragStart(e) {
    e.dataTransfer.setData('iconType', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const size = Math.min(config.size, 18)

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      title={config.paletteName}
      className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing select-none"
      style={{ minWidth: 48 }}
    >
      <div
        className="flex items-center justify-center rounded"
        style={{
          width: 40,
          height: 40,
          backgroundColor: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
        }}
      >
        {config.shape === 'circle' && (
          <div
            style={{
              width: size * 2,
              height: size * 2,
              borderRadius: '50%',
              backgroundColor: config.fillColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: size > 14 ? 9 : 8,
              fontWeight: 700,
              color: config.textColor,
              border: '1px solid rgba(255,255,255,0.3)',
              lineHeight: 1,
            }}
          >
            {config.label}
          </div>
        )}
        {config.shape === 'triangle' && (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${size}px solid transparent`,
                borderRight: `${size}px solid transparent`,
                borderBottom: `${size * 1.7}px solid ${config.fillColor}`,
              }}
            />
          </div>
        )}
        {config.shape === 'text' && (
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f0f0', fontFamily: 'serif', lineHeight: 1 }}>T</div>
        )}
        {config.shape === 'zone' && (
          <div
            style={{
              width: 28,
              height: 28,
              border: `1.5px solid rgba(204,20,20,0.6)`,
              borderRadius: 3,
              backgroundColor: 'rgba(204,20,20,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: '#cc1414',
            }}
          >
            {config.label}
          </div>
        )}
      </div>
      <span
        style={{
          fontSize: 9,
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          lineHeight: 1.2,
          maxWidth: 44,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {config.paletteName}
      </span>
    </div>
  )
}

export default function IconPalette() {
  return (
    <div
      className="flex flex-col gap-3 p-3 rounded-xl overflow-y-auto"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        width: 180,
        maxHeight: 520,
        flexShrink: 0,
      }}
    >
      {PALETTE_CATEGORIES.map(({ key, label }) => {
        const icons = Object.entries(ICON_CONFIGS).filter(([, cfg]) => cfg.category === key)
        return (
          <div key={key}>
            <div
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {label}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {icons.map(([type, config]) => (
                <PaletteIcon key={type} type={type} config={config} />
              ))}
            </div>
          </div>
        )
      })}

      <div>
        <div
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Arrows
        </div>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Click &amp; drag on empty court area to draw arrows
        </p>
      </div>
    </div>
  )
}
