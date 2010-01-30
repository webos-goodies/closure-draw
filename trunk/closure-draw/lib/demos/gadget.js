goog.require('goog.dom.xml');
goog.require('goog.string');
goog.require('goog.userAgent');
goog.require('goog.ui.ToolbarButton');
goog.require('goog.ui.ToolbarSeparator');
goog.require('closuredraw');

function initialize() {
  if(goog.userAgent.IE) {
	goog.dom.$('warning').style.display = 'block';
  }

  var outer  = goog.dom.$('canvas');
  var canvas = new closuredraw.Widget(outer.clientWidth, 512);
  canvas.render(outer);

  var toolbar = canvas.getToolbar();
  var saveBtn = new goog.ui.ToolbarButton("Save");
  toolbar.addChildAt(saveBtn, 0, true);
  toolbar.addChildAt(new goog.ui.ToolbarSeparator(), 1, true);
  goog.events.listen(saveBtn, goog.ui.Component.EventType.ACTION, function(e) {
	var svg = canvas.exportSVG().documentElement;
	var url = goog.string.urlEncode(goog.dom.xml.serialize(svg));
	window.open('data:image/svg+xml,' + url, null);
  });
}
goog.exportSymbol('initialize', initialize, window);
