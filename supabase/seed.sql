-- Current fleet supplied by the owner. Plates, rego and service dates are left empty:
-- fill them in from Admin → Fleet → Edit. Do not seed customers or invoices.
insert into public.cars (model, year, category, seats, bags, weekly_rate, photo_url, sort_order) values
  ('Honda Civic',              2011, 'Sedan', 5, '3',     200, '/images/civic-front.jpg', 1),
  ('Toyota Camry',             2016, 'Sedan', 5, '3',     265, null, 2),
  ('Toyota HiAce',             2010, 'Van',   3, 'Cargo', 330, null, 3),
  ('Honda CR-V',               2016, 'SUV',   5, '3',     300, null, 4),
  ('Toyota Camry',             2017, 'Sedan', 5, '3',     270, null, 5),
  ('Honda Civic',              2015, 'Sedan', 5, '3',     250, null, 6),
  ('Toyota Camry',             2013, 'Sedan', 5, '3',     230, null, 7),
  ('Toyota Corolla',           2013, 'Sedan', 5, '2',     220, null, 8),
  ('Honda Civic',              2015, 'Sedan', 5, '3',     250, null, 9),
  ('Toyota Corolla Hatchback', 2015, 'Hatch', 5, '2',     250, null, 10),
  ('Toyota Aurion',            2014, 'Sedan', 5, '3',     245, null, 11);

-- Make yourself admin (after creating the user in Authentication → Users):
-- insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
