/*
 * Copyright 2022 Adobe. All rights reserved.
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
/* eslint-disable no-console */
import algoliasearch from 'algoliasearch';
import crypto from 'crypto';
import clone from 'clone';

export class CloudSearchIndexStorage {
  #FIELDS_TO_INDEX = new Set(['objectID', 'assetIdentity', 'contentHash', 'sourceName', 'sourceType', 'thumbnailHash', 'file', 'companyId', 'spaceId', 'type', 'tags', 'ocrTags', 'caption', 'width', 'height', 'color', 'sourceId', 'sourceUrl', 'sourceAssetId', 'sourcePath']);
  #INDEX_PREFIX = 'company';

  constructor(context, companyId) {
    // TODO: Job document should specify the companyId which should be used as the index name
    this.indexName = context.env.ALGOLIA_CI_INDEX || `${this.#INDEX_PREFIX}-${companyId}`;
    console.log('Using Search Index', this.indexName);
    this.index = algoliasearch(
      context.env.ALGOLIA_APP_NAME,
      context.env.ALGOLIA_API_KEY,
    ).initIndex(this.indexName);
  }

  withLog(logger) {
    this.log = logger;
    return this;
  }

  /**
   * Strong Existence Check
   *
   * Needs to have both the sourceId and the contentHash (source binary hash) matching
   * @param {Object} query
   * @returns Object of hits if there is a hit or undefined if it doesn't exist
   */
  async exists(query) {
    const facetFilters = [];
    // if no contentHash, we don't want to match just on the sourceId
    // becuase that is not reliable so we will not return a match
    if (!query.contentHash) {
      console.log('Missing contentHash, no existence in the record storage.');
      return undefined;
    }

    facetFilters.push(`contentHash:${query.contentHash}`);

    if (query?.sourceAssetId) {
      facetFilters.push(`sourceAssetId:${query.sourceAssetId}`);
    }

    const searchResult = await this.index.search(
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
   * @param {*} objectID - the unique identifier for the index record
   * @returns the raw result of the query; will contain the record if it exists.
   */
  async get(objectID) {
    return this.index.search(
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

    this.log.info(`Saving doc to cloud record storage index ${this.indexName}`, indexRecord);
    return this.index.saveObject(indexRecord);
  }

  /**
   * Get a list of ObjectID that contain the contentHash
   * @param {String} contentHash sha256 hash of the source binary
   * @returns list of strings of ojectIDs
   */
  async getObjectIdsByContentHash(contentHash) {
    const searchResult = await this.index.search(
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
    return false;
  }

  /**
   * Update all records in the index containing the contentHash
   *
   * - Only update the values that are provided in the object (partial update)
   * - Only add fields that are able to be indexed: `this.#FIELDS_TO_INDEX`
   * @param {Object} doc document containing the contentHash and other fields to update
   * @returns
   */
  async updateByContentHash(doc) {
    if (!doc?.contentHash) {
      this.log.info('Missing contentHash, no update in the record storage.');
      return undefined;
    }
    let objectIDs = await this.getObjectIdsByContentHash(doc.contentHash);
    if (!objectIDs) {
      this.log.info('No matching record found in the record storage.');
      return undefined;
    }
    objectIDs = objectIDs.map((objectID) => ({ objectID, ...doc }));
    return this.update(objectIDs);
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
    this.log.info(`Updating docs in cloud record storage index ${this.indexName}`, indexRecords);
    return this.index.partialUpdateObjects(indexRecords);
  }

  /**
   * Delete record from index
   * @param {String} objectID unique identifier for the index record
   * @returns
   */
  async delete(objectID) {
    return this.index.deleteObject(objectID);
  }

  /**
   * Delete all records of a sourceType from index
   * @param {String} sourceType source type of the record
   */
  async deleteBySourceType(sourceType) {
    this.log.info('Deleting all records of sourceType', sourceType);
    const params = {
      filters: `sourceType:${sourceType}`,
    };
    await this.index.deleteBy(params);
  }

  /**
   * Delete all records containing containing the contentHash from index
   * @param {*} contentHash sha256 hash of the source binary
   */
  async deleteByContentHash(contentHash) {
    this.log.info('Deleting by contentHash', contentHash);
    const params = {
      filters: `contentHash:${contentHash}`,
    };
    await this.index.deleteBy(params);
  }
}
