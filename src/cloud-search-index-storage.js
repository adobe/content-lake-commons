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
/* eslint-disable lines-between-class-members */
/* eslint-disable class-methods-use-this */
import algoliasearch from 'algoliasearch';
import crypto from 'crypto';
import clone from 'clone';
import { ContextHelper } from './context.js';

export class CloudSearchIndexStorage {
  #FIELDS_TO_INDEX = new Set(['objectID', 'assetIdentity', 'contentHash', 'sourceName', 'sourceType', 'thumbnailHash', 'file', 'companyId', 'spaceId', 'type', 'tags', 'ocrTags', 'caption', 'width', 'height', 'color', 'sourceId', 'sourceUrl', 'sourceAssetId', 'sourcePath']);
  #INDEX_PREFIX = 'company';
  #logger;
  #index;
  #indexName;

  constructor(context, companyId) {
    this.#indexName = context.env.ALGOLIA_CI_INDEX || `${this.#INDEX_PREFIX}-${companyId}`;
    this.#logger = new ContextHelper(context).getLog();
    this.#logger.info('Using Search Index', this.#indexName);

    this.#index = this.getClient(context).initIndex(this.#indexName);
  }

  getIndexName() {
    return this.#indexName;
  }

  getClient(context) {
    return algoliasearch(
      context.env.ALGOLIA_APP_NAME,
      context.env.ALGOLIA_API_KEY,
    );
  }

  /**
   * Strong Existence Check
   *
   * Needs to have both the sourceId and the contentHash (source binary hash) matching
   * @param {Object} query
   * @returns Object of hits if there is a hit or false if it doesn't exist
   */
  async exists(query) {
    const facetFilters = [];
    // if no contentHash, we don't want to match just on the sourceId
    // because that is not reliable so we will not return a match
    if (!query || !query.contentHash) {
      this.#logger.info('Missing query.contentHash, no existence in the record storage.');
      return false;
    }

    facetFilters.push(`contentHash:${query.contentHash}`);

    if (query.sourceAssetId) {
      facetFilters.push(`sourceAssetId:${query.sourceAssetId}`);
    }

    const searchResult = await this.#index.search(
      '',
      {
        facetFilters,
      },
    );
    if (searchResult?.nbHits > 0) {
      return searchResult?.hits;
    }
    return false;
  }

  /**
   * Retrieve a single index record via the record's identifier (objectID).
   * @param {String} objectID - the unique identifier for the index record
   * @returns the raw result of the query; will contain the record if it exists.
   */
  async get(objectID) {
    return this.#index.search(
      '',
      {
        facetFilters: [
          `objectID:${objectID}`,
        ],
      },
    );
  }

  /**
   * Save the information in the provided object to the search index as an index record.
   *
   * Not all fields provided in the object will be saved to the index. This method takes the values
   * from the provided object that are specified to be used in the index and saves a record with
   * those values; other values are ignored.
   * @param {Object} doc the object to store in the index.
   * @returns An object containing the saved record's ObjectID.
   */
  async save(doc) {
    const indexRecord = Object.keys(doc).reduce((obj, key) => {
      const result = clone(obj);
      if (this.#FIELDS_TO_INDEX.has(key)) {
        result[key] = doc[key];
      }
      return result;
    }, {});
    if (!indexRecord?.objectID) {
      indexRecord.objectID = crypto.randomUUID();
    }

    this.#logger.info(`Saving doc to cloud record storage index ${this.#indexName}`, indexRecord);
    return this.#index.saveObject(indexRecord);
  }

  /**
   * Get a list of ObjectID that contain the contentHash
   * @param {String} contentHash sha256 hash of the source binary
   * @returns list of strings of ojectIDs
   */
  async getObjectIdsByContentHash(contentHash) {
    const searchResult = await this.#index.search(
      '',
      {
        distinct: false,
        facetFilters: [
          `contentHash:${contentHash}`,
        ],
      },
    );
    if (searchResult?.nbHits > 0) {
      return searchResult?.hits.map((hit) => hit.objectID);
    }
    return [];
  }

  /**
   * Update all records in the index containing the contentHash
   *
   * - Only update the values that are provided in the object (partial update)
   * - Only add fields that are able to be indexed: `this.#FIELDS_TO_INDEX`
   * @param {Object} doc document containing the contentHash and other fields to update
   */
  // eslint-disable-next-line consistent-return
  async updateByContentHash(doc) {
    if (!doc?.contentHash) {
      const message = 'Missing contentHash, no update in the record storage.';
      this.#logger.error(message);
      throw new Error(message);
    }
    let objectIDs = await this.getObjectIdsByContentHash(doc.contentHash);
    if (objectIDs.length > 0) {
      objectIDs = objectIDs.map((objectID) => ({ objectID, ...doc }));
      return this.update(objectIDs);
    }
    this.#logger.info('No matching record found in the record storage.');
  }

  /**
   * Update records in a index
   * Only update the values that are provided in the object (partial update):
   * https://www.algolia.com/doc/api-reference/api-methods/partial-update-objects/
   * @param {Array<Object>} records Array of content records with fields to update
   * @returns
   */
  async update(records) {
    const indexRecords = records.map((doc) => {
      const indexRecord = Object.keys(doc).reduce((obj, key) => {
        const result = clone(obj);
        if (this.#FIELDS_TO_INDEX.has(key)) {
          result[key] = doc[key];
        }
        return result;
      }, {});
      return indexRecord;
    });
    this.#logger.info(`Updating docs ${indexRecords.length} records in cloud record storage index ${this.#indexName}`);
    this.#logger.debug('Documents updated:', indexRecords);
    return this.#index.partialUpdateObjects(indexRecords);
  }

  /**
   * Delete record from index
   * @param {String} objectID unique identifier for the index record
   * @returns
   */
  async delete(objectID) {
    return this.#index.deleteObject(objectID);
  }

  /**
   * Delete all records of type `key` with value `value` from index
   * `key` must be enabled as a filterable attribute in the index.
   *
   * Ex: `deleteBy('sourceType', 's3')` will delete all records with `sourceType` of `s3`
   *
   * @param {String} key attribute to delete by.
   * @param {String} value value of the attribute to delete by.
   */
  async deleteBy(key, value) {
    this.#logger.info(`Deleting all records with '${key}' containing value ${value}`);
    const params = {
      filters: `${key}:${value}`,
    };
    return this.#index.deleteBy(params);
  }
}
