import type { Text } from "./schema"

export type Policy = { title: Text; lead: Text; sections: { heading: Text; body: Text[] }[] }

/**
 * Website policies. Editorial drafts that describe how THIS website works;
 * they make no certification or compliance claims. Review with the office
 * before relaunch.
 */
export const policies: Record<"privacy" | "terms" | "accessibility", Policy> = {
  privacy: {
    title: { hi: "गोपनीयता नीति", en: "Privacy Policy" },
    lead: {
      hi: "यह वेबसाइट आपसे कौन-सी जानकारी लेती है और उसका उपयोग कैसे होता है।",
      en: "What information this website collects and how it is used.",
    },
    sections: [
      {
        heading: { hi: "हम क्या एकत्र करते हैं", en: "What we collect" },
        body: [
          {
            hi: "सूचनाएँ, सेवाएँ और गैलरी देखने के लिए आपको कोई व्यक्तिगत जानकारी देने की आवश्यकता नहीं है। यह वेबसाइट कोई विज्ञापन या ट्रैकिंग कुकी नहीं लगाती।",
            en: "You do not need to provide any personal information to read notices, services or the gallery. This website sets no advertising or tracking cookies.",
          },
          {
            hi: "आपकी भाषा की पसंद एक कुकी (locale) में और अक्षर-आकार की पसंद आपके ब्राउज़र के स्थानीय भंडारण में रखी जाती है। इनमें कोई व्यक्तिगत जानकारी नहीं होती।",
            en: "Your language choice is stored in a cookie (locale) and your text-size choice in your browser's local storage. Neither contains personal information.",
          },
          {
            hi: "सर्वर सामान्य तकनीकी लॉग (जैसे IP पता, समय, देखा गया पृष्ठ) सुरक्षा और त्रुटि-निवारण के लिए रख सकता है।",
            en: "The server may keep standard technical logs (such as IP address, time and page requested) for security and troubleshooting.",
          },
        ],
      },
      {
        heading: { hi: "संपत्ति कर खोज", en: "Property tax search" },
        body: [
          {
            hi: "संपत्ति कर खोज में दर्ज विवरण (जैसे वार्ड, संपत्ति संख्या, नाम या मोबाइल) केवल आपके परिणाम दिखाने के लिए नगर पालिका के सर्वर पर भेजे जाते हैं। ऑनलाइन भुगतान अधिकृत भुगतान गेटवे द्वारा संसाधित होता है; यह वेबसाइट कार्ड या बैंक विवरण संग्रहीत नहीं करती।",
            en: "Details entered in the property tax search (such as ward, property number, name or mobile) are sent to the Nagar Palika server only to show your results. Online payments are processed by the authorised payment gateway; this website does not store card or bank details.",
          },
        ],
      },
      {
        heading: { hi: "बाहरी वेबसाइटें और नक्शा", en: "External websites and the map" },
        body: [
          {
            hi: "कई सेवाएँ अन्य सरकारी पोर्टलों पर उपलब्ध हैं। वहाँ जाने पर उन्हीं पोर्टलों की गोपनीयता नीतियाँ लागू होती हैं। संपर्क पृष्ठ का गूगल मैप्स नक्शा तभी लोड होता है जब आप \"नक्शा दिखाएँ\" दबाते हैं।",
            en: "Many services are provided on other government portals; their own privacy policies apply there. The Google Maps map on the contact page loads only when you press \"Show map\".",
          },
        ],
      },
      {
        heading: { hi: "संपर्क", en: "Contact" },
        body: [
          {
            hi: "इस नीति से संबंधित प्रश्नों के लिए नगर पालिका कार्यालय से संपर्क करें।",
            en: "For questions about this policy, please contact the Nagar Palika office.",
          },
        ],
      },
    ],
  },
  terms: {
    title: { hi: "उपयोग की शर्तें", en: "Terms of Use" },
    lead: {
      hi: "इस वेबसाइट की सामग्री के उपयोग से जुड़ी शर्तें।",
      en: "Terms for using the content of this website.",
    },
    sections: [
      {
        heading: { hi: "सामग्री", en: "Content" },
        body: [
          {
            hi: "इस वेबसाइट की सामग्री नगर पालिका परिषद, धनौरा द्वारा जनसाधारण की जानकारी के लिए प्रकाशित की गई है। सामग्री को सही रखने का प्रयास किया जाता है, फिर भी किसी भी कानूनी या आधिकारिक उद्देश्य के लिए संबंधित मूल आदेश, अधिसूचना या कार्यालय से पुष्टि करें।",
            en: "Content on this website is published by Nagar Palika Parishad, Dhanaura for public information. While care is taken to keep it accurate, please confirm with the original order, notification or the office for any legal or official purpose.",
          },
          {
            hi: "संग्रहीत सूचनाएँ ऐतिहासिक रिकॉर्ड के रूप में रखी जाती हैं; उनकी तिथियाँ बीत चुकी हो सकती हैं।",
            en: "Archived notices are kept as historical records; their dates may have passed.",
          },
        ],
      },
      {
        heading: { hi: "बाहरी लिंक", en: "External links" },
        body: [
          {
            hi: "बाहरी लिंक सुविधा के लिए दिए गए हैं और स्पष्ट रूप से चिह्नित हैं। उन वेबसाइटों की सामग्री और उपलब्धता के लिए उनके प्रकाशक उत्तरदायी हैं।",
            en: "External links are provided for convenience and are clearly marked. Their publishers are responsible for the content and availability of those websites.",
          },
        ],
      },
      {
        heading: { hi: "पुनः उपयोग", en: "Re-use" },
        body: [
          {
            hi: "सामग्री का गैर-व्यावसायिक पुनः उपयोग स्रोत का उल्लेख करते हुए किया जा सकता है। तस्वीरों और दस्तावेज़ों के पुनः उपयोग के लिए कार्यालय से अनुमति लें।",
            en: "Content may be re-used for non-commercial purposes with attribution to the source. Ask the office for permission before re-using photographs and documents.",
          },
        ],
      },
    ],
  },
  accessibility: {
    title: { hi: "सुगम्यता विवरण", en: "Accessibility Statement" },
    lead: {
      hi: "हम चाहते हैं कि यह वेबसाइट सभी नागरिकों के लिए उपयोग में आसान हो।",
      en: "We want this website to be easy for every citizen to use.",
    },
    sections: [
      {
        heading: { hi: "हमने क्या किया है", en: "What we have done" },
        body: [
          {
            hi: "वेबसाइट का लक्ष्य WCAG 2.2 स्तर AA के मार्गदर्शन का पालन करना है। इसमें कीबोर्ड से पूरी नेविगेशन, \"मुख्य सामग्री पर जाएँ\" लिंक, दिखाई देने वाला फोकस, चित्रों के लिए वैकल्पिक पाठ, पर्याप्त रंग-विरोधाभास, अक्षर-आकार नियंत्रण, हिंदी/अंग्रेज़ी भाषा चयन और कम-गति (reduced motion) सेटिंग का सम्मान शामिल है।",
            en: "The website aims to follow WCAG 2.2 Level AA guidance. This includes full keyboard navigation, a \"Skip to main content\" link, visible focus, text alternatives for images, sufficient colour contrast, a text-size control, Hindi/English language choice and respect for the reduced-motion setting.",
          },
          {
            hi: "यह एक लक्ष्य है, प्रमाणन नहीं। स्वचालित जाँच (axe) से परीक्षण किया गया है; पूर्ण मैनुअल ऑडिट शेष है।",
            en: "This is a target, not a certification. Pages have been tested with automated checks (axe); a full manual audit is still pending.",
          },
        ],
      },
      {
        heading: { hi: "ज्ञात सीमाएँ", en: "Known limitations" },
        body: [
          {
            hi: "बाहरी पोर्टलों और बाहरी PDF दस्तावेज़ों की सुगम्यता उनके प्रकाशकों पर निर्भर है। कुछ पुरानी तस्वीरों में लिखे पाठ (जैसे समाचार पत्र की कतरन) का पूरा पाठ उपलब्ध नहीं है।",
            en: "Accessibility of external portals and externally hosted PDFs depends on their publishers. Text inside some photographs (such as a newspaper clipping) is not available as full text.",
          },
        ],
      },
      {
        heading: { hi: "समस्या बताएँ", en: "Report a problem" },
        body: [
          {
            hi: "यदि आपको किसी पृष्ठ के उपयोग में कठिनाई हो, तो कृपया पृष्ठ का पता और समस्या लिखकर नगर पालिका कार्यालय को ईमेल करें।",
            en: "If you find any page hard to use, please email the Nagar Palika office with the page address and the problem.",
          },
        ],
      },
    ],
  },
}
