# Content Lake - Commons

> Common library for Content Lake Backend Services

## Status
[![codecov](https://img.shields.io/codecov/c/github/adobe/content-lake-commons.svg)](https://codecov.io/gh/adobe/content-lake-commons)
[![CircleCI](https://img.shields.io/circleci/project/github/adobe/content-lake-commons.svg)](https://circleci.com/gh/adobe/content-lake-commons)
[![GitHub license](https://img.shields.io/github/license/adobe/content-lake-commons.svg)](https://github.com/adobe/content-lake-commons/blob/master/LICENSE.txt)
[![GitHub issues](https://img.shields.io/github/issues/adobe/content-lake-commons.svg)](https://github.com/adobe/content-lake-commons/issues)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## Installation

```bash
$ npm install @adobe/content-lake-commons
```

## Usage

See the [API documentation](docs/API.md).

## Development

### Build

```bash
$ npm install
```

### Test

```bash
$ npm test
```
### Integration Tests

The Integration Tests require the following environment variables which can be supplied in a .env file:

```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
QUEUE_URL=
```

```bash
$ npm test:integration
```

### Lint

```bash
$ npm run lint
```
