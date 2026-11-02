# Separate tax accounting, online and offline collection, website sync and production reset: delivery report

Branch: `feat/separate-tax-accounting` (from `main` at 0a44712). Not committed and not deployed. Every database test ran on a disposable copy that has since been dropped. The migration was applied to the local `nppdhanaura` development database on 2 Nov 2026 (see "Local migration" at the end). It has not been applied to production, and no reset has been run on either.

## 1. Audit findings

### Defects found and fixed

| # | Severity | Defect | Fix |
|---|---|---|---|
| 1 | Critical | **Online payments that included arrears were only partly recorded.** The citizen was charged the full balance, but the money was allocated only to the selected year. The arrears stayed "outstanding" after being paid. | The online flow now uses the same posting as the counter and covers every year. |
| 2 | Critical | **A verified online payment could stay "successful" with no ledger entry.** Allocation ran in a separate step, and a failure was only logged as a warning. | Status and ledger entry now commit in one transaction. If the database fails, both roll back and the gateway's retry processes it again. |
| 3 | High | **Status check accepted money without checking the amount.** The requery path marked a payment successful without comparing the gateway's amount. | The amount must match, as it already did for callbacks. A mismatch is refused and recorded in the audit log. |
| 4 | High | Online payments never got a stored receipt, so they could not be printed. | They now get the same receipt as a counter payment. |
| 5 | High | Citizens could pay online with no published demand. That money reached no ledger. | Refused with `DEMAND_NOT_PUBLISHED`. |
| 6 | Medium | **The dashboard's "All Ward Tax Collection" showed demand, not money collected.** | Relabelled as demand. A new **Payments Received** section shows real collections, per tax and per channel. |
| 7 | Medium | Public statistics could be up to about 10 minutes out of date (5-minute API cache plus 5-minute website cache). | The API figures update on commit. The website refreshes when told to, with a 60-second fallback. |

### Reported, not changed

| Finding | Why it needs you |
|---|---|
| **Online payment is switched off on the production website.** Commit `e1d875d` ("disable pay buttton") disables the button whenever `NODE_ENV === "production"`. | This looks deliberate, so I left it. Every online feature below stays unreachable on the live website until it is removed. |
| Online transaction IDs still start with `CHH-`, and import presets and test fixtures still refer to Chhata. | Harmless to the money, but a leftover from another municipality. Changing the prefix should be checked with the gateway first. |
| The demand notice prints `www.nppdhanaura.in` by default; your brief gives the website as `nppdhanaura.com`. Earlier briefs also gave the portal as `portal.npdhanaura.in`, this one as `portal.nppdhanaura.in`. | Please confirm the official addresses. |
| 7 older API tests fail (missing Ward 1/2 Excel fixtures, old `chhata` cookie names). They failed before this work too. | Separate clean-up. |

### Not supplied

The dashboard and sidebar screenshots, and the demand notice and Maswasi reference PDFs, were not attached to this request, so the existing notice and receipt layouts were kept. The UI/UX Pro Max skill is not installed here.

## 2. How the accounting works

Each year's balance is held in five separate buckets. They always add up to that year's existing outstanding figure, which is tested.

| Bucket | Contains |
|---|---|
| Property tax | Property tax, plus its own penalty, less its own rebate |
| Water tax | Water tax, plus its own penalty, less its own rebate |
| Drainage tax | Drainage tax, plus its own penalty, less its own rebate |
| Interest and other charges | Interest, approved debits, and any penalty published without a per-tax breakdown |
| Earlier balance (no tax split) | A verified closing balance imported as one figure. **It is never guessed into a tax.** |

Rules applied everywhere:

- Each tax settles on its own, oldest year first, so a liability keeps its original assessment year.
- **Nothing moves between taxes.** An amount above a tax's balance is refused at the counter.
- Money a gateway has already taken cannot be refused. If it no longer fits (for example the same tax was paid at the counter meanwhile), the excess is **held, flagged and left unallocated**. It shows on Online Transactions and on the receipt.
- A partial payment must say which tax it is for. Only a payment of the entire balance may omit the split, because there is then nothing to decide.
- **Existing records do not change.** Older allocations have no split; they settle first in the previous order, so no balance moves when the migration runs, and later payments cannot disturb what they settled.

