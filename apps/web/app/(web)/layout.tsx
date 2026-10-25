import { SiteFooter } from "@/components/site/footer"
import { SiteHeader } from "@/components/site/header"

export default function WebLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <SiteFooter />
    </>
  )
}
