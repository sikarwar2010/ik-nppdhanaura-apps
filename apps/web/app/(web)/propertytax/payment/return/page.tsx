import type { Metadata } from "next"

import PropertyTaxPaymentReturn from "@/components/propertytax/payment-return"

export const metadata: Metadata = {
  title: "Property Tax Payment Status",
  description:
    "Check the status of your municipal property tax payment.",
}

export default async function PropertyTaxPaymentReturnRoute({
  searchParams,
}: {
  searchParams: Promise<{ merchTxnId?: string | string[] }>
}) {
  const { merchTxnId } = await searchParams
  return (
    <PropertyTaxPaymentReturn
      merchTxnId={Array.isArray(merchTxnId) ? (merchTxnId[0] ?? "") : merchTxnId ?? ""}
    />
  )
}