This replaces the automatic split as the rule for new payments. The earlier open question about allocation order is answered by this brief for property and water tax. The old order now applies only to records made before this change and to amounts that name no tax, such as an unattributed rebate.

## 3. Modified files

**Backend, new:** `demands/tax-ledger.ts`, `collections/payment-settlement.service.ts`, `collections/settlement.module.ts`, `public-ward-stats/public-sync-outbox.ts`, `public-sync.service.ts`, `public-sync.controller.ts`, `production-reset/*`.

**Backend, changed:** `demands/outstanding.ts`, `demands/demands.service.ts`, `demands/dto/demands.dto.ts`, `collections/collection-rules.ts`, `collections.service.ts`, `collections.controller.ts`, `collections.dto.ts`, `collections.module.ts`, `receipt-html.ts`, `payments/payments.service.ts`, `payments.module.ts`, `public-property-tax/public-property-tax.service.ts`, `dto/create-public-payment.dto.ts`, `public-ward-stats/ward-stats.ts`, `public-ward-stats.service.ts`, `public-ward-stats.module.ts`, `dashboard/dashboard.service.ts`, `db/seed-database.ts`, `app.module.ts`, `scripts/render-print-samples.ts`, `prisma/schema.prisma`.

**Portal, new:** `collections/online/page.tsx`, `collections/website-sync/page.tsx`, `settings/production-reset/page.tsx`.

**Portal, changed:** `collections/page.tsx`, `collection-shared.tsx`, `layout.tsx`, `ledger/page.tsx`, `year-end/page.tsx`, `dashboard/page.tsx`, `components/app-nav.ts`.

**Website, new:** `app/api/revalidate/route.ts`. **Changed:** `components/propertytax/dues-page.tsx`, `lib/property-tax-api.ts`, `lib/ward-stats.ts`, `app/(web)/gis/page.tsx`, `locales/en.ts`, `locales/hi.ts`.

**Shared:** `packages/types/src/index.ts`, `packages/i18n/src/messages/en.ts`, `hi.ts`, `turbo.json`, `.env.example` files.

**Tests, new:** `collections/separate-tax.spec.ts`, `production-reset/production-reset.spec.ts`, `test/separate-tax.e2e-spec.ts`. **Updated:** `offline-collection.spec.ts`, `test/offline-collection.e2e-spec.ts`, `portal/e2e/collections.spec.ts`.

## 4. Database changes

Migration `20261102120000_separate_tax_accounting`, with `rollback.sql` beside it.

- `payment_allocation`: five nullable tax columns, and a database check that a split adds up exactly to the amount.
- `payment.taxPlan`: what was chosen, kept until a cheque clears or the gateway confirms.
- `demand_adjustment.taxBucket`: a credit or debit may name its tax.
- New tables `public_sync_event` (outbox) and `production_reset_run` (never deleted).
- New permission `system:production-reset`, not granted to any role. Super Admin passes through its role.

It adds only columns and tables, and changes no existing values.

## 5. APIs

| Change | Endpoint |
|---|---|
| New | `GET /api/v1/collections/online` (demand:read) |
| New | `GET /api/v1/public-sync/status` (report:read); `POST …/retry`, `POST …/reconcile` (settings:update) |
| New, Super Admin only | `GET`/`POST /api/v1/production-reset/preview`; `POST …/runs`; `POST`/`GET …/runs/:id/backup`; `POST …/runs/:id/request-approval`, `/approve`, `/cancel`, `/execute` |
| New, website | `POST /api/revalidate` (shared secret) |
| Changed | `POST /api/v1/collections` and `/preview` accept `taxKind` and `parts` and return `taxSummary` |
| Changed | `POST …/public-property-tax/payments` accepts `taxKind`; quote, ledger and dues include `taxPosition` |
| Changed | `GET …/year-end` includes `taxCarryForward`; `POST …/demands/:id/adjustments` accepts `taxBucket` |
| Changed | `GET /api/v1/public/ward-stats` adds per-tax collected figures, only when disclosure is on |

Portal: Tax Collection gains **Online Transactions** and **Website Sync**; Settings gains **Production Reset**.

## 6–12. Results against your examples

All figures below come from tests that ran.

