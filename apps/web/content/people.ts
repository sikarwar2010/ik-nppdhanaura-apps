import type { Person, TeamPortrait } from "./schema"
import { sourceProvenance } from "./site"

const home = sourceProvenance("index.php")

/**
 * Leadership as published on the source homepage (names, designations,
 * photographs and the two messages). The source's Chief Minister and Nagar
 * Vikas Minister "messages" were placeholder text, so no message is shown.
 */
export const people: Person[] = [
  {
    id: "chief-minister",
    name: { hi: "योगी आदित्यनाथ", en: "Yogi Adityanath" },
    designation: { hi: "मुख्यमंत्री, उत्तर प्रदेश", en: "Chief Minister, Uttar Pradesh" },
    photo: {
      src: "/media/source/leader-chief-minister-up.jpg",
      width: 410,
      height: 487,
      alt: { hi: "मुख्यमंत्री योगी आदित्यनाथ का चित्र", en: "Portrait of Chief Minister Yogi Adityanath" },
    },
    photoPosition: "center top",
    group: "patron",
    published: true,
    provenance: home,
  },
  {
    id: "nagar-vikas-minister",
    name: { hi: "श्री ए.के. शर्मा (अरविंद कुमार शर्मा)", en: "Shri Arvind Kumar Sharma (A. K. Sharma)" },
    designation: { hi: "नगर विकास मंत्री, उत्तर प्रदेश", en: "Nagar Vikas Minister, Uttar Pradesh" },
    photo: {
      src: "/media/source/leader-nagar-vikas-minister.jpg",
      width: 399,
      height: 300,
      alt: { hi: "नगर विकास मंत्री श्री ए.के. शर्मा का चित्र", en: "Portrait of Nagar Vikas Minister Shri A. K. Sharma" },
    },
    photoPosition: "center 20%",
    group: "patron",
    published: true,
    provenance: home,
  },
  {
    id: "chairman",
    name: { hi: "प्रवीण कुमार अग्रवाल", en: "Praveen Kumar Agarwal" },
    designation: { hi: "अध्यक्ष, नगर पालिका परिषद धनौरा", en: "Chairman, Nagar Palika Parishad Dhanaura" },
    message: {
      hi: "हमारी नगर पालिका के आधिकारिक पोर्टल पर आपका स्वागत है। हम सभी नागरिकों को पारदर्शी, सुलभ और कुशल सेवाएँ प्रदान करने के लिए प्रतिबद्ध हैं। हमारा विज़न एक साफ़-सुथरा, हरा-भरा और स्मार्ट शहर बनाना है।",
      en: "Welcome to the official portal of our Nagar Palika. We are committed to providing transparent, accessible, and efficient services to all citizens. Our vision is a cleaner, greener, and smarter city.",
    },
    photo: {
      src: "/media/source/leader-chairman.jpg",
      width: 581,
      height: 716,
      alt: { hi: "अध्यक्ष प्रवीण कुमार अग्रवाल का चित्र", en: "Portrait of Chairman Praveen Kumar Agarwal" },
    },
    photoPosition: "center 15%",
    group: "municipal",
    published: true,
    provenance: {
      ...home,
      reviewNote:
        "Name, designation, message and photo are as published on the source homepage. Confirm with the office before relaunch.",
    },
  },
  {
    id: "executive-officer",
    name: { hi: "अवधेश कुमार वर्मा", en: "Awadesh Kumar Verma" },
    designation: { hi: "अधिशासी अधिकारी, नगर पालिका परिषद धनौरा", en: "Executive Officer, Nagar Palika Parishad Dhanaura" },
    message: {
      hi: "यह डिजिटल पोर्टल ई-गवर्नेंस की दिशा में एक महत्वपूर्ण कदम है। हम नागरिकों को प्रॉपर्टी टैक्स, शिकायतों के समाधान और विकास कार्यों की ट्रैकिंग के लिए ऑनलाइन सेवाओं का उपयोग करने के लिए प्रोत्साहित करते हैं।",
      en: "This digital portal represents a significant step towards e-governance. We encourage citizens to utilize online services for property tax, grievance redressal, and tracking development works.",
    },
    photo: {
      src: "/media/source/leader-executive-officer.png",
      width: 584,
      height: 1296,
      alt: { hi: "अधिशासी अधिकारी अवधेश कुमार वर्मा का चित्र", en: "Portrait of Executive Officer Awadesh Kumar Verma" },
    },
    photoPosition: "center 42%",
    group: "municipal",
    published: true,
    provenance: {
      ...home,
      reviewNote:
        "Name, designation, message and photo are as published on the source homepage. Confirm with the office before relaunch.",
    },
  },
]

/**
 * The two portraits supplied with this project:
 *   portrait-1: man in a light-yellow shirt against a light background
 *   portrait-2: man wearing glasses, a blue blazer and a checked shirt
 *
 * Copy the files to public/media/team/ with these names. Identities and roles
 * are NOT assumed: each card stays hidden until an administrator adds a
 * confirmed name and designation and sets `published: true`.
 */
export const teamPortraits: TeamPortrait[] = [
  {
    id: "portrait-1",
    photo: {
      src: "/media/team/portrait-1.jpg",
      width: 800,
      height: 1000,
      alt: { hi: "नगर पालिका टीम सदस्य का चित्र", en: "Portrait of a Nagar Palika team member" },
    },
    published: false,
    provenance: { verification: "office-confirmed", reviewNote: "Awaiting confirmed name and designation." },
  },
  {
    id: "portrait-2",
    photo: {
      src: "/media/team/portrait-2.jpg",
      width: 800,
      height: 1000,
      alt: { hi: "नगर पालिका टीम सदस्य का चित्र", en: "Portrait of a Nagar Palika team member" },
    },
    published: false,
    provenance: { verification: "office-confirmed", reviewNote: "Awaiting confirmed name and designation." },
  },
]
