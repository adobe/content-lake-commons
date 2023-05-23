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
import { SCHEMA_INGESTION_REQUEST, SchemaValidator } from '../src/schema-validator.js';

const SMALL_REQ = {
  data: {
    sourceAssetId: '2D155092-F458-4DDC-A00C-3B003C55EF54',
    sourceId: 'site.sharepoint.com:/sites/ASite',
    sourceType: 'microsoft',
    name: 'testFile.png',
    size: -1,
  },
  binary: {
    url: 'https://site.sharepoint.com/sites/ASite/_layouts/15/download.aspx?UniqueId=SOMEID\u0026Translate=false\u0026tempauth=SOMEJWT',
  },
  jobId: '123',
  batchId: '2023-03-15T16:23:22.149Z',
  requestId: '4556',
  companyId: 'test',
  spaceId: 'test',
};

describe('Schema Validator Tests', () => {
  const validator = new SchemaValidator();
  describe('validateIngestionRequest', () => {
    it('validates full object', async () => {
      await validator.validateRequest(
        {
          data: {
            sourceAssetId: '2D155092-F458-4DDC-A00C-3B003C55EF54',
            sourceId: 'site.sharepoint.com:/sites/ASite',
            sourceType: 'microsoft',
            sourceUrl:
              'https://site.sharepoint.com/sites/ASite/_layouts/15/Doc.aspx?sourcedoc=someid\u0026file=somefile.png\u0026action=default\u0026mobileredirect=true',
            name: 'somefile.png',
            size: 36699,
            created: '2017-03-06T22:41:31Z',
            createdBy: 'testuser@adobe.com',
            lastModified: '2017-03-24T05:59:37Z',
            lastModifiedBy: 'testuser2@adobe.com',
            path: '/sites/ASite/somepath/somefile.png',
          },
          sourceMetadata: {
            title: 'My Cool file title!',
          },
          binary: {
            url: 'https://site.sharepoint.com/sites/ASite/_layouts/15/download.aspx?UniqueId=SOMEID\u0026Translate=false\u0026tempauth=SOMEJWT',
          },
          jobId: '123',
          batchId: '2023-03-15T16:23:22.149Z',
          requestId: '4556',
          companyId: 'test',
          spaceId: 'test',
        },
        SCHEMA_INGESTION_REQUEST,
      );
    });

    it('validates limited object', async () => {
      await validator.validateRequest(SMALL_REQ, SCHEMA_INGESTION_REQUEST);
    });

    it('fails on unexpected keys', async () => {
      let caught;
      try {
        await validator.validateIngestionRequest({
          ...SMALL_REQ,
          iLikeNewKeys: true,
        });
      } catch (err) {
        caught = err;
      }
      assert.ok(caught);
    });

    it('fails on missing fields', async () => {
      let caught;
      try {
        await validator.validateIngestionRequest({
          ...SMALL_REQ,
          companyId: undefined,
        });
      } catch (err) {
        caught = err;
      }
      assert.ok(caught);
    });

    it('can specify additional required fields', async () => {
      let caught;
      try {
        await validator.validateIngestionRequest(SMALL_REQ, ['version']);
      } catch (err) {
        caught = err;
      }
      assert.ok(caught);
    });
  });
});
