-- Community features, wave two: genres on books, due dates on loans,
-- reservations with a fair queue, and a personal wishlist.

alter table books
    add column genre text not null default 'OTHER'
        check (genre in ('CLASSIC', 'CRIME', 'SCIFI', 'FANTASY', 'ROMANCE', 'HISTORY', 'NONFICTION', 'OTHER'));

-- Existing loans get their due date from when they were borrowed, not from
-- when this migration happens to run.
alter table loans add column due_at timestamptz;
update loans set due_at = borrowed_at + interval '21 days';
alter table loans alter column due_at set not null;
alter table loans alter column due_at set default (now() + interval '21 days');

create table reservations (
    id           bigint generated always as identity primary key,
    book_id      bigint not null references books (id),
    user_id      uuid not null references users (id),
    created_at   timestamptz not null default now(),
    fulfilled_at timestamptz,
    canceled_at  timestamptz
);

-- A member queues at most once per book; the queue itself is created_at order.
create unique index idx_reservations_one_active_per_user_book
    on reservations (book_id, user_id) where fulfilled_at is null and canceled_at is null;

create index idx_reservations_book on reservations (book_id);

create table wishlist (
    id         bigint generated always as identity primary key,
    user_id    uuid not null references users (id),
    book_id    bigint not null references books (id),
    created_at timestamptz not null default now(),
    unique (user_id, book_id)
);
