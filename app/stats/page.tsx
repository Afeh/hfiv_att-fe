"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPersonStats, PersonStats } from "../../lib/api";

export default function StatsPage() {
  const [stats, setStats] = useState<PersonStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPersonStats()
      .then(setStats)
      .catch(() => setError("Couldn't load attendance stats."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="page">
      <header className="header">
        <span className="eyebrow">Overview</span>
        <h1>Attendance Summary</h1>
      </header>

      <nav className="nav-links">
        <Link href="/" className="nav-link">
          ← Back to Check-In
        </Link>
      </nav>

      {loading && <p className="empty">Loading…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && stats.length === 0 && (
        <p className="empty">No people registered yet.</p>
      )}

      {!loading && !error && stats.length > 0 && (
        <div className="stats-table-wrapper">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Name</th>
                <th className="num">Total</th>
                <th className="num">Present</th>
                <th className="num">Missed</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.name}>
                  <td className="stat-name">{s.name}</td>
                  <td className="num stat-total">{s.total_possible}</td>
                  <td className="num stat-present">{s.total_attendance}</td>
                  <td className="num stat-missed">{s.missed_attendance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
