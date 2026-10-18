export type PropertyTaxWard = {
  id: string
  code: string
  name: string
  number: number
}

export type PropertyTaxSearchMode = "ward" | "propertyId" | "owner"

export type PropertyTaxSearchResult = {
  id: string
  surveyId: string
  wardNumber: number
  wardName: string
  propertyNo: string | null
  parcelNo: string | null
  ownerNameMasked: string
  mobileMasked: string
  locality: string | null
  dueStatus: "DUE" | "NO_DUE"
}

export type PropertyTaxSearchQuery =
  | {
      mode: "ward"
      wardNumber: number
      propertyNo?: string
      page?: number
      pageSize?: number
    }
  | {
      mode: "propertyId"
      propertyId: string
      page?: number
      pageSize?: number
    }
  | {
      mode: "owner"
      ownerName: string
      mobile: string
      page?: number
      pageSize?: number
    }

export type PropertyTaxDues = {
  id: string
  surveyId: string
  wardNumber: number
  wardName: string
  ownerName: string | null
  ownerFatherName: string | null
  mobileMasked: string
  propertyNo: string | null
  parcelNo: string | null
  houseNo: string | null
  streetName: string | null
  locality: string | null
  colony: string | null
  city: string | null
  pincode: string | null
  propertyType: string | null
  propertyUse: string | null
  taxRateZone: string | null
  roadType: string | null
  assessmentYear: { id: string; code: string; name: string }
  taxConfig: { id: string; version: number }
  floors: Array<{
    floorLabel: string
    usageType: string
    usageFactor: string
    construction: string
    areaSqFt: number
    rate: number
    alv: number
    tax: number
  }>
  tax: {
    propertyTaxPct: number
    waterTaxPct: number
    drainageTaxPct: number
    penaltyPct: number
    assessablePct: number
    commercialAssessablePct: number
    propertyTax: number
    waterTax: number
    drainageTax: number
    penalty: number
    totalDemand: number
    annualBaseRate: number | null
    configFound: boolean
  }
  paidForAssessmentYear: boolean
  onlinePaymentEnabled: boolean
  ledger?: {
    openingArrears: string
    currentYearDemand: string
    rebateAmount: string
    rebateScope: string
    penalty: string
    interest: string
    totalPayable: string
    netOutstanding: string
    authoritative: boolean
    grossEligibleDemand: string
    publishedDemandId: string | null
  }
}

export type CreatePropertyTaxPayment = {
  surveyId: string
  payerMobile: string
  payerEmail?: string
}

export type PropertyTaxPaymentStart = {
  paymentId: string
  merchTxnId: string
  amount: number
  currency: string
  assessmentYear: string
  surveyId: string
} & (
  | {
      checkout: {
        mode: "aipay"
        atomTokenId: string
        merchId: string
        custEmail: string
        custMobile: string
        returnUrl: string
        cdnUrl: string
        env: "uat" | "prod"
      }
    }
  | { redirectUrl: string }
)

export type PropertyTaxPaymentStatus = {
  paymentId: string
  merchTxnId: string
  status: "INITIATED" | "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED"
  sandbox: boolean
  amount: number
  currency: string
  payerMobileMasked: string
  id: string | null
  surveyId: string | null
  wardNumber: number | null
  wardName: string | null
  propertyNo: string | null
  parcelNo: string | null
  createdAt: string
  updatedAt: string
}

type ApiEnvelope<T> = {
  success: true
  data: T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function errorMessage(value: unknown, fallback: string): string {
  if (!isRecord(value)) return fallback
  if (typeof value.message === "string") return value.message
  if (
    Array.isArray(value.message) &&
    value.message.every((message) => typeof message === "string")
  ) {
    return value.message.join(". ")
  }
  return fallback
}

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`/api/v1/public/property-tax${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })

  const payload: unknown = await response.json()
  if (!response.ok) {
    throw new Error(
      errorMessage(
        isRecord(payload) ? payload : undefined,
        `Property tax service returned HTTP ${response.status}.`
      )
    )
  }

  if (
    !isRecord(payload) ||
    payload.success !== true ||
    !("data" in payload)
  ) {
    throw new Error("Property tax service returned an invalid response.")
  }

  return (payload as ApiEnvelope<T>).data
}

export function listPropertyTaxWards(): Promise<PropertyTaxWard[]> {
  return request<PropertyTaxWard[]>("/wards")
}

export function searchPropertyTax(
  query: PropertyTaxSearchQuery
): Promise<{
  items: PropertyTaxSearchResult[]
  page: number
  pageSize: number
  total: number
}> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value))
  }
  return request<{
    items: PropertyTaxSearchResult[]
    page: number
    pageSize: number
    total: number
  }>(`/search?${params.toString()}`)
}

export function getPropertyTaxDues(id: string): Promise<PropertyTaxDues> {
  return request<PropertyTaxDues>(`/dues/${encodeURIComponent(id)}`)
}

export function createPropertyTaxPayment(
  payment: CreatePropertyTaxPayment
): Promise<PropertyTaxPaymentStart> {
  return request("/payments", {
    method: "POST",
    body: JSON.stringify(payment),
  })
}

export function getPropertyTaxPayment(
  merchTxnId: string,
  sync = false
): Promise<PropertyTaxPaymentStatus> {
  const params = sync ? "?sync=1" : ""
  return request(
    `/payments/by-merch/${encodeURIComponent(merchTxnId)}${params}`
  )
}
