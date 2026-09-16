# Survey Excel Import — Classification Mapping Remediation

## Problem

Mainpuri `Ward 01.xlsx` uses headers **Property Type** and **Property Uses** (no **Commercial**).
Older import mapping treated unmatched fields as Chhata v1-38 column indexes, which wrote:

- Colony → `propertyUse`
- Tax Rate Zone → `commercial`

Survey View / API / Export then showed those wrong stored values under Classification.

## Fix (code)

Import now:

1. Maps `Property Uses` → `propertyUse`
2. Maps `Property Type` → `propertyType` (new nullable column)
3. Leaves `commercial` empty when there is no Commercial column (index `-1`)

## Healing existing database rows (department-safe)

**Do not** run a mass SQL rewrite or delete surveys.

### Recommended path

1. Apply migration `20260916140000_survey_property_type` (adds nullable `Survey.propertyType`).
2. Deploy the fixed API.
3. Re-upload the same Excel (`Ward 01.xlsx`) via Survey Import with duplicate strategy **UPDATE** (default).
4. Spot-check Classification on a few parcels (Property Type, Property Use, Tax Rate Zone, Commercial subtype empty when not in Excel).

### Alternative

Re-process an existing import job file:

```bash
pnpm --filter api exec tsx scripts/repair-import-standalone.ts <importJobId>
```

That script now uses `resolveColumnMap` (header refine + Mainpuri aliases), same as live import.

### What will NOT heal bad rows

- Duplicate strategy **SKIP** — leaves existing corrupted `propertyUse` / `commercial` unchanged.

### Optional diagnostic (read-only)

Count rows that look like the old cross-map (colony stored as use, zone stored as commercial):

```sql
SELECT COUNT(*) AS suspect_rows
FROM "Survey"
WHERE "deletedAt" IS NULL
  AND (
    ("propertyUse" IS NOT NULL AND "colony" IS NOT NULL AND "propertyUse" = "colony")
    OR (
      "commercial" IS NOT NULL
      AND "taxRateZone" IS NOT NULL
      AND "commercial" = "taxRateZone"
    )
  );
```

After a successful UPDATE re-import, this count should drop toward zero for the re-imported ward.

## Safety

- No tax / demand / area / floor business logic changes.
- No database reset or survey deletion for this remediation.
- Additive schema only (`propertyType` nullable).
