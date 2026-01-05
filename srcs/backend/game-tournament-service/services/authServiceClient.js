// game-tournament-service/services/userServiceClient.js
// API client to communicate with User-Social Service

import jwt from 'jsonwebtoken';
const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:5002';

export function generateServiceToken() {
  const token = jwt.sign(
    { service: 'services-communication' },
    process.env.JWT_SERVICE_SECRET,
    { expiresIn: '5m' }
  );

  return token;
}

export async function updateUserStats(userId, { won, score }) {
  try {
    const response = await fetch(`${PROFILE_SERVICE_URL}/api/profileServ/users/${userId}/stats`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${generateServiceToken()}`
      },
      body: JSON.stringify({ won, score })
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
    const response = await fetch(`${PROFILE_SERVICE_URL}/api/profileServ/users/${userId}/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${generateServiceToken()}`
      }
    });

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
    const response = await fetch(`${PROFILE_SERVICE_URL}/api/profileServ/users/batch-info`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${generateServiceToken()}`
      },
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