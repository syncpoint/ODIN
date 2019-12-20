#!/bin/sh

SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"

DEST_PATH="$SCRIPTPATH/book"
TEMP_BOOK="$SCRIPTPATH/tmpbook"
## clean up
rm -rf "$DEST_PATH"
mkdir -p  "$DEST_PATH"

## create keyboard Cheat Sheets 
"$SCRIPTPATH/src/pdf/genpdf.sh"

## copy README 
#cp -rf "$SCRIPTPATH/src/README.md" "$DEST_PATH"


## create book
mdbook build "$SCRIPTPATH/src/de"
mdbook build "$SCRIPTPATH/src/en"

## copy book
cp -rf "$TEMP_BOOK/de/html" "$DEST_PATH/de"
cp -rf "$TEMP_BOOK/en/html" "$DEST_PATH/en"

rm -rf "$TEMP_BOOK" 

