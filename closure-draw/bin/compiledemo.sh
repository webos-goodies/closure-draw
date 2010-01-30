#! /bin/sh

source define.sh

OPTIMIZATION=ADVANCED
#OPTIMIZATION=SIMPLE

cd $BIN_DIR

for jsfile in $DEMOS_DIR/*.js; do
	basename=${jsfile%.js}
	$PYTHON $CALCDEPS -i $basename.js \
	    -p $CLOSURE_LIB_DIR/goog -p $CLOSURE_DRAW_DIR/lib \
	    -o compiled -c $CLOSURE_COMPILER \
	    -f "--compilation_level=${OPTIMIZATION}_OPTIMIZATIONS" \
		-f "--create_source_map=$basename-min-map" \
		> $basename-min.js
done
