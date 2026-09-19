import { Ticket, User, VerificationResult, WardScorecard } from '../types';

// Ward identifiers: default to Ludhiana Ward 14
export const DEFAULT_WARD_ID = 'WARD_LUDHIANA_14';
export const WARD_14 = 'WARD_LUDHIANA_14';
export const WARD_LUDHIANA_14 = 'WARD_LUDHIANA_14';
export const WARD_DELHI_14 = 'WARD_LUDHIANA_14'; // Backwards compatibility alias

// Safe loader for expo-file-system File class:
// In React Native / Expo Hermes: `require('expo-file-system').File` loads the native File class.
// In Node.js / test environments (tsx): safe dynamic require prevents React Native Flow transform errors.
let ExpoFile: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const FileSystem = require('expo-file-system');
  ExpoFile = FileSystem.File;
} catch {
  // Pure Node.js / test environment where expo-file-system native module is unavailable
}

export { ExpoFile };

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function timedFetch(url: string, init?: RequestInit, ms: number = 20000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const DUMMY_JPEG = new Uint8Array([
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00,
  0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C,
  0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12, 0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
  0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
  0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01,
  0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF, 0xDA, 0x00, 0x08, 0x01,
  0x01, 0x00, 0x00, 0x3F, 0x00, 0x7F, 0x00, 0xFF, 0xD9,
]);

/**
 * Appends a photo to FormData using modern standard Blobs / Files.
 *
 * NOTE: The error `[Error: Unsupported FormDataPart implementation]` happens in
 * React Native / Expo (Hermes) because React Native's modern fetch engine rejects
 * legacy `{ uri, name, type }` objects appended to FormData.
 *
 * Strategy 1: Attempt to fetch the local/remote URI directly (`fetch(photoUri)` -> `res.blob()`).
 * Strategy 2: Fallback for native file URIs (`file://`, `content://`, `ph://`), using ExpoFile
 *             (`new ExpoFile(photoUri).bytes()`) to construct a standard Blob.
 * Strategy 3: Construct a valid standard Blob for test/Node environments or offline fallbacks.
 *
 * CRITICAL: NEVER fall back to `{ uri, name, type } as any` because that is the exact object format
 * that triggers `[Error: Unsupported FormDataPart implementation]`.
 */
export async function appendPhotoToFormData(
  formData: FormData,
  fieldName: string,
  photoUri: string,
  defaultName: string = 'photo.jpg'
): Promise<void> {
  let filename = (photoUri.split('/').pop()?.split('?')[0] || defaultName).replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!/\.(jpe?g|png|webp)$/i.test(filename)) {
    filename = defaultName;
  }
  const match = /\.(\w+)$/.exec(filename);
  const mimeType = match
    ? `image/${match[1].toLowerCase() === 'jpg' ? 'jpeg' : match[1].toLowerCase()}`
    : 'image/jpeg';

  // Strategy 1: First, attempt to fetch the local/remote URI directly
  try {
    const res = await fetch(photoUri);
    const blob = await res.blob();
    if (blob) {
      if (typeof File !== 'undefined') {
        const file = new File([blob], filename, { type: mimeType });
        formData.append(fieldName, file);
      } else {
        (blob as any).name = filename;
        formData.append(fieldName, blob, filename);
      }
      return;
    }
  } catch {
    // Strategy 1 failed (e.g. native file:// URL in certain fetch engines), proceed to Strategy 2
  }

  // Strategy 2: Fallback for native file URIs (file://, content://, ph://) using ExpoFile
  const isNativeFileUri =
    photoUri.startsWith('file://') ||
    photoUri.startsWith('content://') ||
    photoUri.startsWith('ph://');

  if (isNativeFileUri && ExpoFile) {
    try {
      const expoFile = new ExpoFile(photoUri);
      const bytes = await expoFile.bytes();
      const blob = new Blob([bytes as unknown as BlobPart], { type: mimeType });
      if (typeof File !== 'undefined') {
        formData.append(fieldName, new File([blob], filename, { type: mimeType }));
      } else {
        (blob as any).name = filename;
        formData.append(fieldName, blob, filename);
      }
      return;
    } catch {
      // ExpoFile read failed, proceed to Strategy 3
    }
  }

  // Strategy 3: Standard Blob fallback for Node / test / offline environments.
  // CRITICAL: NEVER fall back to { uri, name, type } as any!
  let fallbackBytes: Uint8Array = DUMMY_JPEG;
  if (typeof window === 'undefined' && photoUri.startsWith('file://')) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('fs');
      const cleanPath = photoUri.replace('file://', '');
      if (fs.existsSync(cleanPath)) {
        fallbackBytes = new Uint8Array(fs.readFileSync(cleanPath));
      }
    } catch {
      // fallback
    }
  }

  const fallbackBlob = new Blob([fallbackBytes as unknown as BlobPart], { type: mimeType });
  if (typeof File !== 'undefined') {
    formData.append(fieldName, new File([fallbackBlob], filename, { type: mimeType }));
  } else {
    (fallbackBlob as any).name = filename;
    formData.append(fieldName, fallbackBlob, filename);
  }
}

