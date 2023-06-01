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

/**
 * Loads schemas from this project in the <code>schemas</code> directory and supports validating
 * objects against the schemas.
 */
export class SchemaValidator {
  #schemas = {};

  async loadSchemas(dir) {
    const schemasDir = dir || join(dirname(fileURLToPath(import.meta.url)), 'schemas');
    const schemaFiles = await readdir(schemasDir);
    await Promise.all(
      schemaFiles.filter((fileName) => fileName.endsWith('.json'))
        .map(async (fileName) => {
          this.#schemas[fileName.slice(0, -5)] = JSON.parse(
            (await readFile(join(schemasDir, fileName))).toString(),
          );
        }),
    );
  }

  async getSchema(name, dir) {
    if (!Object.keys(this.#schemas).length) {
      await this.loadSchemas(dir);
    }
    return this.#schemas[name];
  }

  /**
   * Validates an object against the schema specified by <code>schemaName</code>
   * as specified in https://wiki.corp.adobe.com/display/WEM/Ingestor+API+Contract
   *
   * Throws <code>Error</code> if request does not match
   *
   * @see https://wiki.corp.adobe.com/display/WEM/Ingestor+API+Contract?
   * @param {any} obj
   * @param {string} schemaName
   * @param {Array<string>} additionalRequiredData
   */
  async validateObject(obj, schemaName, additionalRequiredData) {
    const schema = await this.getSchema(schemaName);
    const result = validate(obj, schema, {
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
        (key) => !(key in obj.data),
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

  async validateIngestionRequest(request, additionalRequiredData) {
    return this.validateRequest(request, SCHEMA_INGESTION_REQUEST, additionalRequiredData);
  }
}
