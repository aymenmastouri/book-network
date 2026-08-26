# BookNetwork

*Share your shelf.* BookNetwork is a community book-lending application:
members put their own books on a shared shelf, borrow from each other, hand
books back, and rate what they have read. Owners stay in control — a return
only frees a book once its owner approves it.

![Java 17](https://img.shields.io/badge/Java-17-b07219)
![Spring Boot 3.4](https://img.shields.io/badge/Spring%20Boot-3.4-6db33f)
![Angular 19](https://img.shields.io/badge/Angular-19-dd0031)
![Keycloak 24](https://img.shields.io/badge/Keycloak-24-4d4d4d)
![Playwright](https://img.shields.io/badge/E2E-Playwright-2ead33)

Beyond the lending core, members search and filter the shelf by genre, sort
by rating, bookmark books on a wishlist, browse each other's shelves, and
queue for borrowed books — when the owner approves a return, the book is lent
straight to the first reservation and its holder is told by mail. Loans carry
a three-week due date and show up as overdue when it passes. The interface
speaks English and German and switches at runtime, without a reload; a dark
theme is one click away. Business rules surface as machine-readable codes
that the UI translates — the backend never ships display text.

| Community shelf | Book detail with feedback |
| --- | --- |
| ![Community shelf](docs/screenshots/community-shelf.png) | ![Book detail](docs/screenshots/book-detail.png) |

| Runtime language switch | Dark theme |
| --- | --- |
| ![My shelf in German](docs/screenshots/my-shelf-de.png) | ![Dark mode](docs/screenshots/dark-mode.png) |

## Architecture

```mermaid
flowchart LR
    subgraph Browser
        UI["Angular 19 SPA<br/>localhost:4201"]
    end
    UI -->|"OIDC login (PKCE)"| KC["Keycloak 24<br/>realm booknetwork<br/>localhost:9090"]
    UI -->|"REST + Bearer token"| API["Spring Boot 3.4 API<br/>localhost:8088/api/v1"]
    API -->|"validates JWT"| KC
    API --> DB[("PostgreSQL 15<br/>schema by Flyway")]
    KC -->|"verification mail"| MAIL["MailDev<br/>localhost:1080"]
```

The backend is a stateless OAuth2 resource server; identity lives entirely in
Keycloak, and the application mirrors only what it needs to attach books,
loans and feedback to a person. Catalog, lending and feedback are separate
modules that reference each other by id — list queries carry their
cross-module facts (average rating, availability) in a single statement, and
the invariant "one live loan per book" is enforced by a partial unique index
in the database rather than by application luck.

## Getting started

Prerequisites: Docker, JDK 17, Node 20+.

```bash
docker compose up -d                     # PostgreSQL, Keycloak (9090), MailDev (1080)
cd booknetwork && ./mvnw spring-boot:run # API on http://localhost:8088/api/v1
cd booknetwork-ui && npm ci && npm start # UI on http://localhost:4201
```

Keycloak imports the `booknetwork` realm on first start; Flyway creates the
schema and seeds a small demo shelf. Two demo accounts ship with the realm —
`alice@booknetwork.dev` and `ben@booknetwork.dev`, password `booknetwork`.
New members can register themselves: the verification mail arrives in MailDev
at `http://localhost:1080`. Every credential in this repository is a local
development value, not a secret.

## Domain rules

A book can be lent to one member at a time. Members cannot borrow, reserve or
rate their own books, only the borrower can return a loan, only the owner can
approve the return, and feedback is reserved for members who actually
borrowed the book. Reserving is only possible while someone else holds the
book — a free book is simply borrowed — and each member holds at most one
place per queue, enforced by a partial unique index just like the single live
loan per book. Violations answer with `409` and a stable code
(`already_borrowed`, `never_borrowed`, `book_available`, `not_owner`, …).

Notifications are plain mail, sent best-effort so a failing SMTP never breaks
the business operation: the owner hears about borrows and returns, the
borrower about approvals, and the first in the queue when a book becomes
theirs. Locally everything lands in MailDev.

## API

The backend publishes its OpenAPI description at `/api/v1/v3/api-docs`
(Swagger UI at `/api/v1/swagger-ui.html`). The frozen copy
`booknetwork-ui/openapi.json` is the source the typed Angular client is
generated from — regenerate with `npx ng-openapi-gen` after API changes.

## Tests

```bash
cd booknetwork-e2e && npm ci && npx playwright install chromium && npm test
```

The Playwright suite drives the app through real Keycloak logins: the full
lending arc, the reservation queue with all three members (including the
automatic hand-over and its notification mail), and the discovery loop of
search, genre filter and wishlist. Every spec restores the state it found and
heals leftovers of a crashed earlier run, so the suite can run repeatedly
against the same stack.

## Repository layout

| Folder | Contents |
| --- | --- |
| `booknetwork/` | Spring Boot backend: catalog, lending and feedback modules, Flyway migrations, Keycloak resource-server security. |
| `booknetwork-ui/` | Angular web app: standalone components, Tailwind CSS, Transloco i18n, generated API client. |
| `booknetwork-e2e/` | Playwright end-to-end suite. |
| `keycloak/realm/` | Realm definition, imported automatically at container start. |
| `docs/` | Screenshots and documentation assets. |

## License

Apache License 2.0 — see [LICENSE](LICENSE).
