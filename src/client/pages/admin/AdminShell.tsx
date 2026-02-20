import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function AdminShell() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex justify-between items-center p-4 bg-white border-b">
        <h1 className="text-lg font-semibold">Admin Panel</h1>
        <button
          type="button"
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </header>
      <main className="flex items-center justify-center p-12">
        <p className="text-gray-500">Map editor coming in Phase 9</p>
      </main>
    </div>
  )
}
