"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Category,
  Pledge,
  getCategories,
  getPledges,
  createPledge,
  updatePledge,
  deletePledge,
  addContribution,
  deleteContribution,
  fulfillInKind,
  quickDonate,
} from "../../../../lib/api";

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export default function CategoryPage() {
  const params = useParams();
  const categoryId = Number(params.id);

  const [category, setCategory] = useState<Category | null>(null);
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add pledge form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newItem, setNewItem] = useState("");
  const [newIsInKind, setNewIsInKind] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit pledge state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editItem, setEditItem] = useState("");
  const [editNote, setEditNote] = useState("");

  // Contribution form
  const [contribPledgeId, setContribPledgeId] = useState<number | null>(null);
  const [contribAmount, setContribAmount] = useState("");
  const [contribDate, setContribDate] = useState(todayISO());
  const [contribNote, setContribNote] = useState("");

  // Quick donate form (walk-in donations)
  const [showQuickDonate, setShowQuickDonate] = useState(false);
  const [qdName, setQdName] = useState("");
  const [qdAmount, setQdAmount] = useState("");
  const [qdDate, setQdDate] = useState(todayISO());
  const [qdNote, setQdNote] = useState("");

  const currencySymbol = category ? "₦" : "₦"; // fallback

  const load = useCallback(async () => {
    try {
      const [cats, plgs] = await Promise.all([
        getCategories(),
        getPledges(categoryId),
      ]);
      setCategory(cats.find((c) => c.id === categoryId) || null);
      setPledges(plgs);
    } catch {
      setError("Couldn't load category data.");
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddPledge(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createPledge({
        category_id: categoryId,
        person_name: newName.trim(),
        pledged_amount: newIsInKind ? null : newAmount ? Number(newAmount) : null,
        pledged_item: newIsInKind ? newItem.trim() || null : null,
        is_in_kind: newIsInKind,
        note: newNote.trim() || null,
      });
      setNewName("");
      setNewAmount("");
      setNewItem("");
      setNewIsInKind(false);
      setNewNote("");
      setShowAddForm(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add pledge.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePledge(id: number) {
    if (!confirm("Delete this pledge?")) return;
    try {
      await deletePledge(id);
      load();
    } catch {
      setError("Failed to delete pledge.");
    }
  }

  function startEdit(p: Pledge) {
    setEditingId(p.id);
    setEditName(p.person_name);
    setEditAmount(p.pledged_amount?.toString() || "");
    setEditItem(p.pledged_item || "");
    setEditNote(p.note || "");
  }

  async function saveEdit() {
    if (editingId === null) return;
    setSaving(true);
    try {
      await updatePledge(editingId, {
        person_name: editName.trim(),
        pledged_amount: editAmount ? Number(editAmount) : null,
        pledged_item: editItem.trim() || null,
        note: editNote.trim() || null,
      });
      setEditingId(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update pledge.");
    } finally {
      setSaving(false);
    }
  }

  async function handleFulfill(id: number) {
    try {
      await fulfillInKind(id);
      load();
    } catch {
      setError("Failed to toggle fulfillment.");
    }
  }

  async function handleAddContribution(e: React.FormEvent) {
    e.preventDefault();
    if (contribPledgeId === null || !contribAmount) return;
    setSaving(true);
    setError(null);
    try {
      await addContribution(contribPledgeId, {
        amount: Number(contribAmount),
        date_paid: contribDate,
        note: contribNote.trim() || null,
      });
      setContribPledgeId(null);
      setContribAmount("");
      setContribDate(todayISO());
      setContribNote("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add contribution.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteContribution(id: number) {
    if (!confirm("Delete this contribution?")) return;
    try {
      await deleteContribution(id);
      load();
    } catch {
      setError("Failed to delete contribution.");
    }
  }

  async function handleQuickDonate(e: React.FormEvent) {
    e.preventDefault();
    if (!qdName.trim() || !qdAmount) return;
    setSaving(true);
    setError(null);
    try {
      await quickDonate({
        category_id: categoryId,
        person_name: qdName.trim(),
        amount: Number(qdAmount),
        date_paid: qdDate,
        note: qdNote.trim() || null,
      });
      setQdName("");
      setQdAmount("");
      setQdDate(todayISO());
      setQdNote("");
      setShowQuickDonate(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to record donation.");
    } finally {
      setSaving(false);
    }
  }

  // Separate cash and in-kind pledges
  const cashPledges = pledges.filter((p) => !p.is_in_kind);
  const inKindPledges = pledges.filter((p) => p.is_in_kind);

  if (loading) {
    return (
      <main className="page">
        <header className="header">
          <span className="eyebrow">Contribution Tracker</span>
          <h1>Loading…</h1>
        </header>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="header">
        <div className="header-row">
          <div>
            <span className="eyebrow">Contribution Tracker</span>
            <h1>{category?.name || "Category"}</h1>
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

      {/* Action Buttons */}
      {!showAddForm && !showQuickDonate && (
        <div className="ct-action-group">
          <button
            type="button"
            className="ct-btn ct-btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            + Add Pledge
          </button>
          <button
            type="button"
            className="ct-btn ct-btn-accent"
            onClick={() => setShowQuickDonate(true)}
          >
            ⚡ Quick Donate
          </button>
        </div>
      )}

      {/* Add Pledge Form */}
      {showAddForm && (
        <section className="ct-section ct-form-section">
          <div className="ct-section-heading">New Pledge</div>
          <form onSubmit={handleAddPledge} className="ct-form">
            <label className="ct-label">
              Name
              <input
                className="ct-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                autoFocus
              />
            </label>
            <label className="ct-checkbox-label">
              <input
                type="checkbox"
                checked={newIsInKind}
                onChange={(e) => setNewIsInKind(e.target.checked)}
              />
              In-kind pledge (item, not cash)
            </label>
            {!newIsInKind && (
              <label className="ct-label">
                Amount
                <input
                  className="ct-input"
                  type="number"
                  min="0"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                />
              </label>
            )}
            {newIsInKind && (
              <label className="ct-label">
                Item description
                <input
                  className="ct-input"
                  placeholder="e.g. 1 pack of drinks"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                />
              </label>
            )}
            <label className="ct-label">
              Note (optional)
              <input
                className="ct-input"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
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
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Quick Donate Form */}
      {showQuickDonate && (
        <section className="ct-section ct-form-section ct-quick-donate">
          <div className="ct-section-heading">⚡ Quick Donate</div>
          <p className="ct-section-sub">
            For walk-in donations — creates a pledge and records payment in one step
          </p>
          <form onSubmit={handleQuickDonate} className="ct-form">
            <label className="ct-label">
              Name
              <input
                className="ct-input"
                value={qdName}
                onChange={(e) => setQdName(e.target.value)}
                required
                autoFocus
                placeholder="Person's name"
              />
            </label>
            <label className="ct-label">
              Amount
              <input
                className="ct-input"
                type="number"
                min="1"
                value={qdAmount}
                onChange={(e) => setQdAmount(e.target.value)}
                required
              />
            </label>
            <label className="ct-label">
              Date
              <input
                className="ct-input"
                type="date"
                value={qdDate}
                onChange={(e) => setQdDate(e.target.value)}
                required
              />
            </label>
            <label className="ct-label">
              Note (optional)
              <input
                className="ct-input"
                value={qdNote}
                onChange={(e) => setQdNote(e.target.value)}
              />
            </label>
            <div className="ct-form-actions">
              <button
                type="submit"
                className="ct-btn ct-btn-primary"
                disabled={saving || !qdName.trim() || !qdAmount}
              >
                {saving ? "Saving…" : "Record Donation"}
              </button>
              <button
                type="button"
                className="ct-btn ct-btn-secondary"
                onClick={() => setShowQuickDonate(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Cash Pledges Table */}
      {cashPledges.length > 0 && (
        <section className="ct-section">
          <div className="ct-section-heading">
            Cash Pledges ({cashPledges.length})
          </div>
          <div className="ct-table-wrapper">
            <table className="ct-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th className="ct-th-num">Pledged</th>
                  <th className="ct-th-num">Paid</th>
                  <th className="ct-th-num">Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cashPledges.map((p) => (
                  <tr key={p.id}>
                    <td className="ct-td-name">
                      {editingId === p.id ? (
                        <input
                          className="ct-input-inline"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      ) : (
                        <span className="ct-name-text">{p.person_name}</span>
                      )}
                    </td>
                    <td className="ct-td-num">
                      {editingId === p.id ? (
                        <input
                          className="ct-input-inline ct-input-num"
                          type="number"
                          min="0"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                        />
                      ) : (
                        <span>{currencySymbol}{p.pledged_amount?.toLocaleString() || "—"}</span>
                      )}
                    </td>
                    <td className="ct-td-num ct-td-paid">
                      {currencySymbol}{p.total_contributed.toLocaleString()}
                    </td>
                    <td className="ct-td-num ct-td-balance">
                      {(p.balance ?? 0) > 0 ? (
                        <span className="ct-balance-owed">
                          {currencySymbol}{p.balance!.toLocaleString()}
                        </span>
                      ) : (
                        <span className="ct-balance-done">✓</span>
                      )}
                    </td>
                    <td className="ct-td-actions">
                      {editingId === p.id ? (
                        <div className="ct-action-group">
                          <button
                            type="button"
                            className="ct-btn-sm ct-btn-primary"
                            onClick={saveEdit}
                            disabled={saving}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="ct-btn-sm ct-btn-secondary"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="ct-action-group">
                          {(p.balance ?? 0) > 0 && (
                            <button
                              type="button"
                              className="ct-btn-sm ct-btn-accent"
                              onClick={() => {
                                setContribPledgeId(p.id);
                                setContribAmount("");
                                setContribDate(todayISO());
                                setContribNote("");
                              }}
                            >
                              + Pay
                            </button>
                          )}
                          <button
                            type="button"
                            className="ct-btn-sm ct-btn-secondary"
                            onClick={() => startEdit(p)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="ct-btn-sm ct-btn-danger"
                            onClick={() => handleDeletePledge(p.id)}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* In-Kind Pledges */}
      {inKindPledges.length > 0 && (
        <section className="ct-section">
          <div className="ct-section-heading">
            In-Kind Pledges ({inKindPledges.length})
          </div>
          <div className="ct-list">
            {inKindPledges.map((p) => (
              <div key={p.id} className="ct-list-row ct-inkind-row">
                <div className="ct-list-info">
                  <span className="ct-list-name">{p.person_name}</span>
                  {p.pledged_item && (
                    <span className="ct-list-sub">{p.pledged_item}</span>
                  )}
                </div>
                <div className="ct-action-group">
                  <button
                    type="button"
                    className={`ct-btn-sm ${p.in_kind_fulfilled ? "ct-btn-fulfilled" : "ct-btn-accent"}`}
                    onClick={() => handleFulfill(p.id)}
                  >
                    {p.in_kind_fulfilled ? "✓ Fulfilled" : "Mark Fulfilled"}
                  </button>
                  <button
                    type="button"
                    className="ct-btn-sm ct-btn-secondary"
                    onClick={() => startEdit(p)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ct-btn-sm ct-btn-danger"
                    onClick={() => handleDeletePledge(p.id)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {pledges.length === 0 && (
        <p className="empty">No pledges yet. Add one to get started.</p>
      )}

      {/* Add Contribution Modal */}
      {contribPledgeId !== null && (
        <div className="ct-modal-overlay" onClick={() => setContribPledgeId(null)}>
          <div
            className="ct-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ct-section-heading">Log Contribution</div>
            <form onSubmit={handleAddContribution} className="ct-form">
              <label className="ct-label">
                Amount
                <input
                  className="ct-input"
                  type="number"
                  min="1"
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  required
                  autoFocus
                />
              </label>
              <label className="ct-label">
                Date Paid
                <input
                  className="ct-input"
                  type="date"
                  value={contribDate}
                  onChange={(e) => setContribDate(e.target.value)}
                  required
                />
              </label>
              <label className="ct-label">
                Note (optional)
                <input
                  className="ct-input"
                  value={contribNote}
                  onChange={(e) => setContribNote(e.target.value)}
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
                  onClick={() => setContribPledgeId(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
