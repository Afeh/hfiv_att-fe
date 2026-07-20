"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AttendanceRecord,
  Person,
  createPerson,
  getAllPeople,
  getAttendance,
  markAttendance,
  removeAttendance,
  searchPeople,
} from "../lib/api";

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function Page() {
  const [date, setDate] = useState(todayISO());
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Person[]>([]);
  const [checkedIn, setCheckedIn] = useState<AttendanceRecord[]>([]);
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState<Set<number>>(new Set());
  const [removing, setRemoving] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const checkedInIds = useMemo(
    () => new Set(checkedIn.map((r) => r.person.id)),
    [checkedIn]
  );

  useEffect(() => {
    refreshAttendance(date);
    refreshAllPeople();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const trimmed = query.trim();
      if (trimmed.length > 0) {
        searchPeople(trimmed)
          .then(setMatches)
          .catch(() => setMatches([]));
      } else {
        setMatches([]);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  async function refreshAttendance(forDate: string) {
    try {
      const records = await getAttendance(forDate);
      setCheckedIn(records);
    } catch {
      setError("Couldn't load this day's list.");
    }
  }

  async function refreshAllPeople() {
    try {
      const people = await getAllPeople();
      setAllPeople(people);
    } catch {
      // silently fail — the main attendance already loaded
    }
  }

  async function handleCheckIn(person: Person) {
    setError(null);
    setCheckingIn((prev) => new Set(prev).add(person.id));
    try {
      await markAttendance(person.id, date);
      setQuery("");
      setMatches([]);
      refreshAttendance(date);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setCheckingIn((prev) => {
        const next = new Set(prev);
        next.delete(person.id);
        return next;
      });
    }
  }

  async function handleAddNew() {
    const name = query.trim();
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      const person = await createPerson(name);
      await handleCheckIn(person);
    } catch {
      setError("Couldn't add that person.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(record: AttendanceRecord) {
    setError(null);
    setRemoving((prev) => new Set(prev).add(record.id));
    try {
      await removeAttendance(record.id);
      refreshAttendance(date);
    } catch {
      setError("Couldn't remove that entry.");
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(record.id);
        return next;
      });
    }
  }

  const trimmedQuery = query.trim();
  const exactMatch = matches.some(
    (m) => m.name.toLowerCase() === trimmedQuery.toLowerCase()
  );

  return (
    <main className="page">
      <header className="header">
        <div className="header-row">
          <div>
            <span className="eyebrow">Weekend Check-In</span>
            <h1>{dayLabel(date)}</h1>
          </div>
          <Link href="/stats" className="nav-icon-link" title="View attendance stats">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="M7 16l4-8 4 4 4-6" />
            </svg>
          </Link>
        </div>
        <input
          type="date"
          className="date-input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </header>

      <section className="search-panel">
        <input
          className="search-input"
          placeholder="Type a name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        {trimmedQuery.length > 0 && (
          <ul className="results">
            {matches
              .filter((m) => !checkedInIds.has(m.id))
              .map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="result-row"
                    onClick={() => handleCheckIn(m)}
                    disabled={checkingIn.has(m.id)}
                  >
                    {checkingIn.has(m.id) ? `${m.name}…` : m.name}
                  </button>
                </li>
              ))}
            {!exactMatch && (
              <li>
                <button
                  type="button"
                  className="result-row add-new"
                  onClick={handleAddNew}
                  disabled={loading}
                >
                  + Add &ldquo;{trimmedQuery}&rdquo;
                </button>
              </li>
            )}
          </ul>
        )}
      </section>

      {error && <p className="error">{error}</p>}

      <section className="roster">
        <div className="roster-heading">
          <span>Present</span>
          <span className="count">{checkedIn.length}</span>
        </div>
        {checkedIn.length === 0 ? (
          <p className="empty">No one checked in yet.</p>
        ) : (
          <ul className="roster-list">
            {checkedIn.map((r) => (
              <li key={r.id} className="roster-row">
                <span className="stamp" aria-hidden="true">
                  ✓
                </span>
                <span className="name">{r.person.name}</span>
                <button
                  type="button"
                  className="remove"
                  onClick={() => handleRemove(r)}
                  disabled={removing.has(r.id)}
                  aria-label={`Remove ${r.person.name}`}
                >
                  {removing.has(r.id) ? "…" : "×"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="roster others">
        <div className="roster-heading">
          <span>Not Checked In</span>
          <span className="count">{allPeople.length - checkedIn.length}</span>
        </div>
        {allPeople.length === 0 ? null : allPeople.filter((p) => !checkedInIds.has(p.id))
            .length === 0 ? (
          <p className="empty">Everyone is checked in!</p>
        ) : (
          <ul className="roster-list">
            {allPeople
              .filter((p) => !checkedInIds.has(p.id))
              .map((p) => (
                <li key={p.id} className="roster-row">
                  <span className="name">{p.name}</span>
                  <button
                    type="button"
                    className="check-in-btn"
                    onClick={() => handleCheckIn(p)}
                    disabled={checkingIn.has(p.id)}
                  >
                    {checkingIn.has(p.id) ? "Checking…" : "Check In"}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </section>
    </main>
  );
}
