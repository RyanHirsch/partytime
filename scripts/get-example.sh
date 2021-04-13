#!/usr/bin/env bash
set -euo pipefail

SCRIPTS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PROJECT_DIR="$( cd "${SCRIPTS_DIR}" && cd .. && pwd )"

if [[ -f "${PROJECT_DIR}/.env" ]]; then
  set -o allexport
  source "${PROJECT_DIR}/.env"
  set +o allexport
fi

curl -o "${PROJECT_DIR}/src/parser/__test__/fixtures/example.xml" https://raw.githubusercontent.com/Podcastindex-org/podcast-namespace/main/example.xml

curl -o "${SCRIPTS_DIR}/taxonomy.json" https://raw.githubusercontent.com/Podcastindex-org/podcast-namespace/main/taxonomy.json
yarn ts-node "${SCRIPTS_DIR}/generate-person-enum.ts"

rm "${SCRIPTS_DIR}/taxonomy.json"
