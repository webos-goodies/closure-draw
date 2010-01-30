goog.require('goog.dom.xml');
goog.require('closuredraw');

function initialize() {
  var canvas1 = new closuredraw.Widget(512, 256);
  canvas1.render(goog.dom.$('canvas1'));

  var canvas2 = new closuredraw.Widget(512, 256);
  canvas2.render(goog.dom.$('canvas2'));

  goog.events.listen(goog.dom.$('button'), goog.events.EventType.CLICK, function(e) {
	var svg = goog.dom.xml.loadXml(goog.dom.xml.serialize(canvas1.exportSVG()));
	canvas2.importSVG(svg);
	return;
  });
}
goog.exportSymbol('initialize', initialize, window);
