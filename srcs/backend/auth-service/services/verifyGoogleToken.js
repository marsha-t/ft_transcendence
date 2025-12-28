// services/verifyGoogleToken.js
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * verifyGoogleToken: verifies an ID token and returns payload
 * @param {string} idToken
 * @returns {object} payload or throws
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