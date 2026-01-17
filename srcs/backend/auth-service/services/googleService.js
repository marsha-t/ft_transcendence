// services/googleService.js

import { OAuth2Client } from 'google-auth-library';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

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

// saveGoogleAvatar Service
/*
 Service to download and store a user's Google profile picture locally.
 - Accepts a Google profile picture URL and the user's ID
 - Fetches the image from Google only once (on first login)
 - Validates the downloaded image size (max 5MB)
 - Determines file extension based on the image MIME type
 - Saves the avatar in the server uploads directory using the user ID as filename
 - Returns the local avatar URL to be stored in the database
 - Falls back to the default avatar if no picture URL is provided
*/
export async function saveGoogleAvatar(pictureUrl, userId) {
  if (!pictureUrl) return '/uploads/avatars/default.png';

  const res = await fetch(pictureUrl);
  if (!res.ok) throw new Error('Failed to fetch Google avatar');

  const buffer = Buffer.from(await res.arrayBuffer());

  const MAX_SIZE = 5 * 1024 * 1024;
  if (buffer.length > MAX_SIZE) {
    throw new Error('Google avatar too large');
  }

  const contentType = res.headers
    .get('content-type')
    ?.split(';')[0]
    .toLowerCase();

  const extMap = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  };

  const ext = extMap[contentType] || '.png';

  const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const fileName = `${userId}${ext}`;
  const filePath = path.join(uploadDir, fileName);

  await fs.promises.writeFile(filePath, buffer);

  return `/uploads/avatars/${fileName}`;
}
