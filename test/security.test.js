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
import { LocalKeySecurity } from '../src/mocks/local-key-security.js';

function createRequest(spaceId, token) {
  return new Request('http://localhost/', {
    headers: {
      'x-space-id': spaceId,
      authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Asserts that the call fails with an exception with the supplied status code
 * @param {number} expectedStatus
 * @param {():Promise<void>} fn
 */
async function assertFailsWithStatus(expectedStatus, fn) {
  let caught;
  try {
    await fn();
  } catch (err) {
    caught = err;
  }
  assert.ok(caught);
  assert.equal(caught.status, expectedStatus);
}

describe('Security Unit Tests', () => {
  describe('authorization', () => {
    let token;
    const security = new LocalKeySecurity();
    before(async () => {
      token = await security.generateToken({
        spaceId: 'test-space',
        generator: 'unittest',
        roleKeys: ['test-role'],
      });
      assert.ok(token);
    });

    it('rejects missing authorization header', async () => {
      const request = new Request('http://localhost/', {
        headers: {
          'x-space-id': 'test-space',
        },
      });
      await assertFailsWithStatus(400, () => security.authorize(request));
    });

    it('rejects non-bearer authorization header', async () => {
      const request = createRequest('test-space', token);
      request.headers.set('authorization', 'basic YWRtaW46YWRtaW4=');
      await assertFailsWithStatus(401, () => security.authorize(request));
    });

    it('rejects malformed bearer token', async () => {
      const request = createRequest('test-space', 'somestringthatsnotatoken');
      await assertFailsWithStatus(401, () => security.authorize(request));
    });

    it('rejects tokens from other issuers', async () => {
      const security2 = new LocalKeySecurity();
      const token2 = await security2.generateToken({
        spaceId: 'test-space',
        generator: 'unittest',
        roleKeys: ['test-role'],
      });
      const request = createRequest('test-space', token2);
      await assertFailsWithStatus(401, () => security.authorize(request));
    });

    it('can authorize request', async () => {
      await security.authorize(createRequest('test-space', token));
    });
  });

  describe('authentication', () => {
    let tenant1Token;
    let tenant1AdminToken;
    let tenant2Token;
    const security = new LocalKeySecurity();
    before(async () => {
      security.roleToPermissions.user = ['app.read'];
      security.roleToPermissions.admin = ['app.*'];
      tenant1Token = await security.generateToken({
        spaceId: 'test-space',
        generator: 'unittest',
        roleKeys: ['user'],
      });
      assert.ok(tenant1Token);
      tenant1AdminToken = await security.generateToken({
        spaceId: 'test-space',
        generator: 'unittest',
        roleKeys: ['admin'],
      });
      assert.ok(tenant1AdminToken);
      tenant2Token = await security.generateToken({
        spaceId: 'test-space2',
        generator: 'unittest',
        roleKeys: ['admin'],
      });
      assert.ok(tenant2Token);
    });

    it('allows tenant with no role or permission checks', async () => {
      await security.authenticate(createRequest('test-space', tenant1Token));
      await security.authenticate(
        createRequest('test-space', tenant1AdminToken),
      );
    });

    it('disallows cross tenant requests', async () => {
      const request = createRequest('test-space', tenant2Token);
      await assertFailsWithStatus(403, () => security.authenticate(request));
    });

    describe('roles', () => {
      it('allows with any allowed role', async () => {
        const request = createRequest('test-space', tenant1AdminToken);
        await security.authenticate(request, {
          allowedRoles: ['admin', 'testuser'],
        });
      });

      it('disallows without any role', async () => {
        const request = createRequest('test-space', tenant1Token);
        await assertFailsWithStatus(403, () => security.authenticate(request, { allowedRoles: ['admin'] }));
      });

      it('disallows without role AND permissions', async () => {
        const request = createRequest('test-space', tenant1Token);
        await assertFailsWithStatus(403, () => security.authenticate(request, { allowedRoles: ['admin'], allowedPermissions: ['app.read'] }));
      });
    });

    describe('permissions', () => {
      it('allows with any permission', async () => {
        const request = createRequest('test-space', tenant1Token);
        await security.authenticate(request, {
          allowedPermissions: ['app.write', 'app.read'],
        });
      });

      it('allows with globbed permission', async () => {
        const request = createRequest('test-space', tenant1AdminToken);
        security.authenticate(request, {
          allowedPermissions: ['app.write', 'app.read'],
        });
      });

      it('disallowed with globbed permission', async () => {
        const request = createRequest('test-space', tenant1Token);
        security.authenticate(request, {
          allowedPermissions: ['app.write', 'app.read'],
        });
      });
    });
  });
});
