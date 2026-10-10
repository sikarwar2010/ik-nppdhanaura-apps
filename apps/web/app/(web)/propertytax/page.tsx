import PropertyTax from '@/components/propertytax/page';
import type { Metadata } from "next"
import { propertyTaxMunicipality } from "@/components/propertytax/municipality-config"

export const metadata: Metadata = {
  title: `House Tax | ${propertyTaxMunicipality.name}`,
  description:
    `Search and pay municipal house and property tax for ${propertyTaxMunicipality.name}, ${propertyTaxMunicipality.city}, ${propertyTaxMunicipality.state}.`,
}

export default function PropertyTaxPage() {
  return (
    <div>
      <PropertyTax/>
    </div>
  )
}
