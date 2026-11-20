import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Spinner } from './components/ui'
import { AppShell } from './components/AppShell'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { Login } from './pages/auth/Login'
import { Registered } from './pages/auth/Registered'
import { Register } from './pages/auth/Register'
import { ResetPassword } from './pages/auth/ResetPassword'
import { AdminActivityLogs } from './pages/admin/AdminActivityLogs'
import { AdminCategories } from './pages/admin/AdminCategories'
import { AdminClaims } from './pages/admin/AdminClaims'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminReports } from './pages/admin/AdminReports'
import { AdminSupport } from './pages/admin/AdminSupport'
import { AdminUsers } from './pages/admin/AdminUsers'
import { ActivityHistory } from './pages/student/ActivityHistory'
import { Browse } from './pages/student/Browse'
import { ClaimItem } from './pages/student/ClaimItem'
import { Claims } from './pages/student/Claims'
import { Help } from './pages/student/Help'
import { Home } from './pages/student/Home'
import { ItemDetails } from './pages/student/ItemDetails'
import { MyReports } from './pages/student/MyReports'
import { Notifications } from './pages/student/Notifications'
import { PersonalInfo } from './pages/student/PersonalInfo'
import { Profile } from './pages/student/Profile'
import { ReportItem } from './pages/student/ReportItem'
import { Verification } from './pages/student/Verification'

function FullPageLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream text-sm font-semibold text-muted">
      <Spinner />
      Loading CampusFind…
    </div>
  )
}

function ProtectedRoute({ requireAdmin = false }: { requireAdmin?: boolean }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (requireAdmin && !isAdmin) return <Navigate to="/home" replace />

  return <Outlet />
}

function PublicOnlyRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (isAuthenticated) return <Navigate to={isAdmin ? '/admin' : '/home'} replace />
  return <Outlet />
}

function RootRedirect() {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  if (loading) return <FullPageLoader />
  return <Navigate to={isAuthenticated ? (isAdmin ? '/admin' : '/home') : '/login'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/registered" element={<Registered />} />

        <Route element={<AppShell />}>
          <Route path="/home" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/items/:id" element={<ItemDetails />} />
          <Route path="/items/:id/claim" element={<ClaimItem />} />
          <Route path="/verification/:code" element={<Verification />} />
          <Route path="/report/:type" element={<ReportItem />} />
          <Route path="/my-reports" element={<MyReports />} />
          <Route path="/claims" element={<Claims />} />
          <Route path="/activity" element={<ActivityHistory />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/personal-info" element={<PersonalInfo />} />
          <Route path="/help" element={<Help />} />

          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/claims" element={<AdminClaims />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/logs" element={<AdminActivityLogs />} />
            <Route path="/admin/support" element={<AdminSupport />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  )
}
