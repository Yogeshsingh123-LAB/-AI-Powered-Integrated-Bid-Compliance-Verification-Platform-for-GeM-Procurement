import React, { useState, useEffect } from "react";
import {
  MOCK_BIDDER_PROFILE,
  calculateProfileCompletion,
  getBidderProfile
} from "../services/bidderProfileService";
import "./BidderProfile.css";
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Map,
  Hash,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Edit,
  ArrowRight,
  FileText,
  Eye,
  Download,
  RefreshCw,
  Lock,
  MinusCircle,
  XCircle
} from "lucide-react";

/**
 * Standard Status Configuration
 * Maps status keys to human readable labels, colors, and icons.
 */
const STATUS_CONFIG = {
  VERIFIED: {
    label: "VERIFIED",
    class: "verified",
    icon: CheckCircle2,
    badgeText: "✓ Verified"
  },
  PENDING: {
    label: "PENDING",
    class: "pending",
    icon: AlertTriangle,
    badgeText: "⚠ Pending Verification"
  },
  NOT_VERIFIED: {
    label: "NOT_VERIFIED",
    class: "not_verified",
    icon: XCircle,
    badgeText: "✕ Not Verified"
  },
  NOT_APPLICABLE: {
    label: "NOT_APPLICABLE",
    class: "not_applicable",
    icon: MinusCircle,
    badgeText: "N/A"
  }
};

/**
 * Status Badge for Registration & Compliance and Documents
 */
function ComplianceStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_APPLICABLE;
  const IconComponent = config.icon;

  return (
    <span className={`status-pill ${config.class}`}>
      <IconComponent size={14} />
      <span>{config.label}</span>
    </span>
  );
}

/**
 * Inline Verification Badge for Govt Registration Numbers
 */
function FieldVerificationBadge({ status }) {
  if (!status) return null;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_APPLICABLE;

  return (
    <span className={`inline-badge ${config.class}`}>
      {config.badgeText}
    </span>
  );
}

