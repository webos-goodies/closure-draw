goog.require('goog.dom.xml');
goog.require('goog.string');
goog.require('goog.userAgent');
goog.require('goog.ui.ToolbarButton');
goog.require('goog.ui.ToolbarSeparator');
goog.require('closuredraw');

function initialize() {
  var width = 0, height = 512;
  if(document.documentElement.scrollWidth) {
	width = document.documentElement.scrollWidth;
  } else {
	width = document.body.scrollWidth;
  }

  if(goog.userAgent.IE) {
	goog.dom.$('svgtext-div').style.display = 'block';
	height = 256;
  }

  var outer  = goog.dom.$('canvas');
  var canvas = new closuredraw.Widget(width, height);
  canvas.render(outer);

  var toolbar = canvas.getToolbar();
  var saveBtn = new goog.ui.ToolbarButton("Save");
  toolbar.addChildAt(saveBtn, 0, true);
  toolbar.addChildAt(new goog.ui.ToolbarSeparator(), 1, true);
  goog.events.listen(saveBtn, goog.ui.Component.EventType.ACTION, function(e) {
	var svg = goog.dom.xml.serialize(canvas.exportSVG().documentElement);
	if(goog.userAgent.IE) {
	  goog.dom.setTextContent(goog.dom.$('svgtext'), svg);
	} else {
	  window.open('data:image/svg+xml,' + goog.string.urlEncode(svg), null);
	}
  });
}
goog.exportSymbol('initialize', initialize, window);
