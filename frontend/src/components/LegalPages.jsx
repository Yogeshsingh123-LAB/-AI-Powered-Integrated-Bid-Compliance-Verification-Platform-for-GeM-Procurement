import React from "react";
import { Home, ShieldCheck, Scale, Mail, LifeBuoy, ChevronRight } from "lucide-react";

export const LEGAL_VIEWS = ["privacy", "terms", "contact", "help"];

const NAV = [
  { id: "privacy", label: "Privacy Policy" },
  { id: "terms", label: "Terms of Service" },
  { id: "contact", label: "Contact" },
  { id: "help", label: "Help" },
];

const TITLES = {
  privacy: "Privacy Policy",
  terms: "Terms of Service",
  contact: "Contact Us",
  help: "Help & Support",
};

function LegalContent({ page }) {
  if (page === "privacy") {
    return (
      <div className="legal-body">
        <h2>1. What this platform stores</h2>
        <p>
          Bid Zee stores the information needed to operate bid compliance verification: your account
          (name, email, phone), the documents you upload for tenders, verification results produced from
          those documents, and an append-only audit log of security- and compliance-relevant actions.
          Passwords are stored only as salted one-way hashes.
        </p>
        <h2>2. How it is protected</h2>
        <p>
          Traffic is transported over TLS. Uploaded documents are stored in private storage with
          server-side validation (type, size, page count and, where configured, malware scanning).
          Access to data is role-based: bidders can only see their own submissions, officers and
          administrators can see data within their mandate, and privileged actions are recorded in the
          audit trail. Session tokens are kept in browser memory and an <code>HttpOnly</code>,
          <code> Secure</code>, <code>SameSite=Lax</code> cookie — they are not readable by scripts.
        </p>
        <h2>3. Government registry lookups</h2>
        <p>
          When registry verification is enabled, the platform sends specific identifiers (for example a
          GSTIN, PAN or CIN) to the corresponding government or licensed data platform solely to verify
          the status of the submitted document. In demo environments the simulated gateway adapters are
          clearly labelled and no live identifiers are queried.
        </p>
        <h2>4. Data retention and your rights</h2>
        <p>
          Submission and audit records are retained for the period required by applicable procurement
          record-keeping rules. You may contact us to request access to, correction of, or deletion of
          your personal data (subject to statutory retention obligations).
        </p>
      </div>
    );
  }
  if (page === "terms") {
    return (
      <div className="legal-body">
        <h2>1. Acceptance</h2>
        <p>
          By creating an account or using Bid Zee you agree to these terms. If you use the platform on
          behalf of an organization you represent that you are authorized to do so.
        </p>
        <h2>2. Decision authority</h2>
        <p>
          Bid Zee is an AI-assisted decision-support and verification platform. The AI never qualifies or
          disqualifies a bidder: final qualification and disqualification decisions belong exclusively to
          the authorized Procurement Officer, and the platform records the officer's decision and its
          justification in the audit trail.
        </p>
        <h2>3. Acceptable use</h2>
        <p>
          You may not submit false or misleading documents, attempt to gain access to another party's
          submissions, probe or attack the platform, or use the platform for any purpose that violates
          applicable law or procurement rules. Accounts used in violation of these terms may be
          suspended.
        </p>
        <h2>4. Demo data</h2>
        <p>
          Sample tenders, bidders and documents that appear in demo mode are synthetic. They do not
          represent real procurement activity and must not be treated as official records.
        </p>
        <h2>5. Changes</h2>
        <p>We may update these terms; the latest version is always available on this page.</p>
      </div>
    );
  }
  if (page === "contact") {
    return (
      <div className="legal-body">
        <h2>Contact the platform team</h2>
        <p>
          For account access issues, vendor support, or questions about a specific tender, contact the
          deployment administrator responsible for your GeM workspace.
        </p>
        <ul>
          <li>
            <strong>General support:</strong>{" "}
            <a href="mailto:support@bidzee.example">support@bidzee.example</a>
          </li>
          <li>
            <strong>Security disclosures:</strong>{" "}
            <a href="mailto:security@bidzee.example">security@bidzee.example</a> (please do not include
            credentials or bid data in reports)
          </li>
        </ul>
        <p>
          Include your registered email address and, where relevant, the tender reference number. Do not
          send passwords or sensitive personal data by email.
        </p>
      </div>
    );
  }
  // help
  return (
    <div className="legal-body">
      <h2>Quick answers</h2>
      <dl>
        <dt>How do I apply to a tender?</dt>
        <dd>
          Sign in to the Bidder Portal, open the tender, apply, then upload each required document in
          the Document Upload step. Submission becomes final when all mandatory documents are present.
        </dd>
        <dt>What do the risk levels mean?</dt>
        <dd>
          Risk levels (LOW / MEDIUM / HIGH / CRITICAL) are computed by the backend from the compliance
          score using centrally configured thresholds. They are decision-support only — the final
          decision always rests with the Procurement Officer.
        </dd>
        <dt>Why can't I see another company's bid?</dt>
        <dd>
          By design. Bidders can only access their own submissions. Officers and administrators see
          bids within their authorization scope.
        </dd>
        <dt>Which government data is simulated in demo mode?</dt>
        <dd>
          Registry lookups labelled “Simulated gateway” (GSTN, PAN, Udyam, EPFO, ESIC, DigiLocker and the
          debarment database) use simulated adapters in demo mode. The MCA21 lookup uses the live
          data.gov.in open dataset when a valid API key is configured.
        </dd>
      </dl>

      <h2>Security Statement</h2>
      <ul>
        <li>
          <strong>Authentication:</strong> email and password (stored as salted one-way hashes), short-lived
          JWT sessions delivered in an <code>HttpOnly</code>, <code>Secure</code>, <code>SameSite=Lax</code> cookie
          plus an in-memory token. Logins are rate-limited and repeated failures lock the account temporarily.
          Accounts provisioned with a provisional credential must change their password before first use.
        </li>
        <li>
          <strong>Access control:</strong> role-based (bidder, procurement officer, auditor, administrator).
          Bidders can only reach their own submissions; roles are always read from the server database,
          never from the client.
        </li>
        <li>
          <strong>Uploads:</strong> the server enforces a 10 MB limit, validates file contents (magic bytes),
          caps PDF page counts, and runs malware scanning (ClamAV) where configured.
        </li>
        <li>
          <strong>Audit:</strong> security- and compliance-relevant actions are recorded in a hash-chained,
          append-only audit log.
        </li>
        <li>
          <strong>AI role:</strong> AI output is decision support only. Final qualification decisions always
          rest with the authorized Procurement Officer.
        </li>
        <li>
          <strong>Report a vulnerability:</strong> email{" "}
          <a href="mailto:security@bidzee.example">security@bidzee.example</a> — please do not include
          credentials or bid data in the message.
        </li>
      </ul>
    </div>
  );
}

