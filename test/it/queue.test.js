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
import dotenv from 'dotenv';
import {
  PurgeQueueCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';
import util from 'util';
import { QueueClient } from '../../src/queue.js';
import { extractAwsConfig } from '../../src/context.js';

dotenv.config();

const sleep = util.promisify(setTimeout);

const DEFAULT_CONFIG = {
  ...extractAwsConfig(process),
  logger: console,
  queueUrl: process.env.QUEUE_URL,
};

const SLOW_TEST_TIMEOUT = 5000;

describe('Queue Integration Tests', () => {
  it('will use default logger', async () => {
    const queueClient = new QueueClient({
      ...DEFAULT_CONFIG,
      logger: undefined,
    });
    const id = await queueClient.sendMessage({ message: 'Hello World' });
    assert.ok(id);
  });

  describe('send message', () => {
    it('can send message', async () => {
      const queueClient = new QueueClient(DEFAULT_CONFIG);
      const id = await queueClient.sendMessage({ message: 'Hello World' });
      assert.ok(id);
    });

    it('will fail with invalid queue', async () => {
      const queueClient = new QueueClient({
        ...DEFAULT_CONFIG,
        queueUrl: 'http://notaqueue.com',
      });
      let caught;
      try {
        await queueClient.sendMessage({ message: 'Hello World' });
      } catch (err) {
        caught = err;
      }
      assert.ok(caught);
    });

    it('will fail on oversized message', async () => {
      const queueClient = new QueueClient(DEFAULT_CONFIG);
      let caught;
      try {
        const message = [];
        for (let i = 0; i < 4086; i += 1) {
          message.push(
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse nec nisl massa. Morbi at erat elementum, dignissim quam at.',
          );
        }
        await queueClient.sendMessage(message);
      } catch (err) {
        caught = err;
      }
      assert.ok(caught);
    }).timeout(SLOW_TEST_TIMEOUT);

    after(async () => {
      const queueClient = new QueueClient(DEFAULT_CONFIG);
      await queueClient.client
        .send(
          new PurgeQueueCommand({
            QueueUrl: process.env.QUEUE_URL,
          }),
        )
        .catch(() => {});
    });
  });

  describe('remove message', () => {
    it('will not fail on invalid recieptHandle', async () => {
      const queueClient = new QueueClient(DEFAULT_CONFIG);
      let caught;
      try {
        await queueClient.removeMessage('notvalid');
      } catch (err) {
        caught = err;
      }
      assert.ok(caught);
    });

    it('can remove message by recieptHandle', async () => {
      const queueClient = new QueueClient(DEFAULT_CONFIG);
      await queueClient.client.send(
        new SendMessageCommand({
          QueueUrl: process.env.QUEUE_URL,
          MessageBody: JSON.stringify({ message: 'Hello world' }),
        }),
      );
      await sleep(2000);
      const messages = await queueClient.client.send(
        new ReceiveMessageCommand({
          QueueUrl: process.env.QUEUE_URL,
        }),
      );
      const { ReceiptHandle } = messages.Messages[0];
      assert.ok(ReceiptHandle);
      await queueClient.removeMessage(ReceiptHandle);
    }).timeout(5000);
  });
});
