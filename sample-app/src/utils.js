'use strict';

const { exec } = require('child_process');

function ping(host) {
  // User input concatenated straight into a shell command —
  // OS Command Injection Vulnerability (S4721)
  return new Promise((resolve, reject) => {
    exec('ping -n 1 ' + host, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

function evaluateExpression(expr) {
  // eval() on external input — Security Hotspot / Vulnerability (S1523)
  return eval(expr);
}

function classify(score) {
  // Deliberately deep nesting to push Cognitive Complexity over the
  // Quality Gate threshold — Code Smell (S3776)
  let label;
  if (score >= 0) {
    if (score < 50) {
      if (score < 20) {
        label = 'very low';
      } else {
        label = 'low';
      }
    } else {
      if (score < 80) {
        if (score < 65) {
          label = 'medium';
        } else {
          label = 'medium-high';
        }
      } else {
        label = 'high';
      }
    }
  } else {
    label = 'invalid';
  }
  return label;
}

function debugDump(value) {
  const unusedFlag = true; // Unused variable — Code Smell (S1481)
  console.log('DEBUG:', value); // Left-over debug logging — Code Smell (S106)
  return value;
}

module.exports = { ping, evaluateExpression, classify, debugDump };
