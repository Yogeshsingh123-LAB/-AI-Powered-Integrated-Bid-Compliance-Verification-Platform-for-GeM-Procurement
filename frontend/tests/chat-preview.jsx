// Development-only component harness. Vite's production entry does not import this file.
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "../src/index.css";
import "../src/App.css";
import Chatbot from "../src/components/Chatbot";

function Preview() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  async function signIn(staff) {
    setUser(null);
    try {
      // Fixed loopback target: these fixture credentials must never go to a configured live API.
      const response = await fetch("http://127.0.0.1:8011/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: staff ? "support@example.com" : "applicant@example.com", password: staff ? "Preview!8Support" : "Preview!8Applicant" }),
      });
      if (!response.ok) throw new Error("Start backend/tests/chat_preview.py first.");
      const data = await response.json();
      localStorage.setItem("gem_token", data.access_token);
      setUser(staff ? "ADMIN" : "BIDDER");
    } catch (err) { setError(err.message); }
  }
  return <main style={{ fontFamily: "system-ui", padding: 24 }}>
    <h1>Isolated MyGeM preview</h1><p>Synthetic data only. Tender ID: PREVIEW-2026. Select Preview applicant, then Track bid.</p>
    <button onClick={() => setUser("Guest")}>Preview assistant design</button>{" "}
    <button onClick={() => signIn(false)}>Preview applicant</button>{" "}<button onClick={() => signIn(true)}>Preview support administrator</button>
    {error && <p role="alert">{error}</p>}
    {user && <Chatbot key={user} userRole={user} isSupportAdmin={user === "ADMIN"} />}
  </main>;
}
createRoot(document.getElementById("root")).render(<Preview />);
