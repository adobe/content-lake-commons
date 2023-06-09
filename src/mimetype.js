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

import path from 'path';
import Mime from 'mime';

/**
 * Get mime type from Ingestion Job: either from job.data.mimeType or job.data.name
 * @param {Object} job Ingestion Job object (TODO: should be its own class)
 * @returns mime type
 */
export function getMimeType(job) {
  let mime;
  if (job?.data?.mimeType) {
    mime = job.data.mimeType;
  } else if (job?.data?.name) {
    const ext = (path.extname(job.data.name).substring(1)).toLowerCase();
    if (ext === 'ai') {
      // special case since mime libraries set this to `application/postscript`
      mime = 'application/vnd.adobe.illustrator';
    } else {
      mime = Mime.getType(ext);
    }
  }
  return mime || 'application/octet-stream';
}
