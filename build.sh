#!/bin/bash

POSITIONAL=()
while [[ $# -gt 0 ]]
do
    key="$1"

    case $key in
        -e|--env|--environment)
        ENVIRONMENT="$2"
        shift
        shift
        ;;
    esac
done

set -- "${POSITIONAL[@]}"

DATE=$(date +"%Y-%m-%d_%H_%M")
NAME="scambialibri-api-${ENVIRONMENT}-${DATE}.tar.gz"
SSH_KEY="~/.ssh/id_rsa_personal"
WORK_DIR=`mktemp -d`

case "$ENVIRONMENT" in
    qa) REMOTE_DIR="dev-api" ;;
    prod|production) REMOTE_DIR="api" ;;
    *) echo "Error getting environment!"; exit 1;
esac

rm -rf release
npm run build-prod
tar czf $WORK_DIR/$NAME release/
scp -i $SSH_KEY $WORK_DIR/$NAME deploy@loscambialibri.it:~/$REMOTE_DIR/releases/$NAME
ssh deploy@loscambialibri.it -i $SSH_KEY -t "cd ~/${REMOTE_DIR}/ && rm -rf dist && tar xzf ./releases/${NAME} && pm2 restart ecosystem.json"
rm -rf $WORK_DIR