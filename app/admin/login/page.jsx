"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("");

    const next =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next") || "/admin"
        : "/admin";

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setStatus(data.message || "Invalid password.");
        return;
      }

      // ✅ NEW: session-only auth (clears when tab closes)
      sessionStorage.setItem("admin-auth", "true");

      window.location.href = next;
    } catch {
      setStatus("Network error.");
    }
  }

  return (
    <div style={{ padding: 30, fontFamily: "Arial" }}>
      <h1>Admin Login</h1>

      <form
        onSubmit={onSubmit}
        autoComplete="off"
        style={{ marginTop: 16, maxWidth: 420 }}
        >
        <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
            Password
        </label>

        <input
            type="password"
            name="admin_password_no_autofill"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
            width: "100%",
            padding: 10,
            border: "2px solid gray",
            fontSize: 14,
            }}
        />

        <button
            type="submit"
            style={{
            marginTop: 12,
            padding: "10px 14px",
            border: "2px solid black",
            cursor: "pointer",
            fontWeight: "bold",
            }}
        >
            Log in
        </button>

        {status ? (
            <div style={{ marginTop: 12, color: "#c04b4b", fontWeight: "bold" }}>
            {status}
            </div>
        ) : null}
        </form>

    </div>
  );
}
