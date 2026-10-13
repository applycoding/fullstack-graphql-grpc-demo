import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AuthActions } from '../components/AuthActions';
import { formatStay } from '../lib/dates';
import { formatMoney } from '../lib/money';
import { bookingStatusLabel, parseBookingStatus } from '../lib/status';
import { cancelBooking, fetchBookings } from '../store/bookingsSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useUiStore } from '../ui/store';

export function TripsPage() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const bookings = useAppSelector((state) => state.bookings);
  const pushToast = useUiStore((state) => state.pushToast);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const pending = bookings.items.find((item) => item.id === pendingId) ?? null;

  useEffect(() => {
    document.title = 'Trips · Marlow';
  }, []);

  useEffect(() => {
    if (auth.user) {
      void dispatch(fetchBookings());
    }
  }, [auth.user, dispatch]);

  async function confirmCancel(): Promise<void> {
    if (!pending) {
      return;
    }
    const result = await dispatch(cancelBooking(pending.id));
    setPendingId(null);
    if (cancelBooking.fulfilled.match(result)) {
      pushToast(`${pending.hotel.name} is cancelled.`, 'ok');
      return;
    }
    pushToast(typeof result.payload === 'string' ? result.payload : 'Could not cancel', 'err');
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="kicker">Your desk</p>
        <h1>Trips</h1>
        <p className="lede">Dates you have held. Cancel anything you will not use.</p>
      </header>
      {auth.status === 'loading' ? <p>Checking sign-in…</p> : null}
      {auth.status !== 'loading' && !auth.user ? (
        <div className="empty-auth">
          <p>Sign in to see the stays under your name.</p>
          <AuthActions />
        </div>
      ) : null}
      {auth.user && bookings.status === 'failed' && bookings.error ? <p role="alert">{bookings.error}</p> : null}
      {auth.user && bookings.status === 'loading' ? <p>Loading trips…</p> : null}
      {auth.user && bookings.status === 'succeeded' && bookings.items.length === 0 ? (
        <p>No stays held yet. <Link to="/">Look through the list.</Link></p>
      ) : null}
      {auth.user ? (
        <ul className="trip-list" role="list">
          {bookings.items.map((booking) => {
            const status = parseBookingStatus(booking.status);
            return (
              <li key={booking.id}>
                <article className="trip-card">
                  <img src={booking.hotel.imageUrl} alt="" width={160} height={120} />
                  <div>
                    <h2><Link to={`/hotels/${booking.hotel.id}`}>{booking.hotel.name}</Link></h2>
                    <p className="muted">{booking.hotel.city} · {booking.room.name}</p>
                    <p>{formatStay(booking.checkIn, booking.checkOut)} · {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</p>
                    <p className="price">{formatMoney(booking.totalPrice, booking.currency)}</p>
                    <p>{status ? bookingStatusLabel(status) : booking.status}</p>
                    {status === 'confirmed' ? (
                      <button type="button" className="button secondary" onClick={() => setPendingId(booking.id)}>
                        Cancel {booking.hotel.name}
                      </button>
                    ) : null}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      ) : null}
      <ConfirmDialog
        open={pending !== null}
        title="Cancel this stay?"
        description={pending ? `${pending.hotel.name} will be released for those dates.` : ''}
        confirmLabel="Cancel booking"
        onConfirm={() => void confirmCancel()}
        onClose={() => setPendingId(null)}
      />
    </div>
  );
}