| Requirement | Result |
|---|---|
| Ram pays only ₹2,400 property tax on ₹2,400 + ₹1,800 | Property ₹0 (Paid), Water ₹1,800 (Unpaid), total ₹1,800 |
| 2026-27: ₹1,800 water arrears + ₹2,000 new | Water payable ₹3,800; property arrears ₹0; arrears keep their original year |
| ₹1,500 property + ₹500 water | Property ₹900, Water ₹1,300, total ₹2,200 |
| ₹4,200 combined | One receipt, both cleared, one payment row |
| Excess on one tax | Refused; never moved to the other tax |
| Online property, water, combined | Only the chosen tax falls, using a simulated gateway (see the limits below) |
| Failed or pending online payment | No balance change, no receipt |
| Duplicate and concurrent callbacks | One allocation, one sync event |
| Payment overtaken at the counter | ₹2,000 held and flagged, water tax untouched |
| Reversal | Restores only the tax that was paid |
| Online and offline reach public figures | Per tax, immediately, with no double counting |
| Live check on a running API and website | ₹250 became ₹251, ₹1 under property tax; event `SENT`; refresh route 401 / 401 / 200 |
| Failed website refresh | Retries; figures unchanged; repeat changes no totals |
| Public response | Holds no property ID, name, mobile, remarks or receipt data |
| Reset refused for | Non-Super Admin even with the permission; server switch off; no backup; wrong phrase; short reason; a payment changed after review; second run; self-approval |
| Reset executed (on the copy) | Selected test payments cleared and balances restored; demands, property records, rebates and genuine payments unchanged; audit retained; backup hash verified; all report checks passed |
| Receipts | Property-only, water-only, combined; consumer and office copies; 11 print samples fit their expected pages |

### Production Reset: how test data is chosen

Nothing is treated as test data on a guess.

- **Included automatically:** only the sandbox gateway, or remarks or a counter code that begin with test, demo, sample, dummy or UAT.
- **Everything else needs a Super Admin to tick that one payment.** Payments confirmed by the live gateway are shown in red.
- **Never touched:** demands, property records, tax rates, rebates, penalties, users, roles, audit rows.
- The final step is off unless `PRODUCTION_RESET_ENABLED=true`. Nothing calls it on startup, migration, deployment or a timer; a test checks this.

The built-in backup holds only the affected rows. **Take a full database backup as well before using it.**

## 13–14. Tests and builds (2 Nov 2026)

| Suite | Result |
|---|---|
| API unit | 488 passed, **7 failed** (the same older failures: `proxy-to-api-helpers`, `column-maps`, `survey-excel-export`) |
| Real database, new (`separate-tax.e2e-spec`) | 28 passed |
| Real database, earlier (`offline-collection.e2e-spec`) | 11 passed |
| Portal browser (`collections.spec`) | 9 passed, including 7 pages at 360–1440 px and accessibility |
| Portal browser (`tax-admin.spec`) | 5 passed, **3 not passing because of the test data** (see the limits below) |
| Portal unit | 47 passed |
| Website unit | 13 passed |
| Print check | 11 samples fit their expected pages |
| Builds | types, api, portal and web all succeed |
| Lint | 0 errors (api 12, portal 16, web 6 warnings) |

### Limits of this testing

- **The real Atom gateway was not used.** Online tests used a simulated gateway calling the real callback and settlement code. Run one payment per tax on Atom UAT before go-live.
- **Three Tax Administration browser tests did not pass, and I did not change that area.** All three depend on what is in the database copy: 2025-26 dates are locked because demands exist; the default ward and year have no rate table; and "E2E property rebate" rows are left in your local database from an earlier run. They should be rerun on a clean database. Those three flows have no browser confirmation from this run.
- **Regression items 41–48** (survey, property lookup, reports, import, notice PDFs) were checked through their existing automated tests and builds, not by hand.
- **Phase 10:** this was not a full portal and website redesign. New and changed screens follow the existing design system.
- Screens were checked by automated browser tests, not used by clerks.

## 15. Remaining blockers and decisions

