import { useNavigate } from 'react-router-dom'
import { Clock, Layers, Heart, Copy } from 'lucide-react'
import Card from '../ui/Card.jsx'
import Badge from '../ui/Badge.jsx'
import { FOCUS_AREAS } from '../../lib/constants.js'
import useAuthStore from '../../store/authStore.js'
import { useDuplicateSession } from '../../hooks/useSessions.js'

export default function SessionCard({ session }) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const duplicateSession = useDuplicateSession()

  const visibleFocusAreas = (session.focus_areas || []).slice(0, 2)
  const extraFocusCount = (session.focus_areas || []).length - visibleFocusAreas.length

  const focusLabel = (value) =>
    FOCUS_AREAS.find((f) => f.value === value)?.label ?? value

  return (
    <Card hoverable onClick={() => navigate(`/sessions/${session.id}`)}>
      {/* Title */}
      <h3
        className="text-xl mb-2 leading-tight tracking-wide"
        style={{
          fontFamily: '"Bebas Neue", cursive',
          color: 'var(--color-text)',
        }}
      >
        {session.title}
      </h3>

      {/* Badges row */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {session.skill_level && (
          <Badge variant="skill">{session.skill_level}</Badge>
        )}
        {session.age_range && (
          <Badge variant="age">{session.age_range}</Badge>
        )}
        {visibleFocusAreas.map((fa) => (
          <Badge key={fa} variant="focus">{focusLabel(fa)}</Badge>
        ))}
        {extraFocusCount > 0 && (
          <Badge variant="default">+{extraFocusCount} more</Badge>
        )}
        {!session.is_public && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium"
            style={{ backgroundColor: '#88888822', color: 'var(--color-text-muted)', border: '1px solid #333333' }}
          >
            draft
          </span>
        )}
      </div>

      {/* Description */}
      {session.description && (
        <p
          className="text-sm mb-3 line-clamp-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {session.description}
        </p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <span className="flex items-center gap-1">
          <Layers className="w-3 h-3" />
          {session.drill_count ?? session.drills?.length ?? 0} drills
        </span>
        {session.total_duration_minutes > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {session.total_duration_minutes} min
          </span>
        )}
        {session.likes_count > 0 && (
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {session.likes_count}
          </span>
        )}
        {user && (
          <button
            className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
            title="Duplicate session"
            disabled={duplicateSession.isPending}
            onClick={async (e) => {
              e.stopPropagation()
              await duplicateSession.mutateAsync(session.id)
              navigate('/me?tab=sessions')
            }}
          >
            <Copy className="w-3 h-3" />
            Copy
          </button>
        )}
      </div>
    </Card>
  )
}
