import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import StudentApp from './pages/StudentApp'

// Admin routes are code-split — the student map is the hot path and
// the admin editor pulls in MapEditorCanvas (~1000 lines), the entire
// geometry editor (Toolbar, Canvas, SidePanel, Editor), and data tables.
// Lazy-loading these keeps the student bundle focused on the wayfinding
// experience. The ~150-200 KB raw / ~50 KB gzip saved compounds on
// slow mobile connections on Render's free tier.
const LoginPage = lazy(() => import('./pages/admin/LoginPage'))
const AdminShell = lazy(() => import('./pages/admin/AdminShell'))

/** Suspense fallback for admin routes — matches the existing loading spinner. */
function AdminLoading() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-600 font-medium">Loading admin…</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public: student wayfinding */}
        <Route path="/" element={<StudentApp />} />

        {/* Public: admin login — lazy-loaded */}
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<AdminLoading />}>
              <LoginPage />
            </Suspense>
          }
        />

        {/* Protected: admin panel — lazy-loaded */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/admin"
            element={
              <Suspense fallback={<AdminLoading />}>
                <AdminShell />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
