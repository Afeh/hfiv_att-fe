"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Contributor,
  Summary,
  getContributors,
  getExpenditures,
  getSummary,
} from "../../../lib/api";
import { exportContributionsPdf } from "../../../lib/pdf";

export default function ContributorsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([getSummary(), getContributors()]);
      setSummary(s);
      setContributors(c);
    } catch {
      setError("Couldn't load contributors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      // Pull fresh figures so the PDF always matches the tracker
      const [s, c, e] = await Promise.all([
        getSummary(),
        getContributors(),
        getExpenditures(),
      ]);
      exportContributionsPdf({ summary: s, contributors: c, expenditures: e });
    } catch {
      setError("Couldn't build the PDF. Try again.");
    } finally {
      setExporting(false);
    }
  }

  const fmt = (n: number) =>
    `${summary?.currency_symbol ?? ""}${n.toLocaleString()}`;

  if (loading) {
    return (
      <main className="page">
        <header className="header">
          <span className="eyebrow">Contribution Tracker</span>
          <h1>Contributors</h1>
        </header>
        <p className="empty">Loading…</p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="header">
        <div className="header-row">
          <div>
            <span className="eyebrow">Contribution Tracker</span>
            <h1>Contributors</h1>
          </div>
          <Link href="/contributions" className="nav-icon-link" title="Dashboard">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </Link>
        </div>
      </header>

      <nav className="nav-links">
        <Link href="/contributions" className="nav-link">
          ← Dashboard
        </Link>
      </nav>

      {error && <p className="error">{error}</p>}

      {summary && (
        <section className="ct-section">
          <div className="ct-overall-card">
            <div className="ct-overall-numbers">
              <span className="ct-big-number">
                {fmt(summary.total_contributed)}
              </span>
              <span className="ct-of-label">
                from {contributors.length}{" "}
                {contributors.length === 1 ? "contributor" : "contributors"}
              </span>
            </div>
            <div className="ct-meta-row">
              <span>{fmt(summary.total_expenditure)} spent</span>
              <span>{fmt(summary.remaining_amount)} remaining</span>
            </div>
          </div>
          <button
            type="button"
            className="ct-btn ct-btn-primary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "Building PDF…" : "⬇ Export PDF"}
          </button>
        </section>
      )}

      <section className="ct-section">
        <div className="ct-section-heading">
          All Contributors ({contributors.length})
        </div>
        {contributors.length === 0 ? (
          <p className="empty">
            No contributions recorded yet. Record a payment in a category to
            see contributors here.
          </p>
        ) : (
          <div className="ct-list">
            {contributors.map((contributor, index) => (
              <div key={contributor.person_name} className="ct-list-row">
                <span className="ct-list-rank">{index + 1}</span>
                <div className="ct-list-info">
                  <span className="ct-list-name">{contributor.person_name}</span>
                  <span className="ct-list-sub">
                    {contributor.contribution_count}{" "}
                    {contributor.contribution_count === 1
                      ? "payment"
                      : "payments"}
                    {contributor.category_names.length > 0 &&
                      ` · ${contributor.category_names.join(", ")}`}
                  </span>
                </div>
                <span className="ct-list-value">
                  {fmt(contributor.total_contributed)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
