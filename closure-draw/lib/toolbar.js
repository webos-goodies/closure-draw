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

goog.provide('closuredraw.Toolbar');
goog.provide('closuredraw.ToolbarSelect');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.dom.DomHelper');
goog.require('goog.events');
goog.require('goog.ui.Toolbar');
goog.require('goog.ui.ToolbarButton');
goog.require('goog.ui.ToolbarSelect');
goog.require('goog.ui.ToolbarColorMenuButton');
goog.require('goog.ui.ToolbarSeparator');
goog.require('goog.ui.Tooltip');
goog.require('closuredraw.Command');
goog.require('closuredraw.Mode');
goog.require('closuredraw.CommandEvent');

/**
 * A toolbar class for Closure Draw widget.
 *
 * @param {goog.ui.ToolbarRenderer=} opt_renderer Renderer used to render or
 *     decorate the toolbar; defaults to {@link goog.ui.ToolbarRenderer}.
 * @param {?goog.ui.Container.Orientation=} opt_orientation Toolbar orientation;
 *     defaults to {@code HORIZONTAL}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Toolbar}
 */
closuredraw.Toolbar = function(opt_renderer, opt_orientation, opt_domHelper) {
  goog.base(this, opt_renderer, opt_orientation, opt_domHelper);

  this.tooltips_ = [];

  // create toolbar buttons
  var dom            = this.getDomHelper();
  this.modeSelector_ = new closuredraw.ToolbarSelect(null, null, null, dom);
  this.imageBtn_     = new goog.ui.ToolbarButton(this.makeCaption_('insert-image'), null, dom);
  this.strokeWidth_  = new goog.ui.ToolbarSelect(null, null, null, dom);
  this.strokeColor_  = this.createColorButton_(this.makeCaption_('color-stroke', 12), null, dom);
  this.fillColor_    = this.createColorButton_(this.makeCaption_('color-fill',   12), null, dom);
  this.fontSize_     = new goog.ui.ToolbarSelect(null, null, null, dom);
  this.upBtn_        = new goog.ui.ToolbarButton(this.makeCaption_('bring-up'), null, dom);
  this.downBtn_      = new goog.ui.ToolbarButton(this.makeCaption_('bring-down'), null, dom);
  this.topBtn_       = new goog.ui.ToolbarButton(this.makeCaption_('bring-top'), null, dom);
  this.bottomBtn_    = new goog.ui.ToolbarButton(this.makeCaption_('bring-bottom'), null, dom);
  this.copyBtn_      = new goog.ui.ToolbarButton(this.makeCaption_('copy'), null, dom);
  this.deleteBtn_    = new goog.ui.ToolbarButton(this.makeCaption_('delete'), null, dom);

  // initialize the mode selector
  goog.array.forEach(closuredraw.Toolbar.ModeList, function(mode) {
	this.modeSelector_.addItem(new goog.ui.MenuItem(
	  dom.createDom('div', 'closuredraw-icon closuredraw-mode-' + mode),
	  { command: closuredraw.Command.SET_MODE, arg: mode }, dom));
  }, this);

  // initialize the stroke width selector
  goog.array.forEach(closuredraw.Toolbar.StrokeWidthList, function(width){
	this.strokeWidth_.addItem(new goog.ui.MenuItem(
	  width + 'px', { command: closuredraw.Command.SET_STROKE_WIDTH, arg: width }, dom));
  }, this);

  // initialize the font size selector
  goog.array.forEach(closuredraw.Toolbar.FontSizeList, function(size){
	this.fontSize_.addItem(new goog.ui.MenuItem(
	  size+'px', { command: closuredraw.Command.SET_FONT_SIZE, arg: size }, dom));
  }, this);

  // initialize other buttons
  this.imageBtn_.setModel({ command: closuredraw.Command.INSERT_IMAGE });
  this.strokeColor_.setModel({ command: closuredraw.Command.SET_STROKE_COLOR });
  this.fillColor_.setModel({ command: closuredraw.Command.SET_FILL_COLOR });
  this.upBtn_.setModel({ command: closuredraw.Command.BRING_UP });
  this.downBtn_.setModel({ command: closuredraw.Command.BRING_DOWN });
  this.topBtn_.setModel({ command: closuredraw.Command.BRING_TO_TOP });
  this.bottomBtn_.setModel({ command: closuredraw.Command.BRING_TO_BOTTOM });
  this.copyBtn_.setModel({ command: closuredraw.Command.COPY });
  this.deleteBtn_.setModel({ command: closuredraw.Command.DELETE });

  // prohibit the toolbar from being focused.
  this.setFocusable(false);
  this.setFocusableChildrenAllowed(false);
};
goog.inherits(closuredraw.Toolbar, goog.ui.Toolbar);

