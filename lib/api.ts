const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
