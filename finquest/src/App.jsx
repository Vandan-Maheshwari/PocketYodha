import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore } from './store/userStore'

// ── Pages ──
import Register          from './pages/Register'
import Dashboard         from './pages/Dashboard'      // ← V2
import Profile           from './pages/Profile'
import ExpenseCapture    from './pages/ExpenseCapture' // ← V2
import Battle            from './pages/Battle'         // ← V2
import SkillTree         from './pages/SkillTree'
import Review            from './pages/Review'
import Quests            from './pages/Quests'
import Games             from './pages/Games'

// ── Auth guard ──
function Private({ children }) {
  const { isRegistered, isLoggedIn } = useUserStore()
  if (!isRegistered || !isLoggedIn) return <Navigate to="/register" replace />
  return children
}

export default function App() {
  const { isRegistered, isLoggedIn } = useUserStore()
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Navigate to={isRegistered && isLoggedIn ? '/dashboard' : '/register'} replace />} />
        <Route path="/register"  element={<Register />} />
        <Route path="/dashboard" element={<Private><Dashboard /></Private>} />
        <Route path="/profile"   element={<Private><Profile /></Private>} />
        <Route path="/expenses"  element={<Private><ExpenseCapture /></Private>} />
        <Route path="/battle"    element={<Private><Battle /></Private>} />
        <Route path="/skills"    element={<Private><SkillTree /></Private>} />
        <Route path="/review"    element={<Private><Review /></Private>} />
        <Route path="/quests"    element={<Private><Quests /></Private>} />
        <Route path="/games"     element={<Private><Games /></Private>} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}