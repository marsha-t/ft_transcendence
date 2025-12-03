// game-tournament-service/services/userServiceClient.js
// API client to communicate with User-Social Service

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';

export async function updateUserStats(userId, { won, score, opponentScore }) {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/users/${userId}/stats`, {
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
    const response = await fetch(`${AUTH_SERVICE_URL}/api/users/${userId}/info`);

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

export async function getBatchUserInfo(userIds) {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/users/batch-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch users info');
    }

    return await response.json();
  } catch (err) {
    console.error('Failed to fetch batch user info:', err.message);
    return [];
  }
}