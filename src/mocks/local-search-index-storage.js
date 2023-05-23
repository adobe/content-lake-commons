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

import clone from 'clone';

export class LocalSearchIndexStorage {
  constructor() {
    this.records = {};
    this.onSaveCallback = undefined;
  }

  async exists(query) {
    const queryContentHash = query?.contentHash;
    if (!queryContentHash) {
      return false;
    }
    const result = await this.find(query);
    return result || false;
  }

  async find(query) {
    const res = [];
    for (const record of Object.values(this.records)) {
      let match = true;
      for (const key of Object.keys(query)) {
        if (record[key] !== query[key]) {
          match = false;
          break;
        }
      }
      if (match) {
        res.push(record);
      }
    }
    return res;
  }

  async save(doc) {
    const localDoc = clone(doc);
    if (this.onSaveCallback) {
      this.onSaveCallback(localDoc);
    }
    this.records[localDoc.objectID] = localDoc;
    return localDoc;
  }

  onSave(callback) {
    this.onSaveCallback = callback;
  }

  async get(objectID) {
    return this.records[objectID];
  }
}
