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
import { getMimeType } from '../src/mimetype.js';

describe('mimetype', () => {
  it('can get mimetype from extension', () => {
    const job = {
      data: {
        name: 'test.jpg',
      },
    };
    const mimeType = getMimeType(job);
    assert.strictEqual(mimeType, 'image/jpeg');
  });
  it('can get mimetype from mimetype being passed in directly', () => {
    const job = {
      data: {
        mimeType: 'image/jpeg',
      },
    };
    const mimeType = getMimeType(job);
    assert.strictEqual(mimeType, 'image/jpeg');
  });
  it('will prefer mimetype via extension over directly passing it in', () => {
    const job = {
      data: {
        mimeType: 'image/png',
        name: 'file.jpeg',
      },
    };
    const mimeType = getMimeType(job);
    assert.strictEqual(mimeType, 'image/jpeg');
  });
  it('special mimetype for illustrator files', () => {
    const job = {
      data: {
        name: 'file.ai',
      },
    };
    const mimeType = getMimeType(job);
    assert.strictEqual(mimeType, 'application/vnd.adobe.illustrator');
  });
  it('gets mimetype for psd files', () => {
    const job = {
      data: {
        name: 'file.psd',
      },
    };
    const mimeType = getMimeType(job);
    assert.strictEqual(mimeType, 'image/vnd.adobe.photoshop');
  });
  it('gets mimetype for pdf files', () => {
    const job = {
      data: {
        name: 'file.pdf',
      },
    };
    const mimeType = getMimeType(job);
    assert.strictEqual(mimeType, 'application/pdf');
  });
  it('default to `application/octet-stream` if no valid extension', () => {
    const job = {
      data: {
        name: 'file.invalid',
      },
    };
    const mimeType = getMimeType(job);
    assert.strictEqual(mimeType, 'application/octet-stream');
  });
  it('default to `application/octet-stream` if no file name or mimetype passed in the job object', () => {
    const job = {
      file: 'file.jpg',
    };
    const mimeType = getMimeType(job);
    assert.strictEqual(mimeType, 'application/octet-stream');
  });
});
