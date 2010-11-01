goog.provide('closuredraw.chromeless.App');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('closuredraw.Commands');
goog.require('closuredraw.Canvas');

/** @constructor */
closuredraw.chromeless.App = function() {
  this.canvas_ = new closuredraw.Canvas(512, 512);
  this.canvas_.render(goog.dom.$('canvas'));

  for(var i = 0 ; i <= 5 ; ++i) {
	var el = goog.dom.getElement('mode-' + i);
	goog.events.listen(
	  el, goog.events.EventType.CLICK, goog.bind(this.onModeButton_, this, i));
  }

  for(var i = 1 ; i <= 5 ; ++i) {
	var el = goog.dom.getElement('stroke-width-' + i);
	goog.events.listen(
	  el, goog.events.EventType.CLICK, goog.bind(this.onStrokeWidthButton_, this, i));
  }

  goog.array.forEach(['#ff0000', '#00ff00', '#0000ff'], function(color, i) {
	var el = goog.dom.getElement('stroke-color-' + i);
	goog.events.listen(
	  el, goog.events.EventType.CLICK, goog.bind(this.onStrokeColorButton_, this, color));

	el = goog.dom.getElement('fill-' + i);
	goog.events.listen(
	  el, goog.events.EventType.CLICK, goog.bind(this.onFillButton_, this, color));
  }, this);

  goog.events.listen(
	goog.dom.getElement('bring-up'),
	goog.events.EventType.CLICK,
	goog.bind(this.onBringButton_, this, closuredraw.Commands.BRING_UP));

  goog.events.listen(
	goog.dom.getElement('bring-down'),
	goog.events.EventType.CLICK,
	goog.bind(this.onBringButton_, this, closuredraw.Commands.BRING_DOWN));

  goog.events.listen(
	goog.dom.getElement('bring-to-top'),
	goog.events.EventType.CLICK,
	goog.bind(this.onBringButton_, this, closuredraw.Commands.BRING_TO_TOP));

  goog.events.listen(
	goog.dom.getElement('bring-to-bottom'), goog.events.EventType.CLICK,
	goog.bind(this.onBringButton_, this, closuredraw.Commands.BRING_TO_BOTTOM));

  goog.events.listen(
	goog.dom.getElement('insert-image'), goog.events.EventType.CLICK,
	goog.bind(this.onInsertImage_, this));

  goog.events.listen(
	goog.dom.getElement('delete-shape'), goog.events.EventType.CLICK,
	goog.bind(this.onDeleteShape_, this));

  goog.events.listen(
	goog.dom.getElement('copy-shape'), goog.events.EventType.CLICK,
	goog.bind(this.onCopyShape_, this));
}

closuredraw.chromeless.App.prototype.onModeButton_ = function(mode, e) {
  this.canvas_.execCommand(closuredraw.Commands.SET_MODE, mode);
};

closuredraw.chromeless.App.prototype.onStrokeWidthButton_ = function(width, e) {
  this.canvas_.execCommand(closuredraw.Commands.SET_STROKE_WIDTH, width);
};

closuredraw.chromeless.App.prototype.onStrokeColorButton_ = function(color, e) {
  this.canvas_.execCommand(closuredraw.Commands.SET_STROKE_COLOR, color);
};

closuredraw.chromeless.App.prototype.onFillButton_ = function(color, e) {
  this.canvas_.execCommand(closuredraw.Commands.SET_FILL_COLOR, color);
};

closuredraw.chromeless.App.prototype.onBringButton_ = function(command, e) {
  this.canvas_.execCommand(command);
};

closuredraw.chromeless.App.prototype.onInsertImage_ = function(color, e) {
  this.canvas_.execCommand(closuredraw.Commands.INSERT_IMAGE);
};

closuredraw.chromeless.App.prototype.onDeleteShape_ = function(color, e) {
  this.canvas_.execCommand(closuredraw.Commands.DELETE);
};

closuredraw.chromeless.App.prototype.onCopyShape_ = function(color, e) {
  this.canvas_.execCommand(closuredraw.Commands.COPY);
};

new closuredraw.chromeless.App();
