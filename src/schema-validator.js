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

export const SCHEMA_INGESTION_REQUEST = 'ingestion-request';
export const SCHEMA_MARSHALLING_REQUEST = 'ingestion-request';
export const SCHEMA_THUBMNAIL_GENERATION_REQUEST = 'thumbnail-generation-request';
export const SCHEMA_ASSET_PROCESSING_REQUEST = 'asset-processing-request';
export const SCHEMA_SERIALIZATION_REQUEST = 'serialization-request';
export const SCHEMA_SERIALIZE_EXISTING_ASSET_REQUEST = 'serialize-existing-asset-request';

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
   * Validates a request object against the schema specified by <code>schemaName</code>
   * as specified in https://wiki.corp.adobe.com/display/WEM/Ingestor+API+Contract
   *
   * Throws <code>Error</code> if request does not match
   *
   * @see https://wiki.corp.adobe.com/display/WEM/Ingestor+API+Contract?
   * @param {any} request
   * @param {string} schemaName
   * @param {Array<string>} additionalRequiredData
   */
  async validateRequest(request, schemaName, additionalRequiredData) {
    const schema = await this.#getSchema(schemaName);
    const result = validate(request, schema, {
      allowUnknownAttributes: false,
    });
    if (result.errors?.length > 0) {
      throw new Error(
        `Failed to validate schema "${schemaName}", errors: \n- ${result.errors
          .map((e) => e.message)
          .join('\n- ')}`,
      );
    }
    if (additionalRequiredData) {
      const missing = additionalRequiredData.filter(
        (key) => !(key in request.data),
      );
      if (missing.length > 0) {
        throw new Error(
          `Failed to validate schema "${schemaName}", missing data fields: [${missing.join(
            ', ',
          )}]`,
        );
      }
    }
  }
}
