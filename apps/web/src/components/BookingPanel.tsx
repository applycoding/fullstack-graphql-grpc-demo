import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Hotel } from '../api/types';
import { nightsBetween } from '../lib/dates';
import { formatMoney } from '../lib/money';
import { createBooking } from '../store/bookingsSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useUiStore } from '../ui/store';
import { AuthActions } from './AuthActions';

type BookingPanelProps = {
  hotel: Hotel;
};

export function BookingPanel({ hotel }: BookingPanelProps) {
  const search = useAppSelector((state) => state.search);
  const user = useAppSelector((state) => state.auth.user);
  const saving = useAppSelector((state) => state.bookings.saving);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const pushToast = useUiStore((state) => state.pushToast);
  const [checkIn, setCheckIn] = useState(search.checkIn);
  const [checkOut, setCheckOut] = useState(search.checkOut);
  const [guests, setGuests] = useState(search.guests);
  const [roomId, setRoomId] = useState('');

  useEffect(() => {
    const fit = hotel.rooms.find((room) => room.maxGuests >= guests);
    setRoomId(fit?.id ?? hotel.rooms[0]?.id ?? '');
  }, [hotel, guests]);

  const nights = nightsBetween(checkIn, checkOut);
  const room = hotel.rooms.find((item) => item.id === roomId) ?? null;
  const tooSmall = room !== null && guests > room.maxGuests;
  const total = nights && room && !tooSmall ? room.pricePerNight * nights : null;

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!user || !room || !nights || tooSmall) {
      pushToast('Choose a room that fits the stay.', 'err');
      return;
    }
    const result = await dispatch(createBooking({
      hotelId: hotel.id,
      roomId: room.id,
      checkIn,
      checkOut,
      guests,
    }));
    if (createBooking.fulfilled.match(result)) {
      pushToast(`${hotel.name} is held.`, 'ok');
      navigate('/trips');
      return;
    }
    pushToast(typeof result.payload === 'string' ? result.payload : 'Could not book this stay', 'err');
  }

  return (
    <aside className="booking-panel">
      <h2>Hold these dates</h2>
      <p className="muted">From {formatMoney(hotel.pricePerNight, hotel.currency)} a night. Nothing is charged.</p>
      <form onSubmit={(event) => void onSubmit(event)} aria-busy={saving}>
        <div className="stack">
          <div>
            <label htmlFor="book-check-in">Check-in</label>
            <input id="book-check-in" type="date" required value={checkIn} onChange={(event) => setCheckIn(event.target.value)} />
          </div>
          <div>
            <label htmlFor="book-check-out">Check-out</label>
            <input id="book-check-out" type="date" required value={checkOut} onChange={(event) => setCheckOut(event.target.value)} />
          </div>
          <div>
            <label htmlFor="book-guests">Guests</label>
            <select id="book-guests" value={guests} onChange={(event) => setGuests(Number(event.target.value))}>
              {Array.from({ length: 8 }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>{count}</option>
              ))}
            </select>
          </div>
        </div>
        <fieldset className="room-fieldset">
          <legend>Room</legend>
          <div className="room-list">
            {hotel.rooms.map((item) => {
              const id = `room-${item.id}`;
              return (
                <label key={item.id} className="room-option" htmlFor={id}>
                  <input
                    id={id}
                    type="radio"
                    name="room"
                    value={item.id}
                    checked={roomId === item.id}
                    onChange={() => setRoomId(item.id)}
                  />
                  <span className="room-copy">
                    <span className="room-name">{item.name}</span>
                    <span className="muted">{item.beds} · sleeps {item.maxGuests}</span>
                  </span>
                  <span className="room-price">{formatMoney(item.pricePerNight, hotel.currency)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
        {tooSmall ? <p role="alert">This room sleeps {room?.maxGuests}.</p> : null}
        {!nights ? <p role="alert">Checkout has to be after check-in, within 30 nights.</p> : null}
        {total !== null && nights !== null ? (
          <p className="total">
            <span>{nights} {nights === 1 ? 'night' : 'nights'}</span>
            <strong>{formatMoney(total, hotel.currency)}</strong>
          </p>
        ) : null}
        {user ? (
          <button type="submit" className="button" disabled={saving}>
            {saving ? 'Holding the dates…' : 'Book this stay'}
          </button>
        ) : (
          <div className="panel-auth">
            <p>Sign in to book.</p>
            <AuthActions />
          </div>
        )}
      </form>
    </aside>
  );
}
