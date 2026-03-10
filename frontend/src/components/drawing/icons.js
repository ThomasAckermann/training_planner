// Icon configuration for the drawing tool palette

export const ICON_CONFIGS = {
  // Players
  setter:   { label: 'S',   category: 'players', fillColor: '#FFD700', textColor: '#000000', shape: 'circle', size: 22, paletteName: 'Setter' },
  libero:   { label: 'L',   category: 'players', fillColor: '#FF4D4D', textColor: '#ffffff', shape: 'circle', size: 22, paletteName: 'Libero' },
  outside:  { label: 'OH',  category: 'players', fillColor: '#4488FF', textColor: '#ffffff', shape: 'circle', size: 22, paletteName: 'Outside (OH)' },
  middle:   { label: 'MB',  category: 'players', fillColor: '#22d3ee', textColor: '#000000', shape: 'circle', size: 22, paletteName: 'Middle (MB)' },
  opposite: { label: 'OPP', category: 'players', fillColor: '#FF8800', textColor: '#ffffff', shape: 'circle', size: 22, paletteName: 'Opposite' },
  player1:  { label: 'P1',  category: 'players', fillColor: '#888888', textColor: '#ffffff', shape: 'circle', size: 22, paletteName: 'Player 1' },
  player2:  { label: 'P2',  category: 'players', fillColor: '#888888', textColor: '#ffffff', shape: 'circle', size: 22, paletteName: 'Player 2' },
  player3:  { label: 'P3',  category: 'players', fillColor: '#888888', textColor: '#ffffff', shape: 'circle', size: 22, paletteName: 'Player 3' },
  player4:  { label: 'P4',  category: 'players', fillColor: '#888888', textColor: '#ffffff', shape: 'circle', size: 22, paletteName: 'Player 4' },
  player5:  { label: 'P5',  category: 'players', fillColor: '#888888', textColor: '#ffffff', shape: 'circle', size: 22, paletteName: 'Player 5' },
  player6:  { label: 'P6',  category: 'players', fillColor: '#888888', textColor: '#ffffff', shape: 'circle', size: 22, paletteName: 'Player 6' },
  coach:    { label: '★',   category: 'players', fillColor: '#ffffff', textColor: '#1a1a2e', shape: 'circle', size: 22, paletteName: 'Coach' },
  // Objects
  ball:     { label: '●',   category: 'objects', fillColor: '#ffffff', textColor: '#888888', shape: 'circle', size: 14, paletteName: 'Ball' },
  cone:     { label: '▲',   category: 'objects', fillColor: '#FF8800', textColor: '#ffffff', shape: 'triangle', size: 20, paletteName: 'Cone' },
  // Text label
  text:     { label: 'T',   category: 'objects', fillColor: 'transparent', textColor: '#ffffff', shape: 'text', size: 0, paletteName: 'Text' },
  // Zone markers
  zone1:    { label: '1',   category: 'zones', fillColor: 'rgba(204,20,20,0.15)', textColor: '#cc1414', shape: 'zone', size: 50, paletteName: 'Zone 1' },
  zone2:    { label: '2',   category: 'zones', fillColor: 'rgba(204,20,20,0.15)', textColor: '#cc1414', shape: 'zone', size: 50, paletteName: 'Zone 2' },
  zone3:    { label: '3',   category: 'zones', fillColor: 'rgba(204,20,20,0.15)', textColor: '#cc1414', shape: 'zone', size: 50, paletteName: 'Zone 3' },
  zone4:    { label: '4',   category: 'zones', fillColor: 'rgba(204,20,20,0.15)', textColor: '#cc1414', shape: 'zone', size: 50, paletteName: 'Zone 4' },
  zone5:    { label: '5',   category: 'zones', fillColor: 'rgba(204,20,20,0.15)', textColor: '#cc1414', shape: 'zone', size: 50, paletteName: 'Zone 5' },
  zone6:    { label: '6',   category: 'zones', fillColor: 'rgba(204,20,20,0.15)', textColor: '#cc1414', shape: 'zone', size: 50, paletteName: 'Zone 6' },
}

export const PALETTE_CATEGORIES = [
  { key: 'players', label: 'Players' },
  { key: 'objects', label: 'Objects' },
  { key: 'zones',   label: 'Zones' },
]

export function getIconConfig(type) {
  return ICON_CONFIGS[type] || ICON_CONFIGS.player1
}
