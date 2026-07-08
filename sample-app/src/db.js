'use strict';

/**
 * Fake in-memory "database" so the sample app has no external
 * infrastructure dependency. Good enough to give SonarQube real
 * data-flow to analyze.
 */
const users = [
  { id: 1, username: 'alice', password: 'alice123' },
  { id: 2, username: 'bob', password: 'bob123' },
];

function findUserByUsername(username) {
  return users.find((u) => u.username === username);
}

module.exports = { findUserByUsername, users };
