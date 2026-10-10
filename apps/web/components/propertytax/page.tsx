"use client"

import Link from "next/link"
import Image from "next/image"
import { useMutation, useQuery } from "@tanstack/react-query"
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
  UserRound,
} from "lucide-react"
import { useState, type FormEvent } from "react"

import {
  listPropertyTaxWards,
  searchPropertyTax,
  type PropertyTaxSearchMode,
  type PropertyTaxSearchResult,
} from "@/lib/property-tax-api"
import { propertyTaxMunicipality } from "./municipality-config"

const searchTabs: Array<{
  id: PropertyTaxSearchMode
  title: string
  subtitle: string
  icon: typeof MapPin
}> = [
  {
    id: "ward",
    title: "Search by Ward",
    subtitle: "Ward and property details",
    icon: MapPin,
  },
  {
    id: "propertyId",
    title: "Property ID / Parcel",
    subtitle: "Unique property number",
    icon: Hash,
  },
  {
    id: "owner",
    title: "Owner / Mobile",
    subtitle: "Registered owner details",
    icon: UserRound,
  },
]

function dueStatusLabel(status: PropertyTaxSearchResult["dueStatus"]) {
  return status === "NO_DUE" ? "Paid for current year" : "Tax due"
}

export default function ProfessionalPropertyTaxPage() {
  const [activeTab, setActiveTab] = useState<PropertyTaxSearchMode>("ward")
  const [wardNumber, setWardNumber] = useState("")
  const [propertyNumber, setPropertyNumber] = useState("")
  const [propertyId, setPropertyId] = useState("")
  const [ownerName, setOwnerName] = useState("")
  const [mobile, setMobile] = useState("")
  const [results, setResults] = useState<PropertyTaxSearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchError, setSearchError] = useState("")

  const wards = useQuery({
    queryKey: ["public-property-tax", "wards"],
    queryFn: listPropertyTaxWards,
  })

  const search = useMutation({
    mutationFn: searchPropertyTax,
    onSuccess: (response, variables) => {
      setResults((current) =>
        variables.page === 1 ? response.items : [...current, ...response.items]
      )
      setTotal(response.total)
      setPage(response.page)
      setSearchError("")
    },
    onError: (error) => {
      setSearchError(error.message)
      setResults([])
      setTotal(0)
    },
  })

  const buildSearch = (nextPage = 1) => {
    if (activeTab === "ward") {
      if (!wardNumber) {
        setSearchError("Select a ward to search its properties.")
        return null
      }
      return {
        mode: "ward" as const,
        wardNumber: Number(wardNumber),
        propertyNo: propertyNumber.trim() || undefined,
        page: nextPage,
      }
    }
    if (activeTab === "propertyId") {
      if (!propertyId.trim()) {
        setSearchError("Enter a property ID or parcel number.")
        return null
      }
      return {
        mode: "propertyId" as const,
        propertyId: propertyId.trim(),
        page: nextPage,
      }
    }

    if (ownerName.trim().length < 3 || mobile.length !== 10) {
      setSearchError(
        "Enter at least 3 characters of the registered owner name and the 10-digit registered mobile number."
      )
      return null
    }
    return {
      mode: "owner" as const,
      ownerName: ownerName.trim(),
      mobile,
      page: nextPage,
    }
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = buildSearch()
    if (query) {
      setResults([])
      setSearchError("")
      search.mutate(query)
    }
  }

  const handleReset = () => {
    setWardNumber("")
    setPropertyNumber("")
    setPropertyId("")
    setOwnerName("")
    setMobile("")
    setResults([])
    setTotal(0)
    setPage(1)
    setSearchError("")
    search.reset()
  }

  const loadMore = () => {
    const query = buildSearch(page + 1)
    if (query) search.mutate(query)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f4fff8] via-white to-[#fff9ef] text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(#16734a 1px, transparent 1px), linear-gradient(90deg, #16734a 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-emerald-300/20 blur-[130px]" />
      <div className="pointer-events-none absolute -right-40 top-32 h-96 w-96 rounded-full bg-orange-300/20 blur-[130px]" />

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/85 px-4 py-2 text-[10px] font-black tracking-[0.15em] text-emerald-700 uppercase shadow-sm">
            {propertyTaxMunicipality.logoUrl ? (
              <Image
                src={propertyTaxMunicipality.logoUrl}
                alt=""
                width={28}
                height={28}
                unoptimized
                className="h-7 w-7 rounded-full object-contain"
              />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                <Landmark className="h-4 w-4" />
              </span>
            )}
            {propertyTaxMunicipality.name}
            {propertyTaxMunicipality.city
              ? ` • ${propertyTaxMunicipality.city}`
              : ""}
          </div>

          <h1 className="text-4xl leading-tight font-black tracking-tight text-[#123f2b] sm:text-5xl lg:text-6xl">
            House Tax{" "}
            <span className="bg-gradient-to-r from-emerald-500 via-green-600 to-orange-500 bg-clip-text text-transparent">
              / Property Tax
            </span>
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 font-medium text-slate-600 sm:text-base">
            Find your municipal property record, check the latest published tax
            demand, and pay online securely.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-3.5 py-2 text-[10px] font-bold text-emerald-700 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Official Citizen Service
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/80 px-3.5 py-2 text-[10px] font-bold text-orange-700 shadow-sm">
              <FileText className="h-3.5 w-3.5" />
              Published tax demand
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-2 text-[10px] font-bold text-slate-700 shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Secure online payment
            </div>
          </div>

          <nav
            aria-label="Breadcrumb"
            className="mt-8 inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/85 px-4 py-2.5 text-xs font-semibold shadow-sm"
          >
            <Link href="/" className="text-slate-500 hover:text-emerald-600">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="text-slate-500">Citizen Services</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="font-black text-emerald-700">House Tax</span>
          </nav>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[30px] border border-white bg-white/95 shadow-[0_25px_70px_rgba(15,80,50,0.10)]">
          <div className="border-b border-slate-100 bg-gradient-to-r from-[#f1fff7] via-white to-[#fff8ed] px-5 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-200">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[9px] font-black tracking-[0.15em] text-emerald-700 uppercase">
                    {propertyTaxMunicipality.name}
                  </p>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-[#123f2b] sm:text-2xl">
                    Find your property record
                  </h2>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Search by ward, property number, or registered owner.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-100 bg-white px-3 py-2 text-[9px] font-black text-emerald-700 shadow-sm sm:self-center">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Online service
              </span>
            </div>
          </div>

          <div className="border-b border-slate-100 bg-slate-50/70 p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {searchTabs.map((tab) => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id)
                      setSearchError("")
                    }}
                    aria-pressed={active}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                      active
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm"
                        : "border-transparent bg-white/70 text-slate-600 hover:border-slate-200 hover:bg-white"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span>
                      <span className="block text-xs font-black">
                        {tab.title}
                      </span>
                      <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
                        {tab.subtitle}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-5 sm:p-8 lg:p-10">
            <div className="mb-7">
              <div className="flex items-center gap-2 text-[9px] font-black tracking-[0.15em] text-emerald-700 uppercase">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Search verification
              </div>
              <h3 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">
                Enter property details
              </h3>
              <p className="mt-1 text-xs leading-5 font-medium text-slate-500">
                Owner searches require both registered owner name and mobile
                number. Personal details are masked in results.
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-7">
              {activeTab === "ward" && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="ward-number"
                      className="flex items-center gap-2 text-[10px] font-black tracking-wider text-slate-700 uppercase"
                    >
                      <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                      Select ward
                    </label>
                    <select
                      id="ward-number"
                      value={wardNumber}
                      onChange={(event) => setWardNumber(event.target.value)}
                      required
                      disabled={wards.isLoading || wards.isError}
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm font-semibold text-slate-800 outline-none transition hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">
                        {wards.isLoading
                          ? "Loading wards…"
                          : "Choose a ward"}
                      </option>
                      {(wards.data ?? []).map((ward) => (
                        <option key={ward.id} value={ward.number}>
                          Ward {String(ward.number).padStart(2, "0")} —{" "}
                          {ward.name}
                        </option>
                      ))}
                    </select>
                    {wards.isError && (
                      <p role="alert" className="text-xs text-red-700">
                        {wards.error.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="property-number"
                      className="flex items-center gap-2 text-[10px] font-black tracking-wider text-slate-700 uppercase"
                    >
                      <Building2 className="h-3.5 w-3.5 text-orange-600" />
                      Property / house number (optional)
                    </label>
                    <input
                      id="property-number"
                      type="text"
                      maxLength={100}
                      value={propertyNumber}
                      onChange={(event) => setPropertyNumber(event.target.value)}
                      placeholder="Enter registered number"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm font-semibold text-slate-800 outline-none transition hover:bg-white focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                    />
                  </div>
                </div>
              )}

              {activeTab === "propertyId" && (
                <div className="space-y-2">
                  <label
                    htmlFor="property-id"
                    className="flex items-center gap-2 text-[10px] font-black tracking-wider text-slate-700 uppercase"
                  >
                    <Hash className="h-3.5 w-3.5 text-orange-600" />
                    Property ID / parcel number
                  </label>
                  <input
                    id="property-id"
                    type="text"
                    maxLength={100}
                    value={propertyId}
                    onChange={(event) => setPropertyId(event.target.value)}
                    placeholder="Enter property ID or parcel number"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm font-semibold text-slate-800 outline-none transition hover:bg-white focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                  />
                </div>
              )}

              {activeTab === "owner" && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="owner-name"
                      className="flex items-center gap-2 text-[10px] font-black tracking-wider text-slate-700 uppercase"
                    >
                      <UserRound className="h-3.5 w-3.5 text-blue-600" />
                      Registered owner name
                    </label>
                    <input
                      id="owner-name"
                      type="text"
                      autoComplete="name"
                      maxLength={200}
                      value={ownerName}
                      onChange={(event) => setOwnerName(event.target.value)}
                      placeholder="Enter registered owner name"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm font-semibold text-slate-800 outline-none transition hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="mobile-number"
                      className="flex items-center gap-2 text-[10px] font-black tracking-wider text-slate-700 uppercase"
                    >
                      <Phone className="h-3.5 w-3.5 text-violet-600" />
                      Registered mobile number
                    </label>
                    <input
                      id="mobile-number"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={10}
                      value={mobile}
                      onChange={(event) =>
                        setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      placeholder="10-digit mobile number"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm font-semibold text-slate-800 outline-none transition hover:bg-white focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                    />
                  </div>
                </div>
              )}

              {searchError && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {searchError}
                </p>
              )}

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-7 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={search.isPending || wards.isLoading}
                  className="flex h-13 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 px-7 text-xs font-black text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-wait disabled:opacity-60"
                >
                  <Search className="h-4 w-4" />
                  {search.isPending ? "Searching…" : "Search Tax Dues"}
                  {!search.isPending && <ChevronRight className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex h-13 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-6 text-xs font-black text-slate-600 transition hover:bg-white"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset fields
                </button>
                <span className="text-[10px] font-semibold text-slate-400 sm:ml-auto">
                  <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />
                  Search data is securely masked.
                </span>
              </div>
            </form>
          </div>
        </div>

        {search.isError && !searchError && (
          <p role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {search.error.message}
          </p>
        )}

        {results.length > 0 && (
          <section aria-labelledby="search-results-heading" className="mt-8">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-700">
                  {total} {total === 1 ? "property" : "properties"} found
                </p>
                <h2
                  id="search-results-heading"
                  className="mt-1 text-2xl font-black tracking-tight text-[#123f2b]"
                >
                  Matching property records
                </h2>
              </div>
            </div>
            <div className="grid gap-4">
              {results.map((property) => (
                <article
                  key={property.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900">
                          Property {property.propertyNo ?? property.parcelNo ?? property.surveyId}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            property.dueStatus === "NO_DUE"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-orange-50 text-orange-700"
                          }`}
                        >
                          {dueStatusLabel(property.dueStatus)}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-x-8 gap-y-2 text-xs text-slate-600 sm:grid-cols-2">
                        <p>
                          <span className="font-bold text-slate-800">Ward:</span>{" "}
                          {property.wardNumber} — {property.wardName}
                        </p>
                        <p>
                          <span className="font-bold text-slate-800">Property ID:</span>{" "}
                          {property.surveyId}
                        </p>
                        <p>
                          <span className="font-bold text-slate-800">Owner:</span>{" "}
                          {property.ownerNameMasked}
                        </p>
                        <p>
                          <span className="font-bold text-slate-800">Mobile:</span>{" "}
                          {property.mobileMasked}
                        </p>
                        {property.locality && (
                          <p className="sm:col-span-2">
                            <span className="font-bold text-slate-800">Locality:</span>{" "}
                            {property.locality}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/propertytax/dues/${encodeURIComponent(property.id)}`}
                      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-5 text-xs font-black text-white shadow-md shadow-orange-100 transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      Tax Dues
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            {results.length < total && (
              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={search.isPending}
                  className="rounded-xl border border-emerald-200 bg-white px-5 py-3 text-xs font-black text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-60"
                >
                  {search.isPending ? "Loading…" : "Load more properties"}
                </button>
              </div>
            )}
          </section>
        )}
        {search.isSuccess && results.length === 0 && !search.isPending && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Search className="mx-auto h-8 w-8 text-slate-300" />
            <h2 className="mt-3 text-lg font-black text-slate-800">
              No matching property found
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Check the details and try your search again, or contact the
              municipal office for help.
            </p>
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-700 via-green-700 to-teal-700 p-6 text-white shadow-lg sm:p-8">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-emerald-100" />
            <div>
              <h2 className="text-lg font-black">Need help with your tax record?</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-emerald-50">
                Keep your property ID or registered mobile number ready when
                contacting {propertyTaxMunicipality.name}.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
