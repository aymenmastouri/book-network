-- BookNetwork core schema.
--
-- Users mirror Keycloak: the primary key IS the Keycloak subject, written by
-- the backend on first authenticated request. Nothing here stores passwords.

create table users (
    id          uuid primary key,
    email       text not null unique,
    first_name  text not null default '',
    last_name   text not null default '',
    created_at  timestamptz not null default now()
);

create table books (
    id          bigint generated always as identity primary key,
    owner_id    uuid not null references users (id),
    title       text not null,
    author_name text not null,
    isbn        text not null default '',
    synopsis    text not null default '',
    cover_path  text,
    shareable   boolean not null default true,
    archived    boolean not null default false,
    created_at  timestamptz not null default now()
);

create index idx_books_owner on books (owner_id);

create table loans (
    id          bigint generated always as identity primary key,
    book_id     bigint not null references books (id),
    borrower_id uuid not null references users (id),
    borrowed_at timestamptz not null default now(),
    returned_at timestamptz,
    approved_at timestamptz
);

-- One live loan per book, enforced by the database, not by application luck.
-- A loan is live until the owner approves the return.
create unique index idx_loans_one_active_per_book
    on loans (book_id) where approved_at is null;

create index idx_loans_borrower on loans (borrower_id);

create table feedbacks (
    id         bigint generated always as identity primary key,
    book_id    bigint not null references books (id),
    author_id  uuid not null references users (id),
    rating     int not null check (rating between 1 and 5),
    comment    text not null default '',
    created_at timestamptz not null default now()
);

create index idx_feedbacks_book on feedbacks (book_id);
