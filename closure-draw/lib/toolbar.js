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
goog.require('goog.events');
goog.require('goog.ui.Toolbar');
goog.require('goog.ui.ToolbarButton');
goog.require('goog.ui.ToolbarSelect');
goog.require('goog.ui.ToolbarColorMenuButton');
goog.require('goog.ui.ToolbarSeparator');
goog.require('goog.graphics');
goog.require('closuredraw.AbstractMode');
goog.require('closuredraw.MoveMode');
goog.require('closuredraw.TextMode');
goog.require('closuredraw.Image');

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
closuredraw.Toolbar = function(modes) {
  goog.ui.Toolbar.apply(this, Array.prototype.slice.call(arguments, 1));

  var dom            = this.getDomHelper();
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.modeSelector_ = new closuredraw.ToolbarSelect();
  this.imageBtn_     = new goog.ui.ToolbarButton(this.makeCaption_('insert-image'));
  this.strokeWidth_  = new goog.ui.ToolbarSelect();
  this.strokeColor_  = this.createColorButton(this.makeCaption_('color-stroke', 12));
  this.fillColor_    = this.createColorButton(this.makeCaption_('color-fill',   12));
  this.fontSize_     = new goog.ui.ToolbarSelect();
  this.upBtn_        = new goog.ui.ToolbarButton(this.makeCaption_('bring-up'));
  this.downBtn_      = new goog.ui.ToolbarButton(this.makeCaption_('bring-down'));
  this.topBtn_       = new goog.ui.ToolbarButton(this.makeCaption_('bring-top'));
  this.bottomBtn_    = new goog.ui.ToolbarButton(this.makeCaption_('bring-bottom'));
  this.deleteBtn_    = new goog.ui.ToolbarButton(this.makeCaption_('delete'));

  // initialize the mode selector
  goog.array.forEach(modes, function(mode) {
	this.modeSelector_.addItem(new goog.ui.MenuItem(mode.getCaption(dom)));
  }, this);

  // initialize the stroke width selector
  for(var i = 1 ; i < 10 ; ++i) {
	this.strokeWidth_.addItem(new goog.ui.MenuItem(i + 'px'));
  }

  // initialize the font size selector
  goog.array.forEach(closuredraw.Toolbar.FontSizeList, function(size){
	this.fontSize_.addItem(new goog.ui.MenuItem(size+'px'));
  }, this);
};
goog.inherits(closuredraw.Toolbar, goog.ui.Toolbar);

closuredraw.Toolbar.FontSizeList = [10, 12, 14, 16, 18, 20, 24, 30, 38, 48, 50, 64];

closuredraw.Toolbar.prototype.makeCaption_ = function(klass, height) {
  var domHelper = this.getDomHelper();
  var attribute = { 'class': 'closuredraw-icon closuredraw-' + klass };
  if(height)
	attribute['style'] = 'height:' + height + 'px;';
  return domHelper.createDom('DIV', attribute);
};

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
  this.addChild(this.deleteBtn_, true);

  this.eventHandler_.listen(this.modeSelector_,
							goog.ui.Component.EventType.ACTION, this.onChangeMode);
  this.eventHandler_.listen(this.imageBtn_,
							goog.ui.Component.EventType.ACTION, this.onImageBtn);
  this.eventHandler_.listen(this.strokeWidth_,
							goog.ui.Component.EventType.ACTION, this.onChangeStroke);
  this.eventHandler_.listen(this.strokeColor_,
							goog.ui.Component.EventType.ACTION, this.onChangeStroke);
  this.eventHandler_.listen(this.fillColor_,
							goog.ui.Component.EventType.ACTION, this.onChangeFillColor);
  this.eventHandler_.listen(this.fontSize_,
							goog.ui.Component.EventType.ACTION, this.onChangeFontSize);
  this.eventHandler_.listen(this.upBtn_,
							goog.ui.Component.EventType.ACTION, this.onUpBtn);
  this.eventHandler_.listen(this.downBtn_,
							goog.ui.Component.EventType.ACTION, this.onDownBtn);
  this.eventHandler_.listen(this.topBtn_,
							goog.ui.Component.EventType.ACTION, this.onTopBtn);
  this.eventHandler_.listen(this.bottomBtn_,
							goog.ui.Component.EventType.ACTION, this.onBottomBtn);
  this.eventHandler_.listen(this.deleteBtn_,
							goog.ui.Component.EventType.ACTION, this.onDeleteBtn);
  this.updateStatus();
};

closuredraw.Toolbar.prototype.exitDocument = function() {
  if(this.eventHandler_) this.eventHandler_.removeAll();
  closuredraw.Toolbar.superClass_.exitDocument.call(this);
};