1. **Online payment is off on the live website** (commit `e1d875d`). Remove it when you are ready.
2. **Public collection figures stay hidden** until the department approves disclosure and `PUBLIC_DISCLOSE_COLLECTIONS=true` is set. Synchronisation works either way.
3. **Interest and other charges have no tax of their own** unless they were published per tax. They are paid through a combined payment. Please confirm that is acceptable.
4. **Earlier balances with no tax split** can be paid only through a combined payment, under their own heading. If you have the real split, it should be entered as verified history.
5. **Online payments settle the whole balance of the chosen tax.** Citizens cannot pay part of a tax online; partial payments are counter-only. Your online test list did not ask for partial payments.
6. **Drainage tax has no single-tax option.** It is paid through a combined payment.
7. **Held online money has no refund workflow.** It is flagged for the Accounts section; the refund itself is manual.
8. The older manual allocation endpoint (`payment:allocate`) still records no tax split. Such an allocation settles in the old order. It has no portal screen today.
9. **Receipt numbers after a reset** continue from the highest remaining receipt, so printed test receipts may share a number with later real ones. Destroy printed test receipts.
10. Rates, rebates, penalties and interest are not invented anywhere; they still come from approved Tax Administration rules. Hindi wording on the new receipt titles needs the Executive Officer's approval.

## 16. Deployment and rollback

```bash
# 1. Take a full backup
pg_dump -Fc "$DATABASE_URL" > before-separate-tax.dump

# 2. Apply the migration (adds columns and tables only)
pnpm --filter api exec prisma migrate deploy

# 3. Build and deploy API, portal and website together
pnpm build
```

The portal and website need the new API fields, so deploy them together.

**Environment variables**

| Variable | Where | Value |
|---|---|---|
| `WEB_REVALIDATE_URL` | API | `https://nppdhanaura.com/api/revalidate` (after confirming the address) |
| `WEB_REVALIDATE_SECRET` | API and website | The same long random value |
| `PUBLIC_DISCLOSE_COLLECTIONS` | API | `true` only after approval |
| `PRODUCTION_RESET_ENABLED` | API | Leave `false`. Set `true` only for the planned window, then back |
| `PRODUCTION_RESET_REQUIRE_SECOND_APPROVAL` | API | `true` if the department wants two Super Admins |

Your local development database also needs step 2 before the API runs on this code.

**On staging first:** post one property, one water and one combined payment at the counter; print both copies; check the ledger and year-end; run Website Sync → Run check; run one UAT payment per tax; run a reset on staging only.

**Rollback:** deploy the previous build. If no tax-split payment has been posted, run `rollback.sql` from the migration folder. Once real split payments exist, do not run it: it would discard the split. Restore from the backup or keep the columns, since the old code ignores them.

### Rerunning the database tests (never on production)

Make a copy whose name ends in `_it`, run `prisma migrate deploy` against it, then:

```bash
COLLECTIONS_IT_DATABASE_URL=postgresql://…/npdh_it pnpm --filter api exec jest --config ./test/jest-e2e.json test/separate-tax.e2e-spec.ts
```

Recreate the copy before running the other spec. `separate-tax.e2e-spec` runs a real production reset, so its name must never point at a live database.

## Local migration (2 Nov 2026)

The HTTP 500 errors under `pnpm dev` had one cause: the code expected migration `20261102120000_separate_tax_accounting`, which had not been applied to the local database. No migration needed repair.

- **Target checked:** `localhost:5433`, database `nppdhanaura`, `NODE_ENV=development`.
- **Backup:** `apps/api/tmp/db-backups/nppdhanaura-before-separate-tax-20261102.dump` (git-ignored, contains personal data). SHA-256 `9f0d252fd268f8fd97e6356cceef2b8a402df44ec763396ed9577cde0a6c9c26`. Restored to a throwaway database, and its row counts and totals matched.
- **Applied with:** `prisma migrate deploy`, after a rehearsal on the restored copy. `migrate dev` was avoided because it can offer to reset a database when it sees drift.
- **Data:** payments, allocations, demands, surveys and money totals are unchanged. The audit log grew by one row, from the test login.
- **Historical records:** `payment.taxPlan` and the allocation tax columns stay empty on old rows. No tax was guessed for them.
- **Schema:** two indexes existed in the database but not in `schema.prisma`. They were added to the schema, so nothing would try to drop them, and the schema-to-database diff is now empty.
- **Fix added:** a cheque or online payment accepted before this change has no tax plan. It now settles under the rule in force when it was accepted, instead of being refused or left unallocated.

Every other environment needs the same migration before running this code. That includes production, which needs your approval.