/**
 * Mode list.
 * @type {Array.<closuredraw.Mode>}
 * @const
 */
closuredraw.Toolbar.ModeList = [
  closuredraw.Mode.MOVE,
  closuredraw.Mode.MODIFY,
  closuredraw.Mode.RECT,
  closuredraw.Mode.ELLIPSE,
  closuredraw.Mode.PATH,
  closuredraw.Mode.TEXT];

/**
 * Values displayed in the stroke width menu.
 * @type {Array.<number>}
 * @const
 */
closuredraw.Toolbar.StrokeWidthList = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Values displayed in the font size menu.
 * @type {Array.<number>}
 * @const
 */
closuredraw.Toolbar.FontSizeList = [10, 12, 14, 16, 18, 20, 24, 30, 38, 48, 50, 64];

/**
 * Builds a caption elements for toolbar buttons.
 * @param {string} klass CSS class.
 * @param {number} height Icon height.
 * @return {Element} Caption elements.
 * @private
 */
closuredraw.Toolbar.prototype.makeCaption_ = function(klass, height) {
  var domHelper = this.getDomHelper();
  var attribute = { 'class': 'closuredraw-icon closuredraw-' + klass };
  if(height)
	attribute['style'] = 'height:' + height + 'px;';
  return domHelper.createDom('DIV', attribute);
};

/**
 * Builds a color palette menu.
 * @param {Element} caption Caption elements.
 * @return {goog.ui.ColorMenuButton} The palette menu button.
 * @private
 */
closuredraw.Toolbar.prototype.createColorButton_ = function(caption) {
  var dom    = this.getDomHelper();
  var button = new goog.ui.ColorMenuButton(
	caption, goog.ui.ColorMenuButton.newColorMenu(),
	goog.ui.ToolbarColorMenuButtonRenderer.getInstance());
  button.addItemAt(new goog.ui.MenuItem('None', goog.ui.ColorMenuButton.NO_COLOR, dom), 0);
  button.addItemAt(new goog.ui.Separator(null, dom), 1);
  return button;
};

/**
 * Creates a tooltip and attachs it to the specific button.
 * @param {goog.ui.Componet} button The button attached to.
 * @param {string} message The contents of tooltip.
 * @private
 */
closuredraw.Toolbar.prototype.createTooltip = function(button, message) {
  var tooltip = new goog.ui.Tooltip(
	button.getElement(), message, this.getDomHelper());
  this.tooltips_.push(tooltip);
};

/**
 * Event handler for ACTION event from the select button.
 * @param {goog.events.Event} e Event object.
 * @private
 */
closuredraw.Toolbar.prototype.onSelect_ = function(e) {
  var event = new goog.events.Event(
	goog.ui.Component.EventType.ACTION,
	e.target.getItemAt(e.target.getSelectedIndex()));
  this.dispatchEvent(event);
  e.stopPropagation();
};

/**
 * Event handler for ACTION event from the color palette.
 * @param {goog.events.Event} e Event object.
 * @private
 */
closuredraw.Toolbar.prototype.onChangeColor_ = function(e) {
  closuredraw.CommandEvent.dispatch(
	this, e.target.getModel().command, e.target.getSelectedColor());
  e.stopPropagation();
};

/**
 * Update select button.
 * @param {goog.ui.ToolbarSelect} button The select button.
 * @param {Array} valueList The list of item value.
 * @param {*} value Current value.
 */
closuredraw.Toolbar.UpdateSelect = function(button, valueList, value) {
  var index = goog.array.indexOf(valueList, value);
  button.setSelectedIndex(index >= 0 ? index : 0);
};

/**
 * Updates buttons.
 * @param {Object} status Status object.
 */
closuredraw.Toolbar.prototype.updateClosureDrawStatus = function(status) {
  closuredraw.Toolbar.UpdateSelect(
	this.modeSelector_, closuredraw.Toolbar.ModeList, status.mode);
  closuredraw.Toolbar.UpdateSelect(
	this.strokeWidth_, closuredraw.Toolbar.StrokeWidthList, status.strokeWidth);
  closuredraw.Toolbar.UpdateSelect(
	this.fontSize_, closuredraw.Toolbar.FontSizeList, status.fontSize);

  this.strokeColor_.setSelectedColor(status.strokeColor);
  this.fillColor_.setSelectedColor(status.fillColor);

  this.fontSize_.setVisible(status.mode == closuredraw.Mode.TEXT || status.isText);
}

