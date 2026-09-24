"use client"

import { useState } from "react"
import Image from "next/image"
import { AnimatePresence, m } from "framer-motion"
import {
  AlertCircle,
  CheckCircle2,
  FileCheck,
  Send,
  ShieldAlert,
  Sparkles,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"

type SubmittedCitizen = {
  full_name: string
  mobile_number: string
}

export default function PublicGrievance() {
  const [isPending, setIsPending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [complaintId, setComplaintId] = useState("")
  const [submittedCitizen, setSubmittedCitizen] =
    useState<SubmittedCitizen>({
      full_name: "",
      mobile_number: "",
    })

  const onSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()
    setIsPending(true)

    const formData = new FormData(e.currentTarget)

    const fullName = formData.get("full_name") as string
    const mobileNumber = formData.get("mobile_number") as string

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 1000)
      )

      const mockId = Math.floor(
        100000 + Math.random() * 900000
      )

      setSubmittedCitizen({
        full_name: fullName,
        mobile_number: mobileNumber,
      })

      setSubmitted(true)
      setComplaintId(String(mockId))
    } finally {
      setIsPending(false)
    }
  }

  const handleClearForm = () => {
    const form = document.getElementById(
      "grievance-form"
    ) as HTMLFormElement

    if (form) form.reset()
  }

  const handleRegisterAnother = () => {
    setSubmitted(false)
    setComplaintId("")

    setSubmittedCitizen({
      full_name: "",
      mobile_number: "",
    })
  }

  const scrollToForm = () => {
    const grievanceForm = document.getElementById(
      "grievance-form-section"
    )

    grievanceForm?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-linear-to-br from-[#f0fff6] via-white to-[#f7fff9] px-4 py-16 font-sans md:px-8"
    >
      {/* =====================================================
          PREMIUM BACKGROUND
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #14966b 1px, transparent 1px), linear-gradient(#14966b 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      <div className="pointer-events-none absolute -left-32 top-20 h-90 w-90 rounded-full bg-emerald-300/20 blur-[120px]" />

      <div className="pointer-events-none absolute -right-32 top-1/3 h-105 w-105 rounded-full bg-teal-300/20 blur-[130px]" />

      <div className="pointer-events-none absolute bottom-0 left-1/3 h-75 w-75 rounded-full bg-lime-300/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-12">

        {/* =====================================================
            PAGE HEADER
        ====================================================== */}

        <m.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-[10px] font-black tracking-[0.16em] text-emerald-700 uppercase shadow-sm">
            <ShieldAlert className="h-3.5 w-3.5 text-emerald-600" />
            Citizen Grievance Portal
          </span>

          <h1 className="font-serif text-3xl font-black tracking-tight text-[#123d32] md:text-5xl">
            Public Grievance Redressal System
          </h1>

          <p className="mx-auto max-w-2xl text-sm font-medium leading-7 text-slate-600 md:text-base">
            Nagar Panchayat Goverdhan, Mathura में अपनी नागरिक
            समस्या या सुझाव ऑनलाइन दर्ज करें और पारदर्शी,
            उत्तरदायी एवं समयबद्ध समाधान की दिशा में अपना
            योगदान दें।
          </p>

          {/* Decorative divider */}

          <div className="mx-auto flex items-center justify-center gap-2 pt-2">
            <span className="h-1.5 w-12 rounded-full bg-emerald-500" />

            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-200 bg-white shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            </span>

            <span className="h-1.5 w-20 rounded-full bg-linear-to-r from-teal-500 to-lime-400" />

            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-200 bg-white shadow-sm">
              <ShieldAlert className="h-3.5 w-3.5 text-emerald-600" />
            </span>

            <span className="h-1.5 w-12 rounded-full bg-teal-500" />
          </div>
        </m.div>

        {/* =====================================================
            INFORMATION + IMAGE
        ====================================================== */}

        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2">

          {/* =================================================
              INFORMATION CARD
          ================================================= */}

          <m.div
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-emerald-100 bg-white/90 p-8 shadow-[0_20px_60px_rgba(16,185,129,0.08)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_25px_70px_rgba(16,185,129,0.14)] md:p-10"
          >
            {/* Accent */}

            <div className="absolute left-0 top-0 h-full w-1.5 bg-linear-to-b from-emerald-400 via-teal-500 to-lime-400" />

            {/* Decorative glow */}

            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-100/70 blur-2xl transition-transform duration-700 group-hover:scale-125" />

            <div className="relative z-10 space-y-5">

              {/* Small badge */}

              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[10px] font-black tracking-wider text-emerald-700 uppercase">
                <CheckCircle2 className="h-3.5 w-3.5" />
                आपकी आवाज़ महत्वपूर्ण है
              </div>

              <h2 className="font-serif text-2xl font-black leading-tight tracking-tight text-[#123d32] md:text-3xl">
                आपकी समस्या, हमारी जिम्मेदारी
              </h2>

              <p className="text-xs font-semibold leading-7 text-slate-600 md:text-sm">
                Nagar Panchayat Goverdhan, Mathura नागरिकों
                को बेहतर, पारदर्शी और उत्तरदायी नगर सेवाएं
                उपलब्ध कराने के लिए प्रतिबद्ध है। आप सफाई,
                जल आपूर्ति, सड़क, नाली, स्ट्रीट लाइट,
                कचरा संग्रहण, अतिक्रमण एवं अन्य नागरिक
                समस्याओं की शिकायत दर्ज कर सकते हैं।
              </p>

              <p className="text-xs font-medium leading-7 text-slate-600 md:text-sm">
                प्रत्येक शिकायत को संबंधित विभाग तक पहुंचाने
                और उसके समाधान की प्रक्रिया को बेहतर बनाने
                के लिए डिजिटल grievance system का उपयोग किया
                जाता है। आपका feedback Goverdhan को और
                स्वच्छ, सुरक्षित एवं बेहतर नगर बनाने में
                महत्वपूर्ण भूमिका निभाता है।
              </p>

              {/* Feature Pills */}

              <div className="grid grid-cols-1 gap-2.5 pt-2 sm:grid-cols-2">

                <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5 text-[10px] font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  Transparent Process
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-teal-100 bg-teal-50/70 px-3 py-2.5 text-[10px] font-bold text-teal-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-500" />
                  Quick Response
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2.5 text-[10px] font-bold text-amber-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                  Citizen First
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-2.5 text-[10px] font-bold text-sky-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-500" />
                  Digital Tracking
                </div>

              </div>
            </div>

            {/* CTA */}

            <Button
              type="button"
              onClick={scrollToForm}
              className="relative z-10 mt-8 flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 px-6 py-3 text-xs font-black tracking-wider text-white uppercase shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-1 hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl hover:shadow-emerald-500/25"
            >
              <ShieldAlert className="h-4 w-4" />
              Submit Your Grievance
            </Button>
          </m.div>

          {/* =================================================
              IMAGE CARD
          ================================================= */}

          <m.div
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className="group relative min-h-97.5 overflow-hidden rounded-[28px] border border-emerald-100 bg-[#123d32] shadow-[0_20px_60px_rgba(16,80,60,0.15)]"
          >
            <Image
              src="/grievance.png"
              width={700}
              height={700}
              priority
              alt="Public grievance redressal portal - Nagar Panchayat Goverdhan"
              className="h-full w-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105"
            />

            {/* Gradient overlay */}

            <div className="absolute inset-0 bg-linear-to-t from-[#07352b]/95 via-[#07352b]/35 to-transparent" />

            {/* Colour glow */}

            <div className="pointer-events-none absolute right-5 top-5 h-24 w-24 rounded-full bg-emerald-300/20 blur-2xl" />

            {/* Content */}

            <div className="absolute bottom-0 left-0 right-0 p-7">

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-black tracking-wider text-emerald-200 uppercase backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Nagar Panchayat Goverdhan
              </div>

              <h3 className="font-serif text-xl font-black leading-tight text-white md:text-2xl">
                Grievance Redressal
                <span className="block text-emerald-300">
                  Portal
                </span>
              </h3>

              <p className="mt-2 text-[10px] font-bold tracking-[0.18em] text-emerald-100/70 uppercase">
                Quick • Transparent • Citizen-Centric
              </p>

            </div>
          </m.div>
        </div>

        {/* =====================================================
            FORM SECTION
        ====================================================== */}

        <div
          id="grievance-form-section"
          className="scroll-mt-24 overflow-hidden rounded-[28px] border border-emerald-100 bg-white/95 shadow-[0_20px_70px_rgba(16,185,129,0.10)] backdrop-blur-xl"
        >

          {/* =================================================
              FORM HEADER
          ================================================= */}

          <div className="relative overflow-hidden bg-linear-to-r from-[#123d32] via-[#155b49] to-[#087f62] px-7 py-6 text-white md:px-9">

            <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full border border-white/10" />

            <div className="pointer-events-none absolute right-20 -bottom-20 h-36 w-36 rounded-full bg-emerald-300/10 blur-2xl" />

            <div className="relative flex items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 shadow-inner backdrop-blur-md">
                <ShieldAlert className="h-5 w-5 text-emerald-300" />
              </div>

              <div>
                <h2 className="text-base font-black tracking-wider uppercase md:text-lg">
                  Grievance Submission Form
                </h2>

                <p className="mt-1 text-[10px] font-medium text-emerald-100/70">
                  कृपया अपनी शिकायत से संबंधित सही और पूर्ण
                  जानकारी दर्ज करें।
                </p>
              </div>

            </div>
          </div>

          {/* =================================================
              FORM BODY
          ================================================= */}

          <div className="p-6 md:p-9">

            <AnimatePresence mode="wait">

              {submitted ? (

                /* =================================================
                   SUCCESS SCREEN
                ================================================= */

                <m.div
                  key="grievance-success"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  className="mx-auto flex max-w-md flex-col items-center justify-center py-14 text-center"
                >

                  <div className="relative">

                    <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-2xl" />

                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-emerald-200 bg-linear-to-br from-emerald-50 to-teal-50 text-emerald-500 shadow-lg">
                      <FileCheck className="h-9 w-9" />
                    </div>

                  </div>

                  <h3 className="mt-6 text-xl font-black text-[#173d34] md:text-2xl">
                    Grievance Registered Successfully
                  </h3>

                  <p className="mt-3 text-xs leading-6 font-semibold text-slate-500">
                    धन्यवाद{" "}
                    <span className="font-black text-emerald-600">
                      {submittedCitizen.full_name}
                    </span>
                    । आपकी शिकायत Nagar Panchayat
                    Goverdhan, Mathura के पोर्टल पर सफलतापूर्वक
                    दर्ज कर ली गई है।
                  </p>

                  <p className="mt-6 text-[9px] font-black tracking-[0.18em] text-slate-400 uppercase">
                    Grievance Reference Number
                  </p>

                  <span className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-3 font-mono text-sm font-black tracking-[0.25em] text-emerald-700">
                    {complaintId}
                  </span>

                  <p className="mt-4 text-[10px] font-semibold leading-5 text-slate-400">
                    Registered mobile number:
                    <span className="font-black text-slate-600">
                      {" "}
                      +91-{submittedCitizen.mobile_number}
                    </span>
                  </p>

                  <Button
                    type="button"
                    onClick={handleRegisterAnother}
                    className="mt-7 cursor-pointer rounded-xl border border-emerald-200 bg-white px-5 py-2.5 text-xs font-bold text-emerald-700 shadow-sm transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-md"
                  >
                    Register Another Grievance
                  </Button>

                </m.div>

              ) : (

                /* =================================================
                   FORM
                ================================================= */

                <m.form
                  id="grievance-form"
                  key="grievance-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={onSubmit}
                  className="space-y-7"
                >

                  {/* Name / Phone / Email */}

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

                    <FormField
                      label="Your Full Name"
                      htmlFor="full-name"
                    >
                      <Input
                        id="full-name"
                        name="full_name"
                        required
                        type="text"
                        minLength={2}
                        maxLength={120}
                        autoComplete="name"
                        disabled={isPending}
                        placeholder="e.g. Rahul Sharma"
                        className="h-11 rounded-xl border-slate-200 bg-white px-4 text-xs font-semibold shadow-sm transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                      />
                    </FormField>

                    <FormField
                      label="Mobile Number"
                      htmlFor="mobile-number"
                    >
                      <Input
                        id="mobile-number"
                        name="mobile_number"
                        required
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={10}
                        pattern="[6-9][0-9]{9}"
                        disabled={isPending}
                        placeholder="10-digit mobile number"
                        className="h-11 rounded-xl border-slate-200 bg-white px-4 text-xs font-semibold shadow-sm transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        onChange={(e) => {
                          e.target.value = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 10)
                        }}
                      />
                    </FormField>

                    <FormField
                      label="Email Address"
                      htmlFor="grievance-email"
                    >
                      <Input
                        id="grievance-email"
                        name="email"
                        required
                        type="email"
                        autoComplete="email"
                        disabled={isPending}
                        placeholder="rahul@example.com"
                        className="h-11 rounded-xl border-slate-200 bg-white px-4 text-xs font-semibold shadow-sm transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                      />
                    </FormField>

                  </div>

                  {/* Category / Ward */}

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                    <FormField label="Complaint Category">

                      <Select
                        name="complaint_category"
                        disabled={isPending}
                        required
                      >
                        <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-xs font-semibold shadow-sm transition-all focus:border-emerald-400">
                          <SelectValue placeholder="Select Complaint Category" />
                        </SelectTrigger>

                        <SelectContent className="z-50 bg-white">

                          <SelectItem value="Sanitation">
                            Sanitation / Garbage
                          </SelectItem>

                          <SelectItem value="Water Supply">
                            Water Supply
                          </SelectItem>

                          <SelectItem value="Roads">
                            Roads & Potholes
                          </SelectItem>

                          <SelectItem value="Streetlights">
                            Street Lights
                          </SelectItem>

                          <SelectItem value="Encroachments">
                            Illegal Encroachment
                          </SelectItem>

                          <SelectItem value="Pipeline Leakage">
                            Pipeline Leakage
                          </SelectItem>

                          <SelectItem value="Drainage">
                            Drainage Problem
                          </SelectItem>

                          <SelectItem value="Property Tax">
                            Property Tax
                          </SelectItem>

                          <SelectItem value="Other">
                            Other Civic Issue
                          </SelectItem>

                        </SelectContent>
                      </Select>

                    </FormField>

                    <FormField label="Select Municipal Ward">

                      <Select
                        name="municipal_ward"
                        disabled={isPending}
                        required
                      >
                        <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-xs font-semibold shadow-sm">
                          <SelectValue placeholder="Select Ward" />
                        </SelectTrigger>

                        <SelectContent className="z-50 bg-white">

                          {Array.from(
                            { length: 18 },
                            (_, index) => {
                              const wardNumber = index + 1

                              return (
                                <SelectItem
                                  key={wardNumber}
                                  value={`Ward ${wardNumber}`}
                                >
                                  Ward No. {wardNumber}
                                </SelectItem>
                              )
                            }
                          )}

                        </SelectContent>
                      </Select>

                    </FormField>

                  </div>

                  {/* Address */}

                  <FormField
                    label="Incident Landmark / Address"
                    htmlFor="incident-address"
                  >
                    <Input
                      id="incident-address"
                      name="incident_address"
                      required
                      type="text"
                      minLength={5}
                      maxLength={255}
                      disabled={isPending}
                      placeholder="e.g. Near Giriraj Ji Temple, Goverdhan"
                      className="h-11 rounded-xl border-slate-200 bg-white px-4 text-xs font-semibold shadow-sm transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </FormField>

                  {/* Description */}

                  <FormField
                    label="Detailed Description of Grievance"
                    htmlFor="grievance-description"
                  >
                    <Textarea
                      id="grievance-description"
                      name="description"
                      required
                      minLength={10}
                      disabled={isPending}
                      rows={5}
                      placeholder="Please explain the issue, exact location and other useful details..."
                      className="resize-none rounded-xl border-slate-200 bg-white px-4 py-3 text-xs font-semibold shadow-sm transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </FormField>

                  {/* Important Notice */}

                  <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-linear-to-r from-amber-50 to-yellow-50 p-4 text-xs font-semibold text-amber-800 shadow-sm">

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    </div>

                    <span className="leading-6">
                      Submit करने से पहले सभी जानकारी ध्यानपूर्वक
                      जांच लें। सही जानकारी प्रदान करने से संबंधित
                      विभाग को आपकी शिकायत पर शीघ्र कार्रवाई करने
                      में सहायता मिलेगी।
                    </span>

                  </div>

                  {/* Actions */}

                  <div className="flex flex-col-reverse items-stretch justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">

                    <Button
                      type="button"
                      onClick={handleClearForm}
                      disabled={isPending}
                      className="cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Clear Fields
                    </Button>

                    <Button
                      type="submit"
                      disabled={isPending}
                      className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 via-teal-500 to-emerald-600 px-6 py-2.5 text-xs font-black tracking-wide text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span>
                        {isPending
                          ? "Submitting..."
                          : "Submit Official Grievance"}
                      </span>

                      <Send
                        className={`h-4 w-4 transition-transform duration-300 ${
                          isPending
                            ? "animate-pulse"
                            : "group-hover:translate-x-1"
                        }`}
                      />
                    </Button>

                  </div>

                </m.form>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  )
}

/* =============================================================
   FORM FIELD
============================================================= */

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="group space-y-2">
      <Label
        htmlFor={htmlFor}
        className="block text-[10px] font-black tracking-[0.08em] text-slate-600 uppercase transition-colors group-focus-within:text-emerald-600"
      >
        {label}
      </Label>

      {children}
    </div>
  )
}
