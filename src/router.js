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
import routington from 'routington';
import { RestError } from './rest-error.js';
import { ContextHelper } from './context.js';

/**
 * @typedef SecurityConfig
 * @property {boolean} authRequired;
 * @property {Array<string>} [allowedRoles]
 * @property {Array<string>} [allowedPermissions]
 */

/**
 * Function for handling a routes inside Franklin / Content Lake services
 * @callback Handler
 * @param {Record<string,string>} params the parameters parsed from the request
 * @param {{request:Request,context:import('./context.js').UniversalishContext}} info the
 *   additional request information
 * @returns {Promise<Response>} the response from the request
 */

export class Router {
  methods = {};

  /**
   * @type {import('./security.js').Security | undefined}
   */
  #security;

  /**
   *
   * @param {string} method
   * @param {string} path
   * @param {Handler} handler
   * @param {SecurityConfig} [securityConfig]
   */
  addRoute(method, path, handler, securityConfig) {
    if (!this.methods[method]) {
      this.methods[method] = routington();
    }
    this.methods[method].define(path)[0].handler = handler;
    this.methods[method].define(path)[0].securityConfig = securityConfig;
  }

  /**
   *
   * @param {string} path
   * @param {Handler} handler
   * @param {SecurityConfig} [securityConfig]
   */
  delete(path, handler, securityConfig) {
    this.addRoute('DELETE', path, handler, securityConfig);
    return this;
  }

  /**
   *
   * @param {string} path
   * @param {Handler} handler
   * @param {SecurityConfig} [securityConfig]
   */
  get(path, handler, securityConfig) {
    this.addRoute('GET', path, handler, securityConfig);
    return this;
  }

  /**
   *
   * @param {string} path
   * @param {Handler} handler
   * @param {SecurityConfig} [securityConfig]
   */
  post(path, handler, securityConfig) {
    this.addRoute('POST', path, handler, securityConfig);
    return this;
  }

  /**
   *
   * @param {string} path
   * @param {Handler} handler
   * @param {SecurityConfig} [securityConfig]
   */
  put(path, handler, securityConfig) {
    this.addRoute('PUT', path, handler, securityConfig);
    return this;
  }

  /**
   *
   * @param {import('./security.js').Security} security
   */
  withSecurity(security) {
    this.#security = security;
    return this;
  }

  /**
   * Handles the specified request
   * @param {Request} request
   * @param {import('./context.js').UniversalishContext} context
   * @returns {Promise<Response>}
   */
  async handle(request, context) {
    const helper = new ContextHelper(context);
    const log = helper.getLog();
    const { method } = request;
    let suffix = context.pathInfo?.suffix;
    if (!suffix || suffix === '') {
      suffix = '/';
    }
    if (this.methods[request.method]) {
      log.debug('Handing request', { method, suffix });
      const match = this.methods[method].match(suffix);
      if (match && match.node.handler) {
        try {
          const { handler, securityConfig } = match.node;
          if (securityConfig && securityConfig.authRequired) {
            if (!this.#security) {
              throw new Error(
                'Misconfiguration, security is required for this route, but no security handler registered',
              );
            }
            await this.#security.authorize(request);
            await this.#security.authenticate(request, securityConfig);
          }
          return await handler(match.param, { request, context });
        } catch (err) {
          log.warn('Caught exception from handler', {
            method,
            suffix,
            err,
          });
          return RestError.toProblemResponse(err);
        }
      }
    } else {
      log.debug('No routes found', { method, suffix });
    }
    return RestError.toProblemResponse({
      status: 405,
      title: 'Method Not Allowed',
    });
  }
}
