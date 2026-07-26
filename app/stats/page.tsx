"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getPersonStats, PersonStats, updatePersonName } from "../../lib/api";

export default function StatsPage() {
  const [stats, setStats] = useState<PersonStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await getPersonStats();
      setStats(data);
    } catch {
      setError("Couldn't load attendance stats.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (editingId !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  function startEdit(stat: PersonStats) {
    setEditingId(stat.id);
    setEditValue(stat.name);
  }

  async function saveEdit() {
    if (editingId === null) return;
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === stats.find((s) => s.id === editingId)?.name) {
      setEditingId(null);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updatePersonName(editingId, trimmed);
      await loadStats();
    } catch {
      setError("Couldn't update name.");
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
  }

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
                <tr key={s.id}>
                  <td className="stat-name">
                    {editingId === s.id ? (
                      <form
                        className="inline-edit-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          saveEdit();
                        }}
                      >
                        <input
                          ref={inputRef}
                          className="inline-edit-input"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => !saving && saveEdit()}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") cancelEdit();
                          }}
                          disabled={saving}
                        />
                      </form>
                    ) : (
                      <button
                        type="button"
                        className="name-edit-btn"
                        onClick={() => startEdit(s)}
                        title="Edit name"
                      >
                        <span className="name-text">{s.name}</span>
                        <svg
                          className="edit-icon"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    )}
                  </td>
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
