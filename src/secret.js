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

import {
  CreateSecretCommand,
  DeleteSecretCommand,
  DescribeSecretCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

export class SecretsManager {
  #client;

  #namespace;

  /**
   * Creates a Configuration Manager
   * @param {string} namespace the namespace for the secret
   * @param {Object | undefined} config the configuration
   */
  constructor(namespace, config) {
    this.#client = new SecretsManagerClient(config);
    this.#namespace = namespace;
  }

  /**
   *
   * @param {string} id the id of the secret
   * @returns {string} the full key for accessing the secret
   */
  #makeKey(id) {
    return `${this.#namespace}-${id}`;
  }

  /**
   *
   * @param {string} id the id of the secret to create
   */
  async #upsertSecret(id, secret) {
    const SecretId = this.#makeKey(id);
    try {
      await this.#client.send(
        new DescribeSecretCommand({
          SecretId,
        }),
      );
      await this.#client.send(
        new PutSecretValueCommand({
          SecretId,
          SecretString: secret,
        }),
      );
    } catch (err) {
      await this.#client.send(
        new CreateSecretCommand({
          Name: SecretId,
          SecretString: secret,
        }),
      );
    }
  }

  /**
   * Deletes the specified secret
   * @param {string} id  the id of the secret to delete
   */
  async deleteSecret(id) {
    await this.#client.send(
      new DeleteSecretCommand({
        SecretId: this.#makeKey(id),
      }),
    );
  }

  /**
   * Gets the specified secret
   * @param {string} id the id of the secret to retrieve
   */
  async getSecret(id) {
    const command = new GetSecretValueCommand({
      SecretId: this.#makeKey(id),
    });
    const res = await this.#client.send(command);
    return res.SecretString;
  }

  /**
   * Puts or creates the specified configuration
   * @param {string} id the id of the secret to persist
   * @param {string} secret the se
   */
  async putSecret(id, secret) {
    await this.#upsertSecret(id, secret);
  }
}
