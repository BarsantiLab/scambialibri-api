#!/bin/sh
set -e

DATE=$(date +"%Y-%m-%d_%H_%M")

rm -rf release
npm run build-prod
tar czf scambialibri-api-$DATE.tar.gz release/
scp scambialibri-api-$DATE.tar.gz root@iamdavi.de:~/projects/scambialibri-api/releases/scambialibri-api-$DATE.tar.gz
ssh root@iamdavi.de -t "cd ~/projects/scambialibri-api/; rm -rf dist; tar xzf ./releases/scambialibri-api-$DATE.tar.gz"
rm -f scambialibri-api-$DATE.tar.gz