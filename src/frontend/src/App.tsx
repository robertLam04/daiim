import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import Header from './components/Header'
import ModalHost from './modals/ModalHost'
import WalkthroughPanel from './components/WalkthroughPanel'
import { useStore } from './store'
import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
import TaskDetail from './pages/TaskDetail'
import ProviderDetail from './pages/ProviderDetail'
import CreateTask from './pages/CreateTask'
import NewRequest from './pages/NewRequest'
import RequestDetail from './pages/RequestDetail'
import Profile from './pages/Profile'
import Help from './pages/Help'
import History from './pages/History'

// Signed-out users who open a signed-in page get the sign-in modal instead.
function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useStore()
  const loc = useLocation()
  if (!state.signedIn) {
    const back = encodeURIComponent(loc.pathname + loc.search)
    return <Navigate to={`/?modal=signin&next=${back}`} replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/marketplace/tasks/:id" element={<TaskDetail />} />
        <Route path="/marketplace/providers/:id" element={<ProviderDetail />} />
        <Route path="/help" element={<Help />} />
        <Route path="/tasks/new" element={<RequireAuth><CreateTask /></RequireAuth>} />
        <Route path="/requests" element={<RequireAuth><NewRequest /></RequireAuth>} />
        <Route path="/requests/:id" element={<RequireAuth><RequestDetail /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/history" element={<RequireAuth><History /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ModalHost />
      <WalkthroughPanel />
    </>
  )
}
