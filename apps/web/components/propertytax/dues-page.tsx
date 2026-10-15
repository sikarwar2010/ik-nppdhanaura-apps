"use client"

import Link from "next/link"
import Image from "next/image"
import { useMutation, useQuery } from "@tanstack/react-query"
import { optionLabel, useLocale } from "@workspace/i18n"
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  Landmark,
  MapPin,
  ShieldCheck,
} from "lucide-react"
import { useState, type FormEvent } from "react"

import {
  createPropertyTaxPayment,
  getPropertyTaxDues,
} from "@/lib/property-tax-api"
import { propertyTaxMunicipality } from "./municipality-config"

type AtomCheckoutOptions = {
  atomTokenId: string
  merchId: string
  custEmail: string
  custMobile: string
  returnUrl: string
  txnCurrency: string
  txnAmount: string
  mode: "uat" | "prod"
}

declare global {
  interface Window {
    AtomPaynetz?: new () => {
      initiate: (options: AtomCheckoutOptions) => void
    }
  }
}

function formatRupees(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

async function loadAtomCheckout(url: string): Promise<void> {
  if (window.AtomPaynetz) return
  const existing = document.querySelector<HTMLScriptElement>(
    'script[data-atom-checkout="true"]'
  )
  if (existing) {
    await new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener(
        "error",
        () => reject(new Error("The payment checkout could not be loaded.")),
        { once: true }
      )
    })
    if (window.AtomPaynetz) return
    throw new Error("The payment checkout did not initialize correctly.")
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = url
    script.async = true
    script.dataset.atomCheckout = "true"
    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error("The payment checkout could not be loaded."))
    document.head.appendChild(script)
  })
  if (!window.AtomPaynetz) {
    throw new Error("The payment checkout did not initialize correctly.")
  }
}

