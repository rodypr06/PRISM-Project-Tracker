// Use environment variable
// Empty string means relative URLs (for production with reverse proxy)
// Or explicit URL for development
const API_URL = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : (window.location.protocol === 'https:' ? '' : 'http://localhost:5000');

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error || 'Request failed', response.status);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error. Please check your connection.', 0);
  }
}

// Auth API
export const authAPI = {
  login: (credentials) =>
    fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  logout: () =>
    fetchAPI('/api/auth/logout', {
      method: 'POST',
    }),

  me: () => fetchAPI('/api/auth/me'),

  changePassword: (passwords) =>
    fetchAPI('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwords),
    }),
};

// Admin API
export const adminAPI = {
  // Clients
  getClients: () => fetchAPI('/api/admin/clients'),

  createClient: (clientData) =>
    fetchAPI('/api/admin/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    }),

  getClient: (id) => fetchAPI(`/api/admin/clients/${id}`),

  deleteClient: (id) =>
    fetchAPI(`/api/admin/clients/${id}`, {
      method: 'DELETE',
    }),

  // Projects
  getProject: (projectId) => fetchAPI(`/api/admin/projects/${projectId}`),

  // Phases
  createPhase: (phaseData) =>
    fetchAPI('/api/admin/phases', {
      method: 'POST',
      body: JSON.stringify(phaseData),
    }),

  updatePhase: (id, phaseData) =>
    fetchAPI(`/api/admin/phases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(phaseData),
    }),

  deletePhase: (id) =>
    fetchAPI(`/api/admin/phases/${id}`, {
      method: 'DELETE',
    }),

  // Tasks
  createTask: (taskData) =>
    fetchAPI('/api/admin/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),

  updateTask: (id, taskData) =>
    fetchAPI(`/api/admin/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    }),

  deleteTask: (id) =>
    fetchAPI(`/api/admin/tasks/${id}`, {
      method: 'DELETE',
    }),

  reorderTasks: (phaseId, taskIds) =>
    fetchAPI(`/api/admin/tasks/reorder/${phaseId}`, {
      method: 'PUT',
      body: JSON.stringify({ taskIds }),
    }),

  // Updates
  createUpdate: (updateData) =>
    fetchAPI('/api/admin/updates', {
      method: 'POST',
      body: JSON.stringify(updateData),
    }),

  deleteUpdate: (id) =>
    fetchAPI(`/api/admin/updates/${id}`, {
      method: 'DELETE',
    }),
};

// Client API
export const clientAPI = {
  getProject: () => fetchAPI('/api/client/project'),
  getPhase: (id) => fetchAPI(`/api/client/phases/${id}`),
  getTask: (id) => fetchAPI(`/api/client/tasks/${id}`),
};

// Comments API
export const commentsAPI = {
  createComment: (commentData) =>
    fetchAPI('/api/comments', {
      method: 'POST',
      body: JSON.stringify(commentData),
    }),

  getTaskComments: (taskId) => fetchAPI(`/api/comments/task/${taskId}`),

  getPhaseComments: (phaseId) => fetchAPI(`/api/comments/phase/${phaseId}`),

  deleteComment: (id) =>
    fetchAPI(`/api/comments/${id}`, {
      method: 'DELETE',
    }),
};

// Notes API
export const notesAPI = {
  getProjectNotes: (projectId) => fetchAPI(`/api/notes/project/${projectId}`),

  createNote: (noteData) =>
    fetchAPI('/api/notes', {
      method: 'POST',
      body: JSON.stringify(noteData),
    }),

  updateNote: (id, noteData) =>
    fetchAPI(`/api/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(noteData),
    }),

  deleteNote: (id) =>
    fetchAPI(`/api/notes/${id}`, {
      method: 'DELETE',
    }),

  uploadAttachment: async (noteId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_URL}/api/notes/${noteId}/attachments`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error || 'Upload failed', response.status);
    }

    return data;
  },

  downloadAttachment: (attachmentId) => {
    window.open(`${API_URL}/api/notes/attachments/${attachmentId}`, '_blank');
  },

  deleteAttachment: (attachmentId) =>
    fetchAPI(`/api/notes/attachments/${attachmentId}`, {
      method: 'DELETE',
    }),
};

export { ApiError };
