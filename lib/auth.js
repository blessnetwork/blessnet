const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const jwt = require('jsonwebtoken');
const { JWK, JWS } = require('node-jose');
const CONSTANTS = require('./constants');

const blessnetDir = path.join(os.homedir(), '.blessnet');
const authPath = path.join(blessnetDir, 'auth.json');
const jwksPath = path.join(blessnetDir, 'jwks.json');

/**
 * Auth storage structure:
 * {
 *   jwt: string,
 *   refreshToken: string,
 *   expiresAt: string (ISO date)
 * }
 */

/**
 * JWKS cache structure:
 * {
 *   keys: array,
 *   cachedAt: string (ISO date),
 *   expiresAt: string (ISO date)
 * }
 */

/**
 * Get current auth data
 *
 * @returns
 */
function getAuth() {
  try {
    if (fs.existsSync(authPath)) {
      const authData = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
      return authData;
    }

    return null;
  } catch (error) {
    console.error('Error reading auth data:', error);
    return null;
  }
}

/**
 * Store auth data
 *
 * @param {string} jwt
 * @param {string} refreshToken
 * @param {string|null} expiresAt
 * @returns
 */
function setAuth(jwt, refreshToken, expiresAt = null) {
  try {
    let computedExpiresAt = expiresAt;
    if (!computedExpiresAt && jwt) {
      const decoded = decodeJWT(jwt);
      if (decoded?.exp) {
        computedExpiresAt = new Date(decoded.exp * 1000).toISOString();
      }
    }

    const authData = {
      jwt,
      refreshToken,
      expiresAt: computedExpiresAt,
    };

    fs.writeFileSync(authPath, JSON.stringify(authData, null, 2));

    return authData;
  } catch (error) {
    console.error('Error storing auth data:', error);
    return null;
  }
}

/**
 * Clear auth data
 *
 * @returns
 */
function clearAuth() {
  try {
    if (fs.existsSync(authPath)) {
      fs.unlinkSync(authPath);
    }
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
}

/**
 * Check if user is logged in
 *
 * @returns
 */
function isLoggedIn() {
  const auth = getAuth();
  return auth?.jwt && auth.refreshToken;
}

/**
 * Decode JWT without verification (for reading claims)
 *
 * @param {string} token
 * @returns
 */
function decodeJWT(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Check if JWT is expired
 *
 * @param {string} token
 * @param {number} bufferMinutes
 * @returns
 */
function isJWTExpired(token, bufferMinutes = 5) {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) {
      return true; // Consider invalid tokens as expired
    }

    const expirationTime = decoded.exp * 1000;
    const bufferTime = bufferMinutes * 60 * 1000;
    const now = Date.now();

    return expirationTime - bufferTime <= now;
  } catch (error) {
    console.error('Error checking JWT expiration:', error);
    return true;
  }
}

/**
 * Get cached JWKS
 *
 * @returns
 */
function getJWKS() {
  try {
    if (fs.existsSync(jwksPath)) {
      const jwksData = JSON.parse(fs.readFileSync(jwksPath, 'utf-8'));

      // Validate cache structure
      if (
        !jwksData.keys ||
        !Array.isArray(jwksData.keys) ||
        !jwksData.cachedAt
      ) {
        console.warn('Invalid JWKS cache structure, ignoring cache');
        return null;
      }

      const cachedAt = new Date(jwksData.cachedAt);
      const expiresAt = new Date(cachedAt.getTime() + 60 * 60 * 1000); // 1 hour TTL

      // Validate dates
      if (isNaN(cachedAt.getTime()) || isNaN(expiresAt.getTime())) {
        console.warn('Invalid JWKS cache dates, ignoring cache');
        return null;
      }

      if (new Date() < expiresAt) {
        return jwksData.keys;
      }
    }
    return null;
  } catch (error) {
    console.error('Error reading JWKS cache:', error);
    // Try to clean up corrupted cache file
    try {
      if (fs.existsSync(jwksPath)) {
        fs.unlinkSync(jwksPath);
      }
    } catch (cleanupError) {
      console.error('Failed to clean up corrupted JWKS cache:', cleanupError);
    }
    return null;
  }
}

/**
 * Cache JWKS data
 *
 * @param {Array} keys
 * @returns
 */
function setJWKS(keys) {
  try {
    const now = new Date();
    const jwksData = {
      keys,
      cachedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour TTL
    };

    fs.writeFileSync(jwksPath, JSON.stringify(jwksData, null, 2));
    return true;
  } catch (error) {
    console.error('Error caching JWKS:', error);
    return false;
  }
}