/** @inheritDoc */
closuredraw.Toolbar.prototype.enterDocument = function() {
  closuredraw.Toolbar.superClass_.enterDocument.call(this);

  this.addChild(this.modeSelector_, true);
  this.addChild(this.imageBtn_, true);
  this.addChild(new goog.ui.ToolbarSeparator(), true);
  this.addChild(this.strokeWidth_, true);
  this.addChild(this.strokeColor_, true);
  this.addChild(this.fillColor_, true);
  this.addChild(this.fontSize_, true);
  this.addChild(new goog.ui.ToolbarSeparator(), true);
  this.addChild(this.upBtn_, true);
  this.addChild(this.downBtn_, true);
  this.addChild(this.topBtn_, true);
  this.addChild(this.bottomBtn_, true);
  this.addChild(new goog.ui.ToolbarSeparator(), true);
  this.addChild(this.copyBtn_, true);
  this.addChild(new goog.ui.ToolbarSeparator(), true);
  this.addChild(this.deleteBtn_, true);

  var eh = this.getHandler();
  eh.listen(this.modeSelector_, goog.ui.Component.EventType.ACTION, this.onSelect_);
  eh.listen(this.strokeWidth_,  goog.ui.Component.EventType.ACTION, this.onSelect_);
  eh.listen(this.strokeColor_,  goog.ui.Component.EventType.ACTION, this.onChangeColor_);
  eh.listen(this.fillColor_,    goog.ui.Component.EventType.ACTION, this.onChangeColor_);
  eh.listen(this.fontSize_,     goog.ui.Component.EventType.ACTION, this.onSelect_);

  this.createTooltip(this.modeSelector_, goog.getMsg('Select editing mode'));
  this.createTooltip(this.imageBtn_,     goog.getMsg('Insert image'));
  this.createTooltip(this.strokeWidth_,  goog.getMsg('Stroke width'));
  this.createTooltip(this.strokeColor_,  goog.getMsg('Stroke color'));
  this.createTooltip(this.fillColor_,    goog.getMsg('Fill color'));
  this.createTooltip(this.fontSize_,     goog.getMsg('Font size'));
  this.createTooltip(this.upBtn_,        goog.getMsg('Rise shape one step'));
  this.createTooltip(this.downBtn_,      goog.getMsg('Lowner shape one step'));
  this.createTooltip(this.topBtn_,       goog.getMsg('Rise shape to top'));
  this.createTooltip(this.bottomBtn_,    goog.getMsg('Lower shape to bottom'));
  this.createTooltip(this.copyBtn_,      goog.getMsg('Duplicate shape'));
  this.createTooltip(this.deleteBtn_,    goog.getMsg('Delete shape'));
};

/** @inheritDoc */
closuredraw.Toolbar.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
  this.modeSelector_ = null;
  this.imageBtn_     = null;
  this.strokeWidth_  = null;
  this.strokeColor_  = null;
  this.fillColor_    = null;
  this.fontSize_     = null;
  this.upBtn_        = null;
  this.downBtn_      = null;
  this.topBtn_       = null;
  this.bottomBtn_    = null;
  this.deleteBtn_    = null;
};


//----------------------------------------------------------

/**
 * A mode selector class for Closure Draw widget.
 *
 * @param {goog.ui.ControlContent} caption Default caption or existing DOM
 *     structure to display as the button's caption when nothing is selected.
 * @param {goog.ui.Menu=} opt_menu Menu containing selection options.
 * @param {goog.ui.MenuButtonRenderer=} opt_renderer Renderer used to
 *     render or decorate the control; defaults to
 *     {@link goog.ui.ToolbarMenuButtonRenderer}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for
 *     document interaction.
 * @constructor
 * @extends {goog.ui.ToolbarSelect}
 */
closuredraw.ToolbarSelect = function() {
  goog.ui.ToolbarSelect.apply(this, arguments);
};
goog.inherits(closuredraw.ToolbarSelect, goog.ui.ToolbarSelect);

closuredraw.ToolbarSelect.prototype.updateCaption_ = function() {
  var item    = this.getSelectedItem();
  var caption = this.defaultCaption_;
  if(item) {
	caption = item.getContent();
	if(caption) {
	  if(goog.isArray(caption)) {
		caption = goog.array.map(caption, function(el) { return el.cloneNode(true); });
	  } else if(!goog.isString(caption)) {
		caption = caption.cloneNode(true);
	  }
	}
  }
  this.setContent(caption);
};
