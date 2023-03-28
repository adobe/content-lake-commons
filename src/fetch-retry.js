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
// eslint-disable-next-line import/no-named-default
import { default as originalFetch } from 'node-fetch';
import fetchBuilder from 'fetch-retry';

const fetch = fetchBuilder(originalFetch);

// Constants for retry configuration
const SEC_IN_MS = 1000;
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_ON = [429, 500, 502, 503];

/**
 * @typedef RetryConfig
 * @property {number} [retries]
 * @property {Array<number>} [retryOn]
 * @property {any} [log]
 */

/**
 * Support for retriable requests
 */
export class FetchRetry {
  #config;

  #log;

  /**
   * Construct a new ingestor
   * @param {RetryConfig} config the retry configuration
   */
  constructor(config) {
    this.#config = config || {};
    this.#log = config?.log || console;
  }

  /**
   *
   * @param {string} url the URL to fetch
   * @param {RequestInit} init
   * @returns {Promise<Response>} the response
   */
  async fetch(url, init) {
    this.#log.debug('Submitting request', {
      url,
      method: init.method || 'GET',
      headers: init.headers,
    });
    return fetch(url, {
      ...init,
      retries: this.#config.retries || DEFAULT_RETRIES,
      retryDelay: (attempt, err, response) => {
        let delay;
        if (response?.headers?.has('Retry-After')) {
          delay = response.headers.get('Retry-After') * SEC_IN_MS;
        } else {
          // calculate an exponential backoff, for some reason eslint prefers ** to Math.pow
          delay = attempt ** 2 * SEC_IN_MS;
        }
        this.#log.info('Retrying request', {
          err,
          attempt,
          delay,
          status: response?.status,
          url: response?.url,
          method: init.method || 'GET',
          headers: init.headers,
        });
        return delay;
      },
      retryOn: this.#config.retryOn || DEFAULT_RETRY_ON,
    });
  }
}
