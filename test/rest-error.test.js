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
/* eslint-disable no-await-in-loop */
/* eslint-env mocha */
import assert from 'assert';
import { RestError } from '../src/rest-error.js';

describe('REST Error Tests', () => {
  it('can construct error', async () => {
    const err = new RestError(418, 'A problem!');
    assert.strictEqual(err.status, 418);
    assert.strictEqual(err.detail, 'A problem!');
    assert.strictEqual(err.message, 'A problem!');
  });

  it('can get error as problem', async () => {
    const err = new RestError(400, 'A problem!');
    err.instance = 'test_instance';
    err.unmappedfield = 'ruh ruh';

    const resp = RestError.toProblemResponse(err);
    assert.strictEqual(resp.status, 400);
    const body = await resp.json();
    assert.strictEqual(body.title, 'Bad Request');
    assert.strictEqual(body.instance, 'test_instance');
    assert.equal(body.unmappedfield, undefined);
    assert.strictEqual(body.detail, 'A problem!');
    assert.strictEqual(body.status, 400);
  });

  it('will get title from status', async () => {
    const err = new RestError(502, 'A problem!');
    const resp = RestError.toProblemResponse(err);
    const body = await resp.json();
    assert.strictEqual(body.title, 'Bad Gateway');
  });

  it('handles unknown status', async () => {
    const err = new RestError(418, 'A problem!');
    const resp = RestError.toProblemResponse(err);
    const body = await resp.json();
    assert.strictEqual(body.title, 'Unknown Problem');
  });
});
