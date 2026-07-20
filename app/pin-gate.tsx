"use client";

import { useState } from "react";
import { verifyPin } from "../lib/api";

export function PinGate({ children }: { children: React.ReactNode }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("attendance_unlocked") === "true";
    }
    return false;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const ok = await verifyPin(pin);
      if (ok) {
        sessionStorage.setItem("attendance_unlocked", "true");
        setUnlocked(true);
      } else {
        setError(true);
        setPin("");
      }
    } catch {
      setError(true);
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  if (unlocked) return <>{children}</>;

  return (
    <main className="pin-page">
      <div className="pin-card">
        <div className="pin-lock-icon" aria-hidden="true">🔒</div>
        <h1 className="pin-title">Access Required</h1>
        <p className="pin-subtitle">Enter the PIN to continue</p>

        <form onSubmit={handleSubmit} className="pin-form">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            pattern="[0-9]{4}"
            autoFocus
            className="pin-input"
            placeholder="••••"
            value={pin}
            onChange={(e) => {
              setError(false);
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
            }}
          />
          {error && <p className="pin-error">Incorrect PIN. Try again.</p>}
          <button type="submit" className="pin-submit" disabled={pin.length < 4 || loading}>
            {loading ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    </main>
  );
}
