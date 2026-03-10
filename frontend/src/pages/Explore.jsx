import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useDrills } from '../hooks/useDrills.js'
import { useSessions } from '../hooks/useSessions.js'
import DrillCard from '../components/drill/DrillCard.jsx'
import DrillFilters from '../components/drill/DrillFilters.jsx'
import SessionCard from '../components/session/SessionCard.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import { AGE_RANGES, SKILL_LEVELS } from '../lib/constants.js'

function SkeletonCard() {
  return (
    <Card>
      <div className="animate-pulse space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-surface2 rounded-full" />
          <div className="h-5 w-20 bg-surface2 rounded-full" />
        </div>
        <div className="h-5 w-3/4 bg-surface2 rounded" />
        <div className="h-4 w-full bg-surface2 rounded" />
        <div className="h-4 w-2/3 bg-surface2 rounded" />
        <div className="flex gap-4">
          <div className="h-3 w-16 bg-surface2 rounded" />
          <div className="h-3 w-20 bg-surface2 rounded" />
        </div>
      </div>
    </Card>
  )
}

function SessionFilters({ filters, onFiltersChange }) {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-48">
        <Input
          placeholder="Search sessions..."
          value={filters.search ?? ''}
          onChange={(e) =>
            onFiltersChange((prev) => ({ ...prev, search: e.target.value, page: 1 }))
          }
        />
      </div>
      <div>
        <select
          value={filters.age_range ?? ''}
          onChange={(e) =>
            onFiltersChange((prev) => ({ ...prev, age_range: e.target.value || undefined, page: 1 }))
          }
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
        >
          <option value="">All Ages</option>
          {AGE_RANGES.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>
      <div>
        <select
          value={filters.skill_level ?? ''}
          onChange={(e) =>
            onFiltersChange((prev) => ({ ...prev, skill_level: e.target.value || undefined, page: 1 }))
          }
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
        >
          <option value="">All Levels</option>
          {SKILL_LEVELS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      {(filters.search || filters.age_range || filters.skill_level) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFiltersChange({ page: 1, limit: 20 })}
        >
          Clear
        </Button>
      )}
    </div>
  )
}

function DrillsTab() {
  const [filters, setFilters] = useState({ page: 1, limit: 20 })
  const { data, isLoading, isError } = useDrills(filters)

  const drills = data?.items ?? []
  const total = data?.total ?? 0
  const pages = data?.pages ?? 1
  const currentPage = filters.page ?? 1

  function handlePageChange(newPage) {
    setFilters((prev) => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <div
        className="mb-6 p-4 rounded-xl border"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <DrillFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      {!isLoading && (
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
          {total === 0 ? 'No drills found' : `${total} drill${total !== 1 ? 's' : ''} found`}
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : isError ? (
        <div
          className="text-center py-20 rounded-xl border"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <p className="text-danger text-lg">Failed to load drills. Please try again.</p>
        </div>
      ) : drills.length === 0 ? (
        <div
          className="text-center py-20 rounded-xl border"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            No drills found
          </p>
          <p style={{ color: 'var(--color-text-muted)' }}>Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {drills.map((drill) => <DrillCard key={drill.id} drill={drill} />)}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </Button>
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Page {currentPage} of {pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= pages}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </>
  )
}

function SessionsTab() {
  const [filters, setFilters] = useState({ page: 1, limit: 20 })
  const { data, isLoading, isError } = useSessions(filters)

  const sessions = data?.items ?? []
  const total = data?.total ?? 0
  const pages = data?.pages ?? 1
  const currentPage = filters.page ?? 1

  function handlePageChange(newPage) {
    setFilters((prev) => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <div
        className="mb-6 p-4 rounded-xl border"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <SessionFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      {!isLoading && (
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
          {total === 0 ? 'No sessions found' : `${total} session${total !== 1 ? 's' : ''} found`}
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : isError ? (
        <div
          className="text-center py-20 rounded-xl border"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <p className="text-danger text-lg">Failed to load sessions. Please try again.</p>
        </div>
      ) : sessions.length === 0 ? (
        <div
          className="text-center py-20 rounded-xl border"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            No sessions found
          </p>
          <p style={{ color: 'var(--color-text-muted)' }}>Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => <SessionCard key={session.id} session={session} />)}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </Button>
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Page {currentPage} of {pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= pages}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </>
  )
}

export default function Explore() {
  const [activeTab, setActiveTab] = useState('drills')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-4xl mb-2 tracking-wide"
          style={{ fontFamily: '"Bebas Neue", cursive', color: 'var(--color-text)' }}
        >
          Explore
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Browse the community drill and session library
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b mb-6"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {[
          { key: 'drills', label: 'Drills' },
          { key: 'sessions', label: 'Sessions' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px"
            style={{
              borderColor: activeTab === tab.key ? 'var(--color-accent)' : 'transparent',
              color: activeTab === tab.key ? 'var(--color-accent)' : 'var(--color-text-muted)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'drills' ? <DrillsTab /> : <SessionsTab />}
    </div>
  )
}
