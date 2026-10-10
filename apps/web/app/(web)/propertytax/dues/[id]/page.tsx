import type { Metadata } from "next"

import PropertyTaxDuesPage from "@/components/propertytax/dues-page"

export const metadata: Metadata = {
  title: "Property Tax Dues",
  description:
    "View municipal property tax assessment details, current demand, and online payment options.",
}

export default async function PropertyTaxDuesRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <PropertyTaxDuesPage id={id} />
}
