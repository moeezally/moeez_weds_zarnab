#!/bin/sh
# Assemble exactly what ships. Pointing a host at the project root would
# upload the 47MB source .mov files and the mp3 master along with it.
set -e
rm -rf dist && mkdir -p dist/fonts
cp index.html sw.js opening.mp4 opening-poster.jpg hero-still.jpg swanbg.mp4 invite-music.m4a dist/
cp fonts/*.woff2 dist/fonts/
cp _headers dist/ 2>/dev/null || true
echo "dist assembled:"
du -sh dist | sed 's/^/  /'
find dist -type f | sort | sed 's/^/  /'
