import { LOCALE_COOKIE, LocaleProvider, parseLocale } from "@workspace/i18n"
import { Toaster } from "@workspace/ui/components/sonner"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { Geist, Geist_Mono, Noto_Sans_Devanagari } from "next/font/google"
import { cookies } from "next/headers"

import { QueryProvider } from "@/components/query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-deva",
  weight: ["400", "500", "600", "700"],
})

export const metadata = {
  title: "Nagar Panchayat Goverdhan",
  description: "Survey and property data platform",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const locale = parseLocale(cookieStore.get(LOCALE_COOKIE)?.value)
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable,
        notoDevanagari.variable
      )}
    >
      <body>
        <LocaleProvider initialLocale={locale}>
          <ThemeProvider>
            <QueryProvider>
              <TooltipProvider>
                {children}
                <Toaster richColors closeButton />
              </TooltipProvider>
            </QueryProvider>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
