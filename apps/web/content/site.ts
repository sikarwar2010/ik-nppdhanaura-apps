import type { Provenance, Text } from "./schema"

const SRC = "https://nppdhanaura.com/public/"
const RETRIEVED = "2026-10-25"

export const sourceProvenance = (page: string): Provenance => ({
  verification: "source-published",
  sourceUrl: SRC + page,
  retrievedOn: RETRIEVED,
})

export const editorial: Provenance = { verification: "editorial" }

export const site = {
  name: {
    hi: "नगर पालिका परिषद, धनौरा",
    en: "Nagar Palika Parishad Dhanaura",
  } satisfies Text,
  shortName: { hi: "न.पा.प. धनौरा", en: "NPP Dhanaura" } satisfies Text,
  district: {
    hi: "जनपद अमरोहा, उत्तर प्रदेश",
    en: "District Amroha, Uttar Pradesh",
  } satisfies Text,
  /** Public website origin used for canonical URLs and the sitemap. */
  url: process.env.SITE_URL?.replace(/\/$/, "") || "https://nppdhanaura.com",
  contact: {
    address: {
      hi: "मंडी धनौरा नगर पालिका कार्यालय, पालिका मार्केट, धनौरा, उत्तर प्रदेश 244231",
      en: "Mandi Dhanaura Nagar Palika Office, Palika Market, Dhanaura, Uttar Pradesh 244231",
    } satisfies Text,
    phone: "8189078099",
    phoneHref: "tel:+918189078099",
    email: "npdhanaura@gmail.com",
    hours: {
      hi: "सुबह 10:00 बजे से शाम 05:00 बजे तक (सोमवार–शनिवार)",
      en: "10:00 AM to 05:00 PM (Monday–Saturday)",
    } satisfies Text,
    /**
     * Google Maps search text. The full postal address does not resolve to a
     * place (no pin); this name resolves to Google's listing "Mandi Dhanaura
     * Nagar Palika Office, X744+5P4, Palika Market, Dhanaura 244231", which
     * matches the address published on the source site (checked 2026-10-25).
     */
    mapQuery: "Nagar Palika Parishad Dhanaura",
    provenance: sourceProvenance("contact.php"),
  },
  emergency: [
    { label: { hi: "पुलिस", en: "Police" }, numbers: ["112", "100"] },
    { label: { hi: "फायर ब्रिगेड", en: "Fire Brigade" }, numbers: ["101"] },
    { label: { hi: "एंबुलेंस", en: "Ambulance" }, numbers: ["108", "102"] },
  ] satisfies { label: Text; numbers: string[] }[],
  /**
   * Emblem shown beside the municipal name (header, footer). Supplied with the
   * project: the Uttar Pradesh Government emblem. Set to null to fall back to
   * the typographic mark.
   */
  logo: {
    src: "/media/brand/up-government-emblem.png",
    width: 512,
    height: 512,
    alt: "Uttar Pradesh Government emblem / उत्तर प्रदेश सरकार का प्रतीक चिह्न",
  } as null | { src: string; width: number; height: number; alt: string },
} as const
