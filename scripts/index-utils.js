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

const NON_AGGREGATED_FIELDS = [
  'objectID',
  'assetIdentity',
  'file',
  'companyId',
  'spaceId',
  'caption',
  'tags',
  'width',
  'height',
  'date',
  'color',
  'assetStatus',
];
// TODO: map field to updated name and merge strategy
// contentHash: { name: 'contentHashes', merge: 'union' },
const AGGREGATED_FIELDS_MAP = {
  contentHash: 'contentHashes',
  sourceName: 'sourceNames',
  sourceType: 'sourceTypes',
  thumbnailHash: 'thumbnailHashes',
  type: 'types',
  sourceAssetId: 'sourceAssetIds',
  sourcePath: 'sourcePaths',
  sourceMimeType: 'sourceMimeTypes',
};

// map sourcemimetype to a number, higher number is better
const SOURCE_MIMETYPE_RANKINGS = {
  'application/octet-stream': 0,
  'image/jpeg': 1,
  'image/png': 2,
  'image/vnd.adobe.photoshop': 3,
  'application/pdf': 3,
};

const STATUS_MAP = {
  'work-in-progress': -1, // invalid and outdated status, force unknown
  Unknown: 0,
  'Work in Progress': 1,
  'In Review': 2,
  'Ready to Use': 3,
  Published: 4,
  Archived: 5,
  Embargoed: 100,
};

// WARNING: Do not use this function if index is larger than ~4million records
// since it is stored in an array
export async function getAllAssetIdentities(index) {
  let hits = [];
  await index.browseObjects({
    query: '',
    attributesToRetrieve: [
      'assetIdentity',
    ],
    batch: (batch) => {
      hits = hits.concat(batch);
    },
  });
  const assetIdentities = new Set([...hits.map((hit) => hit.assetIdentity)]);
  return assetIdentities;
}

function getBestMatch(currentBestMatch, entry) {
  if (currentBestMatch === undefined) {
    return entry;
  }
  // choose the entry with the highest ranking mimetype
  if (SOURCE_MIMETYPE_RANKINGS[entry.sourceMimeType]
    > SOURCE_MIMETYPE_RANKINGS[currentBestMatch.sourceMimeType]) {
    return entry;
  } else if (SOURCE_MIMETYPE_RANKINGS[entry.sourceMimeType]
    < SOURCE_MIMETYPE_RANKINGS[currentBestMatch.sourceMimeType]) {
    return currentBestMatch;
  } else {
    // if the mimetype is the same, choose best dimension
    const entrySource = entry.sourceWidth * entry.sourceHeight;
    const bestmatchSource = currentBestMatch.sourceWidth * currentBestMatch.sourceHeight;
    if (entrySource > bestmatchSource) {
      return entry;
    } else {
      return currentBestMatch;
    }
  }
}

export function mergeEntries(entries) {
  let bestmatch;
  return entries.reduce((acc, entry) => {
    bestmatch = getBestMatch(bestmatch, entry);
    const newAcc = acc;
    Object.keys(entry).forEach((key) => {
      if (NON_AGGREGATED_FIELDS.includes(key)) {
        if (JSON.stringify(entry) === JSON.stringify(bestmatch)) {
          newAcc[key] = entry[key];
        }
        // special case for asset status
        if (key === 'assetStatus') {
          if (!acc[key]) {
            newAcc[key] = entry[key];
          } else if (STATUS_MAP[entry[key]] > STATUS_MAP[acc[key]]) {
            newAcc[key] = entry[key];
          } else {
            newAcc[key] = acc[key];
          }
        }
      } else if (Object.keys(AGGREGATED_FIELDS_MAP).includes(key)) {
        // TODO: make aggregated fields a set to be unique
        newAcc[AGGREGATED_FIELDS_MAP[key]] = acc[AGGREGATED_FIELDS_MAP[key]]
          ? [...acc[AGGREGATED_FIELDS_MAP[key]], entry[key]] : [entry[key]];

        // remove duplicates from newAcc of field
        newAcc[AGGREGATED_FIELDS_MAP[key]] = [...new Set(newAcc[AGGREGATED_FIELDS_MAP[key]])];
      }
    });
    return newAcc;
  }, {});
}
