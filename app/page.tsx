"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page landing-page">
      <header className="header landing-header">
        <span className="eyebrow">HFIV</span>
        <h1>Welcome</h1>
      </header>

      <div className="landing-cards">
        <Link href="/attendance" className="landing-card">
          <div className="landing-card-icon">📋</div>
          <h2 className="landing-card-title">Attendance</h2>
          <p className="landing-card-desc">
            Track who&apos;s present and absent at each gathering
          </p>
        </Link>

        <Link href="/contributions" className="landing-card">
          <div className="landing-card-icon">💰</div>
          <h2 className="landing-card-title">Contributions</h2>
          <p className="landing-card-desc">
            Track pledges, payments, and progress toward goals
          </p>
        </Link>
      </div>
    </main>
  );
}
