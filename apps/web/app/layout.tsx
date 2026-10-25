import QueryProvider from "@/components/providers/query-providers"
import { site } from "@/content"
import { getLocale, tx } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { LocaleProvider } from "@workspace/i18n"
import type { Metadata, Viewport } from "next"
import { Inter, Noto_Sans_Devanagari } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter-sans", display: "swap" })
const notoDeva = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-noto-deva",
  display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const name = tx(site.name, locale)
  const description =
    locale === "hi"
      ? "नगर पालिका परिषद, धनौरा (जनपद अमरोहा, उत्तर प्रदेश) की वेबसाइट — नागरिक सेवाएँ, सूचनाएँ, निविदाएँ, योजनाएँ, फोटो गैलरी और संपर्क जानकारी।"
      : "Website of Nagar Palika Parishad Dhanaura, District Amroha, Uttar Pradesh — citizen services, notices, tenders, schemes, photo gallery and contact details."
  return {
    metadataBase: new URL(site.url),
    title: { default: name, template: `%s | ${name}` },
    description,
    applicationName: name,
    openGraph: {
      type: "website",
      siteName: name,
      locale: locale === "hi" ? "hi_IN" : "en_IN",
      images: [{ url: "/media/source/dhanaura-park-walkway.jpg", width: 1600, height: 731 }],
    },
    formatDetection: { telephone: false },
  }
}

export const viewport: Viewport = {
  themeColor: "#17324d",
  width: "device-width",
  initialScale: 1,
}

/** Applies the saved text size before first paint to avoid a layout jump. */
const textSizeScript = `try{var s=localStorage.getItem("text-size");if(s==="lg"||s==="xl")document.documentElement.dataset.textSize=s}catch(e){}`

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale()
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(inter.variable, notoDeva.variable)}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: textSizeScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <LocaleProvider initialLocale={locale}>
          <QueryProvider>{children}</QueryProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
