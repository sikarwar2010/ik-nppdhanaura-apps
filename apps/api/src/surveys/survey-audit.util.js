const FIELD_LABELS = {
    surveyId: "Survey ID",
    parcelNo: "Parcel No",
    propertyNo: "Property No",
    gisUseCode: "GIS Use Code",
    wardId: "Ward",
    ownerName: "Owner Name",
    ownerFatherName: "Owner Father Name",
    mobile: "Mobile No",
    respondentName: "Respondent",
    city: "City",
    pincode: "Pincode",
    houseNo: "House No",
    streetName: "Street",
    locality: "Locality",
    colony: "Colony",
    propertyOwnership: "Property Ownership",
    propertyUse: "Property Use",
    commercial: "Commercial use",
    yearOfConstruction: "Year of Construction",
    situation: "Situation",
    roadType: "Road Type",
    plotAreaSqFt: "Plot Area (sq ft)",
    plinthAreaSqFt: "Plinth Area (sq ft)",
    totalBuiltUpAreaSqFt: "Total Built-up Area (sq ft)",
    hasMunicipalWaterSupply: "Municipal Water Supply",
    totalWaterConnections: "Water Connection",
    toiletType: "Toilet Type",
    hasMunicipalWasteService: "Municipal Waste Service",
    hasAlternateWater: "Alternate Water",
    waterSourceType: "Water Source",
    floorsRaw: "Floor information",
    status: "Status",
};
export const SURVEY_AUDIT_FIELDS = [
    "surveyId",
    "parcelNo",
    "propertyNo",
    "gisUseCode",
    "wardId",
    "ownerName",
    "ownerFatherName",
    "mobile",
    "respondentName",
    "respondentRelationship",
    "city",
    "pincode",
    "houseNo",
    "streetName",
    "locality",
    "colony",
    "propertyOwnership",
    "propertyUse",
    "commercial",
    "yearOfConstruction",
    "situation",
    "roadType",
    "plotAreaSqFt",
    "plotAreaSqMeter",
    "plinthAreaSqFt",
    "plinthAreaSqMeter",
    "totalBuiltUpAreaSqFt",
    "totalBuiltUpAreaSqMeter",
    "hasMunicipalWaterSupply",
    "hasAlternateWater",
    "waterSourceType",
    "totalWaterConnections",
    "waterConnectionIdType",
    "toiletType",
    "hasMunicipalWasteService",
    "floorsRaw",
    "status",
    "taxRateZone",
    "isSlum",
    "remark",
];
function normalizeAuditValue(value) {
    if (value == null)
        return null;
    if (typeof value === "object" && value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === "object" &&
        value !== null &&
        "toString" in value &&
        typeof value.toString === "function") {
        const str = value.toString();
        if (/^\d+(\.\d+)?$/.test(str))
            return str;
    }
    return value;
}
function valuesEqual(a, b) {
    const left = normalizeAuditValue(a);
    const right = normalizeAuditValue(b);
    if (left === right)
        return true;
    if (left == null && right == null)
        return true;
    return JSON.stringify(left) === JSON.stringify(right);
}
export function diffSurveyChanges(before, after, fields = SURVEY_AUDIT_FIELDS) {
    const changes = [];
    for (const field of fields) {
        if (!(field in before) && !(field in after))
            continue;
        const oldVal = before[field];
        const newVal = after[field];
        if (!valuesEqual(oldVal, newVal)) {
            changes.push({ field, old: normalizeAuditValue(oldVal), new: normalizeAuditValue(newVal) });
        }
    }
    return { changes };
}
export function surveyToAuditSnapshot(survey, extras) {
    const snapshot = {};
    for (const field of SURVEY_AUDIT_FIELDS) {
        if (field in survey)
            snapshot[field] = survey[field];
    }
    return { ...snapshot, ...extras };
}
export function formatAuditFieldLabel(field) {
    return FIELD_LABELS[field] ?? field;
}
export function formatAuditChange(change) {
    const label = formatAuditFieldLabel(change.field);
    const oldStr = change.old == null || change.old === "" ? "—" : String(change.old);
    const newStr = change.new == null || change.new === "" ? "—" : String(change.new);
    return `${label}: ${oldStr} → ${newStr}`;
}
