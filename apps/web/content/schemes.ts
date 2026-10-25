import type { ImportantLink, Scheme } from "./schema"
import { sourceProvenance } from "./site"

/** Schemes from schemes.php (with descriptions) and services.php (links only). */
export const schemes: Scheme[] = [
  {
    slug: "pmay-urban",
    name: { hi: "प्रधानमंत्री आवास योजना (शहरी)", en: "Pradhan Mantri Awas Yojana (Urban)" },
    description: {
      hi: "राज्यों/केंद्र शासित प्रदेशों के माध्यम से कार्यान्वयन एजेंसियों को केंद्रीय सहायता प्रदान करके शहरी क्षेत्रों में सभी के लिए आवास प्रदान करने का लक्ष्य है।",
      en: "Aims to provide housing for all in urban areas by providing central assistance to implementing agencies through States/Union Territories.",
    },
    link: { label: { hi: "अधिक जानें", en: "Know More" }, href: "https://pmay-urban.gov.in/", kind: "external" },
    provenance: sourceProvenance("schemes.php"),
  },
  {
    slug: "swachh-bharat-mission-urban",
    name: { hi: "स्वच्छ भारत मिशन (शहरी)", en: "Swachh Bharat Mission (Urban)" },
    description: {
      hi: "भारत के शहरों, कस्बों और ग्रामीण क्षेत्रों की सड़कों, रास्तों और बुनियादी ढांचे को साफ करने के उद्देश्य से एक राष्ट्रीय अभियान।",
      en: "A national campaign aimed at cleaning up the streets, roads, and infrastructure of India's cities, towns, and rural areas.",
    },
    link: { label: { hi: "अधिक जानें", en: "Know More" }, href: "https://sbmurban.org/", kind: "external" },
    provenance: {
      ...sourceProvenance("schemes.php"),
      reviewNote:
        "Source 'Know More' pointed to an SBM login page (sbm.gov.in/sbm_dbt/secure/Login.aspx), and the source's SBM-Urban link (swachhbharaturban.gov.in) timed out on 2026-10-25. Replaced with the MoHUA SBM-Urban site sbmurban.org.",
    },
  },
  {
    slug: "amrut",
    name: { hi: "अमृत योजना (AMRUT)", en: "AMRUT Scheme" },
    description: {
      hi: "घरों में बुनियादी सेवाएं (जैसे जल आपूर्ति, सीवरेज, शहरी परिवहन) प्रदान करने और शहरों में सुविधाएं बनाने पर केंद्रित है।",
      en: "Focuses on providing basic services (e.g. water supply, sewerage, urban transport) to households and build amenities in cities.",
    },
    link: { label: { hi: "अधिक जानें", en: "Know More" }, href: "https://amrut.mohua.gov.in/", kind: "external" },
    provenance: sourceProvenance("schemes.php"),
  },
  {
    slug: "nulm",
    name: { hi: "राष्ट्रीय शहरी आजीविका मिशन (NULM)", en: "National Urban Livelihoods Mission" },
    description: {
      hi: "शहरी गरीब परिवारों को लाभकारी स्वरोजगार और कुशल मजदूरी रोजगार के अवसरों तक पहुंचने में सक्षम बनाकर उनकी गरीबी और भेद्यता को कम करने का लक्ष्य है।",
      en: "Aims to reduce poverty and vulnerability of urban poor households by enabling them to access gainful self-employment and skilled wage employment opportunities.",
    },
    link: { label: { hi: "अधिक जानें", en: "Know More" }, href: "https://nulm.gov.in/", kind: "external" },
    provenance: sourceProvenance("schemes.php"),
  },
  {
    slug: "pm-svanidhi",
    name: { hi: "पीएम स्वनिधि योजना", en: "PM SVANidhi Scheme" },
    link: { label: { hi: "पोर्टल देखें", en: "Visit portal" }, href: "https://pmsvanidhi.mohua.gov.in/", kind: "external" },
    provenance: sourceProvenance("services.php"),
  },
  {
    slug: "pmay-gramin",
    name: { hi: "प्रधानमंत्री आवास योजना (ग्रामीण)", en: "Pradhan Mantri Awas Yojana (Gramin)" },
    link: { label: { hi: "पोर्टल देखें", en: "Visit portal" }, href: "https://pmayg.dord.gov.in/netiayHome/Home.aspx", kind: "external" },
    provenance: sourceProvenance("services.php"),
  },
]

export const importantLinks: ImportantLink[] = [
  { label: { hi: "उत्तर प्रदेश सरकार पोर्टल", en: "Uttar Pradesh Government Portal" }, href: "https://up.gov.in/", group: "government", provenance: sourceProvenance("index.php") },
  { label: { hi: "स्थानीय निकाय निदेशालय", en: "Directorate of Local Bodies" }, href: "https://localbodies.up.nic.in/", group: "government", provenance: sourceProvenance("index.php") },
  { label: { hi: "भारत का राष्ट्रीय पोर्टल", en: "National Portal of India" }, href: "https://india.gov.in/", group: "government", provenance: sourceProvenance("index.php") },
  { label: { hi: "स्वच्छ भारत मिशन (शहरी) पोर्टल", en: "SBM Urban Portal" }, href: "https://sbmurban.org/", group: "schemes", provenance: { ...sourceProvenance("index.php"), reviewNote: "Source linked swachhbharaturban.gov.in, which timed out on 2026-10-25; replaced with sbmurban.org." } },
  { label: { hi: "ई-टेंडर पोर्टल (उत्तर प्रदेश)", en: "e-Tender Portal (Uttar Pradesh)" }, href: "https://etender.up.nic.in/nicgep/app", group: "services", provenance: sourceProvenance("index.php") },
  { label: { hi: "नागरिक पंजीकरण प्रणाली (CRS)", en: "Civil Registration System (CRS)" }, href: "https://crsorgi.gov.in/", group: "services", provenance: sourceProvenance("index.php") },
  { label: { hi: "ई-नगरसेवा यूपी", en: "e-NagarSewa UP" }, href: "https://e-nagarsewaup.gov.in/", group: "services", provenance: sourceProvenance("services.php") },
  { label: { hi: "लोक शिकायत पोर्टल (CPGRAMS)", en: "Public Grievance Portal (CPGRAMS)" }, href: "https://pgportal.gov.in/Registration", group: "services", provenance: sourceProvenance("services.php") },
]

export const ETENDER_URL = "https://etender.up.nic.in/nicgep/app"
