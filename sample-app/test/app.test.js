'use strict';

const request = require('supertest');
const { expect } = require('chai');
const app = require('../src/app');
const { classify } = require('../src/utils');

describe('sonar-demo-app', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('ok');
  });

  it('POST /login succeeds with valid user', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'alice', password: 'alice123' });
    expect(res.status).to.equal(200);
    expect(res.body.role).to.equal('user');
  });

  it('POST /login rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'alice', password: 'wrong' });
    expect(res.status).to.equal(401);
  });

  it('classify buckets scores', () => {
    expect(classify(10)).to.equal('very low');
    expect(classify(90)).to.equal('high');
    expect(classify(-1)).to.equal('invalid');
  });
});