export default function LegalPages({ page, onNavigateLegal, onBackToHome, onOpenLogin }) {
  const active = LEGAL_VIEWS.includes(page) ? page : "privacy";
  return (
    <div className="legal-page-wrapper">
      <header className="legal-page-navbar">
        <button type="button" className="legal-brand" onClick={onBackToHome} aria-label="Back to home">
          <img src="/logo.png" alt="Bid Zee logo" className="legal-brand-img" />
          <span>Bid Zee</span>
        </button>
        <nav aria-label="Legal pages">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === active ? "legal-nav-link active" : "legal-nav-link"}
              onClick={() => onNavigateLegal(item.id)}
              aria-current={item.id === active ? "page" : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button type="button" className="legal-open-login" onClick={onOpenLogin}>
          Sign in <ChevronRight size={16} aria-hidden="true" />
        </button>
      </header>

      <main className="legal-main">
        <div className="legal-main-inner">
          <h1>{TITLES[active]}</h1>
          <p className="legal-updated">Last updated: 23 September 2026</p>
          <LegalContent page={active} />
        </div>
      </main>

      <footer className="legal-footer">
        <span>© 2026 Bid Zee. Government procurement decision-support platform.</span>
        <nav aria-label="Footer legal">
          {NAV.map((item) => (
            <button key={item.id} type="button" onClick={() => onNavigateLegal(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
      </footer>

      <style>{`
        .legal-page-wrapper { min-height: 100vh; display: flex; flex-direction: column; background: #f8fafc; color: #0f172a; font-family: "Outfit", system-ui, sans-serif; }
        .legal-page-navbar { display: flex; align-items: center; gap: 24px; padding: 14px 28px; background: #ffffff; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 5; }
        .legal-brand { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 1.05rem; background: none; border: 0; cursor: pointer; color: #0f172a; }
        .legal-brand-img { width: 34px; height: 34px; border-radius: 8px; }
        .legal-page-navbar nav { display: flex; gap: 6px; flex: 1; flex-wrap: wrap; }
        .legal-nav-link { border: 0; background: none; padding: 8px 12px; border-radius: 8px; font-size: 0.95rem; cursor: pointer; color: #334155; }
        .legal-nav-link:hover { background: #f1f5f9; }
        .legal-nav-link.active { background: #fff7ed; color: #c2410c; font-weight: 600; }
        .legal-open-login { display: inline-flex; align-items: center; gap: 4px; border: 1px solid #c2410c; color: #c2410c; background: #fff; padding: 8px 16px; border-radius: 10px; font-weight: 600; cursor: pointer; }
        .legal-open-login:hover { background: #fff7ed; }
        .legal-main { flex: 1; padding: 48px 24px; }
        .legal-main-inner { max-width: 780px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px 44px; box-shadow: 0 1px 3px rgba(15,23,42,.06); }
        .legal-main h1 { font-size: 2rem; margin: 0 0 6px; }
        .legal-updated { color: #64748b; margin-top: 0; }
        .legal-body h2 { font-size: 1.15rem; margin-top: 28px; }
        .legal-body p, .legal-body li, .legal-body dd { line-height: 1.65; color: #1e293b; }
        .legal-body dl dt { font-weight: 700; margin-top: 18px; }
        .legal-body a { color: #c2410c; }
        .legal-body code { background: #f1f5f9; padding: 1px 5px; border-radius: 4px; font-size: 0.9em; }
        .legal-footer { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; padding: 18px 28px; border-top: 1px solid #e2e8f0; background: #fff; color: #64748b; font-size: 0.9rem; }
        .legal-footer nav { display: flex; gap: 14px; flex-wrap: wrap; }
        .legal-footer button { border: 0; background: none; color: #334155; cursor: pointer; font-size: 0.9rem; }
        .legal-footer button:hover { color: #c2410c; text-decoration: underline; }
        .legal-page-wrapper a:focus-visible, .legal-page-wrapper button:focus-visible { outline: 3px solid #f97316; outline-offset: 2px; }
      `}</style>
    </div>
  );
}
