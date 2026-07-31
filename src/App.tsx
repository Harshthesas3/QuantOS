import './App.css'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'zustand'
import { useUserStore } from './stores/userStore'
import Routes from './routes'

function App() {
  const { user, initializeUser } = useUserStore()

  // Initialize user data on app load
  React.useEffect(() => {
    initializeUser()
  }, [initializeUser])

  return (
    <Provider>
      <BrowserRouter>
        <div className="App">
          <Routes />
        </div>
      </BrowserRouter>
    </Provider>
  )
}

export default App