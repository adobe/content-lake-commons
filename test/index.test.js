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
import {
  BlobStorage,
  contextHelper,
  ContextHelper,
  FetchRetry,
  mocks,
  QueueClient,
  RestError,
  Router,
  SchemaValidator,
  SecretsManager,
  Security,
} from '../src/index.js';

describe('Index Tests', () => {
  it('export BlobStorage is present', async () => {
    assert.ok(BlobStorage);
  });

  it('export contextHelper is present', async () => {
    assert.ok(contextHelper);
  });

  it('export ContextHelper is present', async () => {
    assert.ok(ContextHelper);
  });

  it('export FetchRetry is present', async () => {
    assert.ok(FetchRetry);
  });

  it('export mocks is present', async () => {
    assert.ok(mocks);
    assert.ok(mocks.LocalSearchIndexStorage);
    assert.ok(mocks.MockQueueClient);
    assert.ok(mocks.MockSecretsManager);
  });

  it('export QueueClient is present', async () => {
    assert.ok(QueueClient);
  });

  it('export RestError is present', async () => {
    assert.ok(RestError);
  });

  it('export Router is present', async () => {
    assert.ok(Router);
  });

  it('export SchemaValidator is present', async () => {
    assert.ok(SchemaValidator);
  });

  it('export SecretsManager is present', async () => {
    assert.ok(SecretsManager);
  });

  it('export Security is present', async () => {
    assert.ok(Security);
  });
});
