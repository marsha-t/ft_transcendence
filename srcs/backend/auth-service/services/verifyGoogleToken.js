// services/verifyGoogleToken.js
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * verifyGoogleToken: verifies an ID token and returns payload
 * @param {string} idToken
 * @returns {object} payload or throws
 */
export async function verifyGoogleToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}
