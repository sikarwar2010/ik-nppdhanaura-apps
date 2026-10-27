# Offline collection, receipts, ledger and carry-forward — delivery report

Branch: `feat/offline-collection-ledger` (from `main` at fe7eb06). Internal portal and API only; `apps/web` is unchanged (`git diff --stat -- apps/web` is empty).

## What was already in place (kept, not rebuilt)

The existing design was sound and is reused as the single calculation engine:

- Year-wise `assessment_demand` rows, `payment_allocation` (payment → year), `demand_adjustment` (credits/debits), unverified historical balances, and a demand lock (`SELECT … FOR UPDATE`) during posting.
- Server receipt numbers from `receipt_sequence`, idempotency keys on `payment`, a stored `receiptSnapshot`, oldest-year-first allocation, pending cheque/draft/transfer with confirmation, and reversal that keeps the receipt and stamps it.
- Carry-forward is **derived**, never copied: a year's opening arrears are the earlier verified years' own unpaid balances. That is why arrears cannot be duplicated when a new year is created.

## What changed

| Area | Change |
|---|---|
| Allocation | Each payment is split by tax inside each year, in one shared order (`COMPONENT_ORDER`, `apps/api/src/demands/outstanding.ts`): interest/charges → penalty → drainage → water → property. Preview, posting, receipt, ledger and notice all use it. |
| Posting | `collect` stores the year-and-tax split on the receipt snapshot with `paymentId` and the collector's user ID. A confirmed cheque keeps the original collector and records who confirmed it. A payment dated today records the actual time. |
| Preview | `POST /api/v1/collections/preview` returns the exact split and remaining balance using the posting rule. Nothing is saved. |
| Receipts | Separate **consumer** and **office** copies of the same payment and receipt number. The office copy adds payment ID, status, collector ID, counter, instrument reference and who printed it, and is never on the consumer copy. A "PARTIAL PAYMENT RECEIVED — ₹X still due" banner and a tax-wise "how this payment was applied" table appear on both. Every print or PDF writes a `RECEIPT_PRINTED` audit row. Two copies share one A4 sheet for 1–2 years; 3+ years print each copy on its own page (never clipped). |
| Ledger | `GET /api/v1/collections/ledger` returns a chronological list of demands, rebates, historical payments, credits, charges, payments, reversals and pending instruments. Each entry has its year, tax split, running balance and per-year balance. It also returns year-wise opening and closing balances, the years still unpaid, and a `reconciles` check against the engine. Filters (year, date range, tax, status) are applied after balances are computed. |
| Year-end | `GET /api/v1/collections/year-end` is a reconciliation preview. Each year is checked as closing = opening + demand − rebates/credits − payments. Next-year opening arrears are compared with today's figures, and the report flags unverified history, pending instruments, payments without a demand, unassigned payments and gaps. `POST …/year-end/close` (needs `settings:update`, a reason, and acknowledgement of any flags) sets the year to CLOSED and writes `YEAR_END_CLOSED` with the totals. It changes no balances and refuses a second close. |
| Demand notice | A new strip: gross demand − rebate & credits − already paid = **net amount payable**. If those printed figures do not add up, the notice is marked "not confirmed". The existing year-wise arrears table and the "not treated as zero" warnings are unchanged. |
| Counter search | Search by property ID / PIN, owner name, house number, parcel number or property number, optionally narrowed to a ward. Inside a ward one character is enough, so a short house number like "7" finds the property. Results show ward and house number. |
| Payment time | Optional payment time (IST) beside the date. Blank keeps the old rule: today records the current time, an earlier date 12:00 noon. A day or time later than now is refused by the server (`COLLECTION_DATE_IN_FUTURE` / `COLLECTION_TIME_IN_FUTURE`, one minute of grace for clock drift) and by the form. The rule is the pure `collectionInstant` in `collection-rules.ts`. |
| Confirmation | After the server-checked review, "Post payment…" opens a confirmation dialog: consumer and property ID, assessment year, tax categories, years the money goes to, mode and reference, amount received, remaining balance and Paid / Partially paid. Posting happens only from the dialog. The payment form also lists the tax categories that make up the amount due (read-only; the clerk does not pick an allocation). |
| Portal: Collect | A guided flow: find property → confirm verified dues → enter payment → server-checked review → post → receipt. Posting is blocked when history is unverified. One idempotency key is used per reviewed request, and the button is disabled while posting. Quick actions after posting: print consumer, office or both copies, download PDF, view ledger, new collection. The ward overview, cards and table are kept. |
| Portal: Ledger, Receipts, Year-end | New ledger page (deep link `?surveyId=`), labelled receipt filters with copy-specific printing, and a new Year-end page and tab. |
| Fixes found on the way | **Printing never worked**: `window.open(…, "noopener")` returns `null`, so nothing was written; printing now uses a hidden iframe. Portal money no longer uses floating point. A sidebar list-structure accessibility error. Primary and destructive colours below WCAG AA (now ≥ 4.5:1). The language toggle's classes were never generated (white text on white). Pages scrolled sideways at 360–768 px because of the sidebar inset and grid `min-width: auto`, and because `sr-only` cells escaped their scroll containers. |

No database schema change was needed.

## Routes and APIs

