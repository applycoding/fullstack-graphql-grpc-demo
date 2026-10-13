INSERT INTO hotels (
  slug, name, city, country, neighborhood, description, amenities,
  price_per_night, currency, rating, review_count, image_url
) VALUES
  (
    'casa-do-sal',
    'Casa do Sal',
    'Lisbon',
    'Portugal',
    'Alfama',
    'A tiled townhouse above the river. The courtyard stays cool after lunch, and the roof looks straight at the ferries.',
    ARRAY['Breakfast', 'Courtyard', 'Roof terrace', 'Wifi'],
    180, 'USD', 4.8, 126, '/stays/casa-do-sal.svg'
  ),
  (
    'kiri-house',
    'Kiri House',
    'Kyoto',
    'Japan',
    'Gion',
    'Cedar, paper screens, and a private bath. The lane outside goes quiet once the evening shops close.',
    ARRAY['Private bath', 'Garden', 'Yukata', 'Wifi'],
    260, 'USD', 4.9, 84, '/stays/kiri-house.svg'
  ),
  (
    'basalt-birch',
    'Basalt & Birch',
    'Reykjavik',
    'Iceland',
    'Harbor',
    'A black-timber house a short walk from the water, built for weather and long breakfasts.',
    ARRAY['Breakfast', 'Blackout shades', 'Workspace', 'Wifi'],
    210, 'USD', 4.7, 203, '/stays/basalt-birch.svg'
  ),
  (
    'casa-nube',
    'Casa Nube',
    'Mexico City',
    'Mexico',
    'Roma Norte',
    'A former printing shop with a planted stair. The rooms open onto a loud, lovely street.',
    ARRAY['Breakfast', 'Record player', 'Courtyard', 'Wifi'],
    140, 'USD', 4.6, 158, '/stays/casa-nube.svg'
  ),
  (
    'riad-lumen',
    'Riad Lumen',
    'Marrakech',
    'Morocco',
    'Medina',
    'A small riad with a square of sky in the middle and orange trees in pots.',
    ARRAY['Breakfast', 'Plunge pool', 'Roof terrace', 'Wifi'],
    160, 'USD', 4.8, 97, '/stays/riad-lumen.svg'
  ),
  (
    'harbor-loft',
    'Harbor Loft',
    'Copenhagen',
    'Denmark',
    'Nyhavn',
    'A brick loft one floor above a bike shop, with a window that actually faces the water.',
    ARRAY['Kitchenette', 'Bikes', 'Workspace', 'Wifi'],
    220, 'USD', 4.7, 141, '/stays/harbor-loft.svg'
  ),
  (
    'signal-hill',
    'Signal Hill Rooms',
    'Cape Town',
    'South Africa',
    'Gardens',
    'Four rooms on a steep street. The mountain is on one side and the noon gun is somewhere out of sight.',
    ARRAY['Breakfast', 'City view', 'Workspace', 'Wifi'],
    150, 'USD', 4.6, 112, '/stays/signal-hill.svg'
  ),
  (
    'cliff-thyme',
    'Cliff & Thyme',
    'Santorini',
    'Greece',
    'Oia',
    'Two white rooms and a terrace that earns the view. Evenings are for sitting still.',
    ARRAY['Breakfast', 'Terrace', 'Cave bath', 'Wifi'],
    280, 'USD', 4.9, 76, '/stays/cliff-thyme.svg'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  neighborhood = EXCLUDED.neighborhood,
  description = EXCLUDED.description,
  amenities = EXCLUDED.amenities,
  price_per_night = EXCLUDED.price_per_night,
  currency = EXCLUDED.currency,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  image_url = EXCLUDED.image_url;

INSERT INTO rooms (hotel_id, name, beds, max_guests, price_per_night)
SELECT h.id, v.name, v.beds, v.max_guests, v.price
FROM (VALUES
  ('casa-do-sal'::text, 'River Room'::text, 'Queen bed'::text, 2, 180),
  ('casa-do-sal', 'Roof Suite', 'King bed', 3, 240),
  ('kiri-house', 'Garden Room', 'Two futons', 2, 260),
  ('kiri-house', 'Bath Suite', 'King futon', 2, 340),
  ('basalt-birch', 'Harbor Room', 'Queen bed', 2, 210),
  ('basalt-birch', 'Weather Suite', 'King bed', 3, 290),
  ('casa-nube', 'Print Shop', 'Queen bed', 2, 140),
  ('casa-nube', 'Stair Studio', 'Queen bed and a daybed', 3, 190),
  ('riad-lumen', 'Orange Court', 'Queen bed', 2, 160),
  ('riad-lumen', 'Sky Room', 'King bed', 3, 230),
  ('harbor-loft', 'Water Window', 'Queen bed', 2, 220),
  ('harbor-loft', 'Brick Loft', 'King bed', 4, 310),
  ('signal-hill', 'Noon Room', 'Queen bed', 2, 150),
  ('signal-hill', 'Mountain Room', 'King bed', 3, 200),
  ('cliff-thyme', 'Caldera Room', 'Queen bed', 2, 280),
  ('cliff-thyme', 'Thyme Suite', 'King bed', 2, 390)
) AS v(slug, name, beds, max_guests, price)
JOIN hotels h ON h.slug = v.slug
ON CONFLICT (hotel_id, name) DO UPDATE SET
  beds = EXCLUDED.beds,
  max_guests = EXCLUDED.max_guests,
  price_per_night = EXCLUDED.price_per_night;
