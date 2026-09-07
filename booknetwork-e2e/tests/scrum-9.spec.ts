import { Browser, Page, expect, test } from '@playwright/test';

/** SCRUM-9: borrow count on the book API and the book detail view. */

async function signIn(browser: Browser, email: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await page.getByLabel(/E-?Mail/i).fill(email);
  await page.locator('#password').fill('booknetwork');
  await page.locator('#kc-login').click();
  await expect(page.getByRole('link', { name: 'BookNetwork' })).toBeVisible();
  return page;
}

interface BookDto {
  id: number;
  title: string;
  synopsis: string;
  borrowCount: number;
  [key: string]: unknown;
}

/**
 * The community shelf is GET /api/v1/books. Its siblings /books/mine and
 * /books/{id} must not be confused with it, so match on the exact pathname.
 */
function isBrowse(url: string): boolean {
  return new URL(url).pathname === '/api/v1/books';
}

/** Full-load the browse page and return the book list from the API response. */
async function loadBooks(page: Page): Promise<BookDto[]> {
  const loaded = page.waitForResponse((r) => isBrowse(r.url()) && r.request().method() === 'GET');
  await page.goto('/');
  const body = await (await loaded).json();
  return body.content ?? body;
}

/**
 * The shelf paginates AND hides a member's own books, so look a book up through
 * search — page-independent — and match the very request whose ?q= is the
 * title, so a stale initial load is never mistaken for the search.
 */
async function searchBook(page: Page, title: string): Promise<BookDto> {
  const loaded = page.waitForResponse((r) => {
    const u = new URL(r.url());
    return isBrowse(r.url()) && r.request().method() === 'GET' && u.searchParams.get('q') === title;
  });
  await page.getByPlaceholder('Search title or author…').fill(title);
  const body = await (await loaded).json();
  const books: BookDto[] = body.content ?? body;
  const book = books.find((b) => b.title === title);
  expect(book, `search for '${title}' returned no book`).toBeDefined();
  return book!;
}

// [AC1] The book API returns a borrow count for every book it returns.
test('[AC1] book API returns borrowCount for every book', async ({ browser }) => {
  const alice = await signIn(browser, 'alice@booknetwork.dev');
  const books = await loadBooks(alice);
  expect(books.length).toBeGreaterThan(0);
  for (const book of books) {
    expect(book, `book '${book.title}'`).toHaveProperty('borrowCount');
    expect(typeof book.borrowCount).toBe('number');
  }
  await alice.context().close();
});

// [AC1.1] The count reflects both returned and currently active borrow records.
// borrowCount counts every loan and is viewer-independent, but the shelf hides
// a member's own books — so look each book up as a member who does not own it:
//   Dracula   (Ben's)    → 1 active (Carla) + 1 returned (Aymen) = 2   [as Carla]
//   Moby-Dick (Alice's)  → 1 active (Ben) = 1                        [as Ben]
//   Sherlock  (Ben's)    → 1 returned (Alice) = 1                    [as Carla]
test('[AC1.1] borrowCount counts both returned and active loans', async ({ browser }) => {
  const carla = await signIn(browser, 'carla@booknetwork.dev');
  expect((await searchBook(carla, 'Dracula')).borrowCount).toBe(2);
  expect((await searchBook(carla, 'The Adventures of Sherlock Holmes')).borrowCount).toBe(1);
  await carla.context().close();

  const ben = await signIn(browser, 'ben@booknetwork.dev');
  expect((await searchBook(ben, 'Moby-Dick')).borrowCount).toBe(1);
  await ben.context().close();
});

// [AC1.1.1] The book detail view shows the count with a label a member understands.
// Dracula is Ben's, so open it as Carla (a non-owner) — 2 borrows in total.
test('[AC1.1.1] book detail view shows borrow count with a member-facing label', async ({ browser }) => {
  const carla = await signIn(browser, 'carla@booknetwork.dev');
  const dracula = await searchBook(carla, 'Dracula');

  await carla.goto(`/books/${dracula.id}`);
  await expect(carla.getByText('Times borrowed: 2')).toBeVisible();

  await carla.context().close();
});

// [AC1.1.1.1] A book that was never borrowed shows zero, never an empty field.
// The War of the Worlds is Carla's and has no loans; open it as Alice.
test('[AC1.1.1.1] never-borrowed book shows zero in the detail view', async ({ browser }) => {
  const alice = await signIn(browser, 'alice@booknetwork.dev');
  const war = await searchBook(alice, 'The War of the Worlds');

  await alice.goto(`/books/${war.id}`);
  await expect(alice.getByText('Times borrowed: 0')).toBeVisible();

  await alice.context().close();
});

// [AC1.1.1.1.1] Existing book endpoints keep their current response shape.
// Dracula as Carla (non-owner): the new field sits beside the old ones.
test('[AC1.1.1.1.1] book API response keeps existing fields alongside borrowCount', async ({ browser }) => {
  const carla = await signIn(browser, 'carla@booknetwork.dev');
  const dracula = await searchBook(carla, 'Dracula');

  expect(dracula).toHaveProperty('title');
  expect(dracula).toHaveProperty('synopsis');
  expect(dracula).toHaveProperty('borrowCount');

  await carla.context().close();
});
