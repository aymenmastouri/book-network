-- Demo shelf: the two realm users and a starting library, so a fresh start
-- greets the audience with a living app instead of an empty table.
-- The UUIDs match keycloak/realm/booknetwork-realm.json exactly.

insert into users (id, email, first_name, last_name) values
    ('11111111-1111-1111-1111-111111111111', 'alice@booknetwork.dev', 'Alice', 'Turner'),
    ('22222222-2222-2222-2222-222222222222', 'ben@booknetwork.dev',   'Ben',   'Okafor');

insert into books (owner_id, title, author_name, isbn, synopsis, shareable, archived) values
    ('11111111-1111-1111-1111-111111111111', 'Pride and Prejudice', 'Jane Austen', '9780141439518',
     'Elizabeth Bennet navigates manners, marriage and a certain Mr. Darcy.', true, false),
    ('11111111-1111-1111-1111-111111111111', 'Moby-Dick', 'Herman Melville', '9780142437247',
     'Captain Ahab hunts the white whale that took his leg — and his reason.', true, false),
    ('11111111-1111-1111-1111-111111111111', 'Frankenstein', 'Mary Shelley', '9780141439471',
     'A young scientist creates life and cannot live with what he made.', true, false),
    ('11111111-1111-1111-1111-111111111111', 'The Picture of Dorian Gray', 'Oscar Wilde', '9780141439570',
     'A portrait ages so its subject never has to — at a price.', false, false),
    ('22222222-2222-2222-2222-222222222222', 'The Adventures of Sherlock Holmes', 'Arthur Conan Doyle', '9780199536955',
     'Twelve cases for the consulting detective of 221B Baker Street.', true, false),
    ('22222222-2222-2222-2222-222222222222', 'Dracula', 'Bram Stoker', '9780141439846',
     'Letters and diaries trace a count from Transylvania to London.', true, false),
    ('22222222-2222-2222-2222-222222222222', 'The Time Machine', 'H. G. Wells', '9780141439976',
     'A traveller rides his machine to the year 802,701 and beyond.', true, false),
    ('22222222-2222-2222-2222-222222222222', 'Treasure Island', 'Robert Louis Stevenson', '9780141321004',
     'A map, a mutiny, and one Long John Silver.', true, true);

-- Ben has borrowed Alice's Moby-Dick and not returned it yet.
insert into loans (book_id, borrower_id, borrowed_at)
select b.id, '22222222-2222-2222-2222-222222222222', now() - interval '6 days'
from books b where b.title = 'Moby-Dick';

-- A finished loan with feedback: Alice read Ben's Sherlock Holmes.
insert into loans (book_id, borrower_id, borrowed_at, returned_at, approved_at)
select b.id, '11111111-1111-1111-1111-111111111111',
       now() - interval '30 days', now() - interval '20 days', now() - interval '19 days'
from books b where b.title = 'The Adventures of Sherlock Holmes';

insert into feedbacks (book_id, author_id, rating, comment, created_at)
select b.id, '11111111-1111-1111-1111-111111111111', 5,
       'Read it in two evenings. The Speckled Band alone is worth it.',
       now() - interval '19 days'
from books b where b.title = 'The Adventures of Sherlock Holmes';

insert into feedbacks (book_id, author_id, rating, comment, created_at)
select b.id, '22222222-2222-2222-2222-222222222222', 4,
       'Slow start, then it grabs you like the whale grabs the Pequod.',
       now() - interval '2 days'
from books b where b.title = 'Moby-Dick';
