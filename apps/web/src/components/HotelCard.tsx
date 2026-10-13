import { Link } from 'react-router-dom';
import type { Hotel } from '../api/types';
import { formatMoney } from '../lib/money';

type HotelCardProps = {
  hotel: Hotel;
  priority?: boolean;
};

export function HotelCard({ hotel, priority = false }: HotelCardProps) {
  return (
    <article className="hotel-card">
      <Link to={`/hotels/${hotel.id}`} className="hotel-card-link">
        <img
          src={hotel.imageUrl}
          alt={`${hotel.name} in ${hotel.neighborhood}, ${hotel.city}`}
          width={800}
          height={560}
          fetchPriority={priority ? 'high' : 'low'}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
        <div className="hotel-card-copy">
          <p className="kicker">{hotel.neighborhood} · {hotel.city}</p>
          <h3>{hotel.name}</h3>
          <p className="muted">{hotel.country}</p>
          <p className="price">
            {formatMoney(hotel.pricePerNight, hotel.currency)} <span>a night</span>
          </p>
          <p className="rating">{hotel.rating.toFixed(1)} · {hotel.reviewCount} reviews</p>
        </div>
      </Link>
    </article>
  );
}
