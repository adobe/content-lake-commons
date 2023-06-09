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

/* eslint-env mocha */
import assert from 'assert';
import { QueueClient } from '../src/queue.js';
import { MockAwsClient } from './mocks/aws-client.js';

const LARGE_MESSAGE = {
  // generates a 128KB string by joining the alphabet 5120 times
  msg: [...Array(5120)].map(() => 'abcdefghijklmnopqrstuvwxyz').join(''),
};

describe('QueueClient Unit Tests', () => {
  it('can get client', () => {
    const client = new QueueClient({});
    assert.ok(client);
  });

  it('can send message', async () => {
    const mockClient = new MockAwsClient();
    const client = new QueueClient({
      client: mockClient,
      queueUrl: 'http://www.queue.com',
    });
    mockClient.resp = {
      MessageId: 'test-id',
    };
    const resp = await client.sendMessage({ message: 'Hello World!' });
    assert.strictEqual(resp, 'test-id');
    assert.strictEqual(
      JSON.parse(mockClient.req.input.MessageBody).message,
      'Hello World!',
    );
  });

  it('throws on create message failure', async () => {
    const mockClient = {
      send: () => {
        throw new Error('FAIL');
      },
    };
    const client = new QueueClient({
      client: mockClient,
      queueUrl: 'http://www.queue.com',
    });
    let caught;
    try {
      await client.sendMessage({ message: 'Hello World!' });
    } catch (err) {
      caught = err;
    }
    assert.ok(caught);
  });

  it('can remove message', async () => {
    const mockClient = new MockAwsClient();
    const client = new QueueClient({
      client: mockClient,
      queueUrl: 'http://www.queue.com',
    });
    await client.removeMessage('test-handle');
    assert.strictEqual(mockClient.req.input.ReceiptHandle, 'test-handle');
  });

  it('remove handles throws', async () => {
    const mockClient = {
      send: () => {
        throw new Error('FAIL');
      },
    };
    const client = new QueueClient({
      client: mockClient,
      queueUrl: 'http://www.queue.com',
    });
    let caught;
    try {
      await client.removeMessage('test-handle');
    } catch (err) {
      caught = err;
    }
    assert.ok(caught);
  });

  it('fails on large message if no blob storage provided', async () => {
    const mockClient = new MockAwsClient();
    const client = new QueueClient({
      client: mockClient,
      queueUrl: 'http://www.queue.com',
    });

    let caught;
    try {
      await client.sendMessage(LARGE_MESSAGE);
    } catch (err) {
      caught = err;
    }
    assert.ok(caught);
  });

  it('can send large messages', async () => {
    const mockClient = new MockAwsClient();

    const blobs = {};
    const mockBlobStorage = {
      save: (key, buf) => {
        blobs[key] = buf.toString('utf-8');
      },
    };
    const client = new QueueClient({
      client: mockClient,
      queueUrl: 'http://www.queue.com',
      blobStorage: mockBlobStorage,
    });
    mockClient.resp = {
      MessageId: 'test-id',
    };

    await client.sendMessage(LARGE_MESSAGE);
    const messageBody = JSON.parse(mockClient.req.input.MessageBody);
    assert.strictEqual(messageBody.blobStorage, true);
    assert.ok(messageBody.key);
    assert.ok(blobs[messageBody.key]);
    assert.strictEqual(blobs[messageBody.key].message, LARGE_MESSAGE.message);
  });

  it('can read large messages', async () => {
    const mockClient = new MockAwsClient();

    const blobs = { test: JSON.stringify(LARGE_MESSAGE) };
    const mockBlobStorage = {
      getString: (key) => blobs[key],
    };
    const client = new QueueClient({
      client: mockClient,
      queueUrl: 'http://www.queue.com',
      blobStorage: mockBlobStorage,
    });

    const messageBody = await client.readMessageBody(
      JSON.stringify({
        blobStorage: true,
        key: 'test',
      }),
    );
    assert.strictEqual(messageBody.message, LARGE_MESSAGE.message);
  });

  it('can read normal sized messages', async () => {
    const mockClient = new MockAwsClient();

    const client = new QueueClient({
      client: mockClient,
      queueUrl: 'http://www.queue.com',
    });

    const messageBody = await client.readMessageBody(
      JSON.stringify({
        message: 'Hello World!',
      }),
    );
    assert.strictEqual(messageBody.message, 'Hello World!');
  });

  it('will fail to read large message if no blob storage provided', async () => {
    const mockClient = new MockAwsClient();

    const client = new QueueClient({
      client: mockClient,
      queueUrl: 'http://www.queue.com',
    });

    let caught;
    try {
      await client.readMessageBody(
        JSON.stringify({
          blobStorage: true,
          key: 'test',
        }),
      );
    } catch (err) {
      caught = err;
    }
    assert.ok(caught);
  });
});
