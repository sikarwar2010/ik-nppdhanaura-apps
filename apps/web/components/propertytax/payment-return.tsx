"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle, CheckCircle2, Clock3, XCircle } from "lucide-react"

import {
  getPropertyTaxPayment,
} from "@/lib/property-tax-api"
import { propertyTaxMunicipality } from "./municipality-config"

function formatRupees(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

export default function PropertyTaxPaymentReturn({
  merchTxnId,
}: {
  merchTxnId: string
}) {
  const payment = useQuery({
    queryKey: ["public-property-tax", "payment-status", merchTxnId],
    queryFn: () => getPropertyTaxPayment(merchTxnId, true),
    enabled: Boolean(merchTxnId),
    refetchInterval: (query) => {
      if (query.state.data?.sandbox) return false
      const status = query.state.data?.status
      return status === "INITIATED" || status === "PENDING" ? 5000 : false
    },
  })
  const status = payment.data?.status
  const sandboxSimulation = payment.data?.sandbox === true
  const pending =
    !sandboxSimulation && (status === "INITIATED" || status === "PENDING")
  const successful = status === "SUCCESS" && !sandboxSimulation

  return (
    <main className="min-h-[60vh] bg-gradient-to-br from-[#f4fff8] via-white to-[#fff9ef] px-4 py-14">
      <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_20px_60px_rgba(15,80,50,0.08)] sm:p-10">
        {successful ? (
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
        ) : pending ? (
          <Clock3 className="h-12 w-12 text-amber-500" />
        ) : status === "FAILED" || status === "REFUNDED" ? (
          <XCircle className="h-12 w-12 text-red-600" />
        ) : sandboxSimulation || payment.isError || !merchTxnId ? (
          <AlertCircle className="h-12 w-12 text-red-600" />
        ) : (
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
        )}

        <p className="mt-5 text-[10px] font-black tracking-[0.16em] text-emerald-700 uppercase">
          {propertyTaxMunicipality.name} · Property Tax
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          {successful
            ? "Payment successful"
            : sandboxSimulation
              ? "Sandbox test only — payment not received"
            : pending
              ? "Payment status is being confirmed"
              : status === "FAILED"
                ? "Payment was not completed"
                : status === "REFUNDED"
                  ? "Payment has been refunded"
                  : payment.isError || !merchTxnId
                    ? "Payment status unavailable"
                    : "Checking payment status…"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {successful
            ? "Your payment has been recorded successfully. Keep the transaction reference below for your records."
            : sandboxSimulation
              ? "This transaction was created by the local sandbox, not by a live payment gateway. No money was collected, this property is still due, and no valid receipt is available."
            : pending
              ? "Please keep this page open while we confirm the transaction with the payment gateway. Do not initiate another payment."
              : status === "FAILED"
                ? "The transaction was not marked as successful. Check your bank or payment app before trying again."
                : status === "REFUNDED"
                  ? "The transaction was refunded. Contact the municipal office if you need assistance."
                  : payment.isError
                    ? payment.error.message
                    : !merchTxnId
                      ? "The payment reference is missing from this return link."
                      : "We are securely checking the payment gateway status."}
        </p>

        {payment.data && (
          <dl className="mt-7 grid gap-4 rounded-2xl bg-slate-50 p-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-slate-500">
                Transaction reference
              </dt>
              <dd className="mt-1 break-all font-black text-slate-900">
                {payment.data.merchTxnId}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500">Amount</dt>
              <dd className="mt-1 font-black text-slate-900">
                {formatRupees(payment.data.amount, payment.data.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500">Property ID</dt>
              <dd className="mt-1 font-black text-slate-900">
                {payment.data.surveyId ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500">Status</dt>
              <dd className="mt-1 font-black text-slate-900">
                {payment.data.status}
              </dd>
            </div>
          </dl>
        )}

        {payment.isError && merchTxnId && (
          <button
            type="button"
            onClick={() => void payment.refetch()}
            className="mt-6 rounded-xl border border-emerald-200 px-5 py-3 text-xs font-black text-emerald-800 hover:bg-emerald-50"
          >
            Check status again
          </button>
        )}

        <div className="mt-8 border-t border-slate-100 pt-5">
          <Link
            href="/propertytax"
            className="text-xs font-bold text-emerald-800 hover:text-emerald-600"
          >
            Return to property tax search
          </Link>
        </div>
      </section>
    </main>
  )
}
