# BookNetwork

BookNetwork is a community book-lending application: members put their own
books on a shared shelf, borrow from each other, hand books back, and rate
what they have read. Owners stay in control — a return only frees the book
once its owner approves it.

## Repository layout

| Folder | Contents |
| --- | --- |
| `booknetwork/` | Spring Boot 3.4 backend (Java 17, Maven). Domain modules for catalog, lending and feedback; PostgreSQL via Flyway; Keycloak as OAuth2 resource server. |
| `booknetwork-ui/` | Angular 19 web app. Standalone components, Tailwind CSS, runtime English/German switching via Transloco, typed API client generated from the committed `openapi.json`. |
| `booknetwork-e2e/` | Playwright end-to-end suite that drives the full lending arc through real Keycloak logins. |
| `keycloak/realm/` | The `booknetwork` realm, imported automatically at container start: open registration with e-mail verification, English and German login screens, SMTP wired to the local MailDev. |

## Running locally

```
docker compose up -d                     # PostgreSQL, Keycloak (9090), MailDev (1080)
cd booknetwork && ./mvnw spring-boot:run  # API on http://localhost:8088/api/v1
cd booknetwork-ui && npm ci && npm start  # UI on http://localhost:4201
```

Flyway creates the schema and seeds a small demo shelf on first start. Two
demo accounts ship with the realm: `alice@booknetwork.dev` and
`ben@booknetwork.dev`, both with password `booknetwork`. New members can
register themselves; the verification mail arrives in MailDev at
`http://localhost:1080`. All credentials in this repository are local
development values, not secrets.

## Domain rules

A book can be lent to one member at a time — enforced by a partial unique
index in the database, not only by application code. Members cannot borrow
or rate their own books, and feedback is reserved for members who actually
borrowed the book. Business-rule violations surface as machine-readable
codes (`already_borrowed`, `never_borrowed`, …) that the UI translates.

## API

The backend publishes its OpenAPI description at
`/api/v1/v3/api-docs` (Swagger UI at `/api/v1/swagger-ui.html`). The file
`booknetwork-ui/openapi.json` is the frozen copy the Angular client is
generated from; regenerate with `npx ng-openapi-gen` after API changes.

## End-to-end tests

```
cd booknetwork-e2e && npm ci && npx playwright install chromium && npm test
```

The suite expects the stack above to be running and leaves the data in the
state it found it.
