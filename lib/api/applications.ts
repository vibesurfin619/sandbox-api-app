import { StoredApplication, ApplicationStatus, QuoteResponse } from "../types";

export async function getAllApplications(): Promise<StoredApplication[]> {
  const res = await fetch("/api/applications");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to fetch applications");
  }
  return res.json();
}

export async function getApplication(
  accountId: string
): Promise<StoredApplication | null> {
  const res = await fetch(`/api/applications/${accountId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch application");
  return res.json();
}

export async function saveApplication(
  application: StoredApplication
): Promise<void> {
  const res = await fetch("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(application),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to save application");
  }
}

export async function deleteApplication(
  accountId: string
): Promise<boolean> {
  const res = await fetch(`/api/applications/${accountId}`, {
    method: "DELETE",
  });
  if (!res.ok) return false;
  return true;
}

export async function updateApplicationStatus(
  accountId: string,
  status: ApplicationStatus,
  submittedAt?: string
): Promise<boolean> {
  const res = await fetch(`/api/applications/${accountId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, submittedAt }),
  });
  if (!res.ok) return false;
  return true;
}

export async function getLocalQuote(
  accountId: string
): Promise<QuoteResponse | null> {
  const res = await fetch(`/api/applications/${accountId}/quote`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.result === "PENDING" && !data.quote) return null;
  return data as QuoteResponse;
}

export async function saveWebhookResponse(
  accountId: string,
  data: object
): Promise<void> {
  const res = await fetch(`/api/applications/${accountId}/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to save webhook response");
  }
}
