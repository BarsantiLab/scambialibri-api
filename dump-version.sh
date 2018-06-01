#!/bin/sh
set -e

DATE=$(date +"%Y-%m-%d_%H_%M")

mongodump --db Scambialibri --archive=dumps/Scambialibri_$DATE.tar.gz --gzip