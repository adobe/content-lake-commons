/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-env mocha */

import assert from 'assert';
import nock from 'nock';

import { FetchRetry } from '../src/fetch-retry.js';

const TEST_URL = 'http://localhost:8081';

describe('Fetch Retry Tests', () => {
  it('Can fetch', async () => {
    const scope = nock(TEST_URL)
      .post('/')
      .matchHeader('x-api-key', 'test-api-key')
      .reply(200, 'Ok');
    const client = new FetchRetry();
    const res = await client.fetch(TEST_URL, {
      method: 'POST',
      headers: {
        'x-api-key': 'test-api-key',
      },
    });
    assert.ok(res.ok);
    assert.ok(scope.isDone());
  });

  it('Can can retry on failure', async () => {
    const scope = nock(TEST_URL)
      .post('/')
      .matchHeader('x-api-key', 'test-api-key')
      .reply(502)
      .post('/')
      .matchHeader('x-api-key', 'test-api-key')
      .reply(200, 'Ok');
    const client = new FetchRetry();
    const res = await client.fetch(TEST_URL, {
      method: 'POST',
      headers: {
        'x-api-key': 'test-api-key',
      },
    });
    assert.ok(res.ok);
    assert.ok(scope.isDone());
  });

  it('Can can read retry after header', async () => {
    const start = Date.now();
    const scope = nock(TEST_URL)
      .post('/')
      .matchHeader('x-api-key', 'test-api-key')
      .reply(502, '', { 'Retry-After': 3 })
      .post('/')
      .matchHeader('x-api-key', 'test-api-key')
      .reply(200, 'Ok');
    const client = new FetchRetry();
    const res = await client.fetch(TEST_URL, {
      method: 'POST',
      headers: {
        'x-api-key': 'test-api-key',
      },
    });
    assert.ok(res.ok);
    assert.ok(scope.isDone());
    assert.ok(Date.now() - start >= 3000);
  }).timeout(4000);

  it('Can handle failure', async () => {
    const scope = nock(TEST_URL)
      .get('/')
      .matchHeader('x-api-key', 'test-api-key')
      .reply(400, 'Your request is bad and you should feel bad')
      .get('/')
      .matchHeader('x-api-key', 'test-api-key')
      .reply(200, 'Ok');
    const client = new FetchRetry();
    const res = await client.fetch(TEST_URL, {
      headers: {
        'x-api-key': 'test-api-key',
      },
    });
    assert.ok(!res.ok);
    assert.ok(!scope.isDone());
  });

  it('Can override retries', async () => {
    const scope = nock(TEST_URL)
      .get('/')
      .matchHeader('x-api-key', 'test-api-key')
      .reply(429, 'GO AWAY!')
      .get('/')
      .matchHeader('x-api-key', 'test-api-key')
      .reply(429, 'GO AWAY!')
      .get('/')
      .matchHeader('x-api-key', 'test-api-key')
      .reply(200, 'Ok');
    const client = new FetchRetry({
      retries: 1,
    });
    const res = await client.fetch(TEST_URL, {
      headers: {
        'x-api-key': 'test-api-key',
      },
    });
    assert.ok(!res.ok);
    assert.strictEqual(res.status, 429);
    assert.ok(!scope.isDone());
  });

  it('Can override retryOn', async () => {
    const scope = nock(TEST_URL)
      .get('/')
      .matchHeader('x-api-key', 'test-api-key')
      .reply(500, 'Ruh roh')
      .get('/')
      .matchHeader('x-api-key', 'test-api-key')
      .reply(429, 'GO AWAY!')
      .get('/')
      .matchHeader('x-api-key', 'test-api-key')
      .reply(200, 'Ok');
    const client = new FetchRetry({
      retryOn: [500],
    });
    const res = await client.fetch(TEST_URL, {
      headers: {
        'x-api-key': 'test-api-key',
      },
    });
    assert.ok(!res.ok);
    assert.strictEqual(res.status, 429);
    assert.ok(!scope.isDone());
  });

  afterEach(() => {
    nock.cleanAll();
  });
});
