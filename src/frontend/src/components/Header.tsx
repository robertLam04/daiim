import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { money, USER } from '../data'
import { useNow, useStore } from '../store'
import { useModal } from '../modals/useModal'

export default function Header() {
  const { state, balances, hasConfirmingPayment, signOut } = useStore()
  const now = useNow()
  const { open } = useModal()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const loc = useLocation()
  const [menuOpen, setMenuOpen] = useState(params.get('menu') === 'open')
  const menuRef = useRef<HTMLDivElement>(null)

  // The menu closes on every page change; ?menu=open (screen 05) opens it.
  useEffect(() => {
    setMenuOpen(params.get('menu') === 'open')
  }, [loc.pathname, loc.search, params])

  // Clicking anywhere outside the menu closes it.
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  })

  const closeMenu = () => {
    setMenuOpen(false)
    if (params.get('menu')) {
      const next = new URLSearchParams(params)
      next.delete('menu')
      setParams(next, { replace: true })
    }
  }

  const go = (to: string) => {
    closeMenu()
    navigate(to)
  }

  const logOut = () => {
    closeMenu()
    if (hasConfirmingPayment(now)) {
      open('logout')
    } else {
      signOut()
      navigate('/')
    }
  }

  const { available, held } = balances(now)
  const tabClass = ({ isActive }: { isActive: boolean }) => `btn tab${isActive ? ' active' : ''}`

  return (
    <header className="header">
      <Link to="/" className="logo"><span className="logo-dot" />DAIIM</Link>
      <NavLink to="/marketplace" className={tabClass}>Marketplace</NavLink>
      {state.signedIn && <NavLink to="/requests" className={tabClass}>My requests</NavLink>}
      <div className="spacer" />
      {state.signedIn ? (
        <>
          <div className="funds">
            <span className="funds-label">Held funds</span>
            <span className="funds-held">{money(held)}</span>
          </div>
          <div className="funds">
            <span className="funds-label">Available funds</span>
            <span className="funds-avail">{money(available)} CAD</span>
          </div>
          <button className="btn" onClick={() => open('deposit')}>Deposit</button>
          <div ref={menuRef}>
          <button className="profile-btn" onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))} aria-expanded={menuOpen}>
            <span className="avatar" />{USER.firstName}
          </button>
          {menuOpen && (
            <div className="menu" role="menu">
              <div className="menu-head">
                <span>{USER.handle}</span>
                <button onClick={() => go('/profile')}>⚙ Settings</button>
              </div>
              <button className="menu-item" onClick={() => go('/profile')}>Profile</button>
              <button className="menu-item" onClick={() => go('/history')}>Transaction history</button>
              <button className="menu-item" onClick={() => go('/help')}>Help</button>
              <button className="menu-item danger" onClick={logOut}>Log out</button>
            </div>
          )}
          </div>
        </>
      ) : (
        <button className="btn" onClick={() => open('signin')}>Sign up / Log in</button>
      )}
    </header>
  )
}
