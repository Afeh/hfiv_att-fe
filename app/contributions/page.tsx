"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Summary, getSummary } from "../../lib/api";

function ProgressBar({
  pct,
  color,
}: {
  pct: number;
  color?: "accent" | "muted";
}) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="ct-progress-track">
      <div
        className={`ct-progress-fill ${color === "muted" ? "ct-progress-muted" : ""}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export default function ContributionsDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getSummary();
      setSummary(data);
    } catch {
      setError("Couldn't load contribution data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <main className="page">
        <header className="header">
          <span className="eyebrow">Contribution Tracker</span>
          <h1>Dashboard</h1>
        </header>
        <p className="empty">Loading…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <header className="header">
          <span className="eyebrow">Contribution Tracker</span>
          <h1>Dashboard</h1>
        </header>
        <p className="error">{error}</p>
        <nav className="nav-links">
          <Link href="/" className="nav-link">
            ← Home
          </Link>
        </nav>
      </main>
    );
  }

  if (!summary) return null;

  const fmt = (n: number) => `${summary.currency_symbol}${n.toLocaleString()}`;

  return (
    <main className="page">
      <header className="header">
        <div className="header-row">
          <div>
            <span className="eyebrow">Contribution Tracker</span>
            <h1>{summary.group_name}</h1>
          </div>
          <div className="ct-header-actions">
            <Link
              href="/contributions/settings"
              className="nav-icon-link"
              title="Settings"
            >
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
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
            <Link href="/" className="nav-icon-link" title="Home">
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
        </div>
      </header>

      {/* Overall Progress */}
      <section className="ct-section">
        <div className="ct-section-heading">Overall Progress</div>
        <div className="ct-overall-card">
          <div className="ct-overall-numbers">
            <span className="ct-big-number">{fmt(summary.total_contributed)}</span>
            <span className="ct-of-label">
              of {fmt(summary.goal_amount)} goal
            </span>
          </div>
          <ProgressBar pct={summary.pct_complete} />
          <div className="ct-pct-label">{summary.pct_complete}% complete</div>
          <div className="ct-meta-row">
            <span>{fmt(summary.total_pledged)} pledged</span>
            <span>
              {summary.in_kind_fulfilled}/{summary.in_kind_total} in-kind fulfilled
            </span>
          </div>
        </div>
      </section>

      {/* Categories */}
      {summary.categories.length > 0 && (
        <section className="ct-section">
          <div className="ct-section-heading">Categories</div>
          <div className="ct-category-list">
            {summary.categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/contributions/category/${cat.id}`}
                className="ct-category-card"
              >
                <div className="ct-cat-header">
                  <span className="ct-cat-name">{cat.name}</span>
                  <span className="ct-cat-pct">{cat.pct_complete}%</span>
                </div>
                <ProgressBar pct={cat.pct_complete} />
                <div className="ct-cat-details">
                  <span>
                    {fmt(cat.total_contributed)} / {fmt(cat.goal_amount)}
                  </span>
                  <span>{cat.pledge_count} pledges</span>
                </div>
                {cat.in_kind_total > 0 && (
                  <div className="ct-cat-in-kind">
                    In-kind: {cat.in_kind_fulfilled}/{cat.in_kind_total} fulfilled
                  </div>
                )}
              </Link>
            ))}
          </div>
          <Link href="/contributions/settings" className="ct-add-category-link">
            + Add Category
          </Link>
        </section>
      )}

      {/* Top Contributors */}
      {summary.top_contributors.length > 0 && (
        <section className="ct-section">
          <div className="ct-section-heading">Top Contributors</div>
          <div className="ct-list">
            {summary.top_contributors.map((tc, i) => (
              <div key={tc.person_name} className="ct-list-row">
                <span className="ct-list-rank">{i + 1}</span>
                <span className="ct-list-name">{tc.person_name}</span>
                <span className="ct-list-value">
                  {fmt(tc.total_contributed)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Outstanding Pledgers */}
      {summary.outstanding_pledgers.length > 0 && (
        <section className="ct-section">
          <div className="ct-section-heading">Outstanding Pledgers</div>
          <p className="ct-section-sub">
            Follow up with these people for remaining balances
          </p>
          <div className="ct-list">
            {summary.outstanding_pledgers.map((op) => (
              <div key={op.pledge_id} className="ct-list-row">
                <div className="ct-list-info">
                  <span className="ct-list-name">{op.person_name}</span>
                  <span className="ct-list-sub">{op.category_name}</span>
                </div>
                <div className="ct-list-amounts">
                  <span className="ct-list-owed">
                    {fmt(op.balance)} owed
                  </span>
                  <span className="ct-list-sub">
                    {fmt(op.total_contributed)} / {fmt(op.pledged_amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {summary.categories.length === 0 && (
        <section className="ct-section">
          <p className="empty">
            No categories yet.{" "}
            <Link href="/contributions/settings">Create one in Settings</Link> to
            get started.
          </p>
        </section>
      )}
    </main>
  );
}
