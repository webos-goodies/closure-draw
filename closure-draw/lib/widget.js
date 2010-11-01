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

goog.provide('closuredraw.Widget');

goog.require('goog.ui.Component');
goog.require('closuredraw.Canvas');
goog.require('closuredraw.Toolbar');
goog.require('closuredraw.Controller');

/**
 * Closure Draw widget.
 *
 * @param {number|string} width The width in pixels or percent.
 * @param {number|string} height The height in pixels or percent.
 * @param {goog.dom.DomHelper=} opt_domHelper The DOM helper object for the
 *     document we want to render in.
 * @constructor
 * @extends {goog.ui.Component}
 */
closuredraw.Widget = function(width, height, opt_domHelper) {
  goog.base(this, opt_domHelper);

  // create a canvas
  this.canvas_ = new closuredraw.Canvas(width, height, opt_domHelper);
  this.addChild(this.canvas_, false);

  // create a toolbar
  this.toolbar_ = new closuredraw.Toolbar(null, null, opt_domHelper);
  this.addChild(this.toolbar_, false);
};
goog.inherits(closuredraw.Widget, goog.ui.Component);

/** @inheritDoc */
closuredraw.Widget.prototype.createDom = function() {
  this.decorateInternal(this.dom_.createElement('div'));
};

/** @inheritDoc */
closuredraw.Widget.prototype.decorateInternal = function(element) {
  goog.base(this, 'decorateInternal', element);

  var dom    = this.getDomHelper();
  var rootEl = this.getElement();

  // decorate the root element itself
  goog.dom.classes.add(rootEl, 'closuredraw-component');
  rootEl.tabIndex = 0;

  // create the toolbar elements.
  this.toolbar_.createDom();
  dom.appendChild(rootEl, this.toolbar_.getElement());

  // create the canvas elements.
  this.canvas_.createDom();
  dom.appendChild(rootEl, this.canvas_.getElement());
};

/** @inheritDoc */
closuredraw.Widget.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.controller_ = new closuredraw.Controller(this.canvas_);
  this.controller_.addComponent(this.toolbar_);
};

/** @inheritDoc */
closuredraw.Widget.prototype.exitDocument = function() {
  if(this.controller_) {
	this.controller_.dispose();
	this.controller_ = null;
  }
  goog.base(this, 'exitDocument');
};

/** @inheritDoc */
closuredraw.Widget.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
  this.toolbar_ = null;
  this.canvas_  = null;
};

/**
 * Returns a SVG document contains all shapes.
 * @return {document} An SVG document.
 */
closuredraw.Widget.prototype.exportSVG = function() {
  return this.canvas_.exportSVG();
};

/**
 * Imports shapes from the specific SVG document.
 * @param {document} doc An SVG document.
 */
closuredraw.Widget.prototype.importSVG = function(doc) {
  this.canvas_.importSVG(doc);
};

/**
 * Returns the toolbar component.
 * @return {goog.ui.Toolbar} The toolbar component.
 */
closuredraw.Widget.prototype.getToolbar = function() {
  return this.toolbar_;
};
