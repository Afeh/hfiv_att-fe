"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  GroupSettings,
  Category,
  getGroupSettings,
  updateGroupSettings,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../../lib/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState<GroupSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit settings
  const [groupName, setGroupName] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("");
  const [overrideGoal, setOverrideGoal] = useState("");

  // New category
  const [newCatName, setNewCatName] = useState("");
  const [newCatGoal, setNewCatGoal] = useState("");
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatGoal, setEditCatGoal] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([getGroupSettings(), getCategories()]);
      setSettings(s);
      setCategories(c);
      setGroupName(s.group_name);
      setCurrencySymbol(s.currency_symbol);
      setOverrideGoal(s.override_goal_amount?.toString() || "");
    } catch {
      setError("Couldn't load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateGroupSettings({
        group_name: groupName.trim(),
        currency_symbol: currencySymbol.trim() || "₦",
        override_goal_amount: overrideGoal ? Number(overrideGoal) : null,
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSaving(true);
    try {
      await createCategory({
        name: newCatName.trim(),
        override_goal_amount: newCatGoal ? Number(newCatGoal) : undefined,
      });
      setNewCatName("");
      setNewCatGoal("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory(id: number, name: string) {
    if (!confirm(`Delete category "${name}"? This will also delete all pledges in it.`)) return;
    try {
      await deleteCategory(id);
      load();
    } catch {
      setError("Failed to delete category.");
    }
  }

  function startEditCat(cat: Category) {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatGoal(cat.override_goal_amount?.toString() || "");
  }

  async function saveEditCat() {
    if (editingCatId === null) return;
    setSaving(true);
    try {
      await updateCategory(editingCatId, {
        name: editCatName.trim(),
        override_goal_amount: editCatGoal ? Number(editCatGoal) : null,
      });
      setEditingCatId(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update category.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="page">
        <header className="header">
          <span className="eyebrow">Contribution Tracker</span>
          <h1>Settings</h1>
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
            <h1>Settings</h1>
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

      {/* Group Settings */}
      <section className="ct-section">
        <div className="ct-section-heading">Group Settings</div>
        <form onSubmit={handleSaveSettings} className="ct-form">
          <label className="ct-label">
            Group Name
            <input
              className="ct-input"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </label>
          <label className="ct-label">
            Currency Symbol
            <input
              className="ct-input"
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              maxLength={3}
              required
            />
          </label>
          <label className="ct-label">
            Override Goal (optional)
            <input
              className="ct-input"
              type="number"
              min="0"
              placeholder="Leave empty to use sum of pledges"
              value={overrideGoal}
              onChange={(e) => setOverrideGoal(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="ct-btn ct-btn-primary"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </form>
      </section>

      {/* Categories */}
      <section className="ct-section">
        <div className="ct-section-heading">Categories</div>

        {categories.length > 0 && (
          <div className="ct-settings-list">
            {categories.map((cat) => (
              <div key={cat.id} className="ct-settings-row">
                {editingCatId === cat.id ? (
                  <div className="ct-settings-edit">
                    <input
                      className="ct-input-inline"
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                    />
                    <input
                      className="ct-input-inline ct-input-num"
                      type="number"
                      min="0"
                      placeholder="Goal"
                      value={editCatGoal}
                      onChange={(e) => setEditCatGoal(e.target.value)}
                    />
                    <div className="ct-action-group">
                      <button
                        type="button"
                        className="ct-btn-sm ct-btn-primary"
                        onClick={saveEditCat}
                        disabled={saving}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="ct-btn-sm ct-btn-secondary"
                        onClick={() => setEditingCatId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="ct-settings-info">
                      <span className="ct-settings-name">{cat.name}</span>
                      {cat.override_goal_amount && (
                        <span className="ct-settings-goal">
                          Goal: ₦{cat.override_goal_amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="ct-action-group">
                      <Link
                        href={`/contributions/category/${cat.id}`}
                        className="ct-btn-sm ct-btn-secondary"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        className="ct-btn-sm ct-btn-secondary"
                        onClick={() => startEditCat(cat)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="ct-btn-sm ct-btn-danger"
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      >
                        ×
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddCategory} className="ct-form ct-add-form">
          <div className="ct-form-row">
            <input
              className="ct-input"
              placeholder="New category name"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              required
            />
            <input
              className="ct-input ct-input-short"
              type="number"
              min="0"
              placeholder="Goal"
              value={newCatGoal}
              onChange={(e) => setNewCatGoal(e.target.value)}
            />
            <button
              type="submit"
              className="ct-btn ct-btn-primary"
              disabled={saving || !newCatName.trim()}
            >
              Add
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
