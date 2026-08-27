function DocumentUploadPage() {
  return (
    <>
      <h1>Document Upload</h1>
      <p className="subtitle">
        Upload mandatory compliance files and supporting documents for your GeM applications.
      </p>

      <div className="section-panel">
        <div className="upload-box">
          <div className="upload-icon">☁</div>
          <div>
            <h3>Upload new documents</h3>
            <p>Drag and drop files here or select from your device.</p>
          </div>
        </div>

        <div className="upload-grid">
          <div className="upload-card">
            <span className="status-pill pending">Pending</span>
            <h4>GST Certificate</h4>
            <p>Uploaded 2 days ago</p>
          </div>

          <div className="upload-card">
            <span className="status-pill verified">Verified</span>
            <h4>MSME Registration</h4>
            <p>Validated by compliance team</p>
          </div>

          <div className="upload-card">
            <span className="status-pill review">Review</span>
            <h4>Bank Details</h4>
            <p>Awaiting final approval</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default DocumentUploadPage;