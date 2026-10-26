# Tax portal and public GIS: delivery report

Date: 26 October 2026 · Branch: `feat/tax-ledger-gis-branding` · Audit and plan: [AUDIT-AND-PLAN.md](AUDIT-AND-PLAN.md)

Everything below was implemented and tested in this repository. Nothing was deployed. The production server, production database and `portal.npdhanaura.in` were not accessed.

## 1. What changed

### Separate property-tax and water-tax rebates and penalties

- Rebate and penalty policies now have a **tax category**: `PROPERTY_TAX`, `WATER_TAX` or `DRAINAGE_TAX`. `COMBINED` is the old single rule, and every existing policy keeps that value and behaves exactly as before.
- **One active rule per year and tax.** Activating a water-tax rebate no longer archives the property-tax rebate. A combined rule and tax-specific rules are never active together (activation archives the other kind, and the calculation refuses the mix), so no tax is discounted twice.
- **A rule only touches its own tax.** A property-tax rebate never reduces water tax.
- **Arrears only when explicitly allowed.** Previous-year arrears are included only when the rule says so, and then only that tax's own unpaid arrears (from the ledger's per-component carry-forward).
- **Interest stays combined.** Interest is not split by tax, so only a combined rule can include it.
- **Record of every published demand.** Each newly published demand stores a `chargeBreakdown`: per-tax base, rebate, penalty and rule IDs, plus the calculation time. Published demands are never recalculated.
- **Approval flow.** New portal screens follow draft → **Approve & activate** (a confirmation dialog shows what it replaces, and the approver and time are recorded) → **Archive**. The old screen created *and* activated a rebate in one click, always over property + water + drainage tax. That one click was the cause of the ₹420 rebate on the reference notice.

### Receipts

- **New layout:** UP Government emblem, Hindi/English heading, receipt number, financial year, date and time. Assessee details on one side (PIN/property ID, owner, father/husband, ward, house number, locality, masked mobile, demand reference) and tax details on the other (arrears, property, water and drainage tax, penalty, interest, rebate, total payable).
- **Payment summary:** outstanding before payment | amount received | balance due | mode and reference, followed by a status line:
  - "**PART PAYMENT — ₹2,000.00 STILL DUE / आंशिक भुगतान — ₹2,000.00 शेष बकाया**", or
  - "FULLY PAID for the amounts shown".
- **Reversals are kept, not deleted.** A reversed payment's receipt still reprints, with a **REVERSED / निरस्त** stamp, the reason, who reversed it and when. These are stored on the payment (`reversedAt`, `reversedById`, `reversalReason`) and backfilled from audit logs for earlier reversals.
- **Concurrency.** Reversal now locks the affected demand rows (`FOR UPDATE`).
- **Confirmation step.** The portal's reverse action now opens a dialog showing the receipt, amount and property, with a required reason.
- **Print check.** Office and customer copies fit one A4 page; `scripts/render-print-samples.ts` checks this.

### Demand notice

- The address no longer falls back to "**Nagar Panchayat Chhata**" (it was on the reference notice).
- **Assessment table and spec rows fixed.** The ALV table is no longer squeezed and clipped by a fixed-height page, and wrapped ward names no longer overlap the next row.
- **Long notices flow on.** A notice with many floors now continues onto the next page instead of being cut off.
- **Header fixes.** The tax column reads "Tax (10%)", and the emblem is embedded, so a PDF never shows a broken image.
- The same fixes were applied to the portal's duplicate notice template, which is currently not used by any page.
- The legal Hindi text is unchanged.

### Identity leaks fixed

- Payment-gateway e-mail fallback `citizen@nagar-panchayat-chhata.in` replaced by the office e-mail (`ATOM_FALLBACK_EMAIL` overrides it).
- Portal notice host fallback `www.npgovardhan.org` replaced by `www.nppdhanaura.in`.

### Public GIS and ward-wise tax page (`/gis` on the website)

