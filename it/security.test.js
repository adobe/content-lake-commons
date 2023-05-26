/*
 * Copyright 2021 Adobe. All rights reserved.
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
import * as dotenv from 'dotenv';
import { Security } from '../src/security.js';
import { LocalKeySecurity } from '../src/mocks/local-key-security.js';

dotenv.config();

const SLOW_TEST_TIMEOUT = 5000;
const spaceId = process.env.SPACE_ID;

function createRequest(token) {
  return new Request('http://localhost/', {
    headers: {
      'x-space-id': spaceId,
      authorization: `Bearer ${token}`,
    },
  });
}

describe('Security Integration Tests', async () => {
  const security = new Security({ ...process, scope: 'test' });

  it('can generate and authorize tokens', async () => {
    const token = await security.generateToken({
      generator: 'Commons Security IT',
      spaceId,
      roleKeys: ['Admin'],
    });
    assert.ok(token);
    await security.authorize(createRequest(token));
  }).timeout(SLOW_TEST_TIMEOUT);

  it('generate fails without roles', async () => {
    await assert.rejects(() => security.generateToken({
      generator: 'Commons Security IT',
      spaceId,
      roleKeys: [],
    }));
  });

  it('will not authorize invalid token', async () => {
    await assert.rejects(() => security.authorize(createRequest('not a valid token')));
  });

  it('will not authorize token generated elsewhere', async () => {
    const localSecurity = new LocalKeySecurity();
    const key = await localSecurity.generateToken({
      generator: 'Commons Security IT',
      spaceId,
      roleKeys: ['Admin'],
    });
    await assert.rejects(() => security.authorize(createRequest(key)));
  });
});
