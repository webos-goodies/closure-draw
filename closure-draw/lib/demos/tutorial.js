goog.require('goog.dom.xml');
//goog.require('goog.crypt.base64');
goog.require('goog.string');
goog.require('goog.userAgent');
goog.require('goog.ui.ToolbarButton');
goog.require('goog.ui.ToolbarSeparator');
goog.require('closuredraw');

function initialize() {
  var canvas = new closuredraw.Widget(512, 512);
  canvas.render(goog.dom.$('canvas'));

  var toolbar = canvas.getToolbar();
  var saveBtn = new goog.ui.ToolbarButton("Save");
  toolbar.addChildAt(saveBtn, 0, true);
  toolbar.addChildAt(new goog.ui.ToolbarSeparator(), 1, true);
  goog.events.listen(saveBtn, goog.ui.Component.EventType.ACTION, function(e) {
	var svg = canvas.exportSVG().documentElement;
	//var dec = '<?xml version="1.0" encoding="UTF-8"?>';
	//var url = goog.crypt.base64.encodeString(dec + goog.dom.xml.serialize(svg));
	//window.open('data:image/svg+xml;base64,' + url, null);
	var url = goog.string.urlEncode(goog.dom.xml.serialize(svg));
	window.open('data:image/svg+xml,' + url, null);
  });
}
goog.exportSymbol('initialize', initialize, window);