- **New API:** `GET /api/v1/public/ward-stats?assessmentYear=` is public, read-only, rate-limited to 60/min and cached for 5 min.
- **Data source.** It aggregates **published, verified ledger rows**, not the staff dashboard's float estimate.
- **Ward-level totals only.** No owner, mobile, address, property ID or payment detail is returned (tested).
- **Collections stay hidden.** Collected and outstanding totals appear only when `PUBLIC_DISCLOSE_COLLECTIONS=true`.
- **What the page shows:**
  - year and ward filters (a plain form, so it works without JavaScript);
  - summary tiles labelled with the year;
  - one card per ward: surveyed count and a demand-publication progress bar with its real denominator (published ÷ surveyed), plus property, water and drainage tax and total demand;
  - a single-series bar chart, a full table, and the calculation basis;
  - a privacy note.
- **No map.** There is **no ward boundary geometry** in the system, so the page says so and shows a directory, chart and table instead of an invented map.

### Branding

- The supplied UP Government emblem (from your `seeklogo` archive) is on the website header and footer, the portal (sidebar and login use `/branding/up-government-logo.png`, now 300 px), receipts and notices.
- **Proportions are preserved** (2000×2000 source, square outputs, transparency kept).
- **Alt text:** "Uttar Pradesh Government emblem / उत्तर प्रदेश सरकार का प्रतीक चिह्न".

### Portal navigation

| Group | Pages |
| --- | --- |
| **Reports** | Report Builder, Demand Notice |
| **Tax Administration** | Assessment Years, Tax Rates (property, water and drainage are one ward-wise table, so there is one page, not three duplicates), Property Tax Rebates, Water Tax Rebates, Property Tax Penalties, Water Tax Penalties |
| **Tax Collection** | unchanged |
| **GIS & Public Data** | Ward Statistics (dashboard ward cards), Public GIS Page (website) |

The new routes inherit server-side permissions from the nav map. The API still enforces `settings:update` for changes and `report:read` for viewing.

## 2. Accounting model (unchanged, now documented)

Per property and assessment year (Decimal, half-up to paise):

```
currentYearDemand = propertyTax + waterTax + drainageTax + penalty
yearOutstanding   = currentYearDemand + interest + debits − credits − rebate − payments
openingArrears    = Σ yearOutstanding of earlier VERIFIED years
totalPayable      = openingArrears + (currentYearDemand + interest + debits − rebate − credits)
netOutstanding    = totalPayable − payments allocated to the selected year
```

- **Allocation.** Payments go to the oldest verified year first and are rejected above the outstanding total (no advance credit is configured).
- **Reversals.** A reversal sets its allocations to `REVERSED`, so they stop counting, while the payment and receipt stay on record.
- **Rebate and penalty.** Each is applied once, at publication. Rebate per tax = rate × (that tax [+ its arrears if allowed] [+ its penalty if allowed]), capped by the maximum and by the base.

## 3. Database migration

`apps/api/prisma/migrations/20261026120000_tax_category_policies_and_reversal/`

- **`migration.sql`** is additive only:
  - new enum `TaxCategory`;
  - `taxCategory` (default `COMBINED`) and `createdById` on both policy tables;
  - `chargeBreakdown` on `assessment_demand`;
  - `reversedAt`, `reversedById`, `reversalReason` on `payment`;
  - two indexes;
  - a backfill of reversal details from existing `PAYMENT_REVERSED` audit rows.

  No existing value changes meaning.
- **`rollback.sql`** is a documented manual rollback, safe only before any tax-specific policy is activated.
- **Testing.** The SQL was generated with `prisma migrate diff` from the previous schema. It has **not** been applied to a database here, because Docker/Postgres was not running. Run `pnpm --filter api prisma:migrate` locally, then on staging, before production (`start:prod` runs `prisma migrate deploy`).

## 4. APIs added or changed

