# Tax portal audit and implementation plan

Date: 26 October 2026 · Branch: `feat/tax-ledger-gis-branding` (cut from `main` at `2cd98a3`)

## 1. Architecture (as found)

| Layer | Location | Notes |
| --- | --- | --- |
| Public website | `apps/web` (Next.js 16) | Bilingual site + `/propertytax` search/pay (calls the API through `/api/*`) |
| Staff portal | `apps/portal` (Next.js 16, `portal.npdhanaura.in`) | Sidebar in `components/app-nav.ts`; tax screens under `app/(app)/collections`, `app/(app)/reports` |
| API | `apps/api` (NestJS 12, Prisma, PostgreSQL, Redis sessions) | Permissions enforced server-side by `@RequirePermission` |
| Schema | `apps/api/prisma/schema.prisma` + 17 migrations | Assessment-year demand ledger added on 2026-10-18/19 |

The production database and the deployed `portal.npdhanaura.in` server were **not** accessed. Everything below is from the repository.

### Financial model already in place (preserve)

- `AssessmentDemand`: one published row per property and assessment year (partial unique index). Stores property, water and drainage tax, penalty, interest, rebate, historical payments, the rule IDs and a verification status. Amounts are `Decimal(14,2)`.
- `PaymentAllocation` (ACTIVE/REVERSED) links each payment to the demands it settles. `DemandAdjustment` holds credit/debit adjustments with reversal links.
- `demands/money.ts`: Decimal arithmetic, half-up rounding to paise. No floats in ledger code.
- `demands/outstanding.ts`: the central ledger calculation. Year rows, carry-forward of arrears, per-component previous outstanding, and an `authoritative` flag that blocks collection when history is missing or unverified.
- `collections/collection-rules.ts`: oldest-year-first allocation and overpayment rejection.
- `collections.service.collect`: required idempotency key; demand rows locked `FOR UPDATE`; receipt numbers from `receipt_sequence` inside the same transaction; an immutable `receiptSnapshot` is stored and reprinted as-is.
- `POST /payments/:id/reversals` (`payment:reverse`): marks the payment REFUNDED and its allocations REVERSED, and writes an audit row.
- Demand notice view model, HTML and PDF (Playwright) generated from the same breakdown.

### Calculation trace (one property, one year)

1. Current-year components come from the published tax config for the ward and year (`tax/tax-calc.ts` → `calculateCurrent`).
2. Penalty: the active penalty policy if there is one, otherwise the tax-config penalty percent of property tax.
3. Rebate: the active rebate policy, applied once over the components its flags include (`assessment-charges.ts`).
4. `currentYearDemand` = property + water + drainage + penalty.
5. Year outstanding = currentYearDemand + interest + debits − credits − rebate − payments.
6. Total payable = earlier verified years' outstanding (opening arrears) + current year before payments. Net outstanding = total payable − payments allocated.

## 2. Defects and gaps found

| # | Finding | Evidence | Severity |
| --- | --- | --- | --- |
| 1 | **Only one rebate and one penalty policy can be active per year.** Activating any policy archives all others, so separate property-tax and water-tax rules cannot coexist. | `policies.service.ts activateRebate/activatePenalty` | High (requirement) |
| 2 | **Portal creates every rebate on property + water + drainage tax** and activates it in the same click. The reference notice's ₹420 rebate is 10% of ₹2,400 + ₹1,800, i.e. water tax was discounted too. | `financial-panels.tsx createRebate` | High (policy) |
| 3 | Demand notice address falls back to **"Nagar Panchayat Chhata"** when a survey has no city (visible on the reference notice). | `demand-notice-view-model.ts:110` | High (official document) |
| 4 | Payment gateway fallback e-mail is `citizen@nagar-panchayat-chhata.in`. | `atom-ndps.provider.ts:237` | Medium |
| 5 | Demand notice ALV table is clipped and overlaps the summary ("Gro nd Floor", "ith R C C Roof"); the ward cell overlaps the next row; the tax column header reads "TAX (10)" without %. | Reference PDF | Medium |
| 6 | A reversed payment's receipt still reprints as a valid receipt. The reversal reason, time and user exist only in the audit log. | `reversePayment`, `receipt-html.ts` | Medium |
| 7 | The receipt has no emblem and omits PIN ID, father/husband name, house number, locality and a clear partial-payment label. | `receipt-html.ts` vs. Maswasi reference | Medium |
| 8 | The staff dashboard estimates ward demand by re-running the tax formula with JavaScript numbers. That is a second calculation path, not the published ledger. | `dashboard-tax.util.ts` | Low (the public view must not reuse it) |
| 9 | No public ward-level statistics API; no ward geometry anywhere in the schema or fixtures. | schema, `fixtures/gis` | Requirement |
| 10 | 7 failing tests on `main`: 3 still expect `chhata_session` cookie names, 4 need `fixtures/survey/Ward 1.xlsx` and `Ward 2.xlsx`, which are not in the repo. | `jest` baseline: 360 passed / 7 failed | Pre-existing |

## 3. Plan (implemented in this branch)

1. **Per-category rules.** Add `taxCategory` (`COMBINED` default, `PROPERTY_TAX`, `WATER_TAX`, `DRAINAGE_TAX`) to rebate and penalty policies through an additive migration. Existing rows become `COMBINED` and behave exactly as before. Activation only archives the same year **and** category. COMBINED and per-category rules are mutually exclusive within a year so nothing is applied twice. Each category rule acts only on its own component, plus that category's own previous-year arrears when `includeArrears` is set. The per-category breakdown and rule IDs are stored on the published demand (`chargeBreakdown`).
2. **Portal tax administration.** Separate Property-tax and Water-tax rebate and penalty screens (drainage only if configured), with a draft → approve → activate flow instead of the one-click create-and-activate. Sidebar restructured to the requested groups, with existing routes kept.
3. **Receipts.** Dhanaura emblem and identity, the reference fields mapped to our schema, an explicit "Part payment — balance due" panel, and a printed REVERSED/CANCELLED stamp with reason, user and time stored on the payment (additive columns).
4. **Fix identity leaks** (Chhata fallbacks) and the notice table clipping.
5. **Public GIS / ward statistics.** New read-only `GET /api/v1/public/ward-stats` that aggregates **published ledger rows** (not the dashboard estimate) and returns ward-level totals only. Collection and outstanding totals are off unless `PUBLIC_DISCLOSE_COLLECTIONS=true`. The website gets a `/gis` page as a labelled ward directory (no invented boundaries).
6. **Logo.** The supplied UP Government emblem goes on the website header and footer, receipts, the notice and the portal sidebar, through one branding component per app.
7. **Tests A–L** in Jest at the calculation and rule layer, plus HTML render checks for the receipt and notice.

## 4. Not done without approval

- No migration is run against production; the new migrations are additive and nullable.
- No change to historical balances, published demands or issued receipts.
- No penalty, interest or rebate rates are seeded. The office must enter and approve them.
- The Hindi legal text on the notice is unchanged. Note: it gives the website as `www.nppdhanaura.in`, but the public site is `nppdhanaura.com`. Needs the Executive Officer's decision.
