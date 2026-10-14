const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('studentfund_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : `${API_BASE}/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // If not on login page, handle auth expiration
    if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      // Token expired or invalid
      // localStorage.removeItem('studentfund_token');
    }
  }

  // Handle file downloads / non-JSON responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    if (!response.ok) {
      throw new ApiError('Failed to download report', response.status);
    }
    return (await response.text()) as any;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error || 'Network request failed', response.status, data.details);
  }

  return data as T;
}
