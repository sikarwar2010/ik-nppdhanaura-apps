"use client"

import { AnimatePresence, motion as m } from "framer-motion"

import {
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Landmark,
  MapPin,
  MessageSquareWarning,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"

const complaintCategories = [
  "Sanitation / Garbage Dumping",
  "Water Supply / Pipeline Leakage",
  "Potholes / Damaged Roadways",
  "Street Lights Malfunction",
  "Illegal Encroachment",
]

const wardNumbers = Array.from({ length: 32 }, (_, index) => index + 1)

export default function PublicGrievance() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative isolate overflow-hidden bg-slate-950">
        {/* Background */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-950 via-slate-950 to-indigo-950" />

        {/* Ambient Glow */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-105 w-105 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-95 w-95 rounded-full bg-cyan-400/10 blur-3xl" />

        {/* Grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.035] bg-[linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] bg-size-[40px_40px]" />

        <div className="relative mx-auto w-full max-w-350 px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            {/* HERO CONTENT */}
            <div>
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-200 backdrop-blur-sm">
                <MessageSquareWarning className="h-4 w-4 text-cyan-400" />
                Public Grievance Redressal
              </div>

              {/* Heading */}
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Your Voice Matters.
                <span className="mt-2 block text-cyan-400">
                  We Act On It.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Nagar Palika Parishad is committed to providing a
                transparent and responsive grievance redressal system for
                citizens. Register civic complaints and help us improve
                services across Mainpuri.
              </p>

              {/* Trust Cards */}
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <ShieldCheck className="mb-3 h-5 w-5 text-emerald-400" />

                  <p className="text-xs font-bold text-white">
                    Transparent
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-400">
                    Track your complaint progress.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <CheckCircle2 className="mb-3 h-5 w-5 text-cyan-400" />

                  <p className="text-xs font-bold text-white">
                    Structured
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-400">
                    Routed to the concerned department.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <Sparkles className="mb-3 h-5 w-5 text-amber-400" />

                  <p className="text-xs font-bold text-white">
                    Citizen First
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-400">
                    Designed for simple reporting.
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8">
                <a href="#grievance-form-section">
                  <Button
                    type="button"
                    className="group h-12 cursor-pointer rounded-xl bg-cyan-400 px-6 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-300 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  >
                    Submit Your Grievance

                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </a>
              </div>
            </div>

            {/* HERO IMAGE */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-sm">
                <div className="relative overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1400&auto=format&fit=crop"
                    alt="Citizen grievance submission"
                    className="h-90 w-full object-cover sm:h-110"
                  />

                  <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-slate-950/10 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      Official Citizen Portal
                    </div>

                    <h2 className="mt-3 text-xl font-bold text-white">
                      Report civic issues with confidence.
                    </h2>

                    <p className="mt-1 text-xs text-slate-300">
                      Every submitted grievance receives a unique tracking
                      reference.
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating Card */}
              <div className="absolute -bottom-5 -left-3 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Complaint Tracking
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Transparent & structured
                    </p>
                  </div>
                </div>
              </div>

              {/* 24/7 Card */}
              <div className="absolute -right-3 -top-4 rounded-2xl border border-blue-400/20 bg-blue-600 px-5 py-4 text-white shadow-xl">
                <p className="text-2xl font-black">24/7</p>

                <p className="text-[10px] font-medium text-blue-100">
                  Digital access
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FORM
      ====================================================== */}

      <section
        id="grievance-form-section"
        className="scroll-mt-8 px-4 py-14 sm:px-6 lg:px-10 lg:py-20"
      >
        <div className="mx-auto w-full max-w-300">
          {/* Heading */}
          <div className="mb-8 max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.13em] text-blue-700">
              <FileCheck className="h-3.5 w-3.5" />
              Online Registration
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Register Your Grievance
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Please provide accurate information so that your complaint can
              be reviewed and forwarded to the appropriate nagar palika
              department.
            </p>
          </div>

          {/* Main Form Card */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
            {/* Header */}
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 sm:px-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                  <ShieldAlert className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-950">
                    Grievance Submission Form
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Please provide complete and accurate information before
                    submitting.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <AnimatePresence mode="wait">
                <m.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={(event) => event.preventDefault()}
                  className="space-y-8"
                >
                  {/* =================================================
                      PERSONAL INFORMATION
                  ================================================== */}

                  <div>
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <UserRound className="h-4 w-4" />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-950">
                          Your Information
                        </h3>

                        <p className="text-[11px] text-slate-500">
                          Basic contact information
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="full_name"
                          className="text-xs font-bold text-slate-700"
                        >
                          Full Name
                        </Label>

                        <Input
                          id="full_name"
                          required
                          minLength={2}
                          maxLength={120}
                          type="text"
                          name="full_name"
                          placeholder="Enter your full name"
                          className="h-11 rounded-xl border-slate-200 bg-white px-4 text-sm font-medium shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/10"
                        />
                      </div>

                      {/* Mobile */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="mobile_number"
                          className="text-xs font-bold text-slate-700"
                        >
                          Mobile Number
                        </Label>

                        <Input
                          id="mobile_number"
                          required
                          type="tel"
                          name="mobile_number"
                          inputMode="numeric"
                          pattern="[6-9][0-9]{9}"
                          minLength={10}
                          maxLength={10}
                          placeholder="10-digit mobile number"
                          className="h-11 rounded-xl border-slate-200 bg-white px-4 text-sm font-medium shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/10"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="email"
                          className="text-xs font-bold text-slate-700"
                        >
                          Email Address
                        </Label>

                        <Input
                          id="email"
                          required
                          type="email"
                          name="email"
                          placeholder="you@example.com"
                          className="h-11 rounded-xl border-slate-200 bg-white px-4 text-sm font-medium shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      GRIEVANCE DETAILS
                  ================================================== */}

                  <div>
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <MessageSquareWarning className="h-4 w-4" />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-950">
                          Grievance Details
                        </h3>

                        <p className="text-[11px] text-slate-500">
                          Tell us about the civic issue
                        </p>
                      </div>
                    </div>

                    {/* CATEGORY + WARD */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      {/* CATEGORY */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="complaint_category"
                          className="text-xs font-bold text-slate-700"
                        >
                          Complaint Category
                        </Label>

                        <div className="relative">
                          <select
                            id="complaint_category"
                            name="complaint_category"
                            required
                            defaultValue=""
                            className="h-11 w-full appearance-none cursor-pointer rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all duration-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                          >
                            <option value="" disabled>
                              Select complaint category
                            </option>

                            {complaintCategories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>

                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                            <svg
                              className="h-4 w-4 text-slate-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25-4.5a.75.75 0 01-1.08 1.06l-4.25-4.5a.75.75 0 01.02-1.06z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* WARD */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="municipal_ward"
                          className="text-xs font-bold text-slate-700"
                        >
                             Ward
                        </Label>

                        <div className="relative">
                          <select
                            id="municipal_ward"
                            name="municipal_ward"
                            required
                            defaultValue=""
                            className="h-11 w-full appearance-none cursor-pointer rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all duration-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                          >
                            <option value="" disabled>
                              Select your ward  
                            </option>

                            {wardNumbers.map((wardNumber) => (
                              <option
                                key={wardNumber}
                                value={`Ward No. ${wardNumber}`}
                              >
                                Ward No. {wardNumber}
                              </option>
                            ))}
                          </select>

                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                            <svg
                              className="h-4 w-4 text-slate-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25-4.5a.75.75 0 01-1.08 1.06l-4.25-4.5a.75.75 0 01.02-1.06z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      INCIDENT ADDRESS
                  ================================================== */}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />

                      <Label
                        htmlFor="incident_address"
                        className="text-xs font-bold text-slate-700"
                      >
                        Incident Landmark / Address
                      </Label>
                    </div>

                    <Input
                      id="incident_address"
                      required
                      minLength={5}
                      maxLength={255}
                      type="text"
                      name="incident_address"
                      placeholder="Example: Near Hanuman Mandir , Mainn Road"
                      className="h-11 w-full rounded-xl border-slate-200 bg-white px-4 text-sm font-medium shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/10"
                    />
                  </div>

                  {/* =================================================
                      DESCRIPTION
                  ================================================== */}

                  <div className="space-y-2">
                    <Label
                      htmlFor="description"
                      className="text-xs font-bold text-slate-700"
                    >
                      Detailed Description
                    </Label>

                    <Textarea
                      id="description"
                      required
                      minLength={10}
                      name="description"
                      rows={6}
                      placeholder="Please describe the issue, location and any useful details..."
                      className="w-full resize-none rounded-xl border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/10"
                    />
                  </div>

                  {/* BEFORE SUBMIT */}
                  <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                          <ShieldAlert className="h-4 w-4" />
                        </div>

                        <p className="text-xs font-bold text-amber-900">
                          Before you submit
                        </p>
                      </div>

                      <p className="mt-2 text-[11px] leading-5 text-amber-800">
                        Please review all details carefully. Your grievance
                        reference will be recorded for official review and
                        monitoring.
                      </p>
                    </div>
                  </div>

                  {/* =================================================
                      ACTION BUTTONS
                  ================================================== */}

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-end">
                    <Button
                      type="reset"
                      variant="outline"
                      className="h-11 cursor-pointer rounded-xl border-slate-200 px-6 text-xs font-bold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
                    >
                      Clear Fields
                    </Button>

                    <Button
                      type="submit"
                      className="group h-11 cursor-pointer rounded-xl bg-blue-600 px-6 text-xs font-bold text-white shadow-md shadow-blue-600/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      Submit Official Grievance

                      <Send className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </div>
                </m.form>
              </AnimatePresence>
            </div>
          </div>

          {/* =================================================
              INFORMATION CARDS
          ================================================== */}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Secure */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />

              <h3 className="mt-3 text-sm font-bold text-slate-900">
                Secure Submission
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Your submitted information is recorded through the official
                grievance system.
              </p>
            </div>

            {/* Tracking */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
              <FileCheck className="h-5 w-5 text-blue-600" />

              <h3 className="mt-3 text-sm font-bold text-slate-900">
                Unique Reference
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                A unique tracking reference is generated after successful
                submission.
              </p>
            </div>

            {/* Ward */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
              <Landmark className="h-5 w-5 text-violet-600" />

              <h3 className="mt-3 text-sm font-bold text-slate-900">
                Ward Based Routing
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Select your nagar palika ward for accurate civic issue
                identification.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
