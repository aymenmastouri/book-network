import { Browser, Page, Response, expect, test } from '@playwright/test';

/**
 * SCRUM-9 — the borrow count.
 *
 * The book API ships a `borrowCount` on every book, and the detail view shows
 * it to a member as "Times borrowed: N". The count is the number of loans the
 * book has ever had — returned and still out the door alike (V1 loans, no
 * filter). Ground truth is the seeded shelf (V2–V5 migrations):
 *
 *   Dracula              2 — Carla's live overdue loan + Aymen's closed loan
 *   A Study in Scarlet   1 — one closed (returned) loan
 *   The War of the Worlds 0 — never borrowed
 *
 * None of those books is touched by the sibling specs (lending-arc,
 * reservation-arc, discovery), so their counts are the seeded values no matter
 * which tests have already run against this stack. The API runs on :8088 while
 * the UI is on :4201, so a book's API body is read straight from the page's own
 * XHR (the bearer token rides along automatically), and the label is asserted on
 * the rendered detail view.
 */

const BOOKS = 'localhost:8088/api/v1/books';

/** The community-shelf list call: /books always carries a query string. */
const isBrowseList = (r: Response) =>
  r.request().method() === 'GET' && r.url().includes(`${BOOKS}?`);

/** The single-book call: /books/{id} ends on the id (never /books/{id}/cover). */
const isBookDetail = (r: Response) =>
  r.request().method() === 'GET' && r.url().match(/\/api\/v1\/books\/\d+$/);

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

/** Re-load the community shelf and read the exact body the API returned. */
async function browseList(page: Page): Promise<any> {
  const done = page.waitForResponse(isBrowseList);
  await page.getByRole('button', { name: 'All genres' }).click();
  return (await done).json();
}

/**
 * Search for a book on the community shelf and open its detail page. Returns
 * the body of the /books/{id} call the page made, and leaves the page on the
 * detail route so the caller can assert the rendered view too.
 */
async function openDetail(page: Page, search: string): Promise<any> {
  await page.goto('/books');
  const searchBox = page.getByPlaceholder('Search title or author…');
  await expect(searchBox).toBeVisible();
  await searchBox.fill(search);
  const card = page.locator('article').filter({ hasText: new RegExp(search, 'i') });
  await expect(card.first()).toBeVisible();
  const detail = page.waitForResponse(isBookDetail);
  await card.first().locator('a.block').first().click();
  return (await detail).json();
}

test('[AC1] every book the API returns carries a numeric borrow count', async ({ browser }) => {
  const alice = await signIn(browser, 'alice@booknetwork.dev');

  // The shelf page is the biggest single sample of "every book it returns".
  const list = await browseList(alice);
  expect(Array.isArray(list.content), 'the shelf did not return a content array').toBeTruthy();
  expect(list.content.length).toBeGreaterThan(0);
  for (const book of list.content) {
    expect(typeof book.borrowCount).toBe('number', `book "${book.title}" has no numeric borrowCount`);
    expect(book.borrowCount).toBeGreaterThanOrEqual(0);
  }

  await alice.context().close();
});

test('[AC2] the count reflects both returned and still-active loans', async ({ browser }) => {
  const alice = await signIn(browser, 'alice@booknetwork.dev');

  // Dracula: one live overdue loan (Carla) plus one closed loan (Aymen). Both
  // are counted, so the number is 2 — not just the active one, not just the
  // returned one.
  const dracula = await openDetail(alice, 'dracula');
  expect(dracula.title).toBe('Dracula');
  expect(dracula.borrowCount).toBe(2);

  // A book whose only loan is a finished one still counts it: returned records
  // are part of the number, not just the loans out the door right now.
  const scarlet = await openDetail(alice, 'scarlet');
  expect(scarlet.title).toBe('A Study in Scarlet');
  expect(scarlet.borrowCount).toBe(1);

  await alice.context().close();
});

test('[AC3] the detail view shows the count under a member-understandable label', async ({ browser }) => {
  const alice = await signIn(browser, 'alice@booknetwork.dev');

  // On the rendered detail page the count sits under a plain-words label a
  // member understands, not a raw number.
  await openDetail(alice, 'dracula');
  await expect(alice.getByText(/Times borrowed:\s*2/)).toBeVisible();

  await alice.context().close();
});

test('[AC4] a book that was never borrowed shows zero, never an empty field', async ({ browser }) => {
  const alice = await signIn(browser, 'alice@booknetwork.dev');

  // The War of the Worlds has no loans in the seed.
  await openDetail(alice, 'worlds');

  // The label is rendered with a zero; the field is present, not blank.
  await expect(alice.getByText(/Times borrowed:\s*0/)).toBeVisible();
  await expect(alice.getByText('Times borrowed:')).toHaveCount(1);

  await alice.context().close();
});

test('[AC5] existing book endpoints keep their shape; the count is additive', async ({ browser }) => {
  const alice = await signIn(browser, 'alice@booknetwork.dev');

  // Every field the generated client always knew about is still serialised on
  // both the list endpoint and the single-book endpoint, with the count added.
  const shape = [
    'id', 'title', 'authorName', 'isbn', 'synopsis', 'genre', 'ownerId',
    'ownerName', 'shareable', 'archived', 'rating', 'borrowed',
    'borrowedByMe', 'mine', 'hasCover', 'wishlisted', 'reservedByMe', 'queueLength',
  ];
  const hasField = (body: any, field: string) => field in body;

  const list = await browseList(alice);
  const listItem = list.content[0];
  for (const field of shape) {
    expect(hasField(listItem, field)).toBe(true, `list item lost its "${field}" field`);
  }

  const detail = await openDetail(alice, 'dracula');
  for (const field of shape) {
    expect(hasField(detail, field)).toBe(true, `detail lost its "${field}" field`);
  }
  expect(detail.title).toBe('Dracula');
  expect(detail.authorName).toBe('Bram Stoker');
  expect(detail.genre).toBe('FANTASY');
  expect(typeof detail.borrowCount).toBe('number');

  await alice.context().close();
});
