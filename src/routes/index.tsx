import React from 'react'
import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import Dashboard from '../pages/Dashboard'
import Roadmap from '../pages/Roadmap'
import Resources from '../pages/Resources'
import Projects from '../pages/Projects'
import Notes from '../pages/Notes'
import TopicDetails from '../pages/TopicDetails'
import DailyPlanner from '../pages/DailyPlanner'
import Analytics from '../pages/Analytics'
import Settings from '../pages/Settings'
import Login from '../pages/Login'

function RequireAuth() {
  const { user } = useUserStore()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return null
}

function RequireNoAuth() {
  const { user } = useUserStore()
  if (user) {
    return <Navigate to="/" replace />
  }
  return null
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = RequireAuth()
  if (auth) return auth
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const auth = RequireNoAuth()
  if (auth) return auth
  return <>{children}</>
}

export default function Routes() {
  return (
    <RouterRoutes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/roadmap"
        element={
          <ProtectedRoute>
            <Roadmap />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resources"
        element={
          <ProtectedRoute>
            <Resources />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes"
        element={
          <ProtectedRoute>
            <Notes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/topic/:id"
        element={
          <ProtectedRoute>
            <TopicDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/planner"
        element={
          <ProtectedRoute>
            <DailyPlanner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      {/* Fallback to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </RouterRoutes>
  )
}
