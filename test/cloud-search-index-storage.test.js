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
import { randomUUID } from 'crypto';
import assert from 'assert';
import { config } from 'dotenv';
import { stub } from 'sinon';
import { MockAlgoliaSearch } from './mocks/mock-algoliasearch.js';
import { CloudSearchIndexStorage } from '../src/cloud-search-index-storage.js';

config();

/**
 * Generates a non-cryptographically-secure string of random alphanumeric characters of
 * the specified length.
 * @param {*} length length of the string to generate
 * @returns random string
 */
function randomString(length) {
  let buf = '';
  while (buf.length < length) {
    buf += Math.random().toString(36).slice(2);
  }
  buf = buf.substring(0, length);
  return buf;
}

function generateContentRecord() {
  return {
    jobId: randomUUID(),
    contentHash: randomString(32),
    thumbnailHash: randomString(32),
    sourceId: randomUUID(),
    sourceAssetId: randomUUID(),
    sourceName: 'pickle.png',
    sourcePath: '/test/pickle.png',
    lastModified: new Date().toISOString(),
    file: '/content/dam/pickle.png',
    type: 'image',
    size: 12345,
    width: 200,
    height: 600,
    sourceType: 's3',
    companyId: randomUUID(),
    spaceId: randomUUID(),
    assetIdentity: randomUUID(),
    tags: ['tag1', 'tag1'],
    caption: 'A really cool image of a pickle',
    color: 'silver',
    sourceUrl: 'https://my.aemassets.net/content/dam/pickle.png',
    randomField: 'randomValue',
  };
}

function mockContext() {
  return {
    env: {
      ALGOLIA_APP_NAME: 'appname',
      ALGOLIA_API_KEY: 'apikey',
      ALGOLIA_CI_INDEX: 'indexname',
    },
    log: console,
  };
}

describe('Cloud Search Index Storage tests', async () => {
  it('Use comapny name as the index name: `company-*`', async () => {
    const context = {
      env: {
        ALGOLIA_APP_NAME: 'appname',
        ALGOLIA_API_KEY: 'apikey',
      },
      log: console,
    };
    const searchIndexStorage = new CloudSearchIndexStorage(context, 'test-company-id');
    assert.strictEqual(searchIndexStorage.getIndexName(), 'company-test-company-id');
  });

  it('Save a record in cloud search index storage and check it exists', async () => {
    stub(CloudSearchIndexStorage.prototype, 'getClient').returns(new MockAlgoliaSearch());
    const searchIndexStorage = new CloudSearchIndexStorage(mockContext());
    const contentRecord = generateContentRecord();
    const saveResult = await searchIndexStorage.save(contentRecord);
    assert.notEqual(undefined, saveResult);

    const exists = await searchIndexStorage.exists({
      contentHash: contentRecord.contentHash,
      sourceAssetId: contentRecord.sourceAssetId,
    });
    assert.strictEqual(exists.length, 1);
    assert.strictEqual(exists[0].contentHash, contentRecord.contentHash);
    assert.strictEqual(exists[0].thumbnailHash, contentRecord.thumbnailHash);
    assert.strictEqual(exists[0].sourceId, contentRecord.sourceId);
    assert.strictEqual(exists[0].sourceAssetId, contentRecord.sourceAssetId);
    assert.strictEqual(exists[0].sourceName, contentRecord.sourceName);
    assert.strictEqual(exists[0].sourcePath, contentRecord.sourcePath);
    assert.strictEqual(exists[0].file, contentRecord.file);
    assert.strictEqual(exists[0].type, contentRecord.type);
    assert.strictEqual(exists[0].width, contentRecord.width);
    assert.strictEqual(exists[0].height, contentRecord.height);
    assert.strictEqual(exists[0].sourceType, contentRecord.sourceType);
    assert.strictEqual(exists[0].companyId, contentRecord.companyId);
    assert.strictEqual(exists[0].spaceId, contentRecord.spaceId);
    assert.strictEqual(exists[0].assetIdentity, contentRecord.assetIdentity);
    assert.deepStrictEqual(exists[0].tags, contentRecord.tags);
    assert.strictEqual(exists[0].caption, contentRecord.caption);
    assert.strictEqual(exists[0].color, contentRecord.color);
    assert.strictEqual(exists[0].sourceUrl, contentRecord.sourceUrl);
    assert.ok(exists[0].objectID);
    assert.ok(!exists[0].randomField);
    CloudSearchIndexStorage.prototype.getClient.restore();
  });

  it('Get all objectIDs by contentHash', async () => {
  });
  it('Throw an exception getting all objectIDs by an invalid contentHash', async () => {
  });

  it('Update all content records that contain a contentHash', async () => {
  });

  it('Update a content record', async () => {
  });

  it('Only update a content record with allowed fields', async () => {
  });

  it('Delete all content records of a source type', async () => {
  });

  it('Through exception deleting all content records of a field that doesn\'t exist', async () => {
  });

  it('Delete content records by objectId', async () => {
  });
});
