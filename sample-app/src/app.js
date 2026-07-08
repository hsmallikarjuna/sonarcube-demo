'use strict';

const express = require('express');
const { login, generateResetToken } = require('./auth');
const { ping, evaluateExpression, classify } = require('./utils');

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const session = login(username, password);
  if (!session) {
    res.status(401).json({ error: 'invalid credentials' });
    return;
  }
  res.json({ token: generateResetToken(), role: session.role });
});

app.get('/diagnostics/ping', async (req, res) => {
  try {
    const output = await ping(req.query.host);
    res.type('text/plain').send(output);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/calc', (req, res) => {
  res.json({ result: evaluateExpression(req.query.expr) });
});

app.get('/classify', (req, res) => {
  res.json({ label: classify(Number(req.query.score)) });
});

/* istanbul ignore next */
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`sonar-demo-app listening on ${port}`));
}

module.exports = app;
