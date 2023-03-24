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
});
