function configuredValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

export const propertyTaxMunicipality = {
  name:
    configuredValue(process.env.NEXT_PUBLIC_MUNICIPALITY_NAME) ??
    "Nagar Panchayat Goverdhan",
  city:
    configuredValue(process.env.NEXT_PUBLIC_MUNICIPALITY_CITY) ?? "Mathura",
  state:
    configuredValue(process.env.NEXT_PUBLIC_MUNICIPALITY_STATE) ??
    "Uttar Pradesh",
  logoUrl: configuredValue(process.env.NEXT_PUBLIC_MUNICIPALITY_LOGO_URL),
}
