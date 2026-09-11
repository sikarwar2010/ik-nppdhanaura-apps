/**
 * NO_DUE when a SUCCESS payment exists for the survey + current assessment year.
 * INITIATED/PENDING/FAILED or a different year remain DUE.
 */
export function resolveDueStatus(input) {
    const yearId = input.currentAssessmentYearId?.trim();
    if (!yearId)
        return "DUE";
    const paid = input.paidAssessmentYearIds instanceof Set
        ? input.paidAssessmentYearIds
        : new Set(input.paidAssessmentYearIds);
    return paid.has(yearId) ? "NO_DUE" : "DUE";
}
export function isAlreadyPaidForYear(input) {
    return (Boolean(input.assessmentYearId.trim()) && input.successPaymentCount > 0);
}
