import { normalizeParcelNo } from "@workspace/types";
/** Build list-search OR clauses (contains + padded parcel / exact survey id). */
export function buildSurveySearchOr(search) {
    const q = search.trim();
    if (!q)
        return [];
    const or = [
        { surveyId: { contains: q, mode: "insensitive" } },
        { ownerName: { contains: q, mode: "insensitive" } },
        { ownerFatherName: { contains: q, mode: "insensitive" } },
        { mobile: { contains: q } },
        { parcelNo: { contains: q, mode: "insensitive" } },
        { propertyNo: { contains: q, mode: "insensitive" } },
        { locality: { contains: q, mode: "insensitive" } },
    ];
    if (/^\d[\d\s-]*$/.test(q)) {
        try {
            const paddedParcel = normalizeParcelNo(q);
            or.push({ parcelNo: { equals: paddedParcel, mode: "insensitive" } });
        }
        catch {
            // ignore non-parcel digit noise
        }
    }
    if (q.includes("-")) {
        or.push({ surveyId: { equals: q, mode: "insensitive" } });
    }
    return or;
}