| Method and path | Change |
| --- | --- |
| `POST /api/v1/rebate-policies`, `POST /api/v1/penalty-policies` | Accept `taxCategory`; tax-specific rules get component flags forced to their own tax; `createdById` recorded |
| `GET …-policies` | Return `taxCategory`, `approvedAt` |
| `POST …-policies/:id/activate` | Archives only the same tax (or combined) for that year |
| `POST /api/v1/rebate-policies/:id/archive`, `POST /api/v1/penalty-policies/:id/archive` | **New.** Withdraw a rule, audited |
| `POST /api/v1/payments/:id/reversals` | Stores reason, user and time on the payment; locks demand rows |
| `GET /api/v1/collections/receipts` | Rows include `reversedAt`, `reversalReason` |
| `GET /api/v1/collections/receipts/:id[/pdf]` | New layout; REVERSED stamp for reversed payments |
| `GET /api/v1/public/ward-stats` | **New.** Public ward aggregates |

## 5. Tests

| Suite | Result |
| --- | --- |
| API Jest (`pnpm --filter api test`) | **383 passed, 7 failed.** The 7 failures are pre-existing on `main` and unrelated: 3 expect the old `chhata_session` cookie name, and 4 need `fixtures/survey/Ward 1.xlsx` / `Ward 2.xlsx`, which are not in the repo |
| New scenarios `src/demands/financial-scenarios.spec.ts` | **18/18.** Covers A partial ₹4,500 → ₹2,500 → ₹2,000; B full payment and invalid amounts; C ₹2,400 + ₹1,800 − ₹420 = ₹3,780; D separate rebates and penalties, arrears scope, combined + category conflict, activation scope; E oldest-year allocation; F idempotent replay; G reversal and stamped reprint; H notice figures from the same breakdown, no "Chhata"; L allocations = receipts, outstanding reconciles |
| `src/public-ward-stats/ward-stats.spec.ts` (I) | **5/5.** Ward order, totals, disclosure switch, no personal fields |
| Print check J (`tsx scripts/render-print-samples.ts`) | Partial, full and reversed receipts and the demand notice each render on **1 A4 page**, with no clipped box. Hindi and ₹ were checked visually in the PDFs |
| Permissions K | Unchanged server-side `@RequirePermission` on every changed endpoint; portal route-permission tests **20/20**, portal unit tests **14/14** |
| Website Playwright (`pnpm --filter web e2e`, mock API for ward stats) | **76/76.** Includes the GIS page, ward filter, unknown year, and axe on `/gis` in Hindi and English |
| Builds | `apps/web`, `apps/portal`, `apps/api` production builds succeed; API `tsc` clean; ESLint 0 errors |

**Not tested here** (needs a running API, database and staff login): clicking through the new portal screens end to end, posting a real payment and reversal against Postgres, and the migration on real data.

## 6. Open items: data, policy and access

1. **Rebate policy (the ₹420 question).** Is the approved early-payment rebate on property tax only, or on property + water? Reference notice `249044-001-000001-001-R` applies 10% to both. Existing active policies are `COMBINED` and unchanged. To separate them, create a Property-tax rebate (and a Water-tax rebate if the order allows one) and activate them; the combined rule is then archived automatically. **Demands already published are not changed.**
2. **Penalty and interest rates, grace periods and due dates.** No rates were entered or invented. The office must create and approve them per tax.
3. **Ward boundaries.** No GIS geometry exists in the database or the `fixtures/gis` spreadsheets. Supply ward boundary GeoJSON (or shapefiles) to add a real map.
4. **Public disclosure.** Collections and outstanding totals on `/gis` stay hidden until the municipality approves (`PUBLIC_DISCLOSE_COLLECTIONS=true`).
5. **Receipt wording.** No ownership disclaimer was added (the Maswasi receipt has one; Dhanaura's approved wording is unknown). Signatory designations are generic ("Authorised signatory"); confirm the designations to print.
6. **Website address on notices.** The legal text prints `www.nppdhanaura.in` (from the existing notice). The public site in this repo is configured for `nppdhanaura.com`. Confirm the correct address and set it in the notice settings.
7. **Emblem.** The supplied file is the UP Government emblem from a third-party vector site (seeklogo). Confirm it is the approved artwork for municipal use, or supply an official file.
8. **Migration.** Apply and verify on a staging copy of the production database before deploying (section 3).
9. **Pre-existing failing tests** (section 5) should be fixed or the fixture files added.
