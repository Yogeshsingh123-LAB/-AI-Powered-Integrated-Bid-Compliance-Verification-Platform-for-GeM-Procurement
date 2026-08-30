/**
 * Bidder Profile Data Architecture & API Service
 * 
 * Provides mock data model for Bidder profile overview and functions for 
 * computing profile completeness. Prepared for future integration with:
 * - GET /api/users/me
 * - GET /api/bidders/me/profile
 */

export const MOCK_BIDDER_PROFILE = {
  id: "BID-2026-000123",
  bidderId: "BID-2026-000123",
  memberSince: "January 2026",
  companyLogo: null,
  
  // 1. Company Overview
  legalName: "ABC Industries Pvt. Ltd.",
  tradeName: "ABC Equipment & Tools",
  businessType: "Industrial Equipment Supplier",
  location: "Ahmedabad, Gujarat",
  verificationBadge: "Verified Bidder",
  isVerified: true,

  // 3. Company Information Fields
  registrationNumber: "CIN-U29100GJ2020PTC114589",
  pan: "AABCA1234F",
  panVerificationStatus: "VERIFIED",
  gstin: "24AABCA1234F1Z5",
  gstinVerificationStatus: "VERIFIED",
  udyamNumber: "UDYAM-GJ-01-0012345",
  udyamVerificationStatus: "PENDING",
  yearEstablished: "2018",
  state: "Gujarat",
  district: "Ahmedabad",

  // 4. Contact Information Fields
  email: "contact@abcindustries.in",
  emailVerified: true,
  phone: "+91 98765 43210",
  phoneVerified: true,
  website: "https://www.abcindustries.in",
  address: "Plot 42, GIDC Industrial Estate, Naroda",
  city: "Ahmedabad",
  pincode: "382330",

  // 5. Registration & Compliance Matrix
  complianceStatuses: [
    { key: "pan", label: "PAN", status: "VERIFIED" },
    { key: "gst", label: "GST", status: "VERIFIED" },
    { key: "udyam", label: "Udyam / MSME", status: "VERIFIED" },
    { key: "startupIndia", label: "Startup India", status: "PENDING" },
    { key: "nsic", label: "NSIC", status: "NOT_APPLICABLE" },
    { key: "oemAuthorization", label: "OEM Authorization", status: "NOT_VERIFIED" }
  ],

  // 6. My Documents (Uploaded Compliance Documents)
  documents: [
    {
      id: "doc-1",
      name: "GST Registration Certificate",
      type: "GSTIN",
      uploadedDate: "26 Aug 2026",
      status: "VERIFIED",
      fileUrl: "#"
    },
    {
      id: "doc-2",
      name: "PAN Card / Income Tax Certificate",
      type: "PAN",
      uploadedDate: "26 Aug 2026",
      status: "VERIFIED",
      fileUrl: "#"
    },
    {
      id: "doc-3",
      name: "Udyam MSME Exemption Certificate",
      type: "MSME",
      uploadedDate: "26 Aug 2026",
      status: "VERIFIED",
      fileUrl: "#"
    },
    {
      id: "doc-4",
      name: "Income Tax Returns (Last 3 Years)",
      type: "Financial",
      uploadedDate: "15 Aug 2026",
      status: "VERIFIED",
      fileUrl: "#"
    },
    {
      id: "doc-5",
      name: "OEM Authorization Letter",
      type: "OEM",
      uploadedDate: "10 Aug 2026",
      status: "PENDING",
      fileUrl: "#"
    }
  ],

  // Incomplete Items for Profile Completion Card
  missingItems: [
    "GST verification",
    "Company documentation",
    "OEM authorization renewal"
  ],

  // 7. Account Security Information
  lastLogin: "Today, 10:32 AM",
  passwordLastChanged: "30 days ago",
  passwordStatus: "Active (Last changed 30 days ago)"
};

/**
 * Calculates profile completion percentage dynamically based on completed key profile fields.
 * @param {Object} profile - Bidder profile object
 * @returns {number} Completion percentage (0 - 100)
 */
export function calculateProfileCompletion(profile) {
  if (!profile) return 0;

  // Key fields evaluated for completeness
  const fields = [
    { key: "legalName", weight: 8 },
    { key: "tradeName", weight: 6 },
    { key: "businessType", weight: 6 },
    { key: "registrationNumber", weight: 8 },
    { key: "pan", weight: 8 },
    { key: "gstin", weight: 8 },
    { key: "udyamNumber", weight: 8 },
    { key: "yearEstablished", weight: 5 },
    { key: "email", weight: 6 },
    { key: "phone", weight: 6 },
    { key: "website", weight: 5 },
    { key: "address", weight: 8 },
    { key: "city", weight: 5 },
    { key: "state", weight: 5 },
    { key: "pincode", weight: 6 }
  ];

  let earnedScore = 0;
  let totalScore = 0;

  fields.forEach((item) => {
    totalScore += item.weight;
    const val = profile[item.key];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      earnedScore += item.weight;
    }
  });

  const rawPercentage = Math.round((earnedScore / totalScore) * 100);

  if (profile.missingItems && profile.missingItems.length > 0) {
    const penalty = profile.missingItems.length * 6;
    return Math.max(0, Math.min(100, rawPercentage - penalty));
  }

  return rawPercentage;
}

const API_BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

/**
 * Service function to fetch bidder profile.
 * Connects to API endpoints when available, falling back to mock structure.
 */
export async function getBidderProfile(token = null) {
  if (token) {
    try {
      const response = await fetch(`${API_BASE}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        return { ...MOCK_BIDDER_PROFILE, ...data };
      }
    } catch (err) {
      console.warn("Failed to fetch live bidder profile, using mock fallback:", err);
    }
  }
  return MOCK_BIDDER_PROFILE;
}

