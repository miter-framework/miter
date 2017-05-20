#!/bin/bash

set -e

RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

ENV=${NODE_ENV:-test}
if [[ $ENV != "test" ]]; then
    echo -e "${RED}ERROR${NC}: Cannot run unit tests out of the test environment"
    exit 1
fi

TEST_COUNT=${1:-}

STATUS_RESPONSE=$(git status)
NOT_STAGED_FOR_COMMIT="^.*not staged for commit.*$"
UNTRACKED_FILES="^.*Untracked files.*$"
if [[ $TEST_COUNT != "watch" && ($STATUS_RESPONSE =~ $NOT_STAGED_FOR_COMMIT || $STATUS_RESPONSE =~ $UNTRACKED_FILES) ]]; then
    echo -e "${YELLOW}WARNING${NC}: You have unstaged changes. These tests might not have correct results."
fi

if [[ $TEST_COUNT == "watch" ]]; then
    node_modules/.bin/mocha-typescript-watch -p tsconfig.json "dist/**/*.spec.js"
else
    node_modules/.bin/mocha --require ts-node/register "src/**/*.spec.ts"
fi

exit 0
