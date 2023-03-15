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

/**
 * @typedef {Object} UniversalishContext
 * @property {Record<string,string>} env
 * @property {Logger} log
 * @property {{event: any}} [invocation]
 */

/**
 * @typedef {Object} QueueRecord
 * @property {string} messageId
 * @property {string} receiptHandle
 * @property {string} body
 * @property {Record<string,any>} attributes
 * @property {Record<string,any>} messageAttributes
 * @property {string} eventSource
 * @property {string} eventSourceARN
 */

/**
 * @typedef {Object} Logger
 * @property {function(...any[]):void} debug
 * @property {function(...any[]):void} info
 * @property {function(...any[]):void} warn
 * @property {function(...any[]):void} error
 */

/**
 * Loads the configuration keys from an environment variable map
 * @param {UniversalishContext} context the context from which to retrieve
 *      environment variables map
 * @returns the configuration to use for providing credentials to AWS clients
 */
export function extractAwsConfig(context) {
  const { env } = context;
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
 * Get the logger from the context or return the console
 * @param {UniversalishContext} context
 * @returns {Logger}
 */
export function getLog(context) {
  return context.log || console;
}

/**
 * Gets the original event that triggered the Lambda
 * @param {UniversalishContext} context
 * @returns {any} the original invocation event for the Lambda
 */
export function extractOriginalEvent(context) {
  return context.invocation?.event;
}

/**
 * Gets the SQS records from the context
 * @param {UniversalishContext} context
 * @returns {Array<QueueRecord>} the SQS record payload
 */
export function extractSqsRecords(context) {
  return extractOriginalEvent(context)?.Records || [];
}
