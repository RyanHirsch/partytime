#!/usr/bin/env bash
set -euo pipefail

SCRIPTS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PROJECT_DIR="$( cd "${SCRIPTS_DIR}" && cd .. && pwd )"

if [[ -f "${PROJECT_DIR}/.env" ]]; then
  set -o allexport
  source "${PROJECT_DIR}/.env"
  set +o allexport
fi

cd "${PROJECT_DIR}"

yarn dev $1

NODE_STR="console.log(JSON.stringify(require('./raw/list.json').find(x => x.uri === '$1' || x.uriHash === '$1')))"

RESULT=$(node -e "${NODE_STR}")

URI=$(jq -r '.uri' <<< "${RESULT}")
URI_HASH=$(jq -r '.uriHash' <<< "${RESULT}")
TITLE=$(jq -r '.title' <<< "${RESULT}")
PARSED=$(jq -r '.parsed' <<< "${RESULT}")

echo "${TITLE} => ${URI}"

node src/orig.js ${URI_HASH}

yarn prettier --write results/orig.json
yarn prettier --write "results/${PARSED}"

echo "raw/${URI_HASH}.txt"

diffmerge results/orig.json "results/${PARSED}" &
