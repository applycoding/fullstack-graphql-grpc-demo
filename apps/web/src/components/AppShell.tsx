import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useUiStore } from '../ui/store';
import { AuthActions } from './AuthActions';

export function AppShell() {
  const navOpen = useUiStore((state) => state.navOpen);
  const setNavOpen = useUiStore((state) => state.setNavOpen);
  const { pathname } = useLocation();

  useEffect(() => {
    setNavOpen(false);
  }, [pathname, setNavOpen]);

  return (
    <header className="site-header">
      <div className="header-inner">
        <NavLink to="/" className="wordmark" end>
          <span className="mark" aria-hidden="true" />
          Marlow
        </NavLink>
        <button
          type="button"
          className="button secondary nav-toggle"
          aria-expanded={navOpen}
          aria-controls="primary-nav"
          onClick={() => setNavOpen(!navOpen)}
        >
          Menu
        </button>
        <nav id="primary-nav" aria-label="Primary" className={navOpen ? 'primary-nav open' : 'primary-nav'}>
          <ul className="nav-links" role="list">
            <li><NavLink to="/" end>Stays</NavLink></li>
            <li><NavLink to="/trips">Trips</NavLink></li>
          </ul>
        </nav>
        <div className="header-auth">
          <AuthActions />
        </div>
      </div>
    </header>
  );
}
