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

const schemas = {};

export async function getSchema(name, dir) {
  if (!Object.keys(schemas).length) {
    let schemasDir = dir;
    if (!dir) {
      schemasDir = join(dirname(fileURLToPath(import.meta.url)), 'schemas');
    }
    const schemaFiles = await readdir(schemasDir);
    await Promise.all(
      schemaFiles.filter((fileName) => fileName.endsWith('.json'))
        .map(async (fileName) => {
          schemas[fileName.slice(0, -5)] = JSON.parse(
            (await readFile(join(schemasDir, fileName))).toString(),
          );
        }),
    );
  }
  return schemas[name];
}

/**
 * Loads schemas from this project in the <code>schemas</code> directory and supports validating
 * objects against the schemas.
 */
export class SchemaValidator {
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
  // eslint-disable-next-line class-methods-use-this
  async validateRequest(request, schemaName, additionalRequiredData) {
    const schema = await getSchema(schemaName);
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
