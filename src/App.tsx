import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import VehicleDetail from './pages/VehicleDetail'
import VehicleForm from './pages/VehicleForm'
import Vehicles from './pages/Vehicles'
import { StoreProvider, useStore } from './store'

function Shell() {
  const { reminders, resetDemoData } = useStore()
  const urgent = reminders.filter((r) => r.status !== 'ok').length

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">🚗 CarPool</span>
        <nav className="nav">
          <NavLink to="/" end>
            Overview
            {urgent > 0 && <span className="pill">{urgent}</span>}
          </NavLink>
          <NavLink to="/vehicles">Vehicles</NavLink>
        </nav>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/vehicles/new" element={<VehicleForm />} />
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
          <Route path="/vehicles/:id/edit" element={<VehicleForm />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>

      <footer className="footer muted">
        Prototype · data lives in this browser only ·{' '}
        <button className="link" onClick={() => confirm('Replace all data with the demo set?') && resetDemoData()}>
          reset demo data
        </button>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </BrowserRouter>
  )
}
