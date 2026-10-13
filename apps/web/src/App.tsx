import { useEffect, useRef } from 'react';
import { Link, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ToastRegion } from './components/ToastRegion';
import { HotelPage } from './pages/HotelPage';
import { SearchPage } from './pages/SearchPage';
import { TripsPage } from './pages/TripsPage';
import { fetchSession } from './store/authSlice';
import { useAppDispatch } from './store/hooks';
import { useUiStore } from './ui/store';

let authFailureNoted = false;

export function App() {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const pushToast = useUiStore((state) => state.pushToast);
  const mainRef = useRef<HTMLElement>(null);
  const firstPath = useRef(true);

  useEffect(() => {
    void dispatch(fetchSession());
  }, [dispatch]);

  useEffect(() => {
    if (authFailureNoted || params.get('auth') !== 'failed') {
      return;
    }
    authFailureNoted = true;
    pushToast('GitHub sign-in did not complete.', 'err');
  }, [params, pushToast]);

  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    mainRef.current?.focus();
  }, [pathname]);

  return (
    <div className="app">
      <a className="skip-link visually-hidden" href="#content">Skip to content</a>
      <AppShell />
      <main id="content" tabIndex={-1} ref={mainRef}>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/hotels/:id" element={<HotelPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <p>Marlow is a demo desk. Bookings stay in this database and are not real reservations.</p>
      </footer>
      <ToastRegion />
    </div>
  );
}

function NotFound() {
  useEffect(() => {
    document.title = 'Not found · Marlow';
  }, []);
  return (
    <div className="page narrow">
      <h1>That page is not on the desk.</h1>
      <Link to="/">Back to stays</Link>
    </div>
  );
}
