// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// Helper to get auth token
const getToken = (type: 'agent' | 'admin' | 'msme') => {
  if (typeof window === 'undefined') return null;
  
  // MSME tokens are stored in sessionStorage
  if (type === 'msme') {
    return sessionStorage.getItem('msme_auth_token');
  }
  
  const token = localStorage.getItem(`${type}_token`);
  console.log(`Retrieved ${type}_token:`, token ? `exists (length: ${token.length})` : 'not found');
  console.log(`Token preview:`, token ? `${token.substring(0, 20)}...` : 'none');
  return token;
};

// Generic fetch wrapper
async function fetchApi(
  endpoint: string,
  options: RequestInit = {},
  tokenType: 'agent' | 'admin' | 'msme' = 'msme'
) {
  const token = getToken(tokenType);
  
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const requestOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(options.headers as Record<string, string> || {}),
    },
  };

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, requestOptions);

    if (response.status === 401) {
      console.error('401 Unauthorized - clearing invalid token');
      // Clear invalid token
      if (tokenType === 'msme') {
        sessionStorage.removeItem('msme_auth_token');
      } else {
        localStorage.removeItem(`${tokenType}_token`);
      }
      // Don't redirect - let the calling code handle it
      throw new Error('Invalid token');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('API call failed:', error);
    throw error;
  }
}

// ==================== AGENT AUTH APIs ====================