/**
 * Fetch JWKS from server
 *
 * @returns
 */
async function fetchJWKS() {
  try {
    const response = await fetch(`${CONSTANTS.authHost}/api/v1/.well-known/jwks.json`);

    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS: ${response.status}`);
    }

    const jwks = await response.json();

    if (jwks?.keys && Array.isArray(jwks.keys)) {
      setJWKS(jwks.keys);
      return jwks.keys;
    }

    throw new Error('Invalid JWKS format');
  } catch (error) {
    console.error('Error fetching JWKS:', error);
    return null;
  }
}

/**
 * Get JWKS (from cache or fetch)
 *
 * @returns
 */
async function getValidJWKS() {
  let keys = getJWKS();

  if (!keys) {
    keys = await fetchJWKS();
  }

  return keys;
}

/**
 * Verify JWT signature using JWKS
 *
 * @param {string} token
 * @returns
 */
async function verifyJWT(token) {
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header || !decoded.header.kid) {
      return false;
    }

    const keys = await getValidJWKS();
    if (!keys) {
      return false;
    }

    // Verify signature using the matching key
    const key = keys.find((k) => k.kid === decoded.header.kid);
    if (!key) {
      const freshKeys = await fetchJWKS();
      if (freshKeys) {
        const freshKey = freshKeys.find((k) => k.kid === decoded.header.kid);
        if (!freshKey) {
          return false;
        }

        const jwk = await JWK.asKey(freshKey);
        const result = await JWS.createVerify(jwk).verify(token);
        return !!result;
      }
      return false;
    }

    const jwk = await JWK.asKey(key);
    const result = await JWS.createVerify(jwk).verify(token);
    return !!result;
  } catch (error) {
    console.error('Error verifying JWT:', error);
    return false;
  }
}

/**
 * Refresh auth token using refresh token
 *
 * @returns
 */
async function refreshToken() {
  try {
    const auth = getAuth();
    if (!auth || !auth.refreshToken) {
      return null;
    }

    const response = await fetch(`${CONSTANTS.authHost}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: auth.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.status}`);
    }

    const data = await response.json();

    if (data.jwt && data.refreshToken) {
      const isValid = await verifyJWT(data.jwt);
      if (!isValid) {
        // Verification failed - return null to trigger re-authentication
        return null;
      }

      return setAuth(data.jwt, data.refreshToken);
    }

    // Invalid response format - return null
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Get valid JWT, after refresh if needed
 *
 * @returns
 */
async function getValidJWT() {
  const auth = getAuth();
  if (!auth || !auth.jwt) {
    return null;
  }

  // Refresh token if it is expired
  if (isJWTExpired(auth.jwt)) {
    const refreshed = await refreshToken();
    if (refreshed) {
      return refreshed.jwt;
    }
    // If refresh fails, clear force re-auth
    clearAuth();
    return null;
  }

  return auth.jwt;
}

/**
 * Make an authenticated fetch request with automatic token refresh
 * Handles 401/403 responses by attempting token refresh and retry
 *
 * @param {string} url
 * @param {object} options
 * @returns
 */
async function authenticatedFetch(url, options = {}) {
  // Get valid JWT (pre-validated)
  const jwt = await getValidJWT();
  if (!jwt) {
    throw new Error(
      'Authentication required. Please run: blessnet options account login'
    );
  }

  // First attempt with current JWT
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${jwt}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    console.log('Token expired, attempting refresh...');

    // Try refresh
    const refreshed = await refreshToken();

    if (refreshed?.jwt) {
      // Retry with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${refreshed.jwt}`,
        },
      });

      // If still failing after refresh, force re-auth
      if (response.status === 401 || response.status === 403) {
        clearAuth();
        throw new Error(
          'Authentication failed. Please login again: blessnet options account login'
        );
      }
    } else {
      // Refresh failed - clear auth and force re-login
      clearAuth();
      throw new Error(
        'Session expired. Please login again: blessnet options account login'
      );
    }
  }

  return response;
}

module.exports = {
  getAuth,
  setAuth,
  clearAuth,
  isLoggedIn,
  decodeJWT,
  isJWTExpired,
  getJWKS,
  setJWKS,
  fetchJWKS,
  getValidJWKS,
  verifyJWT,
  refreshToken,
  getValidJWT,
  authenticatedFetch,
};
