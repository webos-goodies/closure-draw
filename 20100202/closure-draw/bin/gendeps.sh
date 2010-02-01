#! /bin/sh

source define.sh

cd $BIN_DIR
$PYTHON $CALCDEPS -p $CLOSURE_DRAW_DIR/lib -o deps > $CLOSURE_DRAW_DIR/lib/deps.js
