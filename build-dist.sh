#!/bin/sh
# Assemble exactly what ships. Pointing a host at the project root would
# upload the 47MB source .mov files and the mp3 master along with it.
set -e
rm -rf dist && mkdir -p dist/fonts dist/photos
cp index.html sw.js opening.mp4 opening-poster.png hero-still.jpg swanbg.mp4 invite-music.m4a shendi.ics favicon.ico og-image.jpg dist/
cp fonts/*.woff2 dist/fonts/
cp photos/*.jpg dist/photos/
cp _headers dist/ 2>/dev/null || true
echo "dist assembled:"
du -sh dist | sed 's/^/  /'
find dist -type f | sort | sed 's/^/  /'
