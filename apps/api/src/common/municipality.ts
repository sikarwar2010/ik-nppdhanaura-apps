/**
 * Identity of the municipality this deployment serves (one database is one
 * municipality). Used on receipts, demand notices and gateway requests so no
 * template carries another town's name.
 */
export const MUNICIPALITY = {
  nameEn: "Nagar Palika Parishad Dhanaura",
  nameHi: "नगर पालिका परिषद, धनौरा",
  town: "Dhanaura",
  districtEn: "Amroha, Uttar Pradesh",
  districtHi: "अमरोहा, उत्तर प्रदेश",
  /** Office e-mail published on the municipal website. */
  officeEmail: "npdhanaura@gmail.com",
} as const

/**
 * E-mail sent to the payment gateway when the citizen gave none. The gateway
 * requires one; we never invent a per-citizen address.
 */
export function gatewayFallbackEmail(): string {
  return process.env.ATOM_FALLBACK_EMAIL?.trim() || MUNICIPALITY.officeEmail
}
