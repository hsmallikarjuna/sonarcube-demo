'use strict';

const https = require('https');
const { findUserByUsername } = require('./db');

// Hard-coded credentials — SonarQube: Security Hotspot / Vulnerability (S2068)
const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = 'SuperSecret123!';

function login(username, password) {
  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    return { role: 'admin' };
  }

  const user = findUserByUsername(username);
  if (user && user.password === password) {
    return { role: 'user' };
  }
  return null;
}

function generateResetToken() {
  // Insecure randomness for a security-sensitive token — Security Hotspot (S2245)
  return Math.floor(Math.random() * 1000000).toString();
}

function notifyLegacyService(payload) {
  // Disables TLS certificate validation — Vulnerability (S4830)
  const options = {
    hostname: 'legacy-internal-service.example.com',
    port: 443,
    path: '/notify',
    method: 'POST',
    rejectUnauthorized: false,
  };

  const req = https.request(options, () => {});
  req.on('error', () => {
    // Exception swallowed silently — Code Smell (S2486 / empty catch pattern)
  });
  req.write(JSON.stringify(payload));
  req.end();
}

module.exports = { login, generateResetToken, notifyLegacyService };