export default function PropertyTaxDuesPage({ id }: { id: string }) {
  const { locale, t } = useLocale()
  const option = (value?: string | null) => {
    const text = value?.trim()
    if (!text) return "—"
    return optionLabel(locale, text)
  }
  const [payerMobile, setPayerMobile] = useState("")
  const [payerEmail, setPayerEmail] = useState("")
  const [paymentError, setPaymentError] = useState("")
  const dues = useQuery({
    queryKey: ["public-property-tax", "dues", id],
    queryFn: () => getPropertyTaxDues(id),
  })

  const payment = useMutation({
    mutationFn: createPropertyTaxPayment,
    onSuccess: async (created) => {
      setPaymentError("")
      if ("redirectUrl" in created) {
        window.location.assign(created.redirectUrl)
        return
      }

      try {
        await loadAtomCheckout(created.checkout.cdnUrl)
        const checkout = new window.AtomPaynetz!()
        checkout.initiate({
          atomTokenId: created.checkout.atomTokenId,
          merchId: created.checkout.merchId,
          custEmail: created.checkout.custEmail,
          custMobile: created.checkout.custMobile,
          returnUrl: created.checkout.returnUrl,
          txnCurrency: created.currency,
          txnAmount: created.amount.toFixed(2),
          mode: created.checkout.env,
        })
      } catch (error) {
        setPaymentError(
          error instanceof Error
            ? `${error.message} Your transaction reference is ${created.merchTxnId}.`
            : `Checkout could not start. Your transaction reference is ${created.merchTxnId}.`
        )
      }
    },
    onError: (error) => setPaymentError(error.message),
  })

  const startPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!dues.data) return
    setPaymentError("")
    payment.mutate({
      surveyId: dues.data.id,
      payerMobile,
      payerEmail: payerEmail.trim() || undefined,
    })
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-[#f4fff8] via-white to-[#fff9ef]">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <nav
            aria-label="Breadcrumb"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold shadow-sm"
          >
            <Link href="/" className="text-slate-500 hover:text-emerald-700">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <Link
              href="/propertytax"
              className="text-slate-500 hover:text-emerald-700"
            >
              House Tax
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="font-black text-emerald-800">Tax Dues</span>
          </nav>
          <Link
            href="/propertytax"
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to search
          </Link>
        </div>

        {dues.isLoading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
            <p className="mt-4 text-sm font-semibold text-slate-600">
              Loading published property tax dues…
            </p>
          </div>
        )}
        {dues.isError && (
          <div
            role="alert"
            className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm"
          >
            <AlertCircle className="h-8 w-8 text-red-600" />
            <h1 className="mt-3 text-xl font-black text-slate-900">
              Could not load tax dues
            </h1>
            <p className="mt-2 text-sm text-red-800">{dues.error.message}</p>
            <button
              type="button"
              onClick={() => void dues.refetch()}
              className="mt-5 rounded-xl bg-emerald-700 px-5 py-3 text-xs font-black text-white hover:bg-emerald-600"
            >
              Try again
            </button>
          </div>
        )}

        {dues.data && (
          <>
            <header className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_20px_60px_rgba(15,80,50,0.08)] sm:p-8">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-orange-500 via-white to-emerald-600" />
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.16em] text-emerald-700 uppercase">
                    {propertyTaxMunicipality.logoUrl ? (
                      <Image
                        src={propertyTaxMunicipality.logoUrl}
                        alt=""
                        width={20}
                        height={20}
                        unoptimized
                        className="h-5 w-5 rounded-full object-contain"
                      />
                    ) : (
                      <Landmark className="h-4 w-4" />
                    )}
                    {propertyTaxMunicipality.name}
                  </p>
                  <h1 className="mt-3 text-3xl font-black tracking-tight text-[#123f2b] sm:text-4xl">
                    Property Tax Dues
                  </h1>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Assessment year {dues.data.assessmentYear.name}
                  </p>
                </div>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm font-black ${
                    dues.data.paidForAssessmentYear
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-orange-50 text-orange-800"
                  }`}
                >
                  {dues.data.paidForAssessmentYear
                    ? "Paid for this assessment year"
                    : "Payment is due"}
                </div>
              </div>

              <div className="mt-7 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
                <Summary label="Property ID" value={dues.data.surveyId} />
                <Summary label="Property No." value={dues.data.propertyNo ?? "—"} />
                <Summary label="Parcel No." value={dues.data.parcelNo ?? "—"} />
                <Summary
                  label="Ward"
                  value={`${dues.data.wardNumber} — ${dues.data.wardName}`}
                />
              </div>
            </header>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                  <Building2 className="h-5 w-5 text-emerald-700" />
                  Property details
                </h2>
                <div className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  <Detail label="Registered owner" value={dues.data.ownerName ?? "—"} />
                  <Detail label="Father / guardian" value={dues.data.ownerFatherName ?? "—"} />
                  <Detail label="Registered mobile" value={dues.data.mobileMasked} />
                  <Detail label={t("survey.propertyType")} value={option(dues.data.propertyType)} />
                  <Detail label={t("survey.propertyUse")} value={option(dues.data.propertyUse)} />
                  <Detail label={t("survey.taxZone")} value={option(dues.data.taxRateZone)} />
                  <Detail label={t("survey.roadType")} value={option(dues.data.roadType)} />
                  <Detail
                    label="Address"
                    value={
                      [
                        dues.data.houseNo,
                        dues.data.streetName,
                        dues.data.locality,
                        dues.data.colony,
                        dues.data.city,
                        dues.data.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"
                    }
                  />
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                  <MapPin className="h-5 w-5 text-emerald-700" />
                  Tax assessment
                </h2>
                <div className="mt-5 space-y-4">
                  <Detail
                    label="Assessment year"
                    value={dues.data.assessmentYear.name}
                  />
                  <Detail
                    label="Tax configuration version"
                    value={String(dues.data.taxConfig.version)}
                  />
                  <Detail
                    label="Annual base rate"
                    value={
                      dues.data.tax.annualBaseRate === null
                        ? "—"
                        : `${formatRupees(dues.data.tax.annualBaseRate)} / sq. ft.`
                    }
                  />
                  <Detail
                    label="Municipal water supply"
                    value={dues.data.tax.waterTax > 0 ? "Applicable" : "Not applied"}
                  />
                </div>
              </section>
            </div>

            <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
                <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                  <FileText className="h-5 w-5 text-emerald-700" />
                  Floor-wise property tax breakdown
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Assessment values are calculated using the latest published
                  rates for this ward and assessment year.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-170 text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-black tracking-wide text-slate-600 uppercase">
                    <tr>
                      <th className="px-6 py-4">Floor</th>
                      <th className="px-6 py-4">Usage / construction</th>
                      <th className="px-6 py-4 text-right">Area (sq. ft.)</th>
                      <th className="px-6 py-4 text-right">Rate</th>
                      <th className="px-6 py-4 text-right">Property tax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dues.data.floors.map((floor, index) => (
                      <tr key={`${floor.floorLabel}-${index}`}>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {floor.floorLabel}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {floor.usageType} · {floor.construction}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-700">
                          {floor.areaSqFt.toLocaleString("en-IN")}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-700">
                          {formatRupees(floor.rate)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          {formatRupees(floor.tax)}
                        </td>
                      </tr>
                    ))}
                    {dues.data.floors.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-slate-500"
                        >
                          No floor-wise measurements are available for this
                          property.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <h2 className="text-lg font-black text-slate-900">
                  Demand breakdown
                </h2>
                <div className="mt-5 divide-y divide-slate-100">
                  <AmountRow
                    label="Property tax"
                    amount={dues.data.tax.propertyTax}
                  />
                  <AmountRow
                    label="Water tax"
                    amount={dues.data.tax.waterTax}
                  />
                  <AmountRow
                    label="Drainage tax"
                    amount={dues.data.tax.drainageTax}
                  />
                  <AmountRow label="Penalty" amount={dues.data.tax.penalty} />
                  <div className="flex items-center justify-between gap-4 pt-5">
                    <span className="text-base font-black text-slate-900">
                      Total demand
                    </span>
                    <span className="text-xl font-black text-emerald-800">
                      {formatRupees(dues.data.tax.totalDemand)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-orange-100 bg-linear-to-br from-white to-orange-50 p-6 shadow-sm sm:p-7">
                <h2 className="text-lg font-black text-slate-900">
                  Pay property tax online
                </h2>
                {dues.data.paidForAssessmentYear ? (
                  <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800">
                    <CheckCircle2 className="mr-2 inline h-5 w-5" />
                    A successful payment is recorded for this assessment year.
                  </div>
                ) : (
                  <form onSubmit={startPayment} className="mt-5 space-y-4">
                    {!dues.data.onlinePaymentEnabled && (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                        Online payment is not available yet because a live
                        payment gateway has not been configured. Your payment
                        mobile number field remains available, but no payment
                        or receipt will be created.
                      </p>
                    )}
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-700">
                        Mobile number for payment updates
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        value={payerMobile}
                        onChange={(event) =>
                          setPayerMobile(
                            event.target.value.replace(/\D/g, "").slice(0, 10)
                          )
                        }
                        required
                        placeholder="Enter 10-digit mobile"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-700">
                        Email for payment updates (optional)
                      </span>
                      <input
                        type="email"
                        autoComplete="email"
                        maxLength={200}
                        value={payerEmail}
                        onChange={(event) => setPayerEmail(event.target.value)}
                        placeholder="name@example.com"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                      />
                    </label>
                    {paymentError && (
                      <p
                        role="alert"
                        className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800"
                      >
                        {paymentError}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={
                        payment.isPending ||
                        process.env.NODE_ENV === "production" ||
                        !dues.data.onlinePaymentEnabled ||
                        dues.data.tax.totalDemand <= 0
                      }
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-orange-500 to-amber-600 px-5 text-sm font-black text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CreditCard className="h-4 w-4" />
                      {payment.isPending
                        ? "Connecting to payment gateway…"
                        : dues.data.onlinePaymentEnabled
                          ? `Pay Online · ${formatRupees(dues.data.tax.totalDemand)}`
                          : "Payment gateway not configured"}
                    </button>
                  </form>
                )}
                <p className="mt-4 flex items-start gap-2 text-[10px] leading-5 text-slate-500">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  Payment is processed by the configured secure payment
                  gateway. Keep the transaction reference until payment status
                  is confirmed.
                </p>
              </div>
            </section>

            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white p-4 text-xs leading-5 text-slate-600">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" />
              Demand values are computed from the property record, ward tax
              configuration, and latest published assessment year.
            </div>
          </>
        )}
      </section>
    </main>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-1 wrap-break-word text-sm font-black text-slate-900">
        {value}
      </p>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  )
}

function AmountRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 text-sm">
      <span className="font-medium text-slate-600">{label}</span>
      <span className="font-bold text-slate-900">{formatRupees(amount)}</span>
    </div>
  )
}
