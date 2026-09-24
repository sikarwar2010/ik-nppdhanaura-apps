"use client"

import React, { useState } from "react"
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  FileText,
  Hash,
  Landmark,
  MapPin,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react"

type SearchTab = "ward" | "propertyId" | "owner"

export default function ProfessionalPropertyTaxPage() {
  const [activeTab, setActiveTab] = useState<SearchTab>("ward")

  const [wardNumber, setWardNumber] = useState("")
  const [propertyNumber, setPropertyNumber] = useState("")
  const [propertyIdInput, setPropertyIdInput] = useState("")
  const [ownerName, setOwnerName] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    console.log("Property Tax Search:", {
      searchType: activeTab,
      wardNumber,
      propertyNumber,
      propertyId: propertyIdInput,
      ownerName,
      mobileNumber,
    })

    // Connect your backend/API here.
  }

  const handleReset = () => {
    setWardNumber("")
    setPropertyNumber("")
    setPropertyIdInput("")
    setOwnerName("")
    setMobileNumber("")
  }

  const tabs = [
    {
      id: "ward" as SearchTab,
      title: "Search by Ward",
      subtitle: "Ward & property details",
      icon: MapPin,
      active:
        "border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-700 shadow-[0_10px_30px_rgba(16,185,129,0.14)]",
      iconBg: "bg-emerald-100 text-emerald-600",
    },
    {
      id: "propertyId" as SearchTab,
      title: "Property ID / Parcel",
      subtitle: "Unique property number",
      icon: Hash,
      active:
        "border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 text-orange-700 shadow-[0_10px_30px_rgba(249,115,22,0.14)]",
      iconBg: "bg-orange-100 text-orange-600",
    },
    {
      id: "owner" as SearchTab,
      title: "Owner / Mobile",
      subtitle: "Registered owner details",
      icon: User,
      active:
        "border-blue-300 bg-linear-to-br from-blue-50 to-cyan-50 text-blue-700 shadow-[0_10px_30px_rgba(59,130,246,0.14)]",
      iconBg: "bg-blue-100 text-blue-600",
    },
  ]

  return (
    <main className="relative min-h-screen overflow-hidden bg-linear-to-br from-[#f4fff8] via-white to-[#fff9ef] font-sans text-slate-900">
      {/* =====================================================
          PREMIUM GRID BACKGROUND
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(#16734a 1px, transparent 1px), linear-gradient(90deg, #16734a 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Soft colorful background lights */}

      <div className="pointer-events-none absolute -left-40 top-10 h-107.5 w-107.5 rounded-full bg-emerald-300/20 blur-[130px]" />

      <div className="pointer-events-none absolute -right-40 top-32 h-105 w-105 rounded-full bg-orange-300/20 blur-[130px]" />

      <div className="pointer-events-none absolute bottom-0 left-1/3 h-95 w-95 rounded-full bg-lime-300/15 blur-[130px]" />

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <section className="relative z-10 mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          {/* Government Badge */}

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/85 px-4 py-2 text-[10px] font-black tracking-[0.15em] text-emerald-700 uppercase shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-green-600 text-white">
              <Landmark className="h-3.5 w-3.5" />
            </span>

            Nagar Panchayat Goverdhan • Mathura
          </div>

          {/* Heading */}

          <h1 className="font-serif text-4xl leading-[1.12] font-black tracking-tight text-[#123f2b] sm:text-5xl lg:text-6xl">
            Property Tax{" "}
            <span className="bg-linear-to-r from-emerald-500 via-green-600 to-orange-500 bg-clip-text text-transparent">
              Search & Payment
            </span>
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 font-medium text-slate-600 sm:text-base">
            Nagar Panchayat Goverdhan, Mathura में अपनी संपत्ति का रिकॉर्ड
            खोजें, बकाया संपत्ति कर की जानकारी प्राप्त करें और उपलब्ध होने पर
            ऑनलाइन भुगतान प्रक्रिया पूरी करें।
          </p>

          {/* Trust indicators */}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-3.5 py-2 text-[10px] font-bold text-emerald-700 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Official Citizen Service
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/80 px-3.5 py-2 text-[10px] font-bold text-orange-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Digital Property Services
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3.5 py-2 text-[10px] font-bold text-blue-700 shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Easy Search
            </div>
          </div>

          {/* Breadcrumb */}

          <div className="mt-8 inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/85 px-4 py-2.5 text-xs font-semibold shadow-sm backdrop-blur-xl">
            <a
              href="/"
              className="text-slate-500 transition-colors hover:text-emerald-600"
            >
              Home
            </a>

            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />

            <span className="text-slate-500">Citizen Services</span>

            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />

            <span className="font-black text-emerald-600">
              Property Tax
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN SEARCH AREA
      ====================================================== */}

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {/* Premium Glow */}

        <div className="pointer-events-none absolute -inset-2 rounded-[38px] bg-linear-to-r from-emerald-400/20 via-orange-300/10 to-blue-400/20 blur-2xl" />

        <div className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/90 shadow-[0_25px_70px_rgba(15,80,50,0.10)] backdrop-blur-2xl">
          {/* =================================================
              CARD TOP HEADER
          ================================================== */}

          <div className="relative overflow-hidden border-b border-slate-100 bg-linear-to-r from-[#f1fff7] via-white to-[#fff8ed] px-5 py-6 sm:px-8">
            {/* Decorative circles */}

            <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-emerald-300/10 blur-2xl" />

            <div className="pointer-events-none absolute right-1/4 bottom-0 h-24 w-24 rounded-full bg-orange-300/10 blur-2xl" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-200">
                  <Building2 className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-[9px] font-black tracking-[0.15em] text-emerald-600 uppercase">
                    Nagar Panchayat Goverdhan
                  </p>

                  <h2 className="mt-1 text-xl font-black tracking-tight text-[#123f2b] sm:text-2xl">
                    Find Your Property Record
                  </h2>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Search your municipal property registration details.
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-100 bg-white px-3 py-2 text-[9px] font-black text-emerald-700 shadow-sm sm:self-center">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Online Service
              </div>
            </div>
          </div>

          {/* =================================================
              SEARCH TABS
          ================================================== */}

          <div className="border-b border-slate-100 bg-slate-50/70 p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-all duration-300 ${
                      isActive
                        ? tab.active
                        : "border-transparent bg-white/60 text-slate-600 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:text-slate-900 hover:shadow-lg"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                        isActive
                          ? tab.iconBg
                          : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>

                    <span className="min-w-0">
                      <span className="block text-xs font-black">
                        {tab.title}
                      </span>

                      <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
                        {tab.subtitle}
                      </span>
                    </span>

                    {isActive && (
                      <span className="absolute right-4 h-2 w-2 rounded-full bg-current shadow-sm" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* =================================================
              FORM CONTENT
          ================================================== */}

          <div className="p-5 sm:p-8 lg:p-10">
            {/* Form Heading */}

            <div className="mb-8 flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />

                  <span className="text-[9px] font-black tracking-[0.15em] text-emerald-600 uppercase">
                    Search Verification
                  </span>
                </div>

                <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                  Enter Property Details
                </h3>

                <p className="mt-1 text-xs leading-5 font-medium text-slate-500">
                  Please enter accurate information to find the registered
                  property record.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start rounded-xl border border-orange-100 bg-orange-50 px-3.5 py-2.5 text-[10px] font-bold text-orange-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure Search
              </div>
            </div>

            <form onSubmit={handleSearch} className="space-y-7">
              {/* =================================================
                  WARD SEARCH
              ================================================== */}

              {activeTab === "ward" && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="ward-number"
                      className="flex items-center gap-2 text-[10px] font-black tracking-wider text-slate-700 uppercase"
                    >
                      <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                      Select Ward Number
                    </label>

                    <input
                      id="ward-number"
                      type="text"
                      value={wardNumber}
                      onChange={(e) => setWardNumber(e.target.value)}
                      placeholder="Enter ward number"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm font-semibold text-slate-800 shadow-inner outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-emerald-200 hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />

                    <p className="px-1 text-[9px] font-medium text-slate-400">
                      Example: Ward 01, Ward 05, Ward 10
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="property-number"
                      className="flex items-center gap-2 text-[10px] font-black tracking-wider text-slate-700 uppercase"
                    >
                      <Building2 className="h-3.5 w-3.5 text-orange-500" />
                      Property / House Details
                    </label>

                    <input
                      id="property-number"
                      type="text"
                      value={propertyNumber}
                      onChange={(e) => setPropertyNumber(e.target.value)}
                      placeholder="Enter house / property number"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm font-semibold text-slate-800 shadow-inner outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-orange-200 hover:bg-white focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                    />

                    <p className="px-1 text-[9px] font-medium text-slate-400">
                      Enter your registered house or property number.
                    </p>
                  </div>
                </div>
              )}

              {/* =================================================
                  PROPERTY ID SEARCH
              ================================================== */}

              {activeTab === "propertyId" && (
                <div className="space-y-2">
                  <label
                    htmlFor="property-id"
                    className="flex items-center gap-2 text-[10px] font-black tracking-wider text-slate-700 uppercase"
                  >
                    <FileText className="h-3.5 w-3.5 text-orange-500" />
                    Property ID / Unique Parcel Number
                  </label>

                  <div className="relative">
                    <input
                      id="property-id"
                      type="text"
                      value={propertyIdInput}
                      onChange={(e) => setPropertyIdInput(e.target.value)}
                      placeholder="Enter Property ID or Parcel Number"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 pr-12 text-sm font-semibold text-slate-800 shadow-inner outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-orange-200 hover:bg-white focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                    />

                    <Hash className="absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-slate-300" />
                  </div>

                  <p className="px-1 text-[9px] font-medium text-slate-400">
                    Enter the unique property identification number mentioned
                    on your municipal property record.
                  </p>
                </div>
              )}

              {/* =================================================
                  OWNER SEARCH
              ================================================== */}

              {activeTab === "owner" && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="owner-name"
                      className="flex items-center gap-2 text-[10px] font-black tracking-wider text-slate-700 uppercase"
                    >
                      <User className="h-3.5 w-3.5 text-blue-500" />
                      Property Owner Name
                    </label>

                    <input
                      id="owner-name"
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Enter registered owner name"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm font-semibold text-slate-800 shadow-inner outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-blue-200 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="mobile-number"
                      className="flex items-center gap-2 text-[10px] font-black tracking-wider text-slate-700 uppercase"
                    >
                      <Phone className="h-3.5 w-3.5 text-violet-500" />
                      Registered Mobile Number
                    </label>

                    <input
                      id="mobile-number"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={mobileNumber}
                      onChange={(e) =>
                        setMobileNumber(
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                        )
                      }
                      placeholder="Enter 10-digit mobile number"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm font-semibold text-slate-800 shadow-inner outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-violet-200 hover:bg-white focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                    />

                    <p className="px-1 text-[9px] font-medium text-slate-400">
                      Use the mobile number registered with your property.
                    </p>
                  </div>
                </div>
              )}

              {/* =================================================
                  SEARCH BUTTON AREA
              ================================================== */}

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-7 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  className="group relative flex h-13 cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-linear-to-r from-emerald-600 via-green-600 to-teal-600 px-7 text-xs font-black text-white shadow-lg shadow-emerald-200 transition-all duration-300 hover:-translate-y-0.5 hover:from-emerald-500 hover:via-green-500 hover:to-teal-500 hover:shadow-xl hover:shadow-emerald-300 active:scale-[0.98]"
                >
                  {/* Shine */}

                  <span className="absolute inset-y-0 -left-20 w-20 skew-x-[-20deg] bg-white/20 transition-all duration-700 group-hover:left-[120%]" />

                  <Search className="relative h-4 w-4 transition-transform duration-300 group-hover:scale-110" />

                  <span className="relative">
                    Search Property Tax Dues
                  </span>

                  <ChevronRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="group flex h-13 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-6 text-xs font-black text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-900 hover:shadow-lg active:scale-[0.98]"
                >
                  <RotateCcw className="h-4 w-4 text-slate-400 transition-transform duration-500 group-hover:-rotate-180 group-hover:text-slate-600" />

                  <span>Reset Fields</span>
                </button>

                <div className="sm:ml-auto">
                  <div className="flex items-center gap-2 text-[9px] font-semibold text-slate-400">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    Your search details are handled securely.
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* =================================================
              SERVICE FOOTER
          ================================================== */}

          <div className="grid grid-cols-1 border-t border-slate-100 bg-linear-to-r from-emerald-50/60 via-white to-orange-50/60 sm:grid-cols-3">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:border-r sm:border-b-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Search className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-700">
                  Easy Search
                </p>

                <p className="text-[9px] font-medium text-slate-400">
                  Multiple search options
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:border-r sm:border-b-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <FileText className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-700">
                  Tax Details
                </p>

                <p className="text-[9px] font-medium text-slate-400">
                  View property dues
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-700">
                  Digital Receipt
                </p>

                <p className="text-[9px] font-medium text-slate-400">
                  Available after payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          HELP STRIP
      ====================================================== */}

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] border border-emerald-100 bg-linear-to-r from-emerald-600 via-green-600 to-teal-600 p-6 text-white shadow-xl shadow-emerald-200 md:p-8">
          {/* Pattern */}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #fff 1px, transparent 1px), linear-gradient(-45deg, #fff 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                <ShieldCheck className="h-6 w-6 text-emerald-100" />
              </div>

              <div>
                <p className="text-[9px] font-black tracking-[0.15em] text-emerald-100 uppercase">
                  Citizen Assistance
                </p>

                <h3 className="mt-1 text-lg font-black">
                  Need help finding your property?
                </h3>

                <p className="mt-1 max-w-xl text-xs leading-5 font-medium text-emerald-50/80">
                  यदि आपको अपनी संपत्ति का रिकॉर्ड खोजने में परेशानी हो रही
                  है, तो नगर पंचायत गोवर्धन कार्यालय से संपर्क करें।
                </p>
              </div>
            </div>

            <a
              href="tel:8189077944"
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black text-emerald-700 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-xl"
            >
              <Phone className="h-4 w-4 transition-transform group-hover:rotate-12" />
              <span>+91 81890 77944</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
