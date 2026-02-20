import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import AdminShell from './pages/admin/AdminShell'
import LoginPage from './pages/admin/LoginPage'
import StudentApp from './pages/StudentApp'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public: student wayfinding */}
        <Route path="/" element={<StudentApp />} />

        {/* Public: admin login */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Protected: admin panel */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminShell />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