export const agentAuthApi = {
  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    region: string;
    expertise: string[];
    availability?: string;
    certifications?: string[];
    gender?: string;
  }) => fetchApi('/api/agent-auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }, 'msme'),
  
  login: (email: string, password: string) => fetchApi('/api/agent-auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, 'agent'),
  
  getProfile: () => fetchApi('/api/agent-auth/profile', {}, 'agent'),
  
  updateProfile: (data: any) => fetchApi('/api/agent-auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }, 'agent'),
  
  changePassword: (currentPassword: string, newPassword: string) => fetchApi('/api/agent-auth/change-password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  }, 'agent'),
};

// ==================== ADMIN AUTH APIs ====================

export const adminAuthApi = {
  login: (email: string, password: string) => fetchApi('/api/admin-auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, 'admin'),
  
  getProfile: () => fetchApi('/api/admin-auth/profile', {}, 'admin'),
  
  getDashboardStats: () => fetchApi('/api/admin-auth/dashboard/stats', {}, 'admin'),
  
  getPendingAgents: () => fetchApi('/api/admin-auth/agents/pending', {}, 'admin'),
  
  getAllAgents: (params?: { status?: string; approvalStatus?: string }) => {
    const query = new URLSearchParams(params || {}).toString();
    return fetchApi(`/api/admin-auth/agents?${query}`, {}, 'admin');
  },
  
  approveAgent: (agentId: string, action: 'APPROVE' | 'REJECT', rejectionReason?: string) => fetchApi(`/api/admin-auth/agents/${agentId}/approve`, {
    method: 'PUT',
    body: JSON.stringify({ action, rejectionReason }),
  }, 'admin'),
  
  updateAgentStatus: (agentId: string, action: string, reason?: string) => fetchApi(`/api/admin-auth/agents/${agentId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ action, reason }),
  }, 'admin'),
};

// ==================== CASE APIs ====================

export const casesApi = {
  // MSME endpoints
  createCase: (data: {
    msmeUserId: number;
    schemeId: string;
    schemeName?: string;
    applicationData?: any;
  }) => fetchApi('/api/cases/internal/create-from-application', {
    method: 'POST',
    body: JSON.stringify(data),
  }, 'msme'),

  getMsmeCases: (msmeUserId?: number, status?: string) => {
    const params = new URLSearchParams();
    if (msmeUserId) params.append('msmeUserId', msmeUserId.toString());
    if (status) params.append('status', status);
    const query = params.toString();
    return fetchApi(`/api/cases/msme/my-cases${query ? '?' + query : ''}`, {}, 'msme');
  },

  getMsmeCaseDetails: (caseId: string, msmeUserId: number) => fetchApi(`/api/cases/msme/${caseId}?msmeUserId=${msmeUserId}`, {}, 'msme'),

  deleteCase: (caseId: string, msmeUserId: number) => fetchApi(`/api/cases/msme/${caseId}?msmeUserId=${msmeUserId}`, {
    method: 'DELETE',
  }, 'msme'),

  // Agent endpoints
  getAgentCases: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return fetchApi(`/api/cases/agent/my-cases${query}`, {}, 'agent');
  },
  
  getAgentCaseDetails: (caseId: string) => fetchApi(`/api/cases/agent/${caseId}`, {}, 'agent'),
  
  updateCaseStatus: (caseId: string, status: string, notes?: string) => fetchApi(`/api/cases/agent/${caseId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, notes }),
  }, 'agent'),
  
  addCaseNote: (caseId: string, agentNotes: string) => fetchApi(`/api/cases/agent/${caseId}/notes`, {
    method: 'PUT',
    body: JSON.stringify({ agentNotes, noteType: 'AGENT' }),
  }, 'agent'),
  
  closeCase: (caseId: string, closureReason: string, closureNotes?: string) => fetchApi(`/api/cases/agent/${caseId}/close`, {
    method: 'PUT',
    body: JSON.stringify({ closureReason, closureNotes }),
  }, 'agent'),
  
  getAgentCaseHistory: () => fetchApi('/api/cases/agent/history', {}, 'agent'),

  // ── Document upload (multipart — bypasses the JSON fetchApi wrapper) ───────
  uploadCaseDocument: async (caseId: string, file: File, documentTag?: string): Promise<any> => {
    const token = getToken('agent');
    const formData = new FormData();
    formData.append('file', file);
    if (documentTag) formData.append('documentTag', documentTag);

    const response = await fetch(`${API_BASE_URL}/api/cases/agent/${caseId}/documents`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (response.status === 401) throw new Error('Invalid token');
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.message || `Upload failed: ${response.status}`);
    }
    return response.json();
  },

  getCaseDocuments: (caseId: string) =>
    fetchApi(`/api/cases/agent/${caseId}/documents`, {}, 'agent'),

  logContactMSME: (caseId: string, method: string, notes?: string) =>
    fetchApi(`/api/cases/agent/${caseId}/contact`, {
      method: 'PUT',
      body: JSON.stringify({ method, notes }),
    }, 'agent'),

  // ── Document requests (agent) ──────────────────────────────────────────────
  createDocumentRequest: (caseId: string, documentName: string, description?: string) =>
    fetchApi(`/api/cases/agent/${caseId}/document-requests`, {
      method: 'POST',
      body: JSON.stringify({ documentName, description }),
    }, 'agent'),

  getDocumentRequests: (caseId: string) =>
    fetchApi(`/api/cases/agent/${caseId}/document-requests`, {}, 'agent'),

  // ── Document requests (MSME) ───────────────────────────────────────────────
  getMsmeDocumentRequests: (msmeUserId: number) =>
    fetchApi(`/api/cases/msme/document-requests?msmeUserId=${msmeUserId}`, {}, 'msme'),

  fulfillDocumentRequest: async (requestId: string, msmeUserId: number, file: File): Promise<any> => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('msme_auth_token') : null;
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${API_BASE_URL}/api/cases/msme/document-requests/${requestId}/upload?msmeUserId=${msmeUserId}`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      },
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.message || `Upload failed: ${response.status}`);
    }
    return response.json();
  },

  // Admin endpoints
  getAllCases: (filters?: { status?: string; agentId?: string; priority?: string }) => {
    const query = new URLSearchParams(filters || {}).toString();
    return fetchApi(`/api/cases?${query}`, {}, 'admin');
  },
  
  getAdminCaseDetails: (caseId: string) => fetchApi(`/api/cases/admin/${caseId}`, {}, 'admin'),
  
  assignCase: (caseId: string, agentId: number, notes?: string) => fetchApi(`/api/cases/${caseId}/assign`, {
    method: 'PUT',
    body: JSON.stringify({ agentId, notes }),
  }, 'admin'),
  
  reassignCase: (caseId: string, newAgentId: number, reason?: string) => fetchApi(`/api/cases/${caseId}/reassign`, {
    method: 'PUT',
    body: JSON.stringify({ newAgentId, reason }),
  }, 'admin'),
  
  updateCaseStatusAdmin: (caseId: string, status: string, notes?: string) => fetchApi(`/api/cases/${caseId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, notes }),
  }, 'admin'),
  
  addAdminNote: (caseId: string, adminNotes: string, msmeNotes?: string) => fetchApi(`/api/cases/${caseId}/notes/admin`, {
    method: 'PUT',
    body: JSON.stringify({ adminNotes, msmeNotes, noteType: 'ADMIN' }),
  }, 'admin'),

  // Eligibility check with caching
  checkEligibility: (schemeId: string, msmeUserId: number, completedTasks?: string[]) => fetchApi('/api/schemes/eligibility-check', {
    method: 'POST',
    body: JSON.stringify({ schemeId, msmeUserId, completedTasks }),
  }, 'msme'),

  completeEligibilityTask: (schemeId: string, msmeUserId: number, taskId: string) => fetchApi('/api/schemes/eligibility-check/complete-task', {
    method: 'POST',
    body: JSON.stringify({ schemeId, msmeUserId, taskId }),
  }, 'msme'),

  updateProfileField: (msmeUserId: number, field: string, value: any) => fetchApi('/api/schemes/eligibility-check/update-profile', {
    method: 'POST',
    body: JSON.stringify({ msmeUserId, field, value }),
  }, 'msme'),
};

export { API_BASE_URL, getToken };
