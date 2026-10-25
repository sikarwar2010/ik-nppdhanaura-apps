import type { Text } from "./schema"
import { sourceProvenance } from "./site"

/** Text migrated verbatim from about.php (Hindi and English versions). */
export const about = {
  title: { hi: "नगर पालिका परिषद, धनौरा में आपका स्वागत है", en: "Welcome to Nagar Palika Parishad, Dhanaura" } satisfies Text,
  intro: [
    {
      hi: "धनौरा की नगर पालिका परिषद एक नगरपालिका शासी निकाय है जो शहर के निवासियों को आवश्यक नागरिक सेवाएं और मजबूत बुनियादी ढांचे का विकास प्रदान करने के लिए प्रतिबद्ध है। सांस्कृतिक रूप से समृद्ध क्षेत्र में स्थित, धनौरा ऐतिहासिक विरासत को आधुनिक नागरिक योजना के साथ मिश्रित करता है।",
      en: "The Nagar Palika Parishad of Dhanaura is the municipal governing body committed to providing essential civic services and robust infrastructure development to the city's residents. Situated in a culturally rich region, Dhanaura blends historical heritage with modern civic planning.",
    },
    {
      hi: "शहरी उत्कृष्टता की दृष्टि से स्थापित, पालिका शहर नियोजन, व्यापक स्वच्छता, स्वास्थ्य सेवाओं और पारदर्शी संपत्ति कराधान की देखरेख करती है ताकि सतत विकास को बढ़ावा दिया जा सके।",
      en: "Established with a vision of urban excellence, the Palika oversees city planning, comprehensive sanitation, health services, and transparent property taxation to foster sustainable growth.",
    },
  ] satisfies Text[],
  vision: {
    title: { hi: "हमारा दृष्टिकोण", en: "Our Vision" } satisfies Text,
    body: {
      hi: "हमारा मिशन धनौरा के सभी नागरिकों के लिए जीवन की उच्च गुणवत्ता, पर्यावरण संरक्षण और मजबूत सार्वजनिक सुविधाएं सुनिश्चित करते हुए सतत विकास को बढ़ावा देना है। हम सक्रिय नागरिक भागीदारी और स्मार्ट प्रशासन के माध्यम से \"स्वच्छ धनौरा, हरित धनौरा\" बनाने का प्रयास करते हैं।",
      en: "Our mission is to foster sustainable growth while ensuring a high quality of life, environmental conservation, and robust public amenities for all citizens of Dhanaura. We strive to create a \"Clean Dhanaura, Green Dhanaura\" through active citizen participation and smart governance.",
    } satisfies Text,
  },
  heritage: {
    title: { hi: "विरासत और प्रशासन", en: "Heritage & Administration" } satisfies Text,
    body: {
      hi: "धनौरा का गहरा ऐतिहासिक महत्व है, जो एक जीवंत व्यापारिक केंद्र से तेजी से विकसित हो रहे शहरी नगर पालिका में विकसित हो रहा है। नगर पालिका शहर के बुनियादी ढांचे को लगातार उन्नत कर रही है - जिसमें एलईडी स्ट्रीट लाइटिंग से लेकर पाइप जल आपूर्ति तक शामिल है - साथ ही इसकी अनूठी सांस्कृतिक पहचान को भी संरक्षित कर रही है।",
      en: "Dhanaura has a deep-rooted historical significance, evolving from a vibrant trading hub into a rapidly developing urban municipality. The Nagar Palika is continuously upgrading the city's infrastructure—ranging from LED street lighting to piped water supply—while preserving its unique cultural identity.",
    } satisfies Text,
  },
  slogan: { hi: "स्वच्छ धनौरा, हरित धनौरा", en: "Clean Dhanaura, Green Dhanaura" } satisfies Text,
  provenance: sourceProvenance("about.php"),
}

/** Hero slide captions from the source homepage carousel. */
export const heroSlides = [
  {
    title: { hi: "स्वच्छ शहर, हरा शहर", en: "Clean City, Green City" },
    body: {
      hi: "बेहतर कल के लिए हमारी स्वच्छ भारत पहल में शामिल हों।",
      en: "Join us in our Swachh Bharat initiatives for a better tomorrow.",
    },
  },
  {
    title: { hi: "डिजिटल नागरिक सेवाएँ", en: "Digital Citizen Services" },
    body: {
      hi: "नगरपालिका सेवाओं तक पहुंचें, करों का भुगतान करें और ऑनलाइन फॉर्म डाउनलोड करें।",
      en: "Access municipal services, pay taxes, and download forms online.",
    },
  },
] satisfies { title: Text; body: Text }[]
