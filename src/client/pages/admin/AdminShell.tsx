import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import MapEditorCanvas from './MapEditorCanvas'

export default function AdminShell() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <MapEditorCanvas onLogout={handleLogout} />
    </div>
  )
}
