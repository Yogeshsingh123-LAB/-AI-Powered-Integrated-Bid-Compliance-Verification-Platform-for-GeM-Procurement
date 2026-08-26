import { useState } from "react";
import profileImage from "../assets/profile.png";
import "../App.css";
import DocumentUploadPage from "./DocumentUpload";
import StatusPage from "./Status";
import {
  LayoutDashboard,
  UserCircle,
  CloudUpload,
  FileText,
  Clock3,
  Bell,
  LifeBuoy,
  LogOut,
  Shield,
  User,
} from "lucide-react";

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "profile", label: "My Profile", icon: UserCircle },
  { id: "documentUpload", label: "Document Upload", icon: CloudUpload },
  { id: "applications", label: "My Applications", icon: FileText },
  { id: "status", label: "Status Tracker", icon: Clock3 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "support", label: "Support", icon: LifeBuoy },
];

function DashboardSection() {
  return (
    <>
      <h1>Welcome, Shweta Beelwal!</h1>

      <p className="subtitle">
        Manage your compliance documents and track your application status.
      </p>

      <div className="stats-grid">
        <div className="stat-card purple">
          <p>TOTAL APPLICATIONS</p>
          <h2>06</h2>
          <span>📄</span>
        </div>

        <div className="stat-card blue">
          <p>UPLOADED DOCUMENTS</p>
          <h2>24</h2>
          <span>☁</span>
        </div>

        <div className="stat-card green">
          <p>VERIFIED</p>
          <h2>16</h2>
          <span>✓</span>
        </div>

        <div className="stat-card orange">
          <p>PENDING ACTION</p>
          <h2>04</h2>
          <span>⚠</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="applications-card">
          <div className="card-header">
            <h2>📁 My Compliance Applications</h2>
            <button type="button">View All</button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Application ID</th>
                <th>Service</th>
                <th>Submitted On</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>GEM-APP-2024-001</td>
                <td>GeM Registration Assistance</td>
                <td>24 May 2024</td>
                <td>
                  <span className="status verified">Verified</span>
                </td>
                <td>View</td>
              </tr>

              <tr>
                <td>GEM-APP-2024-002</td>
                <td>MSME Registration</td>
                <td>20 May 2024</td>
                <td>
                  <span className="status review">Under Review</span>
                </td>
                <td>View</td>
              </tr>

              <tr>
                <td>GEM-APP-2024-003</td>
                <td>Tender Compliance</td>
                <td>18 May 2024</td>
                <td>
                  <span className="status pending">Pending</span>
                </td>
                <td>View</td>
              </tr>

              <tr>
                <td>GEM-APP-2024-004</td>
                <td>OEM Authorization</td>
                <td>15 May 2024</td>
                <td>
                  <span className="status verified">Verified</span>
                </td>
                <td>View</td>
              </tr>

              <tr>
                <td>GEM-APP-2024-005</td>
                <td>DSC & MSME Verification</td>
                <td>10 May 2024</td>
                <td>
                  <span className="status review">Under Review</span>
                </td>
                <td>View</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="right-column">
          <div className="application-status">
            <h2>Application Status</h2>

            <div className="circle">
              <div>63%</div>
            </div>

            <div className="legend">
              <p>🟢 Verified (16)</p>
              <p>🟡 Under Review (06)</p>
              <p>🟣 Pending (04)</p>
              <p>⚪ Rejected (02)</p>
            </div>
          </div>

          <div className="quick-actions">
            <h2>Quick Actions</h2>

            <button type="button">☁ Upload New Document <span>›</span></button>
            <button type="button">📄 Start New Application <span>›</span></button>
            <button type="button">⌕ Check Status <span>›</span></button>
            <button type="button">♧ View Notifications <span>›</span></button>
          </div>
        </div>
      </div>

      <div className="help-section">
        <div>
          <h2>📄 Need Help with Compliance?</h2>
          <p>
            Our platform helps you manage your GeM procurement compliance and
            verification requirements.
          </p>
        </div>

        <button type="button">Contact Support</button>
      </div>

      <footer>© 2026 GeM Procurement. All rights reserved.</footer>
    </>
  );
}

function SectionPlaceholder({ title, description, rows }) {
  return (
    <>
      <h1>{title}</h1>
      <p className="subtitle">{description}</p>

      <div className="section-panel">
        {rows.map((row) => (
          <div className="detail-item" key={row.label}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </>
  );
}

function Home({ onLogout }) {
  const [activeSection, setActiveSection] = useState("dashboard");

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <SectionPlaceholder
            title="My Profile"
            description="Review personal details and procurement account information."
            rows={[
              { label: "Full Name", value: "Shweta Beelwal" },
              { label: "User Type", value: "Buyer / Supplier" },
              { label: "Organization", value: "Gem Bid Compliance" },
              { label: "Last Updated", value: "18 Aug 2026" },
            ]}
          />
        );
      case "documentUpload":
        return <DocumentUploadPage />;
      case "applications":
        return (
          <SectionPlaceholder
            title="My Applications"
            description="Track all the procurement and compliance applications created by your account."
            rows={[
              { label: "Active Applications", value: "05" },
              { label: "Submitted this month", value: "03" },
              { label: "Pending Docs", value: "02" },
              { label: "Last Action", value: "Verification in progress" },
            ]}
          />
        );
      case "status":
        return <StatusPage />;
      case "notifications":
        return (
          <SectionPlaceholder
            title="Notifications"
            description="Review important updates, verification alerts, and adherence reminders."
            rows={[
              { label: "Unread", value: "04" },
              { label: "Critical Alerts", value: "01" },
              { label: "System Updates", value: "03" },
              { label: "This Week", value: "08" },
            ]}
          />
        );
      case "support":
        return (
          <SectionPlaceholder
            title="Support"
            description="Contact the help desk for portal access, compliance guidance, and application support."
            rows={[
              { label: "Help Desk", value: "support@gemprocurement.in" },
              { label: "Phone", value: "+91 98765 43210" },
              { label: "Average Response", value: "< 2 hours" },
              { label: "Issue Queue", value: "12 open tickets" },
            ]}
          />
        );
      case "dashboard":
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-box">
            <Shield size={22} />
          </div>

          <div>
            <h2>GeM Procurement</h2>
            <p>PORTAL</p>
          </div>
        </div>

        <nav className="sidebar-menu">
          {navigationItems.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href="#"
              className={activeSection === id ? "active" : ""}
              onClick={(event) => {
                event.preventDefault();
                setActiveSection(id);
              }}
            >
              <Icon size={17} />
              <span>{label}</span>
            </a>
          ))}
        </nav>

        <div className="user-section">
          <div className="user-info">
            <div className="user-avatar">
              <User size={17} />
            </div>

            <div>
              <strong>Shweta Beelwal</strong>
              <small>User</small>
            </div>
          </div>

          <button type="button" className="signout" onClick={onLogout}>
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <strong>GeM Procurement</strong>
            <span>/</span>
            <span>{navigationItems.find((item) => item.id === activeSection)?.label || "Dashboard"}</span>
          </div>

          <div className="profile">
            <span className="notification">♧</span>

            <div className="profile-avatar">
              <img src={profileImage} alt="Profile" />
            </div>

            <strong>Shweta Beelwal</strong>
            <span>⌄</span>
          </div>
        </header>

        <section className="content">{renderContent()}</section>
      </main>
    </div>
  );
}

export default Home;