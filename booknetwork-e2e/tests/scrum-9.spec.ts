import { Browser, Page, expect, test } from '@playwright/test';

/**
 * SCRUM-9: the borrow count — how often a book has already been borrowed —
 * is exposed by the book API and shown on the book detail page.
 *
 * Seed ground truth (from the migrations, total loans per book):
 *   Dracula                            2  (Carla's live + Aymen's returned)
 *   The Adventures of Sherlock Holmes  1  (Alice's returned)
 *   Moby-Dick                          1  (Ben's live)
 *   The War of the Worlds              0  (never borrowed)
 */

interface Book {
  id?: number;
  title?: string;
  authorName?: string;
  queueLength?: number;
  borrowCount?: number;
  [key: string]: unknown;
}

async function signIn(browser: Browser, email: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await page.getByLabel(/E-?Mail/i).fill(email);
  await page.locator('#password').fill('booknetwork');
  await page.locator('#kc-login').click();
  // The post-login shell can take a while to render under load; give the
  // landing link a generous window instead of the 5s default.
  await expect(page.getByRole('link', { name: 'BookNetwork' })).toBeVisible({ timeout: 30_000 });
  return page;
}

/**
 * Open a book's detail page. Each shelf card carries two links named by the
 * title (the cover link and the title link), so clicking by name is ambiguous;
 * and the community shelf hides the viewer's own books, so a title search can
 * find nothing at all. Resolve the id through the browse API and go straight
 * to the detail route instead.
 */
async function openDetail(page: Page, title: string): Promise<void> {
  const book = (await booksFor(page, title)).find((b) => b.title === title);
  expect(typeof book?.id, `book "${title}" not found via the browse API`).toBe('number');
  await page.goto(`/books/${book!.id}`);
}

/** The book API response the UI itself makes for a given search query. */
async function booksFor(page: Page, query: string): Promise<Book[]> {
  const loaded = page.waitForResponse((r) => {
    const url = new URL(r.url());
    return url.pathname === '/api/v1/books' && url.searchParams.get('q') === query;
  });
  await page.getByPlaceholder('Search title or author…').fill(query);
  const body = await (await loaded).json();
  return (body.content ?? []) as Book[];
}

/** The full community shelf the UI loads on the browse page. */
async function shelf(page: Page): Promise<Book[]> {
  const loaded = page.waitForResponse((r) => {
    const url = new URL(r.url());
    return url.pathname === '/api/v1/books' && r.request().method() === 'GET';
  });
  await page.goto('/');
  const body = await (await loaded).json();
  return (body.content ?? []) as Book[];
}

test('[AC1] the book API returns a borrowCount for every book it returns', async ({ browser }) => {
  const alice = await signIn(browser, 'alice@booknetwork.dev');
  const books = await shelf(alice);
  expect(books.length).toBeGreaterThan(0);
  for (const b of books) {
    expect(b, `book "${b.title}" is missing borrowCount`).toHaveProperty('borrowCount');
    expect(typeof b.borrowCount).toBe('number');
  }
  await alice.context().close();
});

test('[AC2] the borrow count reflects both returned and active loans', async ({ browser }) => {
  const alice = await signIn(browser, 'alice@booknetwork.dev');

  // Dracula: Carla's live (overdue) loan + Aymen's returned loan = 2.
  const dracula = (await booksFor(alice, 'Dracula')).find((b) => b.title === 'Dracula');
  expect(dracula?.borrowCount).toBe(2);

  // Sherlock Holmes: Alice's returned loan = 1 (returned records count).
  const sherlock = (await booksFor(alice, 'Sherlock')).find(
    (b) => b.title === 'The Adventures of Sherlock Holmes');
  expect(sherlock?.borrowCount).toBe(1);

  // Great Expectations: Ben's live loan = 1, and it has never been returned —
  // so its count comes purely from the active record, never a returned one.
  // (Moby-Dick is Alice's own book, which the community shelf does not show her.)
  const great = (await booksFor(alice, 'Great Expectations')).find(
    (b) => b.title === 'Great Expectations');
  expect(great?.borrowCount).toBe(1);

  await alice.context().close();
});

test('[AC3] the book detail view shows the count with a label', async ({ browser }) => {
  const alice = await signIn(browser, 'alice@booknetwork.dev');
  await openDetail(alice, 'Dracula');
  // The detail page renders "<label>: <count>"; Dracula has been borrowed twice.
  await expect(alice.locator('span').filter({ hasText: /: 2$/ })).toBeVisible();
  await alice.context().close();
});

test('[AC4] a never-borrowed book shows zero, never an empty field', async ({ browser }) => {
  const alice = await signIn(browser, 'alice@booknetwork.dev');
  await openDetail(alice, 'The War of the Worlds');
  // The War of the Worlds has no loan records; the detail page shows 0.
  await expect(alice.locator('span').filter({ hasText: /: 0$/ })).toBeVisible();
  await alice.context().close();
});

test('[AC5] existing book endpoints keep their current response shape', async ({ browser }) => {
  const alice = await signIn(browser, 'alice@booknetwork.dev');
  const books = await shelf(alice);
  expect(books.length).toBeGreaterThan(0);
  for (const b of books) {
    // The pre-existing fields are still there ...
    expect(b).toHaveProperty('id');
    expect(b).toHaveProperty('title');
    expect(b).toHaveProperty('authorName');
    expect(b).toHaveProperty('queueLength');
    // ... and the new field is additive, not a replacement.
    expect(b).toHaveProperty('borrowCount');
  }
  await alice.context().close();
});

test('[AC7] the API exposes only the plain borrow count, no ranking or extra statistics', async ({ browser }) => {
  const alice = await signIn(browser, 'alice@booknetwork.dev');
  const books = await shelf(alice);
  expect(books.length).toBeGreaterThan(0);
  // The BookResponse shape is the pre-existing fields plus the plain number.
  const allowed = new Set([
    'id', 'title', 'authorName', 'isbn', 'synopsis', 'genre',
    'ownerId', 'ownerName', 'shareable', 'archived', 'rating',
    'borrowed', 'borrowedByMe', 'mine', 'hasCover', 'wishlisted',
    'reservedByMe', 'queueLength', 'borrowCount',
  ]);
  for (const b of books) {
    for (const key of Object.keys(b)) {
      expect(allowed.has(key), `unexpected field "${key}" on book "${b.title}"`).toBe(true);
    }
  }
  await alice.context().close();
});
