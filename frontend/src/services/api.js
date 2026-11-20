// frontend/src/services/api.js
// Centralized API Client for Primordial Backend Communication

const API_BASE = '/api';

/**
 * Universal fetch wrapper that handles credentials (cookies), JSON headers, and error parsing
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
    credentials: 'include', // Crucial for session-based cookie persistence!
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Authentication
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me', { method: 'GET' }),

  // Challenges (CRUD)
  getPublicChallenges: () => request('/challenges', { method: 'GET' }),
  getChallengeById: (id) => request(`/challenges/${id}`, { method: 'GET' }),
  createChallenge: (body) => request('/challenges', { method: 'POST', body }),
  updateChallenge: (id, body) => request(`/challenges/${id}`, { method: 'PUT', body }),
  deleteChallenge: (id) => request(`/challenges/${id}`, { method: 'DELETE' }),
  getUserCreatedChallenges: () => request('/challenges/user/created', { method: 'GET' }),

  // Memberships (Join, Leave, List)
  joinChallenge: (challengeId) => request(`/challenges/${challengeId}/join`, { method: 'POST' }),
  leaveChallenge: (challengeId) => request(`/challenges/${challengeId}/leave`, { method: 'POST' }),
  joinPrivateChallenge: (inviteCode) => request('/challenges/join-private', { method: 'POST', body: { inviteCode } }),
  getChallengeMembers: (challengeId) => request(`/challenges/${challengeId}/members`, { method: 'GET' }),
  getUserJoinedChallenges: () => request('/users/me/challenges', { method: 'GET' }),

  // Check-ins & Streak Freeze
  submitCheckIn: (challengeId, note) => 
    request(`/challenges/${challengeId}/checkins`, { 
      method: 'POST', 
      body: { note } 
    }),
  getChallengeCheckIns: (challengeId) => request(`/challenges/${challengeId}/checkins`, { method: 'GET' }),
  getUserCheckIns: (challengeId) => request(`/users/me/checkins${challengeId ? `?challengeId=${challengeId}` : ''}`, { method: 'GET' }),
  useStreakFreeze: (challengeId, date) => request(`/challenges/${challengeId}/streak-freeze`, { method: 'POST', body: { date } }),
  getStreakFreezes: (challengeId) => request(`/challenges/${challengeId}/streak-freeze`, { method: 'GET' }),

  // Leaderboard
  getLeaderboard: (challengeId) => request(`/challenges/${challengeId}/leaderboard`, { method: 'GET' }),

  // Dashboard & History
  getDashboardStats: () => request('/users/me/dashboard', { method: 'GET' }),
  getUserHistory: () => request('/users/me/history', { method: 'GET' }),

  // Group Chat (MongoDB)
  getMessages: (challengeId) => request(`/challenges/${challengeId}/messages`, { method: 'GET' }),
  sendMessage: (challengeId, message) => request(`/challenges/${challengeId}/messages`, { method: 'POST', body: { message } }),
  deleteMessage: (messageId) => request(`/messages/${messageId}`, { method: 'DELETE' }),
};
