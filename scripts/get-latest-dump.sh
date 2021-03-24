#!/usr/bin/env bash
set -euo pipefail

SCRIPTS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PROJECT_DIR="$( cd "${SCRIPTS_DIR}" && cd .. && pwd )"

if [[ -f "${PROJECT_DIR}/.env" ]]; then
  set -o allexport
  source "${PROJECT_DIR}/.env"
  set +o allexport
fi

curl -o "${SCRIPTS_DIR}/podcastindex_feeds.db.tgz" https://cloudflare-ipfs.com/ipns/k51qzi5uqu5dkde1r01kchnaieukg7xy9i6eu78kk3mm3vaa690oaotk1px6wo/podcastindex_feeds.db.tgz
tar -xvzf "${SCRIPTS_DIR}/podcastindex_feeds.db.tgz" -C "${PROJECT_DIR}/src/parser/__test__/fixtures"
rm -f "${SCRIPTS_DIR}/podcastindex_feeds.db.tgz"

