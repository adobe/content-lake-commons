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

import { randomUUID } from 'crypto';

/**
 * @typedef {Object} UniversalishContext
 * @property {Record<string,string>} [env]
 * @property {{name:string,version:string}} [func]
 * @property {import('./common-typedefs.js').Logger} [log]
 * @property {{event:any,transactionId:string,requestId:string}} [invocation]
 */

/**
 * A helper for working with the Franklin Universal context
 */
export class ContextHelper {
  /**
   * @type {UniversalishContext}
   */
  #context;

  /**
   * @param {UniversalishContext} context
   */
  constructor(context) {
    this.#context = context || {};
  }

  /**
   * Loads the configuration keys from an environment variable map
   * @returns {import('./common-typedefs.js').AwsConfig} sthe configuration to use for
   *    providing credentials to AWS clients
   */
  extractAwsConfig() {
    const env = this.getEnv();
    const config = {
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_ACCESS_SECRET_KEY || env.AWS_SECRET_ACCESS_KEY,
      },
      region: env.AWS_REGION,
    };
    if (env.AWS_SESSION_TOKEN) {
      config.credentials.sessionToken = env.AWS_SESSION_TOKEN;
    }
    return config;
  }

  /**
   * Gets the original event that triggered the Lambda
   * @returns {any} the original invocation event for the Lambda
   */
  extractOriginalEvent() {
    return this.#context.invocation?.event;
  }

  /**
   * Gets the queue records from the context
   * @returns {Array<import('./queue.js').QueueRecord>} the queue records
   */
  extractQueueRecords() {
    return this.extractOriginalEvent()?.Records || [];
  }

  /**
   * Get the environment variables
   * @returns {Record<string,string|undefined>} the environment variables
   */
  getEnv() {
    return this.#context.env || {};
  }

  /**
   * Get an identifier for the current function including name and version.
   * @returns {string} the identifier in the format [name]:[version]
   */
  getFunctionIdentifier() {
    const { func } = this.#context;
    return `${func?.name || 'unknown'}:${func?.version || '1'}`;
  }

  /**
   * @returns {string} the request id or a new random UUID
   */
  getRequestId() {
    return this.#context.invocation?.requestId || randomUUID();
  }

  /**
   * @returns {string} the transaction id (for connecting multiple requests) or a new random UUID
   */
  getTransactionId() {
    return this.#context.invocation?.transactionId || randomUUID();
  }

  /**
   * Get the logger from the context or return the console
   * @returns {import('@adob')}
   */
  getLog() {
    return this.#context.log || console;
  }

  /**
   * Check whether or not this is a request contains Records from a queue
   * @returns {boolean}
   */
  isQueueRequest() {
    return typeof this.extractOriginalEvent()?.Records !== 'undefined';
  }
}

/**
 * @deprecated
 */
export function extractAwsConfig(context) {
  return new ContextHelper(context).extractAwsConfig();
}

/**
 * @deprecated
 */
export function getLog(context) {
  return new ContextHelper(context).getLog();
}

/**
 * @deprecated
 */
export function extractOriginalEvent(context) {
  return new ContextHelper(context).extractOriginalEvent();
}

/**
 * @deprecated
 */
export function extractSqsRecords(context) {
  return new ContextHelper(context).extractQueueRecords();
}
