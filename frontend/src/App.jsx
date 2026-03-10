import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/layout/Navbar.jsx'
import { useAuth } from './hooks/useAuth.js'
import Home from './pages/Home.jsx'
import Explore from './pages/Explore.jsx'
import DrillDetail from './pages/DrillDetail.jsx'
import DrillNew from './pages/DrillNew.jsx'
import DrillEdit from './pages/DrillEdit.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import SessionNew from './pages/SessionNew.jsx'
import SessionDetail from './pages/SessionDetail.jsx'
import SessionEdit from './pages/SessionEdit.jsx'
import Profile from './pages/Profile.jsx'

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/drills/:id" element={<DrillDetail />} />
          <Route
            path="/drills/new"
            element={
              <ProtectedRoute>
                <DrillNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drills/:id/edit"
            element={
              <ProtectedRoute>
                <DrillEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/me"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions/new"
            element={
              <ProtectedRoute>
                <SessionNew />
              </ProtectedRoute>
            }
          />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route
            path="/sessions/:id/edit"
            element={
              <ProtectedRoute>
                <SessionEdit />
              </ProtectedRoute>
            }
          />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
