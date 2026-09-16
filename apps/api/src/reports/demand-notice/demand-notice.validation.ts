import type { SurveyForDues } from "../../public-property-tax/dues.util"

export type DemandNoticeValidationError = {
  surveyId: string
  parcelNo: string | null
  propertyCuid: string
  error: string
}

export type DemandNoticeValidationResult = {
  validIds: string[]
  invalid: DemandNoticeValidationError[]
}

function isBlank(value: string | null | undefined): boolean {
  return !value || !String(value).trim()
}

/**
 * Validate a survey for demand-notice generation.
 * Does not silently skip — callers must surface invalid rows.
 */
export function validateSurveyForDemandNotice(
  survey: SurveyForDues & { id: string },
  tax: { totalDemand: number } | null,
  options: { hasPublishedTaxConfig: boolean }
): string | null {
  if (!options.hasPublishedTaxConfig) {
    return "Missing published tax configuration for ward/assessment year"
  }
  if (!survey.ward?.number && survey.ward?.number !== 0) {
    return "Missing ward"
  }
  // Missing owner is allowed — notice renders "N/A".
  if (isBlank(survey.parcelNo)) {
    return "Missing parcel"
  }
  if (!tax || !Number.isFinite(tax.totalDemand) || tax.totalDemand < 0) {
    return "Missing or invalid tax calculation"
  }
  return null
}

export function partitionDemandNoticeValidation(
  items: Array<{
    survey: SurveyForDues & { id: string }
    tax: { totalDemand: number } | null
    hasPublishedTaxConfig: boolean
  }>
): DemandNoticeValidationResult {
  const validIds: string[] = []
  const invalid: DemandNoticeValidationError[] = []

  for (const item of items) {
    const error = validateSurveyForDemandNotice(item.survey, item.tax, {
      hasPublishedTaxConfig: item.hasPublishedTaxConfig,
    })
    if (error) {
      invalid.push({
        surveyId: item.survey.surveyId,
        parcelNo: item.survey.parcelNo,
        propertyCuid: item.survey.id,
        error,
      })
    } else {
      validIds.push(item.survey.id)
    }
  }

  return { validIds, invalid }
}
