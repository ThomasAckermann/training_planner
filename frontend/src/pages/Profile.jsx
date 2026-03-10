import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Layers, MapPin, Trophy } from 'lucide-react'
import { useUserProfile } from '../hooks/useUsers.js'
import { useDrills } from '../hooks/useDrills.js'
import { useSessions } from '../hooks/useSessions.js'
import Badge from '../components/ui/Badge.jsx'
import Card from '../components/ui/Card.jsx'
import { FOCUS_AREAS } from '../lib/constants.js'

const COACHING_LEVEL_LABELS = {
  C: 'C License',
  B: 'B License',
  A: 'A License',
  national: 'National License',
}

export default function Profile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('sessions')

  const { data: profile, isLoading: profileLoading, isError } = useUserProfile(userId)
  const { data: drillData, isLoading: drillsLoading } = useDrills({ author_id: userId, limit: 50 })
  const { data: sessionData, isLoading: sessionsLoading } = useSessions({ author_id: userId, limit: 50 })

  const drills = drillData?.items ?? []
  const sessions = sessionData?.items ?? []

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse space-y-4">
        <div className="h-6 w-24 rounded" style={{ backgroundColor: 'var(--color-surface)' }} />
        <div className="h-24 rounded-2xl" style={{ backgroundColor: 'var(--color-surface)' }} />
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-2xl mb-2" style={{ color: 'var(--color-text)' }}>Coach not found</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm mt-4"
          style={{ color: 'var(--color-text-muted)' }}
        >
          ← Go back
        </button>
      </div>
    )
  }

  const joinYear = new Date(profile.created_at).getFullYear()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm mb-6 hover:opacity-80 transition-opacity"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Profile header */}
      <div
        className="p-6 rounded-2xl border mb-8 flex items-start gap-5"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        {/* Avatar */}
        <div
          className="flex-shrink-0 w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-surface-2)', border: '2px solid var(--color-border)' }}
        >
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <span
              className="text-3xl font-bold"
              style={{ fontFamily: '"Bebas Neue", cursive', color: 'var(--color-accent)' }}
            >
              {profile.name?.[0]?.toUpperCase() ?? '?'}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1
            className="text-4xl tracking-wide mb-1"
            style={{ fontFamily: '"Bebas Neue", cursive', color: 'var(--color-text)' }}
          >
            {profile.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            {(profile.club || profile.country) && (
              <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                <MapPin className="w-3.5 h-3.5" />
                {[profile.club, profile.country].filter(Boolean).join(' · ')}
              </span>
            )}
            {profile.coaching_level && (
              <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                <Trophy className="w-3.5 h-3.5" />
                {COACHING_LEVEL_LABELS[profile.coaching_level] ?? profile.coaching_level}
              </span>
            )}
          </div>

          <div className="flex gap-4 mt-4">
            <div className="text-center">
              <div
                className="text-2xl font-bold"
                style={{ fontFamily: '"Bebas Neue", cursive', color: 'var(--color-accent)' }}
              >
                {sessionData?.total ?? '—'}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Sessions</div>
            </div>
            <div className="text-center">
              <div
                className="text-2xl font-bold"
                style={{ fontFamily: '"Bebas Neue", cursive', color: 'var(--color-accent)' }}
              >
                {drillData?.total ?? '—'}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Drills</div>
            </div>
            <div className="text-center">
              <div
                className="text-2xl font-bold"
                style={{ fontFamily: '"Bebas Neue", cursive', color: 'var(--color-accent)' }}
              >
                {joinYear}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Joined</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-xl border"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          width: 'fit-content',
        }}
      >
        {[
          { key: 'sessions', label: 'Sessions' },
          { key: 'drills', label: 'Drills' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: tab === key ? 'var(--color-surface-2)' : 'transparent',
              color: tab === key ? 'var(--color-text)' : 'var(--color-text-muted)',
              border: tab === key ? '1px solid var(--color-border)' : '1px solid transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sessions tab */}
      {tab === 'sessions' && (
        <div>
          {sessionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl animate-pulse"
                  style={{ backgroundColor: 'var(--color-surface)' }}
                />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div
              className="text-center py-14 rounded-xl border"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>
                No public sessions yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  hoverable
                  className="cursor-pointer"
                  onClick={() => navigate(`/sessions/${session.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold mb-1 truncate" style={{ color: 'var(--color-text)' }}>
                        {session.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {session.skill_level && <Badge variant="skill">{session.skill_level}</Badge>}
                        {session.age_range && <Badge variant="age">{session.age_range}</Badge>}
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          <Layers className="w-3 h-3" />
                          {session.drills?.length ?? 0} drills
                        </span>
                        {session.total_duration_minutes > 0 && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            <Clock className="w-3 h-3" />
                            {session.total_duration_minutes} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Drills tab */}
      {tab === 'drills' && (
        <div>
          {drillsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl animate-pulse"
                  style={{ backgroundColor: 'var(--color-surface)' }}
                />
              ))}
            </div>
          ) : drills.length === 0 ? (
            <div
              className="text-center py-14 rounded-xl border"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>
                No public drills yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {drills.map((drill) => {
                const focusLabel = FOCUS_AREAS.find((f) => f.value === drill.focus_area)?.label ?? drill.focus_area
                return (
                  <Card
                    key={drill.id}
                    hoverable
                    className="cursor-pointer"
                    onClick={() => navigate(`/drills/${drill.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      {drill.drawing_thumb_url && (
                        <img
                          src={drill.drawing_thumb_url}
                          alt=""
                          className="w-14 h-10 rounded object-cover flex-shrink-0"
                          style={{ border: '1px solid var(--color-border)' }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold mb-1 truncate" style={{ color: 'var(--color-text)' }}>
                          {drill.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {drill.focus_area && <Badge variant="focus">{focusLabel}</Badge>}
                          {drill.skill_level && <Badge variant="skill">{drill.skill_level}</Badge>}
                          {drill.age_range && <Badge variant="age">{drill.age_range}</Badge>}
                          {drill.duration_minutes && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              <Clock className="w-3 h-3" />
                              {drill.duration_minutes} min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
