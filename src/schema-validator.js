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
import ingestionRequestSchema from './schemas/ingestion-request.json' assert { type: 'json' };

export class SchemaValidator {
  // eslint-disable-next-line class-methods-use-this
  validateIngestionRequest(ingestionRequest, additionalRequired) {
    const result = validate(ingestionRequest, ingestionRequestSchema, {
      allowUnknownAttributes: false,
    });

    if (result.errors?.length > 0) {
      throw new Error(
        `Failed to validate schema, errors: \n- ${result.errors
          .map((e) => e.message)
          .join('\n- ')}`,
      );
    }
  }
}
