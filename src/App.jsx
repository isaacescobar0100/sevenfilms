import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ToastContainer from './components/notifications/ToastContainer'
import ErrorBoundary from './components/common/ErrorBoundary'

// Pages críticas (cargadas inmediatamente)
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Pages con lazy loading (cargadas cuando se necesitan)
const Feed = lazy(() => import('./pages/Feed'))
const Profile = lazy(() => import('./pages/Profile'))
const Search = lazy(() => import('./pages/Search'))
const Messages = lazy(() => import('./pages/Messages'))
const Movies = lazy(() => import('./pages/Movies'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Saved = lazy(() => import('./pages/Saved'))
const Settings = lazy(() => import('./pages/Settings'))
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService'))
const AboutUs = lazy(() => import('./pages/legal/AboutUs'))
const Contact = lazy(() => import('./pages/legal/Contact'))
const MissionVision = lazy(() => import('./pages/legal/MissionVision'))
const CreateStory = lazy(() => import('./pages/CreateStory'))
const Notifications = lazy(() => import('./pages/Notifications'))

function App() {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      {/* Toast notifications container */}
      {user && <ToastContainer />}

      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      }>
        <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public routes */}
          <Route index element={user ? <Navigate to="/feed" /> : <Home />} />
          <Route
            path="login"
            element={user ? <Navigate to="/feed" replace /> : <Login />}
          />
          <Route
            path="register"
            element={user ? <Navigate to="/feed" replace /> : <Register />}
          />

          {/* Legal pages - Public */}
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="terms" element={<TermsOfService />} />
          <Route path="about" element={<AboutUs />} />
          <Route path="contact" element={<Contact />} />
          <Route path="mission" element={<MissionVision />} />

          {/* Protected routes - Red Social */}
          <Route element={<ProtectedRoute />}>
            <Route path="feed" element={<Feed />} />
            <Route path="stories/create" element={<CreateStory />} />
            <Route path="search" element={<Search />} />
            <Route path="messages" element={<Messages />} />
            <Route path="movies" element={<Movies />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/:username" element={<Profile />} />
            <Route path="saved" element={<Saved />} />
            <Route path="settings" element={<Settings />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
