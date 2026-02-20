import { useEffect, useState } from 'react'

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((response) => {
        if (response.ok) {
          setAuthenticated(true)
        } else {
          setAuthenticated(false)
        }
      })
      .catch(() => {
        setAuthenticated(false)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => {
      setAuthenticated(false)
    })
  }

  return { authenticated, loading, logout }
}
