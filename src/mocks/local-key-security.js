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
import jwt from 'jsonwebtoken';
import { generateKeyPairSync, randomUUID } from 'crypto';
import { Security } from '../security.js';
import { MockSecretsManager } from './secrets.js';

export class LocalKeySecurity extends Security {
  /**
   * @type {Array<string>}
   */
  additionalTenantIds;

  #privateKey;

  /**
   * @type {Record<string,Array<string>>}
   */
  roleToPermissions = {};

  constructor() {
    const secretsManager = new MockSecretsManager();
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    secretsManager.putSecret('public-key', publicKey);
    super({
      secretsManager,
    });
    this.#privateKey = privateKey;
  }

  /**
   * Generates a server to server token with the specified settings
   * @param {import('../security.js').TokenRequest} request
   * @returns {Promise<string>}
   */
  async generateToken(request) {
    const permissions = new Set();
    request.roleKeys
      .forEach((role) => this.roleToPermissions[role]
        ?.forEach((permission) => permissions.add(permission)));
    return jwt.sign(
      {
        permissions: Array.from(permissions),
        roles: request.roleKeys,
        tenantId: request.spaceId,
        tenantIds: this.additionalTenantIds,
      },
      this.#privateKey,
      { expiresIn: (request.expiresInMinutes || 120) * 60, subject: randomUUID(), algorithm: 'RS256' },
    );
  }
}
