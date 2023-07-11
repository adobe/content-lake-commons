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

/* eslint-disable no-console */
// eslint-disable-next-line import/no-extraneous-dependencies
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs/promises';
import { CloudSearchIndexStorage } from '../src/cloud-search-index-storage.js';
import { getAllAssetIdentities, mergeEntries } from './index-utils.js';
import { parallelLimit } from 'async';

const NEW_INDEX = 'delbick-test-aggregated'; // always use a test index to avoid overwriting existing data

dotenv.config();

const context = {
  env: {
    ALGOLIA_APP_NAME: process.env.ALGOLIA_APP_NAME,
    ALGOLIA_API_KEY: process.env.ALGOLIA_API_KEY,
    ALGOLIA_CI_INDEX: process.env.ALGOLIA_CI_INDEX,
  },
  log: console,
};
const newContext = {
  env: {
    ALGOLIA_APP_NAME: process.env.ALGOLIA_APP_NAME,
    ALGOLIA_API_KEY: process.env.ALGOLIA_API_KEY,
    ALGOLIA_CI_INDEX: NEW_INDEX,
  },
  log: console,
};
const oldSearchIndex = new CloudSearchIndexStorage(context);
const newSearchIndex = new CloudSearchIndexStorage(newContext);
// alg A
// get list of all asset identities from old index
// loop through each asset identity
// if no object for that asset identity exists in new index, do work
// get all objects for that asset identity (distinct:false)
// form new aggregated entry
// add entry to new index

// alg B
// loop through all objects in the old index
// if no object with that asset identity exists in the new index
//      create new aggregated entry
//      add entry to new index
// else if existing entry in the new index
//      add the object to the existing entry in the new index (merge)

// alg A
// 1. get list of all asset identities from old index
const start = Date.now();
const assetIdentities = await getAllAssetIdentities(oldSearchIndex.index);
// warning, if asset identities length is larger than max array size, could cause memory issues
console.log('length of assetIdentities', assetIdentities.size);
console.log(`Browsed index in ${Date.now() - start}ms`);
// 2. loop through each asset identity
// run in parallel in batches of 1000
const tasks = [];
assetIdentities.forEach((assetIdentity) => {
  tasks.push(async () => {
    // if no object for that asset identity exists in new index, do work
    const objects = await newSearchIndex.getObjectsBy('assetIdentity', assetIdentity);
    console.log(`Found ${objects.length} existing objects for assetIdentity:${assetIdentity} in the new index: ${newSearchIndex.getIndexName()}`);
    if (objects.length === 0) {
      // get all objects for that asset identity (distinct:false)
      console.log(`Getting all objects for assetIdentity:${assetIdentity} from the old index: ${oldSearchIndex.getIndexName()}`);
      const singleEntries = await oldSearchIndex.getObjectsBy('assetIdentity', assetIdentity, false);
      // form new aggregated entry
      // merge all objects into one
      console.log(`Merging ${singleEntries.length} objects for assetIdentity:${assetIdentity}`);
      const newObject = mergeEntries(singleEntries);
      newObject.objectID = crypto.randomUUID();
      // console.log('Adding new object to new index', newObject);
      // add entry to new index
      try {
        // TODO: upload in batches
        await newSearchIndex.index.saveObject(newObject);
      } catch (error) {
        console.log('Error adding new object to new index', error);
        // TODO: write object to a file to upload later
        fs.writeFile(`./${newObject.objectID}.json`, JSON.stringify(newObject));
      }
    }
  });
});
await parallelLimit(tasks, 200);
console.log(`Created new aggregated index in ${Date.now() - start}ms`);
