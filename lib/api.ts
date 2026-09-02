const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ═══════════════════════════════════════════════════════════════════
// Attendance types & API
// ═══════════════════════════════════════════════════════════════════

export type Person = {
  id: number;
  name: string;
  created_at: string;
};

export type AttendanceRecord = {
  id: number;
  date: string;
  is_absent: boolean;
  person: Person;
};

export async function searchPeople(query: string): Promise<Person[]> {
  const res = await fetch(`${API_URL}/people?search=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Failed to search people");
  return res.json();
}

export async function getAllPeople(): Promise<Person[]> {
  const res = await fetch(`${API_URL}/people`);
  if (!res.ok) throw new Error("Failed to load people");
  return res.json();
}

export async function createPerson(name: string): Promise<Person> {
  const res = await fetch(`${API_URL}/people`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to add person");
  return res.json();
}

export async function getAttendance(date: string): Promise<AttendanceRecord[]> {
  const res = await fetch(`${API_URL}/attendance?date=${date}`);
  if (!res.ok) throw new Error("Failed to load attendance");
  return res.json();
}

export async function markAttendance(
  personId: number,
  date: string,
  isAbsent: boolean = false
): Promise<AttendanceRecord> {
  const res = await fetch(`${API_URL}/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ person_id: personId, attendance_date: date, is_absent: isAbsent }),
  });
  if (!res.ok) {
    if (res.status === 409) throw new Error("Already checked in for this date");
    throw new Error("Failed to mark attendance");
  }
  return res.json();
}

export async function toggleAttendance(attendanceId: number): Promise<AttendanceRecord> {
  const res = await fetch(`${API_URL}/attendance/${attendanceId}/toggle`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to toggle attendance");
  return res.json();
}

export async function removeAttendance(attendanceId: number): Promise<void> {
  const res = await fetch(`${API_URL}/attendance/${attendanceId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to remove entry");
}

export type PersonStats = {
  name: string;
  id: number;
  total_possible: number;
  total_attendance: number;
  missed_attendance: number;
};

export async function getPersonStats(): Promise<PersonStats[]> {
  const res = await fetch(`${API_URL}/people/stats`);
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json();
}

export async function updatePersonName(personId: number, name: string): Promise<Person> {
  const res = await fetch(`${API_URL}/people/${personId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to update name");
  return res.json();
}

export async function verifyPin(pin: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/auth/verify-pin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  return res.ok;
}

// ═══════════════════════════════════════════════════════════════════
// Contribution Tracker types & API
// ═══════════════════════════════════════════════════════════════════

export type GroupSettings = {
  id: number;
  group_name: string;
  currency_symbol: string;
  override_goal_amount: number | null;
};

export type Category = {
  id: number;
  name: string;
  override_goal_amount: number | null;
};

export type Pledge = {
  id: number;
  category_id: number;
  person_name: string;
  pledged_amount: number | null;
  pledged_item: string | null;
  is_in_kind: boolean;
  in_kind_fulfilled: boolean;
  note: string | null;
  total_contributed: number;
  balance: number | null;
};

export type Contribution = {
  id: number;
  pledge_id: number;
  amount: number;
  date_paid: string;
  note: string | null;
};

export type CategorySummary = {
  id: number;
  name: string;
  total_pledged: number;
  total_contributed: number;
  goal_amount: number;
  pct_complete: number;
  in_kind_total: number;
  in_kind_fulfilled: number;
  pledge_count: number;
};

export type TopContributor = {
  person_name: string;
  total_contributed: number;
};

export type OutstandingPledger = {
  pledge_id: number;
  person_name: string;
  category_name: string;
  pledged_amount: number;
  total_contributed: number;
  balance: number;
};

export type Summary = {
  group_name: string;
  currency_symbol: string;
  total_pledged: number;
  total_contributed: number;
  goal_amount: number;
  pct_complete: number;
  categories: CategorySummary[];
  top_contributors: TopContributor[];
  outstanding_pledgers: OutstandingPledger[];
  in_kind_total: number;
  in_kind_fulfilled: number;
};

async function ctFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/ct${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// -- Settings --
export async function getGroupSettings(): Promise<GroupSettings> {
  return ctFetch<GroupSettings>("/settings");
}

export async function updateGroupSettings(data: {
  group_name?: string;
  currency_symbol?: string;
  override_goal_amount?: number | null;
}): Promise<GroupSettings> {
  return ctFetch<GroupSettings>("/settings", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// -- Categories --
export async function getCategories(): Promise<Category[]> {
  return ctFetch<Category[]>("/categories");
}

export async function createCategory(data: {
  name: string;
  override_goal_amount?: number | null;
}): Promise<Category> {
  return ctFetch<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(
  id: number,
  data: { name?: string; override_goal_amount?: number | null }
): Promise<Category> {
  return ctFetch<Category>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: number): Promise<void> {
  return ctFetch<void>(`/categories/${id}`, { method: "DELETE" });
}

// -- Pledges --
export async function getPledges(categoryId?: number): Promise<Pledge[]> {
  const qs = categoryId !== undefined ? `?category_id=${categoryId}` : "";
  return ctFetch<Pledge[]>(`/pledges${qs}`);
}

export async function createPledge(data: {
  category_id: number;
  person_name: string;
  pledged_amount?: number | null;
  pledged_item?: string | null;
  is_in_kind?: boolean;
  note?: string | null;
}): Promise<Pledge> {
  return ctFetch<Pledge>("/pledges", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePledge(
  id: number,
  data: {
    person_name?: string;
    pledged_amount?: number | null;
    pledged_item?: string | null;
    is_in_kind?: boolean;
    note?: string | null;
  }
): Promise<Pledge> {
  return ctFetch<Pledge>(`/pledges/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deletePledge(id: number): Promise<void> {
  return ctFetch<void>(`/pledges/${id}`, { method: "DELETE" });
}

export async function fulfillInKind(id: number): Promise<Pledge> {
  return ctFetch<Pledge>(`/pledges/${id}/fulfill`, { method: "PATCH" });
}

// -- Contributions --
export async function addContribution(
  pledgeId: number,
  data: { amount: number; date_paid: string; note?: string | null }
): Promise<Contribution> {
  return ctFetch<Contribution>(`/pledges/${pledgeId}/contributions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteContribution(id: number): Promise<void> {
  return ctFetch<void>(`/contributions/${id}`, { method: "DELETE" });
}

// -- Quick Donate (walk-in donations) --
export type QuickDonateResponse = {
  pledge: Pledge;
  contribution: Contribution;
};

export async function quickDonate(data: {
  category_id: number;
  person_name: string;
  amount: number;
  date_paid: string;
  note?: string | null;
}): Promise<QuickDonateResponse> {
  return ctFetch<QuickDonateResponse>("/quick-donate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// -- Summary --
export async function getSummary(): Promise<Summary> {
  return ctFetch<Summary>("/summary");
}
