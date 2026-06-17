import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import ToastContainer from '@/components/Toast'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
import TaskHall from '@/pages/TaskHall'
import PublishTask from '@/pages/PublishTask'
import MyTasks from '@/pages/MyTasks'
import AdminDashboard from '@/pages/AdminDashboard'
import { useAuthStore } from '@/store/auth'

function Layout() {
  const location = useLocation()
  const showNavbar = location.pathname !== '/login'

  return (
    <div className="min-h-screen bg-gray-light">
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <TaskHall />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks/publish"
          element={
            <ProtectedRoute roles={['user', 'admin']}>
              <PublishTask />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks/mine"
          element={
            <ProtectedRoute roles={['user', 'admin']}>
              <MyTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
      <ToastContainer />
    </div>
  )
}

function AppContent() {
  const { fetchUser, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser()
    }
  }, [isAuthenticated, fetchUser])

  return <Layout />
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}
