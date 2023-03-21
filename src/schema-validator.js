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

const SCHEMA_INGESTION_REQUEST = 'ingestion-request';

/**
 * Loads schemas from this project in the <code>schemas</code> directory and supports validating
 * objects against the schemas.
 */
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
          .filter((fileName) => fileName.endsWith('.json'))
          .map(async (fileName) => {
            const schemaName = fileName.slice(0, -5);
            const schemaBuf = await readFile(join(schemasDir, fileName));
            this.#schemas[schemaName] = JSON.parse(schemaBuf.toString());
          }),
      );
      this.#loaded = true;
    }
    return this.#schemas[name];
  }

  /**
   * Validates the <code>ingestionRequest</code> object against the Ingestion Request schema
   * as specified in https://wiki.corp.adobe.com/display/WEM/Ingestor+API+Contract
   * @see https://wiki.corp.adobe.com/display/WEM/Ingestor+API+Contract?
   * @param {any} ingestionRequest
   * @param {Array<string>} additionalRequiredData
   */
  async validateIngestionRequest(ingestionRequest, additionalRequiredData) {
    const schema = await this.#getSchema(SCHEMA_INGESTION_REQUEST);
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
        (key) => !(key in ingestionRequest.data),
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
