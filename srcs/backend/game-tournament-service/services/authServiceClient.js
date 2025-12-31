
// API client to communicate with auth-profile Services to update and fetch user info from user table

const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:5002';

export async function updateUserStats(userId, { won, score, opponentScore }) {
  try {
    const response = await fetch(`${PROFILE_SERVICE_URL}/api/profileServ/users/${userId}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ won, score, opponentScore })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user stats');
    }

    return await response.json();
  } catch (err) {
    console.error(`Failed to update stats for user ${userId}:`, err.message);
    // Don't throw - allow game to complete even if stats update fails
    return null;
  }
}

export async function getUserInfo(userId) {
  try {
    const response = await fetch(`${PROFILE_SERVICE_URL}/api/profileServ/users/${userId}/info`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user info');
    }

    return await response.json();
  } catch (err) {
    console.error(`Failed to fetch info for user ${userId}:`, err.message);
    throw err; // This should fail if we can't get user info
  }
}

export async function validateUserCredentials(username, password) {
  try {
    const response = await fetch(`${PROFILE_SERVICE_URL}/api/profileServ/users/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errMsg = data?.error || data?.message || 'Invalid credentials';
      const err = new Error(errMsg);
      // Attach status for callers who may want it
      err.status = response.status;
      throw err;
    }

    return data;
  } catch (err) {
    console.error(`Failed to validate credentials for ${username}:`, err.message);
    throw err;
  }
}
