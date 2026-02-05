import { StoredApplication, ApplicationStatus } from "./types";

const STORAGE_KEY = "counterpart_applications";

// Normalize application data to ensure all required fields have defaults
function normalizeApplication(app: any): StoredApplication {
  return {
    ...app,
    questions: app.questions ?? [],
    answers: app.answers ?? [],
    coverages: app.coverages ?? [],
  };
}

export function saveApplication(application: StoredApplication): void {
  try {
    const applications = getAllApplications();
    const existingIndex = applications.findIndex(
      (app) => app.account_id === application.account_id
    );

    if (existingIndex >= 0) {
      applications[existingIndex] = {
        ...application,
        updated_at: new Date().toISOString(),
      };
    } else {
      applications.push({
        ...application,
        created_at: application.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  } catch (error) {
    console.error("Failed to save application:", error);
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      throw new Error("Storage quota exceeded. Please clear some applications.");
    }
    throw error;
  }
}

export function getApplication(accountId: string): StoredApplication | null {
  try {
    const applications = getAllApplications();
    const app = applications.find((app) => app.account_id === accountId);
    return app ? normalizeApplication(app) : null;
  } catch (error) {
    console.error("Failed to get application:", error);
    return null;
  }
}

export function getAllApplications(): StoredApplication[] {
  try {
    if (typeof window === "undefined") {
      return [];
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const applications = JSON.parse(stored) as StoredApplication[];
    if (!Array.isArray(applications)) {
      return [];
    }
    
    // Normalize all applications to ensure they have required fields
    return applications.map(normalizeApplication);
  } catch (error) {
    console.error("Failed to get all applications:", error);
    return [];
  }
}

export function deleteApplication(accountId: string): boolean {
  try {
    const applications = getAllApplications();
    const filtered = applications.filter(
      (app) => app.account_id !== accountId
    );

    if (filtered.length === applications.length) {
      return false; // Application not found
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to delete application:", error);
    return false;
  }
}

export function clearAllApplications(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear applications:", error);
  }
}

export function updateApplicationStatus(
  accountId: string,
  status: ApplicationStatus,
  submittedAt?: string
): boolean {
  try {
    const application = getApplication(accountId);
    if (!application) {
      return false;
    }

    saveApplication({
      ...application,
      status,
      submitted_at: submittedAt || application.submitted_at,
      updated_at: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("Failed to update application status:", error);
    return false;
  }
}
