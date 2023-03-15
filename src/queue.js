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
import {
  DeleteMessageCommand,
  SQSClient,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';

/**
 * @typedef QueueConfig
 * @property {SQSClient} [client]
 * @property {Object} credentials
 * @property {string} credentials.accessKeyId
 * @property {string} credentials.secretAccessKey
 * @property {*} [logger]
 * @property {string} queueUrl
 * @property {string} [region]
 */

export class QueueClient {
  /**
   * @type {SQSClient}
   */
  client;

  #logger;

  /**
   * @type {string}
   */
  #queueUrl;

  /**
   * @param {QueueConfig} config
   */
  constructor(config) {
    this.#logger = config.logger || console;
    this.#queueUrl = config.queueUrl;
    this.client = config.client || new SQSClient(config);
  }

  async sendMessage(message) {
    try {
      this.#logger.debug('Enqueing message', {
        message,
        queueUrl: this.#queueUrl,
      });
      const res = await this.client.send(
        new SendMessageCommand({
          QueueUrl: this.#queueUrl,
          MessageBody: JSON.stringify(message),
        }),
      );
      const { MessageId } = res;
      this.#logger.debug('Message enqueued successfully', {
        message,
        queueUrl: this.#queueUrl,
        MessageId,
      });
      return MessageId;
    } catch (err) {
      this.#logger.error('Failed to queue message', {
        err,
        message,
        queueUrl: this.#queueUrl,
      });
      throw err;
    }
  }

  /**
   * Removes a message by it's recpeit handle
   * @param {string} receiptHandle
   */
  async removeMessage(receiptHandle) {
    const queueUrl = this.#queueUrl;
    try {
      this.#logger.debug('Removing message', {
        receiptHandle,
        queueUrl,
      });
      await this.client.send(
        new DeleteMessageCommand({
          QueueUrl: this.#queueUrl,
          ReceiptHandle: receiptHandle,
        }),
      );
      this.#logger.debug('Message removed successfully', {
        receiptHandle,
        queueUrl,
      });
    } catch (err) {
      this.#logger.error('Failed to remove message', {
        err,
        receiptHandle,
        queueUrl,
      });
      throw err;
    }
  }
}
