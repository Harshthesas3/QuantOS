import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useUserStore()
  const navigate = useNavigate()

  if (!user) {
    // Redirect to login if not authenticated
    navigate('/login', { replace: true })
    return null
  }

  return children
}

const Routes = () => {
  const { user } = useUserStore()

  return (
    <>
      {/* Public routes */}
      <Outlet />

      {/* Protected routes */}
      <Outlet context={user} />
    </>
  )
}

export default Routes