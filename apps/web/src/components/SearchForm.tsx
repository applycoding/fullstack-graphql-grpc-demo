import { type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { nightsBetween } from '../lib/dates';
import { criteriaOf, fetchHotels, setCriteria } from '../store/searchSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useUiStore } from '../ui/store';

export function SearchForm() {
  const dispatch = useAppDispatch();
  const search = useAppSelector((state) => state.search);
  const pushToast = useUiStore((state) => state.pushToast);
  const [, setSearchParams] = useSearchParams();

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const criteria = criteriaOf(search);
    if (!nightsBetween(criteria.checkIn, criteria.checkOut)) {
      pushToast('Checkout has to be after check-in, within 30 nights.', 'err');
      return;
    }
    const params = new URLSearchParams();
    if (criteria.query) {
      params.set('q', criteria.query);
    }
    params.set('checkIn', criteria.checkIn);
    params.set('checkOut', criteria.checkOut);
    params.set('guests', String(criteria.guests));
    if (criteria.maxPrice) {
      params.set('maxPrice', String(criteria.maxPrice));
    }
    setSearchParams(params, { replace: true });
    void dispatch(fetchHotels(criteria));
  }

  return (
    <form className="search-form" onSubmit={onSubmit}>
      <div>
        <label htmlFor="q">City or hotel</label>
        <input
          id="q"
          name="q"
          value={search.query}
          onChange={(event) => dispatch(setCriteria({ query: event.target.value }))}
          placeholder="Kyoto, Lisbon, riad…"
        />
      </div>
      <div>
        <label htmlFor="check-in">Check-in</label>
        <input
          id="check-in"
          name="checkIn"
          type="date"
          required
          value={search.checkIn}
          onChange={(event) => dispatch(setCriteria({ checkIn: event.target.value }))}
        />
      </div>
      <div>
        <label htmlFor="check-out">Check-out</label>
        <input
          id="check-out"
          name="checkOut"
          type="date"
          required
          value={search.checkOut}
          onChange={(event) => dispatch(setCriteria({ checkOut: event.target.value }))}
        />
      </div>
      <div>
        <label htmlFor="guests">Guests</label>
        <select
          id="guests"
          name="guests"
          value={search.guests}
          onChange={(event) => dispatch(setCriteria({ guests: Number(event.target.value) }))}
        >
          {Array.from({ length: 8 }, (_, index) => index + 1).map((count) => (
            <option key={count} value={count}>{count}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="max-price">Max / night</label>
        <input
          id="max-price"
          name="maxPrice"
          type="number"
          inputMode="numeric"
          min={1}
          step={10}
          value={search.maxPrice ?? ''}
          onChange={(event) => {
            const raw = event.target.value;
            dispatch(setCriteria({ maxPrice: raw === '' ? null : Number(raw) }));
          }}
          placeholder="Any"
        />
      </div>
      <button type="submit" className="button">
        {search.status === 'loading' ? 'Searching…' : 'Search stays'}
      </button>
    </form>
  );
}
