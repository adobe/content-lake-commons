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

// eslint-disable-next-line import/no-extraneous-dependencies
import dotenv from 'dotenv';
import {
  DeleteSecretCommand,
  ListSecretsCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { ContextHelper } from '../src/context.js';

dotenv.config();

const secretManager = new SecretsManagerClient(
  new ContextHelper(process).extractAwsConfig(),
);

let res = await secretManager.send(
  new ListSecretsCommand({ IncludePlannedDeletion: false }),
);
while (res.NextToken && res.SecretList) {
  // eslint-disable-next-line no-await-in-loop
  await Promise.all(
    res.SecretList?.filter((secret) => secret.Name.match(process.argv[2]))?.map(
      (secret) => {
        console.log(`Deleting secret ${secret.Name}`);
        return secretManager.send(
          new DeleteSecretCommand({
            SecretId: secret.ARN,
            ForceDeleteWithoutRecovery: true,
          }),
        );
      },
    ),
  );
  // eslint-disable-next-line no-await-in-loop
  res = await secretManager.send(
    new ListSecretsCommand({
      IncludePlannedDeletion: false,
      NextToken: res.NextToken,
    }),
  );
}
