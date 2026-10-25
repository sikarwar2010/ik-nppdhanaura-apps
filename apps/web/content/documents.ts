import type { DocumentItem } from "./schema"
import { sourceProvenance } from "./site"

/**
 * Downloadable documents. The source site publishes no locally hosted
 * documents; the one file it links is listed here with its real publisher.
 * Put office-supplied files in public/documents/ and add an entry here.
 */
export const documents: DocumentItem[] = [
  {
    slug: "trade-license-process-guideline",
    title: { hi: "व्यापार लाइसेंस — प्रक्रिया और शुल्क दिशानिर्देश", en: "Trade License — Process and Fee Guidelines" },
    description: {
      hi: "निवेश मित्र पोर्टल पर प्रकाशित उपयोगकर्ता प्रक्रिया दस्तावेज़ (UPS_107)।",
      en: "User process document (UPS_107) published on the Nivesh Mitra portal.",
    },
    category: "guideline",
    file: "https://niveshmitra.up.nic.in/Documents/User_Process_Flow/UPS_107.pdf",
    format: "PDF",
    publisher: { hi: "निवेश मित्र, उत्तर प्रदेश", en: "Nivesh Mitra, Uttar Pradesh" },
    provenance: sourceProvenance("services.php"),
  },
]
