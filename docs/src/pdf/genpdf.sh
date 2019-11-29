#!/bin/bash


SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"

## Keyboard shortcaut cheat sheet
mdpdf --border 10mm --style $SCRIPTPATH/odin-3-column.css  --orientation landscape $SCRIPTPATH/../de/src/kb_shortcuts.md $SCRIPTPATH/../../book/kb_shortcuts_cheat_de.pdf
mdpdf --border 10mm --style $SCRIPTPATH/odin-3-column.css  --orientation landscape $SCRIPTPATH/../en/src/kb_shortcuts.md $SCRIPTPATH/../../book/kb_shortcuts_cheat_en.pdf


