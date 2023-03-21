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
import { contextHelper } from '../src/index.js';
import { ContextHelper } from '../src/context.js';

describe('Context Tests', () => {
  describe('getLog', () => {
    it('falls back to console', () => {
      assert.ok(contextHelper.getLog({}));
    });

    it('will use from context', () => {
      assert.strictEqual(contextHelper.getLog({ log: 'test' }), 'test');
    });
  });

  describe('getEnv', () => {
    it('falls back to empty object', () => {
      const helper = new ContextHelper({});
      assert.ok(helper.getEnv());
    });

    it('returns env', () => {
      const helper = new ContextHelper({ env: { test: 'is true' } });
      assert.strictEqual(helper.getEnv().test, 'is true');
    });
  });

  describe('get original event', () => {
    it('will not fail if not present', () => {
      assert.ok(!contextHelper.extractOriginalEvent({}));
    });

    it('will extract original event', () => {
      const res = contextHelper.extractOriginalEvent({
        invocation: { event: 'test' },
      });
      assert.strictEqual(res, 'test');
    });
  });

  describe('get sqs records', () => {
    it('will not fail if not present', () => {
      assert.ok(contextHelper.extractSqsRecords({}));
    });

    it('will extract records', () => {
      const res = contextHelper.extractSqsRecords({
        invocation: {
          event: {
            Records: [
              {
                messageId: 'af88e691-c3a6-4b46-b4d2-1c897b41b600',
                receiptHandle:
                  'AQEBJCLTpWgDm+oaeBAlSKWumzIoFRHeJglHCwWEfJANgc7GSWQBcYTiLPfbO1IuxAIkJagUIEkqgmszqnj2a7hLZjoIcv0AWCQfL0tmje/hhnDWYKdQmrUmfITdPDIg49XI+n+Ub/gKjXEy3VvunLsp0bxuF33OCsR8+N0Skff+U+zan+42GcHtn8lacm6ZQIF9msoFxszourA+zpJ/DJ1DTMlEpr9cSPxa6nsbg7JHOOwBzWknn7d3Zkimuo/J3shMyb+4fBYFRNpzXt9o9l8rfQpi9JZDwGIFRqDYFvpI0Emqv9ke1V2uBAJPiiGS0h1MIKO6dZZ/ejfWAR0Rug3zMEH9SEa6N+hT4gF5Pu2IN6WmcRhE4sh0jW/ImAAunuIo/OZ1FhNjqp+keK3AvBiPiQ==',
                body: '{"message":"Hello World"}',
                attributes: {
                  ApproximateReceiveCount: '1',
                  SentTimestamp: '1678764328689',
                  SenderId: 'AIDAXXYBVS2FJDJXJ56HK',
                  ApproximateFirstReceiveTimestamp: '1678764328690',
                },
                messageAttributes: {},
                md5OfBody: 'd7e5fb40d1b43e304158449c3ecd6e5c',
                eventSource: 'aws:sqs',
                eventSourceARN:
                  'arn:aws:sqs:us-east-1:532042585738:content-lake-it',
                awsRegion: 'us-east-1',
              },
            ],
          },
        },
      });
      assert.strictEqual(res.length, 1);
      assert.strictEqual(
        res[0].messageId,
        'af88e691-c3a6-4b46-b4d2-1c897b41b600',
      );
    });
  });

  describe('isSqsRequest', () => {
    it('will not fail if undefined', () => {
      const helper = new ContextHelper({});
      assert.ok(!helper.isSqsRequest());
    });

    it('will not fail if not present', () => {
      const helper = new ContextHelper({
        invocation: { event: {} },
      });
      assert.ok(!helper.isSqsRequest());
    });

    it('will return true on empty records array', () => {
      const helper = new ContextHelper({
        invocation: {
          event: {
            Records: [],
          },
        },
      });
      assert.ok(helper.isSqsRequest());
    });

    it('will extract records', () => {
      const helper = new ContextHelper({
        invocation: {
          event: {
            Records: [
              {
                messageId: 'af88e691-c3a6-4b46-b4d2-1c897b41b600',
                receiptHandle:
                  'AQEBJCLTpWgDm+oaeBAlSKWumzIoFRHeJglHCwWEfJANgc7GSWQBcYTiLPfbO1IuxAIkJagUIEkqgmszqnj2a7hLZjoIcv0AWCQfL0tmje/hhnDWYKdQmrUmfITdPDIg49XI+n+Ub/gKjXEy3VvunLsp0bxuF33OCsR8+N0Skff+U+zan+42GcHtn8lacm6ZQIF9msoFxszourA+zpJ/DJ1DTMlEpr9cSPxa6nsbg7JHOOwBzWknn7d3Zkimuo/J3shMyb+4fBYFRNpzXt9o9l8rfQpi9JZDwGIFRqDYFvpI0Emqv9ke1V2uBAJPiiGS0h1MIKO6dZZ/ejfWAR0Rug3zMEH9SEa6N+hT4gF5Pu2IN6WmcRhE4sh0jW/ImAAunuIo/OZ1FhNjqp+keK3AvBiPiQ==',
                body: '{"message":"Hello World"}',
                attributes: {
                  ApproximateReceiveCount: '1',
                  SentTimestamp: '1678764328689',
                  SenderId: 'AIDAXXYBVS2FJDJXJ56HK',
                  ApproximateFirstReceiveTimestamp: '1678764328690',
                },
                messageAttributes: {},
                md5OfBody: 'd7e5fb40d1b43e304158449c3ecd6e5c',
                eventSource: 'aws:sqs',
                eventSourceARN:
                  'arn:aws:sqs:us-east-1:532042585738:content-lake-it',
                awsRegion: 'us-east-1',
              },
            ],
          },
        },
      });
      assert.ok(helper.isSqsRequest());
    });
  });

  describe('extractAwsConfig', () => {
    it('wont fail if not present', () => {
      assert.ok(contextHelper.extractAwsConfig({ env: {} }));
    });

    it('can load without session token', () => {
      const creds = contextHelper.extractAwsConfig({
        env: {
          AWS_ACCESS_KEY_ID: 'key',
          AWS_ACCESS_SECRET_KEY: 'secret',
        },
      });
      assert.ok(creds.credentials);
      assert.strictEqual('key', creds.credentials.accessKeyId);
      assert.strictEqual('secret', creds.credentials.secretAccessKey);
    });

    it('can load with session token', () => {
      const creds = contextHelper.extractAwsConfig({
        env: {
          AWS_ACCESS_KEY_ID: 'key',
          AWS_ACCESS_SECRET_KEY: 'secret',
          AWS_SESSION_TOKEN: 'session',
        },
      });
      assert.ok(creds.credentials);
      assert.strictEqual('key', creds.credentials.accessKeyId);
      assert.strictEqual('secret', creds.credentials.secretAccessKey);
      assert.strictEqual('session', creds.credentials.sessionToken);
    });
  });

  describe('getFunctionIdentifier', () => {
    it('can get function identifier', () => {
      const helper = new ContextHelper({
        func: {
          name: 'test',
          version: 1,
        },
      });
      const identifer = helper.getFunctionIdentifier();
      assert.strictEqual(identifer, 'test:1');
    });
    it('function identifer falls back to default', () => {
      const helper = new ContextHelper({});
      const identifer = helper.getFunctionIdentifier();
      assert.strictEqual(identifer, 'unknown:1');
    });
  });

  describe('getRequestId', () => {
    it('can get request id', () => {
      const helper = new ContextHelper({
        invocation: {
          requestId: 'test',
        },
      });
      const id = helper.getRequestId();
      assert.strictEqual(id, 'test');
    });

    it('request id defaults to random value', () => {
      const helper = new ContextHelper({});
      const id = helper.getRequestId();
      assert.ok(id);
    });
  });

  describe('getTransactionId', () => {
    it('can get transaction id', () => {
      const helper = new ContextHelper({
        invocation: {
          transactionId: 'test',
        },
      });
      const id = helper.getTransactionId();
      assert.strictEqual(id, 'test');
    });

    it('transactionId id defaults to random value', () => {
      const helper = new ContextHelper();
      const id = helper.getTransactionId();
      assert.ok(id);
    });
  });
});
