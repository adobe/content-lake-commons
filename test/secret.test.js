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
import { SecretsManager } from '../src/secret.js';
import { MockAwsClient } from './mocks/aws-client.js';

describe('SecretsManager Unit Tests', () => {
  it('can get manager', () => {
    const manager = new SecretsManager('test-ns', {
      client: new MockAwsClient(),
    });
    assert.ok(manager);
  });

  it('can get secret', async () => {
    const mockClient = new MockAwsClient();
    const manager = new SecretsManager({
      client: mockClient,
      application: 'test-app',
    });
    mockClient.resp = {
      SecretString: 'test-secret',
    };
    const resp = await manager.getSecret('test-id');
    assert.strictEqual(resp, 'test-secret');
    assert.strictEqual(
      mockClient.req.input.SecretId,
      'prod/shared/test-app/test-id',
    );
  });

  it('can put secret', async () => {
    const mockClient = new MockAwsClient();
    const manager = new SecretsManager({
      client: mockClient,
      application: 'test-app',
    });
    await manager.putSecret('test-id', 'test-secret');
    assert.strictEqual(
      mockClient.req.input.SecretId,
      'prod/shared/test-app/test-id',
    );
    assert.strictEqual(mockClient.req.input.SecretString, 'test-secret');
  });

  it('can change app and scope', async () => {
    const mockClient = new MockAwsClient();
    const manager = new SecretsManager({
      client: mockClient,
      application: 'test-app2',
      companyId: 'test-company',
      scope: 'test',
    });
    await manager.putSecret('test-id', 'test-secret');
    assert.strictEqual(
      mockClient.req.input.SecretId,
      'test/test-company/test-app2/test-id',
    );
    assert.strictEqual(mockClient.req.input.SecretString, 'test-secret');
  });

  it('can delete secret', async () => {
    const mockClient = new MockAwsClient();
    const manager = new SecretsManager({
      client: mockClient,
      application: 'test-app',
    });
    await manager.deleteSecret('test-id');
    assert.strictEqual(
      mockClient.req.input.SecretId,
      'prod/shared/test-app/test-id',
    );
  });
});
