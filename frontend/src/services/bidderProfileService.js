/**
 * Bidder Profile Data Architecture & API Service
 * 
 * Provides mock data model for Bidder profile overview and functions for 
 * computing profile completeness. Prepared for future integration with:
 * - GET /api/users/me
 * - GET /api/bidders/me/profile
 */

export const EMPTY_BIDDER_PROFILE = {
  id: "BID-REG-0001",
  bidderId: "BID-REG-0001",
  memberSince: "Active Account",
  companyLogo: null,
  
  // 1. Company Overview
  legalName: "Registered Bidder",
  tradeName: "",
  businessType: "Registered Supplier",
  location: "India",
  verificationBadge: "Unverified Bidder",
  isVerified: false,

  // 3. Company Information Fields
  registrationNumber: "",
  pan: "",
  panVerificationStatus: "NOT_VERIFIED",
  gstin: "",
  gstinVerificationStatus: "NOT_VERIFIED",
  udyamNumber: "",
  udyamVerificationStatus: "NOT_VERIFIED",
  yearEstablished: "",
  state: "",
  district: "",

  // 4. Contact Information Fields
  email: "",
  emailVerified: true,
  phone: "",
  phoneVerified: false,
  website: "",
  address: "",
  city: "",
  pincode: "",

  // 5. Registration & Compliance Matrix
  complianceStatuses: [
    { key: "pan", label: "PAN", status: "NOT_VERIFIED" },
    { key: "gst", label: "GST", status: "NOT_VERIFIED" },
    { key: "udyam", label: "Udyam / MSME", status: "NOT_VERIFIED" },
    { key: "startupIndia", label: "Startup India", status: "NOT_VERIFIED" },
    { key: "nsic", label: "NSIC", status: "NOT_APPLICABLE" },
    { key: "oemAuthorization", label: "OEM Authorization", status: "NOT_VERIFIED" }
  ],

  // 6. My Documents (Uploaded Compliance Documents)
  documents: [],

  // Incomplete Items for Profile Completion Card
  missingItems: [
    "Legal Company Name",
    "GSTIN registration number",
    "PAN details",
    "Registered business address"
  ],

  // 7. Account Security Information
  lastLogin: "Active Session",
  passwordLastChanged: "Default",
  passwordStatus: "Active"
};

export const MOCK_BIDDER_PROFILE = EMPTY_BIDDER_PROFILE;

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
    if (val !== undefined && val !== null && String(val).trim() !== "" && String(val) !== "Registered Bidder") {
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

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

/**
 * Service function to fetch bidder profile.
 * Connects to API endpoints when available, falling back to clean profile structure.
 */
export async function getBidderProfile(token = null) {
  if (token) {
    try {
      const response = await fetch(`${API_BASE}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        return {
          ...EMPTY_BIDDER_PROFILE,
          id: data.id || EMPTY_BIDDER_PROFILE.id,
          bidderId: `BID-${(data.id || "").substring(0, 8)}`,
          legalName: data.full_name || "Registered Bidder",
          email: data.email || "",
          ...data
        };
      }
    } catch (err) {
      console.warn("Failed to fetch live bidder profile, using clean fallback:", err);
    }
  }
  return EMPTY_BIDDER_PROFILE;
}

