import QueryProvider from "@/components/providers/query-providers"
import { cn } from "@/lib/utils"
import { LOCALE_COOKIE, LocaleProvider, parseLocale } from "@workspace/i18n"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { cookies } from "next/headers"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Nagar Palika Parishad , Dhanaura, Amroha",
  description:
    "Official portal of Nagar Palika Parishad,Dhanaura,Amroha, Uttar Pradesh. Settle property tax, pay water tax, apply for birth/death certificates, browse active tenders, and submit grievances online.",
  keywords:
    "Nagar Palika Parishad , Dhanaura , Amroha , Uttar Pradesh , Property Tax, Water Tax , Birth Certificate , Death Certificate , Tenders , Grievances",
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
      className={cn("font-sans", geist.variable)}
    >
      <body className="flex min-h-screen flex-col bg-white text-slate-800">
        <LocaleProvider initialLocale={locale}>
          <QueryProvider>{children}</QueryProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
