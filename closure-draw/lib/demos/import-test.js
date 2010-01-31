goog.require('goog.dom.xml');
goog.require('closuredraw');

function initialize() {
  var canvas1 = new closuredraw.Widget(512, 256);
  canvas1.render(goog.dom.$('canvas1'));

  var canvas2 = new closuredraw.Widget(512, 256);
  canvas2.render(goog.dom.$('canvas2'));

  goog.events.listen(goog.dom.$('button'), goog.events.EventType.CLICK, function(e) {
	var svg = goog.dom.xml.serialize(canvas1.exportSVG());
	// remove empty namespaces because IE may generate it.
	svg = svg.replace(/\s*xmlns=\"\"/g, '');

	canvas2.importSVG(goog.dom.xml.loadXml(svg));
  });
}
goog.exportSymbol('initialize', initialize, window);
