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
import { CloudSearchIndexStorage } from '../src/cloud-search-index-storage.js';

dotenv.config();

const context = {
  env: {
    ALGOLIA_APP_NAME: process.env.ALGOLIA_APP_NAME,
    ALGOLIA_API_KEY: process.env.ALGOLIA_API_KEY,
    ALGOLIA_CI_INDEX: process.env.ALGOLIA_CI_INDEX,
  },
  log: console,
};
const searchIndexStorage = new CloudSearchIndexStorage(context);

const objects = await searchIndexStorage.getObjectsBy('sourceMimeType', 'application/octet-stream');
console.log(`Found ${objects.length} assets with sourceMimeType:"application/octet-stream"`);

// if more than 1k entries, run a couple of times
// TODO: add pagination
// update the mimetype to application/pdf
if (objects.length > 0) {
  console.log(`Updating ${objects.length} assets with sourceMimeType:"application/octet-stream" to application/pdf`);
  const newObjects = objects.map((doc) => ({ ...doc, sourceMimeType: 'application/pdf' }));
  await searchIndexStorage.update(newObjects);
}