New: `POST /api/v1/collections/preview` (payment:collect), `GET /api/v1/collections/ledger` (demand:read), `GET /api/v1/collections/year-end` (demand:read), `POST /api/v1/collections/year-end/close` (settings:update).
Changed: `GET /api/v1/collections/properties/search?q=&wardId=` (optional ward; results add `wardNumber`, `houseNo`); `POST /api/v1/collections` accepts optional `paymentTime` (HH:mm IST); `GET /api/v1/collections/receipts/:id[/pdf]?copy=consumer|office|both` (audited); `POST /api/v1/collections` and `/:id/confirm` responses now include `outstandingBefore` and `allocations`; `GET /api/v1/collections/quote` also returns father/husband name, ward number, house number, opening arrears, credits and debits.
Portal: `/collections` (redesigned), `/collections/ledger`, `/collections/receipts`, `/collections/year-end` (new).

## Tests and results (27 Oct 2026, second pass)

| Suite | Result |
|---|---|
| API unit (`pnpm --filter api test`) | 446 passed, 7 failed. The 7 failures are pre-existing and unrelated (`proxy-to-api-helpers`, `column-maps`, `survey-excel-export`: missing Ward 1/2 Excel fixtures and old cookie-name expectations). |
| New unit tests A–K plus payment time (`src/collections/offline-collection.spec.ts`) | 29 passed |
| Integration on a disposable DB copy (`test/offline-collection.e2e-spec.ts`) | 11 passed. New: ward and house-number search, a future payment time refused with nothing saved, and today's payment stamped with the current time. A partial ₹3,000/₹5,000; E same key twice and two concurrent requests → one payment and one allocation, then reversal restores ₹2,000; F copies; B ₹2,000 + ₹4,000 = ₹6,000; C ₹1,000 reduces the old year's property tax; D/J full payment, with every view at ₹0; G close once and refuse a second; H blocked without verified history; I PDF renders, no clipped cell, sheet ≤ 283 mm; K clerk refused reverse, adjust and close. |
| Print check (`scripts/render-print-samples.ts`) | All samples on the expected page count; no overflow |
| Portal unit | 38 passed |
| Portal e2e (`e2e/collections.spec.ts`, against the disposable DB) | 5 passed: guided partial payment (now through the confirmation dialog, with the tax categories and the future-time check), ledger, year-end, 5 pages × 360/390/768/1024/1440 px with no sideways scroll, and axe (no serious or critical findings) |
| Portal e2e (`e2e/tax-admin.spec.ts` layout and axe) | 3 passed (the 360 px Tax Rates overflow from the previous phase is fixed) |
| Builds | `api` and `portal` production builds succeed |
| Lint | 0 errors; remaining warnings are pre-existing undeclared env vars |

### Reproducing the database tests (never on production)

```bash
# 1. Make a disposable copy whose name ends in _it
docker exec -i nppdhanaura-postgres sh -c 'createdb -U "$POSTGRES_USER" npdh_it && pg_restore -U "$POSTGRES_USER" -d npdh_it --no-owner' < backup.dump
# 2. Integration tests
COLLECTIONS_IT_DATABASE_URL=postgresql://…/npdh_it pnpm --filter api exec jest --config ./test/jest-e2e.json test/offline-collection.e2e-spec.ts
# 3. Portal e2e: run the API with DATABASE_URL=…/npdh_it, seed one property, then
DATABASE_URL=…/npdh_it pnpm --filter api exec tsx test/fixtures/seed-collection-e2e.ts   # prints a property ID
E2E_COLLECTION_PROPERTY=<id> PLAYWRIGHT_BASE_URL=http://localhost:3100 pnpm --filter portal exec playwright test e2e/collections.spec.ts
```

The fixture script refuses any database whose name does not end in `_it`.

## Setup and deployment

1. No migration. Deploy the API and portal builds together: the portal uses the new endpoints and response fields.
2. Chromium must be available to the API for receipt PDFs (`pnpm --filter api exec playwright install chromium`, or `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`).
3. Give `payment:collect` to counter staff (CLERK already has it). Keep `payment:reverse`, `demand:adjust` and `settings:update` with supervisors and administrators.
4. Before production: run the year-end preview for the current year and resolve or record the flagged items, test-print one receipt (both copies) on the office printer, and run the integration tests against a fresh backup copy.

## Open policy questions and dependencies

1. **Allocation order within a year**: interest/charges → penalty → drainage → water → property is the rule already in the code. Please confirm it is the municipality's approved order. With ₹3,000 on a ₹3,000 property tax + ₹2,000 water tax demand, ₹2,000 goes to water tax and ₹1,000 to property tax. If the consumer may choose which tax to pay, that needs a written rule before it is built.
2. **Advance or excess payment**: still refused (no approved advance-payment workflow).
3. **Penalty and interest on old arrears**: nothing new is calculated; only amounts on published demands are shown. The rates, triggers and grace periods remain policy inputs.
4. **Receipt wording**: the Hindi labels, the "partial payment" message and the disclaimer need approval by the Executive Officer. The UP Government emblem is used as on the existing documents; please confirm whether a separate Nagar Palika seal should replace it.
5. **Historical data**: properties whose earlier configured years are not verified cannot be collected against, by design. They need verified opening balances (the existing opening-balance import) before counter collection.
6. **Year closing**: who may close a year (currently `settings:update`), and whether pending cheques must clear before closing.
7. **Local data**: yesterday's Tax Administration e2e rules are still in the local `nppdhanaura` database. A local backup from this morning was taken before today's tests; today's tests ran only on a disposable copy that has since been dropped.
