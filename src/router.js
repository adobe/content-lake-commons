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

/**
 * Function for handling a routes inside Frankin / Content Lake services
 * @callback Handler
 * @param {Request} req the request
 * @param {UniversalContext} context the context of the request
 * @param {Record<string,string>} params the parameters parsed from the request
 * @returns {Promise<Response>} the response from the request
 */

export class Router {
  methods = {};

  /**
   *
   * @param {string} method
   * @param {string} path
   * @param {Handler} handler
   */
  addRoute(method, path, handler) {
    if (!this.methods[method]) {
      this.methods[method] = routington();
    }
    this.methods[method].define(path)[0].handler = handler;
  }

  /**
   *
   * @param {string} path
   * @param {Handler} handler
   */
  delete(path, handler) {
    this.addRoute('DELETE', path, handler);
    return this;
  }

  /**
   *
   * @param {string} path
   * @param {Handler} handler
   */
  get(path, handler) {
    this.addRoute('GET', path, handler);
    return this;
  }

  /**
   *
   * @param {string} path
   * @param {Handler} handler
   */
  post(path, handler) {
    this.addRoute('POST', path, handler);
    return this;
  }

  /**
   *
   * @param {string} path
   * @param {Handler} handler
   */
  put(path, handler) {
    this.addRoute('PUT', path, handler);
    return this;
  }

  /**
   * Handles the specified request
   * @param {Request} request
   * @param {UniveralContext} context
   * @returns {Promise<Response>}
   */
  async handle(request, context) {
    const log = context.log || console;
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
          return await match.node.handler(request, context, match.param);
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
