import type { GalleryAlbum, MediaImage } from "./schema"
import { sourceProvenance } from "./site"

const provenance = sourceProvenance("gallery.php")

const img = (file: string, width: number, height: number, hi: string, en: string): MediaImage => ({
  src: `/media/source/${file}`,
  width,
  height,
  alt: { hi, en },
})

/** Albums as published on gallery.php, newest first. Titles are verbatim. */
export const galleryAlbums: GalleryAlbum[] = [
  {
    slug: "swachhata-hi-seva-2026",
    title: {
      hi: "स्वच्छता ही सेवा एवं राष्ट्रव्यापी सेवा संकल्प अभियान 2026 का भव्य शुभारंभ",
      en: "Grand Launch of Swachhata Hi Seva and Nationwide Service Pledge Campaign 2026",
    },
    date: "2026-09-15",
    images: [
      img("swachhata-hi-seva-2026-meeting-1.jpg", 1600, 731, "स्वच्छता ही सेवा 2026 के बैनर के साथ नगर पालिका कार्यालय में बैठक", "Meeting at the Nagar Palika office with a Swachhata Hi Seva 2026 banner"),
      img("swachhata-hi-seva-2026-meeting-2.jpg", 1600, 731, "अभियान के शुभारंभ पर कार्यालय में अधिकारियों और नागरिकों की बैठक", "Officials and citizens meeting at the office for the campaign launch"),
      img("swachhata-hi-seva-2026-meeting-3.jpg", 1600, 731, "स्वच्छता ही सेवा अभियान बैठक में उपस्थित प्रतिभागी", "Participants at the Swachhata Hi Seva campaign meeting"),
    ],
    provenance,
  },
  {
    slug: "swm-2026-master-trainer-workshop",
    title: {
      hi: "स्वच्छ भारत मिशन नगरीय के अंतर्गत नगर पालिका परिषद धनौरा में SWM 2026 - डोर टू डोर स्रोत पृथक्करण विषय पर एक दिवसीय मास्टर ट्रेनर कार्यशाला / क्षमता निर्माण कार्यक्रम",
      en: "One-day Master Trainer Workshop / Capacity Building Program on 'SWM 2026 - Door to Door Source Segregation' under Swachh Bharat Mission Urban at Nagar Palika Dhanaura",
    },
    date: "2026-09-10",
    images: [
      img("swm-2026-workshop-certificate.jpg", 1600, 720, "कार्यशाला में प्रमाण पत्र प्रदान करते हुए", "Certificate being presented at the workshop"),
      img("swm-2026-workshop-session.jpg", 1600, 720, "SWM 2026 बैनर के साथ कार्यशाला सत्र", "Workshop session with SWM 2026 banners"),
    ],
    provenance,
  },
  {
    slug: "independence-day-2026",
    title: { hi: "स्वतंत्रता दिवस", en: "Independence Day" },
    date: "2026-08-15",
    images: [
      img("independence-day-2026-felicitation.jpg", 1280, 960, "स्वतंत्रता दिवस पर महिलाओं का सम्मान", "Women being felicitated on Independence Day"),
      img("independence-day-2026-tiranga-rally.jpg", 1600, 721, "तिरंगा लेकर निकाली गई रैली", "Rally with the national flag"),
      img("independence-day-2026-students-rally.jpg", 1600, 721, "तिरंगा लिए विद्यार्थियों की रैली", "Students carrying the national flag in a rally"),
      img("independence-day-2026-flags.jpg", 1600, 721, "तिरंगे झंडों के साथ नागरिकों का समूह", "Group of citizens with national flags"),
      img("independence-day-2026-floral-tribute.jpg", 1600, 720, "महापुरुषों के चित्रों पर पुष्पांजलि", "Floral tribute to portraits of national leaders"),
      img("independence-day-2026-flag-hoisting.jpg", 1600, 720, "ध्वजारोहण के बाद उपस्थित अधिकारी और नागरिक", "Officials and citizens at the flag hoisting"),
    ],
    provenance,
  },
  {
    slug: "dhanaura-nagar-palika-july-2026",
    title: { hi: "धनौरा नगर पालिका", en: "Dhanaura Nagar Palika" },
    date: "2026-07-17",
    images: [
      img("yoga-day-news-clipping.jpg", 791, 862, "योग दिवस कार्यक्रम पर समाचार पत्र की कतरन", "Newspaper clipping about the Yoga Day programme"),
      img("women-group-felicitation.jpg", 1280, 960, "नगर पालिका कार्यालय में महिलाओं के समूह का सम्मान", "Group of women felicitated at the Nagar Palika office"),
      img("sanitation-workers-safety-kits.jpg", 1600, 731, "सफाई कर्मियों को सुरक्षा किट वितरण", "Safety kits distributed to sanitation workers"),
      img("sanitation-kit-handover.jpg", 1600, 719, "कार्यालय में सामग्री सौंपते हुए अधिकारी", "Officials handing over materials at the office"),
      img("naari-leads-swachhata-felicitation.jpg", 1600, 719, "'नारी लीड्स स्वच्छता' कार्यक्रम में प्रमाण पत्र के साथ महिलाएँ", "Women holding certificates at the 'Naari Leads Swachhata' programme"),
      img("world-environment-day-meeting.jpg", 1541, 693, "विश्व पर्यावरण दिवस बैनर के साथ बैठक", "Meeting with a World Environment Day banner"),
    ],
    provenance,
  },
]

/** Other photographs published on the source homepage and about page. */
export const siteImages = {
  hero: img("dhanaura-park-walkway.jpg", 1600, 731, "धनौरा में पक्के पैदल पथ और लैंप पोस्ट वाला हरा-भरा पार्क", "Landscaped park in Dhanaura with a paved walkway and lamp posts"),
  park: img("dhanaura-park-recycled-tyre-art.jpg", 1393, 621, "पुराने टायरों से बनी कलाकृतियों वाला पार्क", "Park with sculptures made from recycled tyres"),
  office: img("palika-office-hall.jpg", 842, 524, "नगर पालिका कार्यालय का हॉल", "Hall at the Nagar Palika office"),
}

export function getAlbum(slug: string) {
  return galleryAlbums.find((a) => a.slug === slug)
}
