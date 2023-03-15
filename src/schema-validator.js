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
import { validate } from 'jsonschema';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFile, readdir } from 'fs/promises';

export class SchemaValidator {
  #loaded = false;

  #schemas = {};

  async #getSchema(name) {
    if (!this.#loaded) {
      const schemasDir = join(
        dirname(fileURLToPath(import.meta.url)),
        'schemas',
      );
      const schemas = await readdir(schemasDir);
      await Promise.all(
        schemas
          .filter((f) => f.endsWith('.json'))
          .map(async (fn) => {
            const schemaName = fn.slice(0, -5);
            const schemaBuf = await readFile(join(schemasDir, fn));
            this.#schemas[schemaName] = JSON.parse(schemaBuf.toString());
          }),
      );
      this.#loaded = true;
    }
    return this.#schemas[name];
  }

  /**
   *
   * @param {any} ingestionRequest
   * @param {Array<string>} additionalRequiredData
   */
  async validateIngestionRequest(ingestionRequest, additionalRequiredData) {
    const schema = await this.#getSchema('ingestion-request');
    const result = validate(ingestionRequest, schema, {
      allowUnknownAttributes: false,
    });
    if (result.errors?.length > 0) {
      throw new Error(
        `Failed to validate schema, errors: \n- ${result.errors
          .map((e) => e.message)
          .join('\n- ')}`,
      );
    }
    if (additionalRequiredData) {
      const missing = additionalRequiredData.filter(
        (k) => !(k in ingestionRequest.data),
      );
      if (missing.length > 0) {
        throw new Error(
          `Failed to validate schema, missing data fields: [${missing.join(
            ', ',
          )}]`,
        );
      }
    }
  }
}
