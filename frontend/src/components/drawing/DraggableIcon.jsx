import { Group, Circle, RegularPolygon, Rect, Text } from 'react-konva'
import { getIconConfig } from './icons.js'

export default function DraggableIcon({ icon, isSelected, onSelect, onChange, onContextMenu }) {
  const config = getIconConfig(icon.type)
  const fillColor = icon.color || config.fillColor
  const size = config.size

  function handleDragEnd(e) {
    onChange({ x: e.target.x(), y: e.target.y() })
  }

  function handleContextMenu(e) {
    e.cancelBubble = true
    if (onContextMenu) onContextMenu(e)
  }

  const groupProps = {
    draggable: true,
    onClick: (e) => { e.cancelBubble = true; onSelect() },
    onTap: (e) => { e.cancelBubble = true; onSelect() },
    onDragEnd: handleDragEnd,
    onContextMenu: handleContextMenu,
  }

  const selectedStroke = '#cc1414'

  // Circle — players & ball
  if (config.shape === 'circle') {
    return (
      <Group x={icon.x} y={icon.y} {...groupProps}>
        <Circle
          radius={size}
          fill={fillColor}
          stroke={isSelected ? selectedStroke : 'rgba(255,255,255,0.35)'}
          strokeWidth={isSelected ? 2.5 : 1.5}
          shadowColor={isSelected ? selectedStroke : undefined}
          shadowBlur={isSelected ? 10 : 0}
        />
        <Text
          text={config.label}
          fontSize={size > 18 ? 11 : 8}
          fontStyle="bold"
          fill={config.textColor}
          align="center"
          verticalAlign="middle"
          width={size * 2}
          height={size * 2}
          x={-size}
          y={-size}
          listening={false}
        />
      </Group>
    )
  }

  // Triangle — cones
  if (config.shape === 'triangle') {
    return (
      <Group x={icon.x} y={icon.y} {...groupProps}>
        <RegularPolygon
          sides={3}
          radius={size}
          fill={fillColor}
          stroke={isSelected ? selectedStroke : 'rgba(255,255,255,0.35)'}
          strokeWidth={isSelected ? 2.5 : 1.5}
          shadowColor={isSelected ? selectedStroke : undefined}
          shadowBlur={isSelected ? 10 : 0}
        />
      </Group>
    )
  }

  // Rect — zone markers
  if (config.shape === 'zone') {
    return (
      <Group x={icon.x} y={icon.y} {...groupProps}>
        <Rect
          width={size}
          height={size}
          offsetX={size / 2}
          offsetY={size / 2}
          fill={fillColor}
          stroke={isSelected ? selectedStroke : 'rgba(204,20,20,0.5)'}
          strokeWidth={isSelected ? 2.5 : 1.5}
          cornerRadius={4}
          shadowColor={isSelected ? selectedStroke : undefined}
          shadowBlur={isSelected ? 10 : 0}
        />
        <Text
          text={config.label}
          fontSize={20}
          fontStyle="bold"
          fill={icon.color || config.textColor}
          align="center"
          verticalAlign="middle"
          width={size}
          height={size}
          offsetX={size / 2}
          offsetY={size / 2}
          listening={false}
        />
      </Group>
    )
  }

  // Free text label — double-click to edit (editing handled by parent via context menu)
  if (config.shape === 'text') {
    return (
      <Group x={icon.x} y={icon.y} {...groupProps}>
        <Text
          text={icon.text || 'Label'}
          fontSize={15}
          fontStyle="bold"
          fill={icon.color || '#ffffff'}
          stroke={isSelected ? selectedStroke : undefined}
          strokeWidth={isSelected ? 0.4 : 0}
          shadowColor={isSelected ? selectedStroke : undefined}
          shadowBlur={isSelected ? 8 : 0}
          onDblClick={() => onContextMenu && onContextMenu({ isTextEdit: true })}
        />
      </Group>
    )
  }

  return null
}
