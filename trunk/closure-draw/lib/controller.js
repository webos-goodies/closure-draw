// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Copyright 2010 Chihiro Ito. All Rights Reserved.

goog.provide('closuredraw.Controller');
goog.require('goog.Disposable');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventHandler');
goog.require('goog.ui.Component');
goog.require('closuredraw.Command');
goog.require('closuredraw.CommandEvent');
goog.require('closuredraw.Canvas');

/**
 * UI controller of Closure Draw.
 * @param {!closuredraw.Canvas} canvas The closuredraw.Canvas instance.
 * @constructor
 */
closuredraw.Controller = function(canvas) {
  goog.base(this);
  this.canvas_     = canvas;
  this.eh_         = new goog.events.EventHandler(this);
  this.components_ = [];

  this.eh_.listen(
	this.canvas_, closuredraw.Canvas.EventType.STATUS_CHANGED, this.onStatusChanged_);
};
goog.inherits(closuredraw.Controller, goog.Disposable);

/**
 * The closuredraw.Canvas instance.
 * @type {closuredraw.Canvas}
 * @private
 */
closuredraw.Controller.prototype.canvas_;

/**
 * EventHandler
 * @type {goog.events.EventHandler}
 * @private
 */
closuredraw.Controller.prototype.eh_;

/**
 * The array of UI components.
 * @type {Array.<goog.ui.Component>}
 * @private
 */
closuredraw.Controller.prototype.components_;

/**
 * Adds a component.
 * @param {goog.events.EventTarget} component The UI component.
 */
closuredraw.Controller.prototype.addComponent = function(component) {
  this.components_.push(component);
  this.eh_.listen(
	component, goog.ui.Component.EventType.ACTION, this.onAction_);
  this.eh_.listen(
	component, closuredraw.CommandEvent.EVENT_TYPE, this.onCommand_);
  if(goog.isFunction(component.updateClosureDrawStatus)) {
	component.updateClosureDrawStatus(this.canvas_.queryStatus());
  }
};

/**
 * Adds a HTML element.
 * @param {Element} element The HTML element.
 */
closuredraw.Controller.prototype.addElement = function(element) {
  var command = element.getAttribute('closuredrawcmd');
  var value   = element.getAttribute('closuredrawval') || '';
  if(command && closuredraw.Controller.isCommand_(command)) {
	this.eh_.listen(
	  element, goog.events.EventType.CLICK, goog.bind(this.onClick_, this, command, value));
  }
};

/**
 * Checks whether the specified string is one of commands.
 * @param {string} str The target string.
 * @return True if str is a command, false otherwise.
 * @private
 */
closuredraw.Controller.isCommand_ = function(str) {
  return (str == closuredraw.Command.SET_MODE ||
		  str == closuredraw.Command.INSERT_IMAGE ||
		  str == closuredraw.Command.SET_STROKE_WIDTH ||
		  str == closuredraw.Command.SET_STROKE_COLOR ||
		  str == closuredraw.Command.SET_FILL_COLOR ||
		  str == closuredraw.Command.SET_FONT_SIZE ||
		  str == closuredraw.Command.BRING_UP ||
		  str == closuredraw.Command.BRING_DOWN ||
		  str == closuredraw.Command.BRING_TO_TOP ||
		  str == closuredraw.Command.BRING_TO_BOTTOM ||
		  str == closuredraw.Command.COPY ||
		  str == closuredraw.Command.DELETE);
};

/**
 * Event handler for UI component actions.
 * @param {goog.events.Event} e Event object.
 * @private
 */
closuredraw.Controller.prototype.onAction_ = function(e) {
  var model = e.target.getModel() || {};
  if(closuredraw.Controller.isCommand_(model.command || '')) {
	this.canvas_.execCommand(model.command, model.arg);
  }
};

/**
 * Event handler for command event.
 * @param {goog.events.Event} e Event object.
 * @private
 */
closuredraw.Controller.prototype.onCommand_ = function(e) {
  if(closuredraw.Controller.isCommand_(e.command)) {
	this.canvas_.execCommand(e.command, e.arg);
  }
};

/**
 * Event handler for click event.
 * @param {string} command The command to execute.
 * @param {string} arg The argument.
 * @param {goog.events.Event} e Event object.
 * @private
 */
closuredraw.Controller.prototype.onClick_ = function(command, arg, e) {
  this.canvas_.execCommand(command, arg);
};

/**
 * Event handler for STATUS_CHANGED event.
 * @param {goog.events.Event} e Event object.
 * @private
 */
closuredraw.Controller.prototype.onStatusChanged_ = function(e) {
  var status = this.canvas_.queryStatus();
  goog.array.forEach(this.components_, function(component) {
	if(goog.isFunction(component.updateClosureDrawStatus)) {
	  component.updateClosureDrawStatus(status);
	}
  }, this);
};

/** @inheritDoc */
closuredraw.Controller.prototype.disposeInternal = function() {
  if(this.eh_) {
	this.eh_.removeAll();
	this.eh_.dispose();
  }
  this.canvas_     = null;
  this.eh_         = null;
  this.components_ = null;
  goog.base(this, 'disposeInternal');
};