function BidderProfile() {
  const [profile, setProfile] = useState(MOCK_BIDDER_PROFILE);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("gem_token");
    setLoading(true);
    getBidderProfile(token)
      .then((data) => {
        setProfile(data);
      })
      .catch((err) => {
        console.warn("Profile fetch fallback:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Compute profile completion percentage dynamically
  const completionPercentage = calculateProfileCompletion(profile);

  const handleEditProfileClick = () => {
    setFormData({
      legalName: profile.legalName || "",
      tradeName: profile.tradeName || "",
      businessType: profile.businessType || "",
      registrationNumber: profile.registrationNumber || "",
      pan: profile.pan || "",
      gstin: profile.gstin || "",
      udyamNumber: profile.udyamNumber || "",
      email: profile.email || "",
      phone: profile.phone || "",
      website: profile.website || "",
      address: profile.address || "",
      city: profile.city || "",
      state: profile.state || "",
      pincode: profile.pincode || ""
    });
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    
    // Dynamically calculate missing items list
    const newMissingItems = [];
    if (!formData.gstin) {
      newMissingItems.push("GSTIN registration");
      newMissingItems.push("GST verification");
    }
    if (!formData.pan) {
      newMissingItems.push("PAN registration");
    }
    if (!formData.udyamNumber) {
      newMissingItems.push("Udyam MSME registration");
    }
    if (!formData.website) {
      newMissingItems.push("Website configuration");
    }
    if (!formData.address || !formData.city || !formData.state || !formData.pincode) {
      newMissingItems.push("Registered address fields");
    }
    
    const updatedProfile = {
      ...profile,
      ...formData,
      missingItems: newMissingItems
    };
    
    setProfile(updatedProfile);
    setIsEditing(false);
  };

  const handleCompleteProfileClick = () => {
    handleEditProfileClick();
  };

  const handleChangePasswordClick = () => {
    alert("Change Password: Passcode verification workflow initiated.");
  };

  const handleDocAction = (action, docName) => {
    alert(`${action} document: ${docName}`);
  };

  if (loading) {
    return (
      <div className="bidder-profile-container" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
        Loading Bidder Profile...
      </div>
    );
  }

  return (
    <div className="bidder-profile-container">
      {/* 0. INCOMPLETE PROFILE BANNER */}
      {completionPercentage < 100 && (
        <div className="profile-incomplete-banner">
          <div className="banner-left">
            <AlertTriangle className="banner-icon" />
            <div className="banner-text">
              <h3>Compliance Profile Incomplete ({completionPercentage}%)</h3>
              <p>Your profile is missing critical compliance information: <strong>{profile.missingItems?.join(", ") || "Registration details"}</strong>. Complete these to submit bids.</p>
            </div>
          </div>
          <button className="complete-profile-btn" onClick={handleCompleteProfileClick}>
            <span>Complete Profile</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* PAGE HEADER */}
      <header className="profile-page-header">
        <div className="profile-header-titles">
          <h1>Profile</h1>
          <p>Manage your company information, contact details and compliance information.</p>
        </div>
        <button className="header-action-btn" onClick={handleEditProfileClick}>
          <Edit size={16} />
          <span>Edit Profile</span>
        </button>
      </header>

      {/* 1. COMPANY OVERVIEW (HERO CARD) */}
      <div className="profile-card hero-card">
        <div className="hero-card-header-bar" />
        <div className="hero-main-content">
          <div className="hero-avatar-wrapper">
            <div className="gem-sovereign-seal">
              <div className="seal-stamp-ring"></div>
              <div className="seal-stamp-dots"></div>
              <div className="seal-content">
                {profile.companyLogo ? (
                  <img src={profile.companyLogo} alt={profile.legalName} className="company-logo-avatar" />
                ) : (
                  <div className="company-logo-fallback">
                    {profile.legalName ? profile.legalName.substring(0, 3).toUpperCase() : "ABC"}
                  </div>
                )}
              </div>
            </div>
            <div className="verified-icon-badge" title="Verified Bidder">
              <ShieldCheck size={18} />
            </div>
          </div>

          <div className="hero-details-block">
            <div className="company-name-row">
              <h2>{profile.legalName}</h2>
              <span className="verified-pill-badge">
                <CheckCircle2 size={12} />
                <span>{profile.verificationBadge || "Verified Bidder"}</span>
              </span>
            </div>

            <div className="hero-subinfo">
              <div className="subinfo-item">
                <Building2 size={15} />
                <span>{profile.businessType}</span>
              </div>
              <div className="subinfo-item">
                <MapPin size={15} />
                <span>{profile.location}</span>
              </div>
            </div>

            <div className="hero-meta-grid">
              <div className="meta-item">
                <span className="meta-label">Bidder ID</span>
                <span className="meta-value tech-code">{profile.bidderId}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Member Since</span>
                <span className="meta-value">{profile.memberSince}</span>
              </div>
              <button className="hero-edit-btn" onClick={handleEditProfileClick}>
                <Edit size={14} />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID FOR SECTIONS 2, 3, 4, 5, 7 */}
      <div className="profile-grid-layout">
        
        {/* LEFT COLUMN */}
        <div className="profile-left-col">
          
          {/* 2. PROFILE COMPLETION */}
          <div className="profile-card completion-card">
            <div className="completion-top-row">
              <div>
                <h3 className="completion-headline">Profile Completion</h3>
                <p className="completion-subtext">Complete your company and compliance information.</p>
              </div>
              <div className="completion-percentage-badge">
                {completionPercentage}%
              </div>
            </div>

            <div className="progress-bar-track">
              <div
                className="progress-bar-fill-dynamic"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            {profile.missingItems && profile.missingItems.length > 0 && (
              <div className="missing-items-box">
                <div className="missing-title">
                  <AlertTriangle size={14} />
                  <span>Incomplete Items</span>
                </div>
                <ul className="missing-list">
                  {profile.missingItems.map((item, idx) => (
                    <li key={idx}>
                      <span className="missing-dot" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button className="complete-profile-btn" onClick={handleCompleteProfileClick}>
              <span>Complete Profile</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* 3. COMPANY INFORMATION */}
          <div className="profile-card">
            <div className="card-title-row">
              <h2>
                <Building2 size={20} className="card-title-icon" />
                <span>Company Information</span>
              </h2>
            </div>

            <div className="info-fields-grid">
              <div className="info-field-item">
                <div className="field-label-row">
                  <span className="field-label">Legal Company Name</span>
                </div>
                <span className="field-value">{profile.legalName}</span>
              </div>

              <div className="info-field-item">
                <div className="field-label-row">
                  <span className="field-label">Trade Name</span>
                </div>
                <span className="field-value">{profile.tradeName}</span>
              </div>

              <div className="info-field-item">
                <div className="field-label-row">
                  <span className="field-label">Business Type</span>
                </div>
                <span className="field-value">{profile.businessType}</span>
              </div>

              <div className="info-field-item">
                <div className="field-label-row">
                  <span className="field-label">Company Registration Number</span>
                </div>
                <span className="field-value tech-code">{profile.registrationNumber}</span>
              </div>

              <div className="info-field-item">
                <div className="field-label-row">
                  <span className="field-label">PAN</span>
                  <FieldVerificationBadge status={profile.panVerificationStatus} />
                </div>
                <span className="field-value tech-code">{profile.pan}</span>
              </div>

              <div className="info-field-item">
                <div className="field-label-row">
                  <span className="field-label">GSTIN</span>
                  <FieldVerificationBadge status={profile.gstinVerificationStatus} />
                </div>
                <span className="field-value tech-code">{profile.gstin}</span>
              </div>

              <div className="info-field-item">
                <div className="field-label-row">
                  <span className="field-label">Udyam Registration Number</span>
                  <FieldVerificationBadge status={profile.udyamVerificationStatus} />
                </div>
                <span className="field-value tech-code">{profile.udyamNumber}</span>
              </div>

              <div className="info-field-item">
                <div className="field-label-row">
                  <span className="field-label">Year of Establishment</span>
                </div>
                <span className="field-value">{profile.yearEstablished}</span>
              </div>

              <div className="info-field-item">
                <div className="field-label-row">
                  <span className="field-label">State</span>
                </div>
                <span className="field-value">{profile.state}</span>
              </div>

              <div className="info-field-item">
                <div className="field-label-row">
                  <span className="field-label">District</span>
                </div>
                <span className="field-value">{profile.district}</span>
              </div>
            </div>
          </div>

          {/* 4. CONTACT INFORMATION */}
          <div className="profile-card">
            <div className="card-title-row">
              <h2>
                <Mail size={20} className="card-title-icon" />
                <span>Contact Information</span>
              </h2>
            </div>

            <div className="info-fields-grid">
              <div className="info-field-item">
                <div className="field-label-row">
                  <span className="field-label">
                    <Mail size={13} /> Official Email
                  </span>
                  {profile.emailVerified && (
                    <span className="inline-badge verified">✓ Verified</span>
                  )}
                </div>
                <span className="field-value">{profile.email}</span>
              </div>

              <div className="info-field-item">
                <div className="field-label-row">
                  <span className="field-label">
                    <Phone size={13} /> Phone Number
                  </span>
                  {profile.phoneVerified && (
                    <span className="inline-badge verified">✓ Verified</span>
                  )}
                </div>
                <span className="field-value">{profile.phone}</span>
              </div>

              <div className="info-field-item">
                <div className="field-label-row">
                  <span className="field-label">
                    <Globe size={13} /> Website
                  </span>
                </div>
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="field-value"
                  style={{ color: "#0284c7", textDecoration: "none" }}
                >
                  {profile.website}
                </a>
              </div>

              <div className="info-field-item" style={{ gridColumn: "span 1" }}>
                <div className="field-label-row">
                  <span className="field-label">
                    <MapPin size={13} /> Registered Address
                  </span>
                </div>
                <span className="field-value">{profile.address}</span>
              </div>

              <div className="info-field-item">
                <div className="field-label-row">
                  <span className="field-label">
                    <Building2 size={13} /> City
                  </span>
                </div>
                <span className="field-value">{profile.city}</span>
              </div>

              <div className="info-field-item">
                <div className="field-label-row">
                  <span className="field-label">
                    <Map size={13} /> State
                  </span>
                </div>
                <span className="field-value">{profile.state}</span>
              </div>

              <div className="info-field-item">
                <div className="field-label-row">
                  <span className="field-label">
                    <Hash size={13} /> PIN Code
                  </span>
                </div>
                <span className="field-value tech-code">{profile.pincode}</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="profile-right-col">
          
          {/* 5. REGISTRATION & COMPLIANCE */}
          <div className="profile-card">
            <div className="card-title-row">
              <h2>
                <ShieldCheck size={20} className="card-title-icon" />
                <span>Registration & Compliance</span>
              </h2>
            </div>

            <div className="compliance-matrix-list">
              {profile.complianceStatuses.map((item) => (
                <div key={item.key} className="compliance-row-item">
                  <span className="compliance-row-label">{item.label}</span>
                  <ComplianceStatusBadge status={item.status} />
                </div>
              ))}
            </div>
          </div>

          {/* 7. ACCOUNT SECURITY */}
          <div className="profile-card">
            <div className="card-title-row">
              <h2>
                <Lock size={20} className="card-title-icon" />
                <span>Account Security</span>
              </h2>
            </div>

            <div className="security-fields-list">
              <div className="security-item">
                <div className="security-item-left">
                  <span className="security-item-label">Email Verification</span>
                  <span className="security-item-value">{profile.email}</span>
                </div>
                <span className="inline-badge verified">Verified ✓</span>
              </div>

              <div className="security-item">
                <div className="security-item-left">
                  <span className="security-item-label">Phone Verification</span>
                  <span className="security-item-value">{profile.phone}</span>
                </div>
                <span className="inline-badge verified">Verified ✓</span>
              </div>

              <div className="security-item">
                <div className="security-item-left">
                  <span className="security-item-label">Password Status</span>
                  <span className="security-item-value">{profile.passwordStatus || `Last changed ${profile.passwordLastChanged}`}</span>
                </div>
              </div>
            </div>

            <button className="security-action-btn" onClick={handleChangePasswordClick}>
              <Lock size={15} />
              <span>Change Password</span>
            </button>
          </div>

        </div>

      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="edit-profile-modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Bidder Profile</h2>
              <button className="modal-close-btn" onClick={() => setIsEditing(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSaveProfile} className="modal-form">
              <div className="modal-scroll-area">
                <div className="form-section-title">Company Details</div>
                <div className="modal-form-grid">
                  <div className="form-group">
                    <label>Legal Name</label>
                    <input type="text" name="legalName" value={formData.legalName} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Trade Name</label>
                    <input type="text" name="tradeName" value={formData.tradeName} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Business Type</label>
                    <input type="text" name="businessType" value={formData.businessType} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Registration Number (CIN)</label>
                    <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleInputChange} required />
                  </div>
                </div>

                <div className="form-section-title">Compliance Registry Numbers</div>
                <div className="modal-form-grid">
                  <div className="form-group">
                    <label>GSTIN</label>
                    <input type="text" name="gstin" value={formData.gstin} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>PAN</label>
                    <input type="text" name="pan" value={formData.pan} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Udyam Registration Number</label>
                    <input type="text" name="udyamNumber" value={formData.udyamNumber} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="form-section-title">Contact & Location</div>
                <div className="modal-form-grid">
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Website URL</label>
                    <input type="text" name="website" value={formData.website} onChange={handleInputChange} />
                  </div>
                  <div className="form-group full-width">
                    <label>Registered Address</label>
                    <input type="text" name="address" value={formData.address} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input type="text" name="city" value={formData.city} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input type="text" name="state" value={formData.state} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>PIN Code</label>
                    <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} required />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="modal-cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                <button type="submit" className="modal-save-btn">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default BidderProfile;
