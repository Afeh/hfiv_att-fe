"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Category,
  Expenditure,
  Summary,
  createExpenditure,
  deleteExpenditure,
  getCategories,
  getContributors,
  getExpenditures,
  getSummary,
  updateExpenditure,
} from "../../../lib/api";
import { exportContributionsPdf } from "../../../lib/pdf";

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export default function ExpenditurePage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Add / edit form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dateSpent, setDateSpent] = useState(todayISO());
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, e, c] = await Promise.all([
        getSummary(),
        getExpenditures(),
        getCategories(),
      ]);
      setSummary(s);
      setExpenditures(e);
      setCategories(c);
    } catch {
      setError("Couldn't load expenditure data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fmt = (n: number) =>
    `${summary?.currency_symbol ?? ""}${n.toLocaleString()}`;

  function resetForm() {
    setEditingId(null);
    setDescription("");
    setAmount("");
    setDateSpent(todayISO());
    setCategoryId("");
    setNote("");
    setShowForm(false);
  }

  function startEdit(item: Expenditure) {
    setEditingId(item.id);
    setDescription(item.description);
    setAmount(item.amount.toString());
    setDateSpent(item.date_spent);
    setCategoryId(item.category_id ? item.category_id.toString() : "");
    setNote(item.note ?? "");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !amount) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        description: description.trim(),
        amount: Number(amount),
        date_spent: dateSpent,
        category_id: categoryId ? Number(categoryId) : null,
        note: note.trim() || null,
      };
      if (editingId !== null) {
        await updateExpenditure(editingId, payload);
      } else {
        await createExpenditure(payload);
      }
      resetForm();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save expenditure.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: Expenditure) {
    if (!confirm(`Delete "${item.description}"?`)) return;
    try {
      await deleteExpenditure(item.id);
      if (editingId === item.id) resetForm();
      load();
    } catch {
      setError("Failed to delete expenditure.");
    }
  }

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
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

  if (loading) {
    return (
      <main className="page">
        <header className="header">
          <span className="eyebrow">Contribution Tracker</span>
          <h1>Expenditure</h1>
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
            <h1>Expenditure</h1>
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
                {fmt(summary.total_expenditure)}
              </span>
              <span className="ct-of-label">spent</span>
            </div>
            <div className="ct-meta-row">
              <span>{fmt(summary.total_contributed)} contributed</span>
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

      {!showForm && (
        <div className="ct-action-group">
          <button
            type="button"
            className="ct-btn ct-btn-accent"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + Add Expenditure
          </button>
        </div>
      )}

      {showForm && (
        <section className="ct-section ct-form-section">
          <div className="ct-section-heading">
            {editingId !== null ? "Edit Expenditure" : "New Expenditure"}
          </div>
          <form onSubmit={handleSubmit} className="ct-form">
            <label className="ct-label">
              Description
              <input
                className="ct-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Hall rental"
                required
                autoFocus
              />
            </label>
            <label className="ct-label">
              Amount
              <input
                className="ct-input"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>
            <label className="ct-label">
              Date spent
              <input
                className="ct-input"
                type="date"
                value={dateSpent}
                onChange={(e) => setDateSpent(e.target.value)}
                required
              />
            </label>
            <label className="ct-label">
              Category (optional)
              <select
                className="ct-input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="ct-label">
              Note (optional)
              <input
                className="ct-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <div className="ct-form-actions">
              <button
                type="submit"
                className="ct-btn ct-btn-primary"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                className="ct-btn ct-btn-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="ct-section">
        <div className="ct-section-heading">
          Expenses ({expenditures.length})
        </div>
        {expenditures.length === 0 ? (
          <p className="empty">No expenditure recorded yet.</p>
        ) : (
          <div className="ct-list">
            {expenditures.map((item) => (
              <div key={item.id} className="ct-list-row ct-expense-row">
                <div className="ct-list-info">
                  <span className="ct-list-name">{item.description}</span>
                  <span className="ct-list-sub">
                    {item.date_spent}
                    {item.category_name && ` · ${item.category_name}`}
                    {item.note && ` · ${item.note}`}
                  </span>
                </div>
                <div className="ct-list-amounts">
                  <span className="ct-list-spent">{fmt(item.amount)}</span>
                  <div className="ct-action-group">
                    <button
                      type="button"
                      className="ct-btn-sm ct-btn-secondary"
                      onClick={() => startEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="ct-btn-sm ct-btn-danger"
                      onClick={() => handleDelete(item)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
