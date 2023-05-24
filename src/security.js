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
import { minimatch } from 'minimatch';
import fetch from 'node-fetch';
import { ContextHelper } from './context.js';
import { RestError } from './rest-error.js';
import { SecretsManager } from './secret.js';

const BEARER_OFFSET = 7;

/**
 * @typedef {Object} AuthenticationRequirement
 * @property {Array<string>} [allowedRoles]
 * @property {Array<string>} [allowedPermissions]
 */

/**
 * @typedef {Object} TokenRequest
 * @property {string} spaceId the space for which the token will be generated
 * @property {Array<string>} roleKeys the role keys for which the token should be generated
 * @property {string} generator provides attribution for the key in the description
 * @property {number} [expiresInMinutes] the number of minutes before the token expires (or 14 days)
 */

/**
 * @typedef {Object} TokenPayload
 * @property {Array<string>} permissions the permissions granted to this token
 * @property {Array<string>} roles the permissions granted to this token
 * @property {string} sub the subject (or identifier) for this token
 * @property {string} tenantId the primary tenant for the token
 * @property {Array<string>} [tenantIds] the optional list of additional
 *  allowed tenants for the token
 * @property {string} type the type of the token
 * @property {number} exp the timestamp at which the token will expire
 */

export class Security {
  /**
   * Checks to see if any of the allowed permissions are present in the actual permissions,
   * using globbing expansion
   * @param {Array<string>} allowedPermissions the list of permissions which are allowed
   * @param {Array<string>} actualPermissions the actual permissions from the request
   * @returns {boolean}
   */
  static #hasPermissions(allowedPermissions, actualPermissions) {
    return allowedPermissions
      .some((required) => actualPermissions.some((granted) => minimatch(required, granted)));
  }

  /**
   * @type {string}
   */
  #apiHost;

  #certificate;

  /**
   * @type {import('./common-typedefs.js').Logger}
   */
  #log;

  /**
   * Maps the role names to role IDs
   * @type {Record<string,string>}
   */
  #roles;

  /**
   * @type {SecretsManager}
   */
  #secretsManager;

  constructor(context) {
    const helper = new ContextHelper(context);
    this.#apiHost = helper.getEnv().SECURITY_API_HOST || 'https://api.frontegg.com';
    this.#log = helper.getLog();
    this.#secretsManager = context.secretsManager
      || new SecretsManager({
        ...helper.extractAwsConfig(),
        application: 'frontegg',
        scope: context.scope,
      });
  }

  /**
   * Authenticates that the request is allowed to continue based on
   * the authentication requirements
   * @param {AuthenticationRequirement} [authentication] the requirements
   *    for authentication to succeed
   * @param {Request} req the request
   * @returns {Promise<void>}
   */
  async authenticate(req, authentication) {
    const token = this.#getToken(req);
    const spaceId = this.#getRequiredHeader(req, 'x-space-id');
    const payload = jwt.decode(token);

    // first validate that the tenant is correct
    if (payload.tenantId !== spaceId) {
      this.#log.debug(
        `Mismatched spaceId, expected ${spaceId}, found ${payload.tenantId}`,
      );
      throw new RestError(403);
    }
    const { allowedRoles } = authentication || {};
    if (allowedRoles && allowedRoles.length > 0) {
      const actualRoles = payload.roles || [];
      if (!allowedRoles.some((role) => actualRoles.includes(role))) {
        this.#log.debug('Payload did not contain allowed roles', {
          allowedRoles: authentication.allowedRoles,
          actualRoles,
        });
        throw new RestError(403);
      }
    }

    const { allowedPermissions } = authentication || {};
    if (allowedPermissions && allowedPermissions.length > 0) {
      const permissions = payload.permissions || [];
      if (!Security.#hasPermissions(allowedPermissions, permissions)) {
        this.#log.debug('Payload did not contain allowed permissions', {
          allowedRoles: authentication.allowedPermissions,
          roles: payload.roles,
        });
        throw new RestError(403);
      }
    }
  }

  /**
   * Verifies that the request has an authorization header and that the value
   * of that header is a valid JWT token signed with the Private key associated
   * with the provided Public key.
   * @param {Request} req the request to authorize
   * @returns {Promise<void>} resolves if the request is authorized
   */
  async authorize(req) {
    this.#getRequiredHeader(req, 'x-space-id');
    const token = this.#getToken(req);
    await this.#verifyToken(token);
  }

  /**
   * Generates a server to server token with the specified settings
   * @param {TokenRequest} request
   * @returns {Promise<string>}
   */
  async generateToken(request) {
    const authToken = await this.#getAuthToken();
    if (!this.#roles) {
      this.#roles = await this.#getRoles(authToken);
    }
    const roleIds = request.roleKeys.map((k) => this.#roles[k]);

    return this.#generateAccessToken(
      authToken,
      request.spaceId,
      request.generator,
      roleIds,
      request.expiresInMinutes || 20160,
    );
  }

  /**
   *
   * @param {string} authToken
   * @param {string} spaceId
   * @param {string} generator
   * @param {Array<string>} roleIds
   * @param {number | undefined} expiresInMinutes
   */
  async #generateAccessToken(
    authToken,
    spaceId,
    generator,
    roleIds,
    expiresInMinutes,
  ) {
    const res = await fetch(
      `${this.#apiHost}/identity/resources/tenants/access-tokens/v1`,
      {
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${authToken}`,
          'frontegg-tenant-id': spaceId,
        },
        method: 'POST',
        body: JSON.stringify({
          expiresInMinutes,
          roleIds,
          description: `Auto-created for ${generator} at ${new Date().toISOString()}`,
        }),
      },
    );
    if (!res.ok) {
      await this.#logErrorResponse('Failed to generate access token', res);
      throw new RestError(500, 'Failed to generate access token, check logs');
    }
    const body = await res.json();
    return body.secret;
  }

  /**
   * @returns {Promise<string>}
   */
  async #getAuthToken() {
    const secrets = await this.#secretsManager.getSecret('api-access');
    const res = await fetch(`${this.#apiHost}/auth/vendor`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: secrets,
    });
    if (!res.ok) {
      await this.#logErrorResponse('Failed to get auth token', res);
      throw new RestError(500, 'Failed to get auth token, check logs');
    }
    const body = await res.json();
    return body.token;
  }

  /**
   * Gets the specified header, throwing a BadRequest header if the header
   * is not found.
   * @param {Request} req
   * @param {string} headerName
   * @returns {string} the header value
   */
  #getRequiredHeader(req, headerName) {
    const value = req.headers.get(headerName);
    if (!value) {
      this.#log.debug(`Missing header [${headerName}]`);
      throw new RestError(400, `Missing header [${headerName}]`);
    }
    return value;
  }

  /**
   * Retrieves the role key > role id mapping
   * @param {string} authToken
   * @returns {Promise<Record<string,string>>}
   */
  async #getRoles(authToken) {
    const res = await fetch(`${this.#apiHost}/identity/resources/roles/v1`, {
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${authToken}`,
      },
    });
    if (!res.ok) {
      await this.#logErrorResponse('Failed to get roles', res);
      throw new RestError(500, 'Failed to get roles, check logs');
    }
    const body = await res.json();
    const roles = {};
    body.forEach((role) => {
      roles[role.key] = role.id;
    });
    return roles;
  }

  /**
   * Gets the token from the request
   * @param {Request} req
   * @returns {string}
   */
  #getToken(req) {
    const authorization = this.#getRequiredHeader(req, 'authorization');
    if (!authorization.toLowerCase().startsWith('bearer ')) {
      this.#log.debug('Invalid or missing authorization header');
      throw new RestError(401);
    }
    return authorization.substring(BEARER_OFFSET);
  }

  /**
   * @param {string} message
   * @param {Response} res
   */
  async #logErrorResponse(message, res) {
    let body = 'Unable to read body';
    try {
      body = await res.text();
    } catch (err) {
      this.#log.error('Failed to read body', err);
    }
    this.#log.error(message, {
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers),
      url: res.url,
      body,
    });
  }

  /**
   * Verifies the specified token
   * @param {string} token the token string to verify
   * @returns {Promise<any>} the resolve JWT payload
   */
  async #verifyToken(token) {
    if (!this.#certificate) {
      this.#certificate = await this.#secretsManager.getSecret('public-key');
    }
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.#certificate, (err, user) => {
        if (err) {
          this.#log.warn('Failed to verify authorization', err);
          reject(new RestError(401));
        }
        resolve(user);
      });
    });
  }
}
