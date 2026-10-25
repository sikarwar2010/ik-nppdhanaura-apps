import {
  Construction,
  Droplets,
  FileBadge,
  Lightbulb,
  MessageSquareWarning,
  ReceiptIndianRupee,
  Recycle,
  ScrollText,
  Siren,
  Store,
} from "lucide-react"

import type { Service } from "@/content/schema"

const map = {
  certificate: FileBadge,
  tax: ReceiptIndianRupee,
  license: Store,
  grievance: MessageSquareWarning,
  rti: ScrollText,
  emergency: Siren,
  sanitation: Recycle,
  water: Droplets,
  streetlight: Lightbulb,
  works: Construction,
} satisfies Record<Service["icon"], unknown>

export function ServiceIcon({ name, className }: { name: Service["icon"]; className?: string }) {
  const Icon = map[name]
  return <Icon aria-hidden className={className} />
}
