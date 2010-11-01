goog.provide('closuredraw.chromeless.App');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('closuredraw.Command');
goog.require('closuredraw.Canvas');
goog.require('closuredraw.Controller');

/** @constructor */
closuredraw.chromeless.App = function() {
  this.canvas_ = new closuredraw.Canvas(512, 512);
  this.canvas_.render(goog.dom.$('canvas'));

  this.controller_ = new closuredraw.Controller(this.canvas_);

  goog.array.forEach(document.body.getElementsByTagName('button'), function(el) {
	this.controller_.addElement(el);
  }, this);
}

new closuredraw.chromeless.App();
