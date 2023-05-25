#!/bin/bash

if [ -z "$ARTIFACTORY_USER" ]; then
    echo "ERR: Missing ENV ARTIFACTORY_USER"
    exit 1
fi
if [ -z "$ARTIFACTORY_API_KEY" ]; then
    echo "ERR: Missing ENV ARTIFACTORY_API_KEY"
    exit 1
fi

ARTIFACTORY_TOKEN=`curl --silent --show-error --fail -u $ARTIFACTORY_USER:$ARTIFACTORY_API_KEY https://${ARTIFACTORY_HOST}/artifactory/api/npm/auth | grep '_auth' | sed 's/_auth = //'`

if [ -z "$ARTIFACTORY_TOKEN" ]; then
    echo "ERR: Failed to get artifactory token"
    exit 1
fi


cat .npmrc | grep -v npm-adobe-asset-catalog-release > .npmrc
echo "@adobe:registry = https://${ARTIFACTORY_HOST}/artifactory/npm-adobe-asset-catalog-release/" > .npmrc

cat ~/.npmrc | grep -v npm-adobe-asset-catalog-release > ~/.npmrc
echo "//${ARTIFACTORY_HOST}/artifactory/npm-adobe-asset-catalog-release/:_auth=${ARTIFACTORY_TOKEN}" >> ~/.npmrc
echo "//${ARTIFACTORY_HOST}/artifactory/npm-adobe-asset-catalog-release/:email=${ARTIFACTORY_USERNAME}@adobe.com" >> ~/.npmrc
echo "//${ARTIFACTORY_HOST}/artifactory/npm-adobe-asset-catalog-release/:always-auth=true" >> ~/.npmrc
