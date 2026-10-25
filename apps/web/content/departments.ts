import type { Department } from "./schema"
import { sourceProvenance } from "./site"

const provenance = sourceProvenance("departments.php")

/** Departments as published on departments.php, in the same order. */
export const departments: Department[] = [
  {
    slug: "public-health-sanitation",
    icon: "sanitation",
    name: { hi: "सार्वजनिक स्वास्थ्य और स्वच्छता", en: "Public Health & Sanitation" },
    description: {
      hi: "सार्वजनिक स्वास्थ्य और स्वच्छता विभाग शहर की स्वच्छता बनाए रखने में सबसे आगे है। वे दैनिक ठोस अपशिष्ट प्रबंधन, घर-घर कूड़ा संग्रहण, रोग नियंत्रण (जैसे फॉगिंग और छिड़काव) और सार्वजनिक स्वच्छता सुविधाओं के रखरखाव के लिए जिम्मेदार हैं। वे स्वच्छ भारत मिशन के तहत सक्रिय अभियान भी चलाते हैं।",
      en: "The Public Health and Sanitation department is at the forefront of maintaining city hygiene. They are responsible for daily solid waste management, door-to-door garbage collection, disease control (such as fogging and spraying), and maintaining public sanitation facilities. They also run active campaigns under the Swachh Bharat Mission.",
    },
    links: [
      {
        label: { hi: "स्वच्छ भारत मिशन पोर्टल", en: "Swachh Bharat Mission Portal" },
        href: "https://swachhbharatmission.ddws.gov.in/",
        kind: "external",
      },
    ],
    provenance,
  },
  {
    slug: "public-works",
    icon: "works",
    name: { hi: "लोक निर्माण विभाग (PWD)", en: "Public Works Department (PWD)" },
    description: {
      hi: "लोक निर्माण विभाग (PWD) शहर के मुख्य बुनियादी ढांचे को संभालता है। उनकी जिम्मेदारियों में नगरपालिका सड़कों, पुलों, सार्वजनिक भवनों और जटिल जल निकासी प्रणालियों की योजना, निर्माण और नियमित रखरखाव शामिल है ताकि सभी नागरिकों के लिए सुचारू पारगमन और सुरक्षा सुनिश्चित हो सके।",
      en: "The Public Works Department (PWD) handles the core infrastructure of the city. Their responsibilities include the planning, construction, and regular maintenance of municipal roads, bridges, public buildings, and complex drainage systems to ensure smooth transit and safety for all citizens.",
    },
    links: [
      {
        label: { hi: "UP PWD आधिकारिक पोर्टल", en: "UP PWD Official Portal" },
        href: "https://uppwd.gov.in/",
        kind: "external",
      },
    ],
    provenance,
  },
  {
    slug: "revenue-tax",
    icon: "tax",
    name: { hi: "राजस्व और कर विभाग", en: "Revenue & Tax Department" },
    description: {
      hi: "राजस्व और कर विभाग पालिका की वित्तीय रीढ़ है। वे संपत्ति कर, जल कर के उचित मूल्यांकन, बिलिंग और संग्रह को संभालते हैं और वाणिज्यिक प्रतिष्ठानों के लिए व्यापार लाइसेंस जारी करते हैं। वे नगरपालिका विकास के लिए पारदर्शी और कुशल राजस्व सृजन सुनिश्चित करते हैं।",
      en: "The Revenue and Tax Department is the financial backbone of the Palika. They handle the fair assessment, billing, and collection of Property Tax, Water Tax, and issue Trade Licenses for commercial establishments. They ensure transparent and efficient revenue generation for municipal development.",
    },
    links: [
      {
        label: { hi: "ई-नगरसेवा यूपी पोर्टल", en: "e-NagarSewa UP Portal" },
        href: "https://e-nagarsewaup.gov.in/",
        kind: "external",
      },
    ],
    provenance,
  },
  {
    slug: "water-supply",
    icon: "water",
    name: { hi: "जल आपूर्ति विभाग", en: "Water Supply Department" },
    description: {
      hi: "जल आपूर्ति विभाग यह सुनिश्चित करता है कि हर घर और वाणिज्यिक प्रतिष्ठान में स्वच्छ और सुरक्षित पेयजल उपलब्ध हो। वे जल जीवन मिशन के तहत परियोजनाओं को क्रियान्वित करते हुए शहर के पानी के पाइपलाइनों, ओवरहेड टैंकों, जलाशयों और सार्वजनिक स्टैंडपोस्ट के व्यापक नेटवर्क का प्रबंधन करते हैं।",
      en: "The Water Supply Department ensures that every household and commercial establishment has access to clean and safe drinking water. They manage the city's extensive network of water pipelines, overhead tanks, reservoirs, and public standposts, while also executing projects under the Jal Jeevan Mission.",
    },
    links: [
      {
        label: { hi: "जल जीवन मिशन पोर्टल", en: "Jal Jeevan Mission Portal" },
        href: "https://jaljeevanmission.gov.in/",
        kind: "external",
      },
    ],
    provenance,
  },
  {
    slug: "street-lighting",
    icon: "streetlight",
    name: { hi: "स्ट्रीट लाइटिंग विभाग", en: "Street Lighting Department" },
    description: {
      hi: "स्ट्रीट लाइटिंग विभाग अंधेरे के बाद शहर को रोशन करके सार्वजनिक सुरक्षा के लिए समर्पित है। वे राष्ट्रीय ऊर्जा संरक्षण कार्यक्रमों के अनुरूप काम करते हुए, सभी नगरपालिका वार्डों, सार्वजनिक पार्कों और प्रमुख चौराहों पर ऊर्जा-कुशल एलईडी स्ट्रीट लाइटें लगाते, सुधारते और बनाए रखते हैं।",
      en: "The Street Lighting Department is dedicated to public safety by illuminating the city after dark. They install, repair, and maintain energy-efficient LED street lights across all municipal wards, public parks, and major intersections, working in alignment with national energy conservation programs.",
    },
    links: [
      {
        label: { hi: "स्ट्रीट लाइट नेशनल प्रोग्राम", en: "Street Light National Programme" },
        href: "https://eeslindia.org/en/slnp/",
        kind: "external",
      },
    ],
    provenance,
  },
  {
    slug: "civil-registration",
    icon: "certificate",
    name: { hi: "नागरिक पंजीकरण प्रणाली (CRS)", en: "Civil Registration System (CRS)" },
    description: {
      hi: "नागरिक पंजीकरण प्रणाली (CRS) विभाग एक महत्वपूर्ण नागरिक सेवा केंद्र है। वे महत्वपूर्ण घटनाओं, मुख्य रूप से जन्म और मृत्यु के समय पर और सटीक पंजीकरण की सुविधा प्रदान करते हैं। वे आधिकारिक प्रमाण पत्र सुरक्षित और कुशलतापूर्वक जारी करने के लिए राज्य डेटाबेस के साथ समन्वय करते हैं।",
      en: "The Civil Registration System (CRS) department is a vital citizen service center. They facilitate the timely and accurate registration of vital events, primarily births and deaths. They coordinate with state databases to issue official certificates securely and efficiently.",
    },
    links: [
      {
        label: { hi: "CRS आधिकारिक पोर्टल", en: "CRS Official Portal" },
        href: "https://crsorgi.gov.in/",
        kind: "external",
      },
    ],
    provenance,
  },
]
