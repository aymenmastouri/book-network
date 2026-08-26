-- Aymen joins with a shelf of his own, and the community gets a past:
-- closed loans with feedback across many books (so ratings and the
-- best-rated sort mean something), live queues, and a second overdue loan.
-- Every feedback row is backed by a real closed loan — the seed obeys the
-- same rules the application enforces. Aymen's UUID matches
-- keycloak/realm/booknetwork-realm.json.

insert into users (id, email, first_name, last_name) values
    ('44444444-4444-4444-4444-444444444444', 'aymen@booknetwork.dev', 'Aymen', 'Mastouri');

insert into books (owner_id, title, author_name, isbn, synopsis, genre, shareable, archived) values
    ('44444444-4444-4444-4444-444444444444', 'The Count of Monte Cristo', 'Alexandre Dumas', '9780140449266',
     'Fourteen years in a dungeon buy a very long memory. Edmond Dantès collects.', 'CLASSIC', true, false),
    ('44444444-4444-4444-4444-444444444444', 'Around the World in Eighty Days', 'Jules Verne', '9780140449136',
     'Phileas Fogg bets his fortune on the timetable of the entire planet.', 'CLASSIC', true, false),
    ('44444444-4444-4444-4444-444444444444', 'Meditations', 'Marcus Aurelius', '9780140449334',
     'A Roman emperor''s private notes on how to stay decent when everything burns.', 'NONFICTION', true, false),
    ('44444444-4444-4444-4444-444444444444', 'The Art of War', 'Sun Tzu', '9780140439199',
     'Win first, fight later — twenty-five centuries of being quoted in meetings.', 'HISTORY', true, false),
    ('44444444-4444-4444-4444-444444444444', 'A Study in Scarlet', 'Arthur Conan Doyle', '9780140439083',
     'A word written in blood in Brixton, and the first meeting of Holmes and Watson.', 'CRIME', true, false),
    ('44444444-4444-4444-4444-444444444444', 'The Invisible Man', 'H. G. Wells', '9780141439983',
     'A scientist vanishes from sight and, shortly after, from decency.', 'SCIFI', true, false);

-- ---------------------------------------------------------------------------
-- History: closed loans, then the feedback they earned.
-- ---------------------------------------------------------------------------

insert into loans (book_id, borrower_id, borrowed_at, due_at, returned_at, approved_at)
select b.id, x.borrower, now() - x.ago, now() - x.ago + interval '21 days',
       now() - x.ago + x.kept, now() - x.ago + x.kept + interval '1 day'
from (values
    ('Pride and Prejudice',       '33333333-3333-3333-3333-333333333333'::uuid, interval '55 days', interval '12 days'),
    ('Emma',                      '22222222-2222-2222-2222-222222222222'::uuid, interval '48 days', interval '15 days'),
    ('The Time Machine',          '11111111-1111-1111-1111-111111111111'::uuid, interval '42 days', interval '9 days'),
    ('The Sign of the Four',      '33333333-3333-3333-3333-333333333333'::uuid, interval '38 days', interval '11 days'),
    ('Dracula',                   '44444444-4444-4444-4444-444444444444'::uuid, interval '70 days', interval '18 days'),
    ('Frankenstein',              '44444444-4444-4444-4444-444444444444'::uuid, interval '60 days', interval '13 days'),
    ('The Count of Monte Cristo', '22222222-2222-2222-2222-222222222222'::uuid, interval '33 days', interval '16 days'),
    ('A Study in Scarlet',        '33333333-3333-3333-3333-333333333333'::uuid, interval '28 days', interval '8 days'),
    ('Meditations',               '11111111-1111-1111-1111-111111111111'::uuid, interval '24 days', interval '10 days')
) as x(title, borrower, ago, kept)
join books b on b.title = x.title;

insert into feedbacks (book_id, author_id, rating, comment, created_at)
select b.id, x.author, x.rating, x.comment, now() - x.ago
from (values
    ('Pride and Prejudice',       '33333333-3333-3333-3333-333333333333'::uuid, 5,
     'Could not put it down. Mr. Collins alone is worth five stars.', interval '42 days'),
    ('Emma',                      '22222222-2222-2222-2222-222222222222'::uuid, 4,
     'Matchmaking as a contact sport.', interval '32 days'),
    ('The Time Machine',          '11111111-1111-1111-1111-111111111111'::uuid, 4,
     'Read it in one sitting; the far-future chapters are haunting.', interval '32 days'),
    ('The Sign of the Four',      '33333333-3333-3333-3333-333333333333'::uuid, 5,
     'Tighter than the first one. The boat chase!', interval '26 days'),
    ('Dracula',                   '44444444-4444-4444-4444-444444444444'::uuid, 3,
     'Longer than it needs to be, but the diary format still works.', interval '51 days'),
    ('Frankenstein',              '44444444-4444-4444-4444-444444444444'::uuid, 5,
     'The creature gets the best lines. Modern in every way that matters.', interval '46 days'),
    ('The Count of Monte Cristo', '22222222-2222-2222-2222-222222222222'::uuid, 5,
     'Revenge served properly cold, over a thousand pages. Worth every one.', interval '16 days'),
    ('A Study in Scarlet',        '33333333-3333-3333-3333-333333333333'::uuid, 4,
     'The Utah flashback surprised me, but what an introduction to Holmes.', interval '19 days'),
    ('Meditations',               '11111111-1111-1111-1111-111111111111'::uuid, 5,
     'I keep it on the nightstand now. One page fixes most days.', interval '13 days')
) as x(title, author, rating, comment, ago)
join books b on b.title = x.title;

-- ---------------------------------------------------------------------------
-- The present: a second overdue loan, live queues, more wishlists.
-- ---------------------------------------------------------------------------

-- Ben borrowed Carla's Great Expectations five weeks ago and still has it.
insert into loans (book_id, borrower_id, borrowed_at, due_at)
select b.id, '22222222-2222-2222-2222-222222222222', now() - interval '35 days', now() - interval '14 days'
from books b where b.title = 'Great Expectations';

-- Queues: Carla waits for Moby-Dick (Ben holds it), Alice for Great Expectations.
insert into reservations (book_id, user_id, created_at)
select b.id, '33333333-3333-3333-3333-333333333333', now() - interval '2 days'
from books b where b.title = 'Moby-Dick';
insert into reservations (book_id, user_id, created_at)
select b.id, '11111111-1111-1111-1111-111111111111', now() - interval '1 day'
from books b where b.title = 'Great Expectations';

insert into wishlist (user_id, book_id)
select '44444444-4444-4444-4444-444444444444', b.id from books b where b.title = 'Dracula';
insert into wishlist (user_id, book_id)
select '44444444-4444-4444-4444-444444444444', b.id from books b where b.title = 'The Adventures of Sherlock Holmes';