closuredraw.Toolbar.prototype.disposeInternal = function() {
  closuredraw.Toolbar.superClass_.disposeInternal.call(this);
  if(this.eventHandler_) this.eventHandler_.dispose();
  this.eventHandler_ = null;
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

closuredraw.Toolbar.prototype.createColorButton = function(caption) {
  var button = new goog.ui.ColorMenuButton(
	caption, goog.ui.ColorMenuButton.newColorMenu(),
	goog.ui.ToolbarColorMenuButtonRenderer.getInstance());
  button.addItemAt(new goog.ui.MenuItem('None', goog.ui.ColorMenuButton.NO_COLOR), 0);
  button.addItemAt(new goog.ui.Separator(), 1);
  return button;
};

closuredraw.Toolbar.prototype.getModeSelector = function() {
  return this.modeSelector_;
};

closuredraw.Toolbar.prototype.setStroke = function(stroke) {
  if(stroke) {
	this.strokeWidth_.setSelectedIndex(stroke.getWidth() - 1);
	this.strokeColor_.setSelectedColor(stroke.getColor());
  } else {
	this.strokeColor_.setSelectedColor(null);
  }
};

closuredraw.Toolbar.prototype.setFill = function(fill) {
  if(fill) {
	this.fillColor_.setSelectedColor(fill.getColor());
  } else {
	this.fillColor_.setSelectedColor(null);
  }
};

closuredraw.Toolbar.prototype.setFont = function(font) {
  var item = goog.array.indexOf(closuredraw.Toolbar.FontSizeList, font.size);
  this.fontSize_.setSelectedIndex(item >= 0 ? item : 0);
};

closuredraw.Toolbar.prototype.updateStatus = function() {
  var widget = this.getParent();
  var mode   = widget.getCurrentMode();
  var bFont  = false;
  if(mode instanceof closuredraw.MoveMode) {
	var index = widget.getCurrentShapeIndex();
	bFont     = index >= 0 && widget.getShape(index).isText();
  } else if(mode instanceof closuredraw.TextMode) {
	bFont = true;
  }
  this.fontSize_.setVisible(bFont);
}

closuredraw.Toolbar.prototype.onChangeMode = function(e) {
  this.getParent().setModeIndex(e.target.getSelectedIndex());
};

closuredraw.Toolbar.prototype.onImageBtn = function(e) {
  var owner = this.getParent();
  owner.showPrompt('Image URL:', 'http://', function(url) {
	owner.setModeIndex(0, true);
	if(url) {
	  var size  = owner.getGraphics().getSize();
	  var shape = new closuredraw.Image(owner, url);
	  shape.setTransform(size.width/2, size.height/2, size.width/4, size.height/4, 0);
	  owner.setCurrentShapeIndex(-1);
	  owner.addShape(shape);
	  owner.setCurrentShapeIndex(0);
	}
  }, this);
};

closuredraw.Toolbar.prototype.onChangeStroke = function(e) {
  var item  = this.strokeWidth_.getSelectedItem();
  var width = Math.max(parseFloat(item.getCaption()), 0.5);
  var color = this.strokeColor_.getSelectedColor();
  this.getParent().setCurrentStroke(color ? new goog.graphics.Stroke(width, color) : null, false);
};

closuredraw.Toolbar.prototype.onChangeFillColor = function(e) {
  var color  = e.target.getSelectedColor();
  this.getParent().setCurrentFill(color ? new goog.graphics.SolidFill(color) : null, false);
};

closuredraw.Toolbar.prototype.onChangeFontSize = function(e) {
  var item = this.fontSize_.getSelectedItem();
  var size = Math.max(parseFloat(item.getCaption()), '4');
  this.getParent().setCurrentFont(new goog.graphics.Font(size, 'sans-serif'), true);
};

closuredraw.Toolbar.prototype.onDeleteBtn = function(e) {
  var widget = this.getParent();
  var index  = widget.getCurrentShapeIndex();
  if(index >= 0)
	widget.deleteShape(index);
};

closuredraw.Toolbar.prototype.onUpBtn = function(e) {
  this.getParent().bringTo('-1');
};

closuredraw.Toolbar.prototype.onDownBtn = function(e) {
  this.getParent().bringTo('+1');
};

closuredraw.Toolbar.prototype.onTopBtn = function(e) {
  this.getParent().bringTo('0');
};

closuredraw.Toolbar.prototype.onBottomBtn = function(e) {
  var widget = this.getParent();
  widget.bringTo(widget.getShapeCount());
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
