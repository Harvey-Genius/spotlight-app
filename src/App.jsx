import { AuthProvider } from './contexts/AuthContext'
import Spotlight from './Spotlight'

function App() {
  return (
    <AuthProvider>
      <Spotlight />
    </AuthProvider>
  )
}

export default App
