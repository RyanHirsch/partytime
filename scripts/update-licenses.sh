#!/usr/bin/env bash
set -euo pipefail

SCRIPTS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PROJECT_DIR="$( cd "${SCRIPTS_DIR}" && cd .. && pwd )"

if [[ -f "${PROJECT_DIR}/.env" ]]; then
  set -o allexport
  source "${PROJECT_DIR}/.env"
  set +o allexport
fi

curl -o "${SCRIPTS_DIR}/licenses.json" https://raw.githubusercontent.com/spdx/license-list-data/master/json/licenses.json
yarn esr "${SCRIPTS_DIR}/generate-json.ts" ./licenses.json ./src/parser/phase/licenses.ts
rm -f "${SCRIPTS_DIR}/licenses.json"
