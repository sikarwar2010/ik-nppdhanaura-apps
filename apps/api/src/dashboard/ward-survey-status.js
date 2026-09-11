/**
 * PENDING when the ward has no surveys; COMPLETED when it has at least one.
 * Tax demand / collections do not affect this status.
 */
export function wardSurveyStatus(surveyCount) {
    return surveyCount > 0 ? "COMPLETED" : "PENDING";
}
