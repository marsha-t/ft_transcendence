// services/verifyGoogleToken.js

import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// verifyGoogleToken Service
/*
 Service to verify a Google ID token and extract user information.
 - Accepts a Google ID token string
 - Uses Google OAuth client to verify the token against the configured client ID
 - Throws an error if the token is invalid or verification fails
 - Returns the decoded payload containing user details such as:
     - sub (Google user ID)
     - email 
     - name 
     - picture 
*/
export async function verifyGoogleToken(idToken) {
    try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      const err = new Error('Invalid Google token');
      err.statusCode = 401;
      err.code = 'INVALID_GOOGLE_TOKEN';
      throw err;
    }

    return payload;
  } catch (error) {
    const err = new Error('Failed to verify Google token');
    err.statusCode = 500;
    err.code = 'GOOGLE_TOKEN_VERIFICATION_FAILED';
    throw err;
  }
}