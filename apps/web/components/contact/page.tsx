"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"

export default function ContactUs() {
  const [submitted, setSubmitted] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    console.log("Contact Form Data:", data)

    e.currentTarget.reset()

    setTimeout(() => {
      setIsPending(false)
      setSubmitted(true)

      window.setTimeout(() => {
        setSubmitted(false)
      }, 4000)
    }, 900)
  }

  return (
    <main
      id="contact-us"
      className="relative min-h-screen overflow-hidden bg-linear-to-br from-[#fffdf8] via-[#f7fbff] to-[#fbf7ff] px-4 py-16 font-sans md:px-8 md:py-24"
    >
      {/* =====================================================
          BACKGROUND GRID
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(#123247 1px, transparent 1px), linear-gradient(90deg, #123247 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      {/* Background Glows */}

      <div className="pointer-events-none absolute -left-40 top-20 h-105 w-105 rounded-full bg-orange-300/20 blur-[140px]" />

      <div className="pointer-events-none absolute -right-40 top-1/3 h-112.5 w-112.5 rounded-full bg-blue-300/20 blur-[140px]" />

      <div className="pointer-events-none absolute bottom-0 left-1/3 h-100 w-100 rounded-full bg-violet-300/15 blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* =====================================================
            PAGE HEADER
        ====================================================== */}

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-[10px] font-black tracking-[0.15em] text-orange-700 uppercase shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-orange-400 to-pink-500 text-white shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
            </span>

            नागरिक संपर्क केंद्र
          </div>

          <h1 className="font-serif text-4xl font-black tracking-tight text-[#123247] md:text-6xl">
            Get in{" "}
            <span className="bg-linear-to-r from-orange-500 via-pink-500 to-violet-600 bg-clip-text text-transparent">
              Touch
            </span>
          </h1>

          <p className="mt-3 text-sm font-bold text-slate-500 md:text-base">
            संपर्क कार्यालय • Contact Nagar Palika Parishad, Mainpuri
          </p>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 font-medium text-slate-600 md:text-base">
            आपके सुझाव, शिकायतें और प्रश्न हमारे लिए महत्वपूर्ण हैं।
            नगर पालिका परिषद, मैनपुरी से संबंधित किसी भी जानकारी या
            सहायता के लिए हमसे संपर्क करें।
          </p>

          <div className="mx-auto mt-7 flex items-center justify-center gap-2">
            <span className="h-1.5 w-14 rounded-full bg-linear-to-r from-orange-400 to-pink-500" />

            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-violet-200 bg-violet-50">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            </span>

            <span className="h-1.5 w-14 rounded-full bg-linear-to-r from-sky-500 to-violet-600" />
          </div>
        </motion.div>

        {/* =====================================================
            MAIN CONTACT GRID
        ====================================================== */}

        <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
          {/* ===================================================
              CONTACT INFORMATION
          ==================================================== */}

          <motion.section
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5"
          >
            <div className="group relative h-full overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_15px_45px_rgba(15,45,65,0.07)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_25px_65px_rgba(15,45,65,0.12)] md:p-7">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-orange-400 via-pink-500 to-violet-600" />

              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-orange-300/15 blur-3xl" />

              <div className="relative z-10">
                <div className="mb-7 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[9px] font-black tracking-wider text-blue-700 uppercase">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Official Contact
                    </div>

                    <h2 className="font-serif text-2xl font-black tracking-tight text-[#123247]">
                      Contact Information
                    </h2>

                    <p className="mt-1.5 text-xs leading-5 font-medium text-slate-500">
                      किसी भी सहायता, जानकारी या नगरपालिका सेवा से संबंधित
                      प्रश्न के लिए हमसे संपर्क करें।
                    </p>
                  </div>

                  <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-orange-400 to-pink-500 text-white shadow-lg sm:flex">
                    <Phone className="h-5 w-5" />
                  </div>
                </div>

                {/* Address */}

                <div className="space-y-3.5">
                  <div className="group/item flex items-start gap-4 rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50/80 to-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/60">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-md transition-transform duration-300 group-hover/item:scale-110 group-hover/item:rotate-2">
                      <MapPin className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-black tracking-[0.12em] text-blue-600 uppercase">
                        Office Address
                      </p>

                      <p className="mt-1 text-xs leading-5 font-bold text-slate-700">
                        Agrawal Mohalla,
                        <br />
                        Mainpuri, Uttar Pradesh - 205001
                      </p>
                    </div>
                  </div>

                  {/* Phone */}

                  <div className="group/item flex items-start gap-4 rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-50/80 to-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/60">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-md transition-transform duration-300 group-hover/item:scale-110 group-hover/item:rotate-2">
                      <Phone className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-[9px] font-black tracking-[0.12em] text-emerald-600 uppercase">
                        Phone Number
                      </p>

                      <Link
                        href="tel:+919454083549"
                        className="mt-1 block text-xs font-black text-slate-700 transition-colors hover:text-emerald-600 hover:underline"
                      >
                        +91 94540 83549
                      </Link>
                    </div>
                  </div>

                  {/* Email */}

                  <div className="group/item flex items-start gap-4 rounded-2xl border border-amber-100 bg-linear-to-r from-amber-50/80 to-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/60">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-md transition-transform duration-300 group-hover/item:scale-110 group-hover/item:rotate-2">
                      <Mail className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-black tracking-[0.12em] text-amber-600 uppercase">
                        Email Address
                      </p>

                      <Link
                        href="mailto:nppmainpuri@gmail.com"
                        className="mt-1 block truncate text-xs font-black text-slate-700 transition-colors hover:text-amber-600 hover:underline"
                      >
                        nppmainpuri@gmail.com
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Office Details */}

                <div className="mt-7 space-y-3 border-t border-slate-100 pt-6">
                  <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/50 p-3.5 transition-all hover:bg-violet-50">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                      <Clock3 className="h-4 w-4" />
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-[#123247]">
                        Office Hours
                      </h4>

                      <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                        Monday – Saturday • 10:00 AM – 05:00 PM
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/50 p-3.5 transition-all hover:bg-rose-50">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                      <ShieldCheck className="h-4 w-4" />
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-rose-700">
                        Citizen Support
                      </h4>

                      <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                        नगरपालिका सेवाओं एवं नागरिक सहायता के लिए संपर्क करें।
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div>
                    <p className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                      Official Portal
                    </p>

                    <p className="mt-1 text-xs font-black text-[#123247]">
                      Nagar Palika Parishad, Mainpuri
                    </p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-500 shadow-sm">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ===================================================
              CONTACT FORM
          ==================================================== */}

          <motion.section
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <div className="relative h-full overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_15px_45px_rgba(15,45,65,0.07)] backdrop-blur-xl">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-blue-500 via-violet-500 to-pink-500" />

              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-300/10 blur-3xl" />

              <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-pink-300/10 blur-3xl" />

              <div className="relative z-10 p-6 md:p-8">
                <div className="mb-7 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-[9px] font-black tracking-wider text-violet-700 uppercase">
                      <Send className="h-3 w-3" />
                      Online Enquiry
                    </div>

                    <h2 className="font-serif text-2xl font-black tracking-tight text-[#123247]">
                      Send Us a Message
                    </h2>

                    <p className="mt-1.5 text-xs font-medium text-slate-500">
                      अपना संदेश दर्ज करें। हमारी टीम आवश्यकतानुसार आपसे संपर्क
                      करेगी।
                    </p>
                  </div>

                  <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-pink-500 text-white shadow-lg sm:flex">
                    <Send className="h-5 w-5" />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.92, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      className="flex min-h-107.5 flex-col items-center justify-center text-center"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-2xl" />

                        <div className="relative flex h-24 w-24 items-center justify-center rounded-[30px] bg-linear-to-br from-emerald-400 to-teal-600 text-white shadow-xl shadow-emerald-200">
                          <CheckCircle2 className="h-12 w-12" />
                        </div>
                      </div>

                      <h3 className="mt-7 text-2xl font-black text-[#123247]">
                        Message Sent Successfully!
                      </h3>

                      <p className="mt-3 max-w-md text-sm leading-6 font-medium text-slate-500">
                        धन्यवाद! आपका संदेश नगर पालिका परिषद, मैनपुरी को
                        सफलतापूर्वक प्राप्त हो गया है।
                      </p>

                      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Enquiry Successfully Registered
                      </div>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={onSubmit}
                      className="space-y-5"
                    >
                      {/* Name + Email */}

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label
                            htmlFor="contact-name"
                            className="text-[10px] font-black tracking-wider text-slate-600 uppercase"
                          >
                            Your Name
                          </Label>

                          <Input
                            id="contact-name"
                            name="name"
                            required
                            type="text"
                            autoComplete="name"
                            disabled={isPending}
                            placeholder="Enter your full name"
                            className="h-11 rounded-xl border-slate-200 bg-slate-50/70 px-4 text-xs font-semibold transition-all placeholder:text-slate-400 hover:border-blue-200 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="contact-email"
                            className="text-[10px] font-black tracking-wider text-slate-600 uppercase"
                          >
                            Email Address
                          </Label>

                          <Input
                            id="contact-email"
                            name="email"
                            required
                            type="email"
                            autoComplete="email"
                            disabled={isPending}
                            placeholder="Enter your email"
                            className="h-11 rounded-xl border-slate-200 bg-slate-50/70 px-4 text-xs font-semibold transition-all placeholder:text-slate-400 hover:border-violet-200 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                          />
                        </div>
                      </div>

                      {/* Phone + Subject */}

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label
                            htmlFor="contact-phone"
                            className="text-[10px] font-black tracking-wider text-slate-600 uppercase"
                          >
                            Phone Number
                          </Label>

                          <Input
                            id="contact-phone"
                            name="phone"
                            required
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            maxLength={10}
                            pattern="[1-9][0-9]{9}"
                            disabled={isPending}
                            placeholder="10-digit mobile number"
                            className="h-11 rounded-xl border-slate-200 bg-slate-50/70 px-4 text-xs font-semibold transition-all placeholder:text-slate-400 hover:border-emerald-200 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                            onChange={(e) => {
                              e.target.value = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 10)
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="contact-subject"
                            className="text-[10px] font-black tracking-wider text-slate-600 uppercase"
                          >
                            Subject
                          </Label>

                          <Input
                            id="contact-subject"
                            name="subject"
                            required
                            type="text"
                            disabled={isPending}
                            placeholder="Message subject"
                            className="h-11 rounded-xl border-slate-200 bg-slate-50/70 px-4 text-xs font-semibold transition-all placeholder:text-slate-400 hover:border-orange-200 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                          />
                        </div>
                      </div>

                      {/* Message */}

                      <div className="space-y-2">
                        <Label
                          htmlFor="contact-message"
                          className="text-[10px] font-black tracking-wider text-slate-600 uppercase"
                        >
                          Your Message
                        </Label>

                        <Textarea
                          id="contact-message"
                          name="message"
                          required
                          disabled={isPending}
                          rows={6}
                          placeholder="Write your message or enquiry..."
                          className="resize-none rounded-xl border-slate-200 bg-slate-50/70 px-4 py-3 text-xs font-semibold transition-all placeholder:text-slate-400 hover:border-pink-200 focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100"
                        />
                      </div>

                      {/* Privacy */}

                      <div className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

                        <p className="text-[9px] leading-4 font-medium text-slate-500">
                          आपकी जानकारी केवल आपकी enquiry को process करने और
                          आवश्यक संपर्क के लिए उपयोग की जाएगी।
                        </p>
                      </div>

                      {/* Submit */}

                      <Button
                        type="submit"
                        disabled={isPending}
                        className="group h-12 w-full cursor-pointer rounded-xl bg-linear-to-r from-blue-600 via-violet-600 to-pink-500 text-xs font-black text-white shadow-lg shadow-violet-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-300 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <span>
                          {isPending ? "Sending Message..." : "Send Message"}
                        </span>

                        <Send
                          className={`ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 ${
                            isPending ? "animate-pulse" : ""
                          }`}
                        />
                      </Button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.section>
        </div>

        {/* =====================================================
            GOOGLE MAPS
        ====================================================== */}

        <motion.section
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-7 overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_15px_45px_rgba(15,45,65,0.07)] backdrop-blur-xl md:p-7"
        >
          {/* Map Header */}

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[9px] font-black tracking-wider text-emerald-700 uppercase">
                <MapPin className="h-3 w-3" />
                Find Our Office
              </div>

              <h2 className="font-serif text-2xl font-black tracking-tight text-[#123247]">
                Nagar Palika Parishad, Mainpuri
              </h2>

              <p className="mt-1 text-xs font-medium text-slate-500">
                Agrawal Mohalla, Mainpuri, Uttar Pradesh - 205001
              </p>
            </div>

            {/* Open Google Maps */}

            <Link
              href="https://www.google.com/maps/search/?api=1&query=Nagar+Palika+Parishad+Mainpuri+Agrawal+Mohalla+Uttar+Pradesh+205001"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-3 text-[10px] font-black text-white shadow-lg shadow-blue-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-300"
            >
              <Navigation className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" />

              <span>Open in Google Maps</span>

              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {/* =================================================
              MAINPURI GOOGLE MAP IFRAME
          ================================================== */}

          <div className="group relative mt-6 h-95 w-full overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100">
            <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-[#123247]/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <iframe
              src="https://www.google.com/maps?q=Nagar+Palika+Parishad+Mainpuri+Agrawal+Mohalla+Uttar+Pradesh+205001&output=embed"
              className="h-full w-full border-0 grayscale-15 transition-all duration-700 group-hover:grayscale-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Nagar Palika Parishad Mainpuri Location Map"
            />
          </div>

          {/* Map Footer */}

          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-500" />

              <span className="text-[10px] font-bold text-slate-600">
                Agrawal Mohalla, Mainpuri, Uttar Pradesh - 205001
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />

              <span className="text-[9px] font-black tracking-wider text-emerald-700 uppercase">
                Official Location
              </span>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  )
}