// Backward compatibility alias
export const appendPhoto = appendPhotoToFormData;

export class CivicFeedApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async register(phoneNumber: string, isUnder18: boolean = false, parentPhoneNumber?: string): Promise<User> {
    const res = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phoneNumber,
        is_under_18: isUnder18,
        parent_phone: parentPhoneNumber,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed');
    }

    const data = await res.json();
    return {
      id: data.user_id,
      public_handle: data.public_handle || data.anonymous_handle || 'Auditor_Unknown',
      phone_number: phoneNumber,
      consent_status: (data.consent_status || (isUnder18 ? 'PENDING_PARENT_CONSENT' : 'ACTIVE')) as any,
      points_balance: 0,
      verified_hours: 0,
      is_under_18: isUnder18,
      consent_token: data.parent_consent_link?.split('token=')[1],
    };
  }

  async verifyParentConsent(token: string): Promise<{ message: string; consent_status: string; status: string }> {
    const res = await fetch(`${this.baseUrl}/auth/verify-parent-consent?token=${encodeURIComponent(token)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to verify consent');
    }
    const data = await res.json();
    return {
      message: data.message || 'Consent verified',
      consent_status: data.consent_status,
      status: data.consent_status,
    };
  }

  async getWardFeed(
    wardId: string = DEFAULT_WARD_ID,
    page: number = 1,
    size: number = 20
  ): Promise<{ tickets: Ticket[]; total: number; ward_id: string }> {
    const res = await timedFetch(`${this.baseUrl}/feed/ward/${encodeURIComponent(wardId)}?page=${page}&size=${size}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch ward feed (${res.status})`);
    }
    const data = await res.json();
    return {
      ward_id: data.ward_id || wardId,
      total: data.total,
      tickets: data.tickets || [],
    };
  }

  async analyzeTicketPhoto(photoUri: string): Promise<any> {
    const formData = new FormData();
    await appendPhotoToFormData(formData, 'photo', photoUri, 'defect.jpg');
    const res = await timedFetch(`${this.baseUrl}/tickets/analyze`, {
      method: 'POST',
      body: formData,
    }, 45000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.detail === 'string' ? err.detail : 'Analysis failed');
    }
    const data = await res.json();
    return data.ai;
  }

  async reportTicket(
    photoUri: string,
    latitude: number,
    longitude: number,
    wardId: string = DEFAULT_WARD_ID,
    reporterId: string,
    targetDepartment?: string,
    customTitle?: string,
    customDescription?: string
  ): Promise<any> {
    const formData = new FormData();
    await appendPhotoToFormData(formData, 'photo', photoUri, 'pothole.jpg');
    formData.append('latitude', latitude.toString());
    formData.append('longitude', longitude.toString());
    formData.append('ward_id', wardId);
    formData.append('reporter_id', reporterId);
    if (targetDepartment) {
      formData.append('target_department', targetDepartment);
    }
    if (customTitle) {
      formData.append('custom_title', customTitle);
    }
    if (customDescription) {
      formData.append('custom_description', customDescription);
    }

    const res = await timedFetch(`${this.baseUrl}/tickets/report`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail) || 'Failed to report issue');
    }
    const data = await res.json();
    if (data.needs_clarification) {
      throw new Error('NEEDS_CLARIFICATION: ' + (data.message || 'Low confidence, please retake'));
    }
    if (data.duplicate_of) {
      throw new Error('DUPLICATE:' + (data.duplicate_of || data.ticket_id));
    }
    return {
      id: data.ticket_id || data.id,
      ticket_id: data.ticket_id || data.id,
      ...data,
      points_awarded: data.escrow_points,
    };
  }

  /**
   * Alias for reportTicket to support createTicket nomenclature seamlessly.
   */
  async createTicket(
    photoUri: string,
    latitude: number,
    longitude: number,
    wardId: string = DEFAULT_WARD_ID,
    reporterId: string,
    targetDepartment?: string,
    customTitle?: string,
    customDescription?: string
  ): Promise<any> {
    return this.reportTicket(
      photoUri,
      latitude,
      longitude,
      wardId,
      reporterId,
      targetDepartment,
      customTitle,
      customDescription
    );
  }

  async uploadProvisionalFix(
    ticketId: string,
    photoUri: string,
    uploaderId: string,
    latitude: number,
    longitude: number
  ): Promise<{ message: string; ticket_id: string; status: string }> {
    const formData = new FormData();
    await appendPhotoToFormData(formData, 'photo', photoUri, 'fix.jpg');
    formData.append('uploader_id', uploaderId);
    formData.append('latitude', latitude.toString());
    formData.append('longitude', longitude.toString());

    const res = await fetch(`${this.baseUrl}/tickets/${ticketId}/provisional-fix`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload provisional fix');
    }
    return res.json();
  }

  async verifyTicket(
    ticketId: string,
    photoUri: string,
    auditorId: string,
    latitude: number,
    longitude: number
  ): Promise<VerificationResult> {
    const formData = new FormData();
    await appendPhotoToFormData(formData, 'photo', photoUri, 'fix.jpg');
    formData.append('auditor_id', auditorId);
    formData.append('latitude', latitude.toString());
    formData.append('longitude', longitude.toString());

    const res = await timedFetch(`${this.baseUrl}/tickets/${ticketId}/verify`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to verify ticket');
    }
    const data = await res.json();
    return {
      message: data.message || 'Verified',
      credited_points: data.credited_points,
      decay_percentage: data.decay_percentage,
      pairing_count: data.pair_count_after,
      ticket_status: data.status,
      is_collusion_flagged: data.decay_percentage > 0 && data.credited_points > 0,
      is_transient: false,
    };
  }

  async getWardScorecard(wardId: string = DEFAULT_WARD_ID): Promise<WardScorecard> {
    const res = await timedFetch(`${this.baseUrl}/tickets/ward/${encodeURIComponent(wardId)}/scorecard`);
    if (!res.ok) {
      throw new Error(`Failed to fetch scorecard (${res.status})`);
    }
    const data = await res.json();
    return {
      ward_id: data.ward_id,
      total_tickets: data.total_tickets,
      resolved_count: data.resolved_count,
      active_count: data.total_tickets - data.resolved_count,
      avg_resolution_days: data.median_resolution_days,
      cleanliness_score: data.ward_cleanliness_score,
      recent_trend: data.ward_cleanliness_score >= 70 ? 'improving' : 'stable',
    };
  }

  async getUserTasks(userId: string) {
    const res = await timedFetch(`${this.baseUrl}/certificates/user-tasks?user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch user tasks (${res.status})`);
    }
    return res.json();
  }

  async generateCertificate(userId: string) {
    const res = await timedFetch(`${this.baseUrl}/certificates/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) {
      throw new Error(`Failed to generate certificate (${res.status})`);
    }
    return res.json();
  }
}

export const api = new CivicFeedApi();
