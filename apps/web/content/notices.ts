import type { Notice } from "./schema"
import { sourceProvenance } from "./site"

/**
 * Notices and announcements. Add new items at the top. A notice with an
 * eventDate in the past is shown as archived automatically.
 */
export const notices: Notice[] = [
  {
    slug: "dhanaura-cricket-tournament-2026",
    title: { hi: "धनौरा क्रिकेट खेल-प्रतियोगिता", en: "Dhanaura Cricket Tournament" },
    category: "event",
    publishedOn: "2026-06-01",
    eventDate: "2026-07-24",
    body: {
      hi: [
        "धनौरा में इंटर-डिस्ट्रिक्ट क्रिकेट टूर्नामेंट आयोजित किया जा रहा है।",
        "हम चाहते हैं कि इस टूर्नामेंट में ज़्यादा से ज़्यादा टीमें हिस्सा लें।",
        "हर टीम के लिए एंट्री फ़ीस 1,999 रुपये होगी।",
        "विजेता टीम को 1,21,111 रुपये का इनाम दिया जाएगा।",
        "रनर-अप टीम को 31,111 रुपये का इनाम दिया जाएगा।",
        "ज़्यादा जानकारी के लिए धनौरा नगर पालिका से संपर्क करें।",
      ],
      en: [
        "Dhanaura is holding an Inter District Cricket Tournament.",
        "We encourage maximum participation of teams in the tournament.",
        "The entry fee for each team is ₹1,999.",
        "The winning team will be awarded ₹1,21,111.",
        "The runner-up team will be awarded ₹31,111.",
        "For further details, visit the Dhanaura Nagar Palika office.",
      ],
    },
    attachments: [],
    provenance: sourceProvenance("notice.php?id=1"),
  },
]
