function StatusPage() {
  return (
    <>
      <h1>Status Tracker</h1>
      <p className="subtitle">
        Monitor the current status of your submitted applications and required milestones.
      </p>

      <div className="section-panel">
        <div className="status-list">
          <div className="status-row">
            <div>
              <strong>GEM-APP-2024-001</strong>
              <small>GeM Registration Assistance</small>
            </div>
            <span className="status verified">Verified</span>
          </div>

          <div className="status-row">
            <div>
              <strong>GEM-APP-2024-002</strong>
              <small>MSME Registration</small>
            </div>
            <span className="status review">Under Review</span>
          </div>

          <div className="status-row">
            <div>
              <strong>GEM-APP-2024-003</strong>
              <small>Tender Compliance</small>
            </div>
            <span className="status pending">Pending</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default StatusPage;