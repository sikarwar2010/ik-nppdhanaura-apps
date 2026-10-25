import type { LinkAction, Service } from "./schema"
import { editorial, sourceProvenance } from "./site"

const crs: LinkAction = {
  label: { hi: "CRS पोर्टल पर जाएं", en: "Proceed to CRS Portal" },
  href: "https://crsorgi.gov.in/",
  provider: { hi: "भारत के महारजिस्ट्रार का कार्यालय", en: "Office of the Registrar General, India" },
  kind: "external",
}

export const services: Service[] = [
  {
    slug: "birth-death-certificate",
    icon: "certificate",
    title: { hi: "जन्म/मृत्यु प्रमाण पत्र", en: "Birth/Death Certificate" },
    summary: {
      hi: "जन्म और मृत्यु का पंजीकरण तथा प्रमाण पत्र डाउनलोड — नागरिक पंजीकरण प्रणाली (CRS) पोर्टल पर।",
      en: "Registration of births and deaths and certificate download — on the Civil Registration System (CRS) portal.",
    },
    description: [
      {
        hi: "जन्म और मृत्यु प्रमाण पत्र का पंजीकरण और डाउनलोड केंद्रीय नागरिक पंजीकरण प्रणाली (CRS) पोर्टल द्वारा प्रबंधित किया जाता है।",
        en: "Registration and download of Birth and Death certificates are managed by the central Civil Registration System (CRS) portal.",
      },
      {
        hi: "नागरिक पंजीकरण प्रणाली (CRS) विभाग महत्वपूर्ण घटनाओं, मुख्य रूप से जन्म और मृत्यु के समय पर और सटीक पंजीकरण की सुविधा प्रदान करता है।",
        en: "The Civil Registration System (CRS) department facilitates the timely and accurate registration of vital events, primarily births and deaths.",
      },
    ],
    mode: "online",
    actions: [crs],
    department: "civil-registration",
    provenance: sourceProvenance("services.php"),
  },
  {
    slug: "property-water-tax",
    icon: "tax",
    title: { hi: "संपत्ति/जल कर", en: "Property/Water Tax" },
    summary: {
      hi: "संपत्ति कर और जल आपूर्ति शुल्क के दिशानिर्देश, मूल्यांकन विवरण और ऑनलाइन भुगतान विकल्प।",
      en: "Guidelines, assessment details and online payment options for property tax and water charges.",
    },
    description: [
      {
        hi: "नगरपालिका संपत्ति कर और जल आपूर्ति रखरखाव शुल्क के लिए दिशानिर्देश, मूल्यांकन विवरण और ऑनलाइन भुगतान विकल्प देखें।",
        en: "View guidelines, assessment details, and online payment options for municipal property tax and water supply maintenance charges.",
      },
      {
        hi: "राजस्व और कर विभाग संपत्ति कर, जल कर के उचित मूल्यांकन, बिलिंग और संग्रह को संभालता है।",
        en: "The Revenue and Tax Department handles the fair assessment, billing, and collection of Property Tax and Water Tax.",
      },
    ],
    mode: "online",
    actions: [
      {
        label: { hi: "संपत्ति कर खोजें (इस पोर्टल पर)", en: "Search property tax (on this portal)" },
        href: "/propertytax",
        kind: "internal",
      },
      {
        label: { hi: "ई-नगरसेवा यूपी पोर्टल", en: "e-NagarSewa UP Portal" },
        href: "https://e-nagarsewaup.gov.in/",
        provider: { hi: "नगर विकास विभाग, उत्तर प्रदेश", en: "Urban Development Department, Uttar Pradesh" },
        kind: "external",
      },
    ],
    department: "revenue-tax",
    provenance: sourceProvenance("services.php"),
  },
  {
    slug: "trade-license",
    icon: "license",
    title: { hi: "व्यापार लाइसेंस", en: "Trade License" },
    summary: {
      hi: "नया व्यापार लाइसेंस, नवीनीकरण और आवश्यक दिशानिर्देश।",
      en: "New trade licence, renewal and the guidelines you need.",
    },
    description: [
      {
        hi: "नए व्यापार लाइसेंस के लिए आवेदन करें, मौजूदा लाइसेंस को नवीनीकृत करें, या शहर की सीमा में व्यावसायिक प्रतिष्ठान चलाने के लिए आवश्यक दिशानिर्देश देखें।",
        en: "Apply for a new trade license, renew an existing license, or view the guidelines required to run a commercial establishment in the city limits.",
      },
    ],
    mode: "information",
    actions: [
      {
        label: { hi: "दिशानिर्देश और शुल्क (PDF)", en: "Guidelines & Fees (PDF)" },
        href: "https://niveshmitra.up.nic.in/Documents/User_Process_Flow/UPS_107.pdf",
        provider: { hi: "निवेश मित्र, उत्तर प्रदेश", en: "Nivesh Mitra, Uttar Pradesh" },
        kind: "document",
      },
    ],
    department: "revenue-tax",
    provenance: sourceProvenance("services.php"),
  },
  {
    slug: "grievance-registration",
    icon: "grievance",
    title: { hi: "शिकायत पंजीकरण", en: "Grievance Registration" },
    summary: {
      hi: "एकीकृत सरकारी पोर्टल पर अपनी शिकायत दर्ज करें और उसकी स्थिति देखें।",
      en: "Register and track a grievance on the unified government portal.",
    },
    description: [
      {
        hi: "एकीकृत सरकारी पोर्टल के माध्यम से सुरक्षित रूप से अपनी शिकायतें दर्ज करें और ट्रैक करें।",
        en: "Submit and track complaints or grievances securely through the unified government portal.",
      },
      {
        hi: "नगर पालिका से सीधे संपर्क के लिए कार्यालय समय में फ़ोन या ईमेल करें, या कार्यालय आएँ।",
        en: "To reach the Nagar Palika directly, call or email during office hours, or visit the office.",
      },
    ],
    mode: "online",
    actions: [
      {
        label: { hi: "शिकायत दर्ज करें (CPGRAMS)", en: "Register Grievance (CPGRAMS)" },
        href: "https://pgportal.gov.in/Registration",
        provider: { hi: "प्रशासनिक सुधार और लोक शिकायत विभाग, भारत सरकार", en: "DARPG, Government of India" },
        kind: "external",
      },
      {
        label: { hi: "कार्यालय से संपर्क करें", en: "Contact the office" },
        href: "/contact",
        kind: "internal",
      },
    ],
    provenance: sourceProvenance("services.php"),
  },
  {
    slug: "rti-citizen-charter",
    icon: "rti",
    title: { hi: "सूचना का अधिकार (RTI) और चार्टर", en: "Right to Information (RTI) & Charter" },
    summary: {
      hi: "जन सूचना अधिकारियों और नागरिक चार्टर से संबंधित जानकारी।",
      en: "Information on Public Information Officers and the Citizen Charter.",
    },
    description: [
      {
        hi: "सार्वजनिक सूचना अधिकारियों (PIO) के संबंध में जानकारी प्राप्त करें और सेवा वितरण समय सीमा की रूपरेखा बताने वाला नागरिक चार्टर देखें।",
        en: "Access information regarding public information officers (PIO) and view the Citizen Charter outlining service delivery timelines.",
      },
    ],
    mode: "information",
    actions: [
      {
        label: { hi: "RTI विवरण देखें", en: "View RTI Details" },
        href: "https://rti.dopt.gov.in/",
        provider: { hi: "कार्मिक एवं प्रशिक्षण विभाग, भारत सरकार", en: "DoPT, Government of India" },
        kind: "external",
      },
    ],
    provenance: {
      ...sourceProvenance("services.php"),
      reviewNote:
        "Source lists no PIO name or Citizen Charter document for Dhanaura; add them when the office provides them.",
    },
  },
  {
    slug: "sanitation-waste-management",
    icon: "sanitation",
    title: { hi: "स्वच्छता एवं कूड़ा प्रबंधन", en: "Sanitation & Waste Management" },
    summary: {
      hi: "घर-घर कूड़ा संग्रहण, ठोस अपशिष्ट प्रबंधन, फॉगिंग और सार्वजनिक स्वच्छता।",
      en: "Door-to-door collection, solid waste management, fogging and public sanitation.",
    },
    description: [
      {
        hi: "सार्वजनिक स्वास्थ्य और स्वच्छता विभाग दैनिक ठोस अपशिष्ट प्रबंधन, घर-घर कूड़ा संग्रहण, रोग नियंत्रण (जैसे फॉगिंग और छिड़काव) और सार्वजनिक स्वच्छता सुविधाओं के रखरखाव के लिए जिम्मेदार है। वे स्वच्छ भारत मिशन के तहत सक्रिय अभियान भी चलाते हैं।",
        en: "The Public Health and Sanitation department is responsible for daily solid waste management, door-to-door garbage collection, disease control (such as fogging and spraying), and maintaining public sanitation facilities. It also runs active campaigns under the Swachh Bharat Mission.",
      },
    ],
    mode: "information",
    actions: [
      {
        label: { hi: "स्वच्छ भारत मिशन (शहरी) पोर्टल", en: "SBM Urban Portal" },
        href: "https://sbmurban.org/",
        provider: { hi: "आवास और शहरी कार्य मंत्रालय", en: "Ministry of Housing and Urban Affairs" },
        kind: "external",
      },
      {
        label: { hi: "कार्यालय से संपर्क करें", en: "Contact the office" },
        href: "/contact",
        kind: "internal",
      },
    ],
    department: "public-health-sanitation",
    provenance: sourceProvenance("departments.php"),
  },
  {
    slug: "water-supply",
    icon: "water",
    title: { hi: "जल आपूर्ति", en: "Water Supply" },
    summary: {
      hi: "पाइपलाइन, ओवरहेड टैंक और सार्वजनिक स्टैंडपोस्ट के माध्यम से पेयजल आपूर्ति।",
      en: "Drinking water through pipelines, overhead tanks and public standposts.",
    },
    description: [
      {
        hi: "जल आपूर्ति विभाग यह सुनिश्चित करता है कि हर घर और वाणिज्यिक प्रतिष्ठान में स्वच्छ और सुरक्षित पेयजल उपलब्ध हो। वे जल जीवन मिशन के तहत परियोजनाओं को क्रियान्वित करते हुए शहर के पानी के पाइपलाइनों, ओवरहेड टैंकों, जलाशयों और सार्वजनिक स्टैंडपोस्ट के व्यापक नेटवर्क का प्रबंधन करते हैं।",
        en: "The Water Supply Department ensures that every household and commercial establishment has access to clean and safe drinking water. It manages the city's network of water pipelines, overhead tanks, reservoirs, and public standposts, while also executing projects under the Jal Jeevan Mission.",
      },
      {
        hi: "नए जल संयोजन की प्रक्रिया की जानकारी के लिए कार्यालय से संपर्क करें।",
        en: "Contact the office for the procedure for a new water connection.",
      },
    ],
    mode: "information",
    actions: [
      {
        label: { hi: "कार्यालय से संपर्क करें", en: "Contact the office" },
        href: "/contact",
        kind: "internal",
      },
    ],
    department: "water-supply",
    provenance: {
      ...editorial,
      reviewNote:
        "Department description is source-published (departments.php); the connection procedure is not published and needs office input.",
    },
  },
  {
    slug: "emergency-contacts",
    icon: "emergency",
    title: { hi: "आपातकालीन संपर्क", en: "Emergency Contacts" },
    summary: {
      hi: "पुलिस 112/100, फायर ब्रिगेड 101, एंबुलेंस 108/102।",
      en: "Police 112/100, Fire Brigade 101, Ambulance 108/102.",
    },
    description: [
      {
        hi: "आपात स्थिति में इन राष्ट्रीय हेल्पलाइन नंबरों पर कॉल करें।",
        en: "In an emergency, call these national helpline numbers.",
      },
    ],
    mode: "information",
    actions: [],
    provenance: sourceProvenance("services.php"),
  },
]

export function getService(slug: string) {
  return services.find((s) => s.slug === slug)
}
