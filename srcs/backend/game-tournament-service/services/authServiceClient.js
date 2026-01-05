const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:5002';

// Update User Stats
/*
  - Used to update winner and loser stats when game ends (via scoring)
  - Swallows error if fail to update stats for user: game is able to complete even if stats update fail
    - This is regardless of error type: transport errors, can't find user, etc - all errors will be swallowed here
  - Instead, rely on console.warn to issue the warning
*/
export async function updateUserStats(userId, { won, score, opponentScore }) {
  let response;
  
  try {
    response = await fetch(`${PROFILE_SERVICE_URL}/api/profileServ/users/${userId}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ won, score, opponentScore })
    });
  } catch (err) {
    // Handle transport-level failures (where response is not even returned)
    console.warn(`Failed to update stats for user ${userId}:`, err.message);
    // Don't throw - allow game to complete even if stats update fails
    return null;
  }

  // Handle non-OK response from auth service
  if (!response.ok) {
    console.warn(`Failed to update stats for user ${userId}: (status ${response.status})`);
  }

  return await response.json();
}

// Get user info (username)
/*
  - Format error 
    - Handle transport-level failures where response is not even returned
    - Handle specific case where user not found
    - Handle unexpected non-OK responses 
*/
export async function getUserInfo(userId) {
  let response;

  try {
    response = await fetch(`${PROFILE_SERVICE_URL}/api/profileServ/users/${userId}/info`);
  } catch {
    // Handle transport-level failures (where response is not even returned)
     const e = new Error('Auth service unavailable');
      e.statusCode = 502;
      e.code = 'AUTH_SERVICE_DOWN';
      throw e;
  }
    
  // Handle case where user isn't found
  if (response.status === 404) {
    const e = new Error('User not found');
    e.statusCode = 404;
    e.code = 'USER_NOT_FOUND';
    throw e;
  }
  
  // Handle unexpected non-OK response from auth service
  if (!response.ok) {
    const e = new Error('Failed to fetch user info');
    e.statusCode = 502;
    e.code = 'AUTH_SERVICE_ERROR';
    throw e;
  }
  return await response.json();
}

// Validates registered user credentials for tournament draft
/*
  - Format error 
    - Handle transport-level failures where response is not even returned
    - Handle specific case where credentials are invalid
    - Handle unexpected non-OK responses 
*/
export async function validateUserCredentials(username, password) {
  let response;

  try {
    response = await fetch(`${PROFILE_SERVICE_URL}/api/profileServ/users/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    // Handle transport-level failures (where response is not even returned)
    const err = new Error('Auth service unavailable');
    err.statusCode = 502;
    err.code = 'AUTH_SERVICE_DOWN';
    throw err;
  }
  
  // Handle case where auth explicitly rejects credentials
  if (response.status === 401) {
    const err = new Error('Invalid username or password');
    err.statusCode = 401;
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }
  
  // Handle unexpected non-OK response from auth service
  if (!response.ok) {
    const err = new Error('Failed to validate user credentials');
    err.statusCode = 502;
    err.code = 'AUTH_SERVICE_ERROR';
    throw err;
  }

  return await response.json();
}