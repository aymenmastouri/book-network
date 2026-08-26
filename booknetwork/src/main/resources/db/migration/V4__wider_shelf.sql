-- A third member and a wider shelf, so lists, filters and queues have
-- something to show. Carla's UUID matches keycloak/realm/booknetwork-realm.json.

insert into users (id, email, first_name, last_name) values
    ('33333333-3333-3333-3333-333333333333', 'carla@booknetwork.dev', 'Carla', 'Mendes');

update books set genre = 'ROMANCE'  where title = 'Pride and Prejudice';
update books set genre = 'CLASSIC'  where title = 'Moby-Dick';
update books set genre = 'SCIFI'    where title = 'Frankenstein';
update books set genre = 'CLASSIC'  where title = 'The Picture of Dorian Gray';
update books set genre = 'CRIME'    where title = 'The Adventures of Sherlock Holmes';
update books set genre = 'FANTASY'  where title = 'Dracula';
update books set genre = 'SCIFI'    where title = 'The Time Machine';

insert into books (owner_id, title, author_name, isbn, synopsis, genre, shareable, archived) values
    ('33333333-3333-3333-3333-333333333333', 'Emma', 'Jane Austen', '9780141439587',
     'Handsome, clever and rich — Emma Woodhouse arranges everyone''s lives but her own.', 'ROMANCE', true, false),
    ('33333333-3333-3333-3333-333333333333', 'The War of the Worlds', 'H. G. Wells', '9780141441030',
     'Martian cylinders fall on Surrey, and the Empire discovers it is not the apex.', 'SCIFI', true, false),
    ('33333333-3333-3333-3333-333333333333', 'Great Expectations', 'Charles Dickens', '9780141439563',
     'Pip, a convict on the marshes, and a fortune with strings attached.', 'CLASSIC', true, false),
    ('33333333-3333-3333-3333-333333333333', 'The Hound of the Baskervilles', 'Arthur Conan Doyle', '9780199536962',
     'A spectral hound stalks Dartmoor; Holmes suspects something more corporeal.', 'CRIME', true, false),
    ('11111111-1111-1111-1111-111111111111', 'Persuasion', 'Jane Austen', '9780141439686',
     'Eight years after saying no, Anne Elliot meets Captain Wentworth again.', 'ROMANCE', true, false),
    ('22222222-2222-2222-2222-222222222222', 'The Sign of the Four', 'Arthur Conan Doyle', '9780140439076',
     'A pearl a year, a one-legged man, and the Agra treasure.', 'CRIME', true, false),
    ('22222222-2222-2222-2222-222222222222', 'Twenty Thousand Leagues Under the Seas', 'Jules Verne', '9780143106678',
     'Captain Nemo opens the oceans to two guests who may never leave.', 'SCIFI', true, false);

-- Carla borrowed Ben's Dracula a month ago and never returned it: overdue.
insert into loans (book_id, borrower_id, borrowed_at, due_at)
select b.id, '33333333-3333-3333-3333-333333333333', now() - interval '30 days', now() - interval '9 days'
from books b where b.title = 'Dracula';

-- Alice is first in the queue for it.
insert into reservations (book_id, user_id, created_at)
select b.id, '11111111-1111-1111-1111-111111111111', now() - interval '3 days'
from books b where b.title = 'Dracula';

-- A few wishlist entries.
insert into wishlist (user_id, book_id)
select '11111111-1111-1111-1111-111111111111', b.id from books b where b.title = 'The War of the Worlds';
insert into wishlist (user_id, book_id)
select '22222222-2222-2222-2222-222222222222', b.id from books b where b.title = 'Pride and Prejudice';
