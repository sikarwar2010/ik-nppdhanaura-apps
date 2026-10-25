import type { Text } from "@/content/schema"

export type NavLink = { label: Text; href: string; description?: Text }
export type NavItem = NavLink & { children?: NavLink[] }

/** Main navigation. Labels are kept short so the bar fits at 1024px in Hindi. */
export const mainNav: NavItem[] = [
  { label: { hi: "मुख्य पृष्ठ", en: "Home" }, href: "/" },
  { label: { hi: "परिचय", en: "About" }, href: "/about" },
  {
    label: { hi: "प्रशासन", en: "Administration" },
    href: "/administration",
    children: [
      {
        label: { hi: "नेतृत्व एवं टीम", en: "Leadership & Team" },
        href: "/administration",
        description: { hi: "अध्यक्ष, अधिशासी अधिकारी और प्रदेश नेतृत्व", en: "Chairman, Executive Officer and state leadership" },
      },
      {
        label: { hi: "विभाग", en: "Departments" },
        href: "/departments",
        description: { hi: "नगर पालिका के छह विभाग और उनके कार्य", en: "The six departments and what they do" },
      },
    ],
  },
  {
    label: { hi: "नागरिक सेवाएँ", en: "Services" },
    href: "/services",
    children: [
      {
        label: { hi: "सभी सेवाएँ", en: "All services" },
        href: "/services",
        description: { hi: "प्रमाण पत्र, कर, लाइसेंस, RTI", en: "Certificates, tax, licences, RTI" },
      },
      {
        label: { hi: "संपत्ति कर खोज", en: "Property tax search" },
        href: "/propertytax",
        description: { hi: "वार्ड, संपत्ति संख्या या स्वामी से खोजें", en: "Search by ward, property ID or owner" },
      },
      {
        label: { hi: "जन शिकायत", en: "Public grievances" },
        href: "/public-grievance",
        description: { hi: "शिकायत दर्ज करने के आधिकारिक माध्यम", en: "Official ways to register a grievance" },
      },
      {
        label: { hi: "सरकारी योजनाएं", en: "Government schemes" },
        href: "/schemes",
        description: { hi: "आवास, स्वच्छता, आजीविका योजनाएँ", en: "Housing, sanitation and livelihood schemes" },
      },
    ],
  },
  {
    label: { hi: "सूचनाएँ", en: "Notices" },
    href: "/notices",
    children: [
      {
        label: { hi: "सूचनाएँ एवं घोषणाएँ", en: "Notices & announcements" },
        href: "/notices",
        description: { hi: "सक्रिय और संग्रहीत सूचनाएँ", en: "Active and archived notices" },
      },
      {
        label: { hi: "समाचार एवं कार्यक्रम", en: "News & events" },
        href: "/news",
        description: { hi: "अभियान और आयोजन", en: "Campaigns and events" },
      },
    ],
  },
  { label: { hi: "निविदाएं", en: "Tenders" }, href: "/tenders" },
  { label: { hi: "दस्तावेज़", en: "Documents" }, href: "/documents" },
  { label: { hi: "गैलरी", en: "Gallery" }, href: "/gallery" },
  { label: { hi: "संपर्क", en: "Contact" }, href: "/contact" },
]

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}
