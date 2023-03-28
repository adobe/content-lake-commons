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
import { randomUUID } from 'crypto';
// eslint-disable-next-line no-unused-vars
import { BlobStorage } from './blob-storage.js';

/**
 * @typedef QueueConfig
 * @property {BlobStorage} [blobStorage]
 * @property {SQSClient} [client]
 * @property {Object} credentials
 * @property {string} credentials.accessKeyId
 * @property {string} credentials.secretAccessKey
 * @property {*} [logger]
 * @property {string} queueUrl
 * @property {string} [region]
 */

const MAX_MESSAGE_LEN = 127000; // 127 KB

export class QueueClient {
  /**
   * @type {BlobStorage | undefined}
   */
  #blobStorage;

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
    this.client = config.client || new SQSClient(config);
    this.#blobStorage = config.blobStorage;
    this.#queueUrl = config.queueUrl;
  }

  /**
   * Serializes the specified message to a string, saving to blob storage
   * if the message exceeds the max size
   * @param {Object} message the message to serialize
   * @returns {Promise<string>} the message serialized as a string
   */
  async #serializeMessage(message) {
    const json = JSON.stringify(message);
    const size = Buffer.byteLength(json);
    if (size < MAX_MESSAGE_LEN) {
      this.#logger.debug('Message size is below max size, returning JSON', {
        size,
      });
      return json;
    } else if (this.#blobStorage) {
      const key = randomUUID();
      this.#logger.debug(
        'Message size is above max size, saving to blob storage',
        {
          size,
          key,
        },
      );
      await this.#blobStorage.save(key, Buffer.from(json));
      return JSON.stringify({ blobStorage: true, key });
    } else {
      this.#logger.error(
        'Message size exceeds maximum and no blob storage provided',
        { size },
      );
      throw new Error(
        `Message size ${size} exceeds maximum and no blob storage provided`,
      );
    }
  }

  /**
   * Reads the message, reading from blob storage if required
   * @param {string} messageBody
   * @returns {Promise<Object>}
   */
  async readMessageBody(messageBody) {
    const json = JSON.parse(messageBody);
    if (!json.blobStorage) {
      this.#logger.debug('Message does not use blob storage');
      return json;
    } else if (this.#blobStorage) {
      const { key } = json;
      this.#logger.debug('Retrieving message from blob storage', { key });
      return JSON.parse(await this.#blobStorage.getString(key));
    } else {
      throw new Error(
        'Message stored in blob storage, but no blob storage client provided',
      );
    }
  }

  /**
   * Sends the specified message to the queue
   * @param {Object} message the message to send
   * @returns {Promise<string>} the message id
   */
  async sendMessage(message) {
    try {
      this.#logger.debug('Enqueing message', {
        message,
        queueUrl: this.#queueUrl,
      });
      const messageBody = await this.#serializeMessage(message);
      const res = await this.client.send(
        new SendMessageCommand({
          QueueUrl: this.#queueUrl,
          MessageBody: messageBody,
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
