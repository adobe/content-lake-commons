/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { GetObjectCommand, PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * @typedef {Object} BlobStorageConfigExt
 * @property {string} bucket
 * @property {S3} [client]
 *
 * @typedef {import('./common-typedefs').AwsConfig & BlobStorageConfigExt} BlobStorageConfig
 */

export class BlobStorage {
  /**
   * @type {string}
   */
  #bucket;

  /**
   * @type {S3}
   */
  #s3client;

  /**
   *
   * @param {BlobStorageConfig} config
   */
  constructor(config) {
    this.#s3client = config.client || new S3(config);
    this.#bucket = config.bucket;
  }

  /**
   * Return the binary for a blob
   * @param {string} key - identifier of the blob
   * @returns {Promise<import('stream').Readable>}
   */
  async get(key) {
    const res = await this.#s3client.send(
      new GetObjectCommand({
        Bucket: this.#bucket,
        Key: key,
      }),
    );
    return res.Body;
  }

  /**
   * Return a signed URI for the blob specified by 'key' that expires in one hour.
   * @param {string} key - identifier of the blob
   * @returns {Promise<string>}
   */
  async getSignedURI(key) {
    return getSignedUrl(
      this.#s3client,
      new GetObjectCommand({
        Bucket: this.#bucket,
        Key: key,
      }),
      {
        expiresIn: 3600,
      },
    );
  }

  /**
   * Return the binary for a blob
   * @param {string} key - identifier of the blob
   * @returns {Promise<string>}
   */
  async getString(key) {
    const body = await this.get(key);
    const toString = (stream) => new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    return toString(body);
  }

  /**
   * Saves the provided body to blob storage
   * @param {string} key
   * @param {ReadableStream | Buffer} body
   * @param {string} [mediaType]
   * @returns {Promise<void>}
   */
  async save(key, body, mediaType) {
    await this.#s3client.send(
      new PutObjectCommand({
        Bucket: this.#bucket,
        Key: key,
        Body: body,
        ContentType: mediaType,
      }),
    );
  }
}
