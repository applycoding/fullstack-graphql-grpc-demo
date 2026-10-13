import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HotelCard } from '../components/HotelCard';
import { SearchForm } from '../components/SearchForm';
import { criteriaFromParams } from '../lib/dates';
import { criteriaOf, fetchHotels, setCriteria } from '../store/searchSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · Marlow`;
  }, [title]);
}

export function SearchPage() {
  useDocumentTitle('Stays');
  const dispatch = useAppDispatch();
  const search = useAppSelector((state) => state.search);
  const [params] = useSearchParams();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    const criteria = criteriaFromParams(params, criteriaOf(search));
    dispatch(setCriteria(criteria));
    void dispatch(fetchHotels(criteria));
  }, [dispatch, params, search]);

  return (
    <div className="page">
      <header className="hero">
        <p className="kicker">Hotel desk</p>
        <h1>Places with a point of view.</h1>
        <p className="lede">Eight houses, inns, and riads. Search by city, then hold the dates.</p>
      </header>
      <SearchForm />
      <section className="results-section" aria-busy={search.status === 'loading'}>
        <div className="results-head">
          <h2>
            {search.status === 'loading' && search.hotels.length === 0
              ? 'Looking up stays'
              : `${search.total} ${search.total === 1 ? 'stay' : 'stays'}`}
          </h2>
          {search.status === 'succeeded' ? (
            <p className="cache-note">{search.cached ? 'Cached result' : 'Live result'}</p>
          ) : null}
        </div>
        {search.status === 'failed' && search.error ? <p role="alert">{search.error}</p> : null}
        {search.status !== 'loading' && search.hotels.length === 0 && search.status !== 'idle' ? (
          <p>No stays match that search. Try Kyoto, or clear the price cap.</p>
        ) : null}
        <ul className="results" role="list">
          {search.hotels.map((hotel, index) => (
            <li key={hotel.id}>
              <HotelCard hotel={hotel} priority={index === 0} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
