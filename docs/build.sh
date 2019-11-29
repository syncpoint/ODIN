#!/bin/sh

SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"

## clean up
rm -rf $SCRIPTPATH/dist
mkdir -p  $SCRIPTPATH/dist

## create keyboard Cheat Sheets 
$SCRIPTPATH/src/pdf/genpdf.sh

## copy README 
cp -rf $SCRIPTPATH/src/README.md $SCRIPTPATH/dist


## create book
mdbook build $SCRIPTPATH/src/de
mdbook build $SCRIPTPATH/src/en

## copy book
cp -rf $SCRIPTPATH/book/de/html $SCRIPTPATH/dist/de
cp -rf $SCRIPTPATH/book/en/html $SCRIPTPATH/dist/en

rm -rf $SCRIPTPATH/book 

