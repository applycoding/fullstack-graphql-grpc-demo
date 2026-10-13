import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { graphql } from '../api/client';
import { HOTEL_QUERY } from '../api/queries';
import type { Hotel } from '../api/types';
import { BookingPanel } from '../components/BookingPanel';
import { formatMoney } from '../lib/money';

export function HotelPage() {
  const { id = '' } = useParams();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Stay · Marlow';
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    graphql<{ hotel: Hotel | null }>(HOTEL_QUERY, { id })
      .then((data) => {
        if (cancelled) {
          return;
        }
        if (!data.hotel) {
          setHotel(null);
          setStatus('missing');
          return;
        }
        setHotel(data.hotel);
        setStatus('ready');
        document.title = `${data.hotel.name} · Marlow`;
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return;
        }
        setError(caught instanceof Error ? caught.message : 'Could not load this stay');
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (status === 'loading') {
    return <div className="page"><p>Opening the house…</p></div>;
  }
  if (status === 'missing') {
    return (
      <div className="page narrow">
        <h1>That stay is not on the list.</h1>
        <Link to="/">Back to stays</Link>
      </div>
    );
  }
  if (status === 'error' || !hotel) {
    return <div className="page"><p role="alert">{error ?? 'Could not load this stay'}</p></div>;
  }

  return (
    <div className="page">
      <p className="kicker"><Link to="/">Stays</Link> / {hotel.city}</p>
      <div className="hotel-layout">
        <article>
          <img
            className="hotel-hero"
            src={hotel.imageUrl}
            alt={`${hotel.name} in ${hotel.neighborhood}, ${hotel.city}`}
            width={800}
            height={560}
            fetchPriority="high"
            decoding="async"
          />
          <h1>{hotel.name}</h1>
          <p className="lede">{hotel.neighborhood}, {hotel.city} · {hotel.country}</p>
          <p>{hotel.description}</p>
          <p className="rating">{hotel.rating.toFixed(1)} · {hotel.reviewCount} reviews · from {formatMoney(hotel.pricePerNight, hotel.currency)}</p>
          <ul className="amenities" role="list">
            {hotel.amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}
          </ul>
        </article>
        <BookingPanel hotel={hotel} />
      </div>
    </div>
  );
}
