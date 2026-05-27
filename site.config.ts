export const siteConfig = {
  // Basic Site Information
  title: "JP Interio",
  name: "JP Interio",
  description:
    "Discover JP Interio, where style meets sustainability to create beautiful, eco-friendly spaces.",
  domain: "https://jpinterio.com",
  // Logo
  logo: {
    path: "/image/logo.png",
    alt: "JP Interio Logo",
  },

  // Contact Information
  contact: {
    email: "[EMAIL_ADDRESS]",
    phone: "+91 7068999458",
    alternatePhone: "+91 7068999458",
    whatsapp: "917068999458", // Format: country code + number (no spaces or special characters)
    address: "Near JMK Showroom, Avas Vikas Phase 2, Jhansi, Uttar Pradesh 284003",
    secondAddress: "Near Hanuman Mandir, Avas Vikas Phase 2, Jhansi, Uttar Pradesh 284003",
  },

  // Social Media Links
  social: {
    facebook: "",
    instagram: "#",
    twitter: "",
    youtube: "#",
    linkedin: "",
  },

  // Admin Panel
  admin: {
    title: "JP Interio",
    subtitle: "Admin Panel",
  },
} as const;

export type SiteConfig = typeof siteConfig;
