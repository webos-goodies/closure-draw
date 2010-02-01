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
goog.provide('closuredraw.WidgetImportParams');

goog.require('goog.object');
goog.require('goog.array');
goog.require('goog.math.Vec2');
goog.require('goog.userAgent')
goog.require('goog.dom');
goog.require('goog.dom.DomHelper');
goog.require('goog.dom.xml');
goog.require('goog.events');
goog.require('goog.events.EventHandler');
goog.require('goog.graphics');
goog.require('goog.graphics.Font');
goog.require('goog.fx.Dragger');
goog.require('closuredraw.AbstractMode');
goog.require('closuredraw.Toolbar');

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
  goog.ui.Component.call(this, opt_domHelper);

  // initialize member variables
  this.modes_         = [];
  this.eventHandler_  = new goog.events.EventHandler(this);
  this.handleShapes_  = {};
  this.dragger_       = null;
  this.dragTarget_    = null;
  this.shapes_        = [];
  this.currentMode_   = 2;
  this.currentShape_  = -1;
  this.currentStroke_ = new goog.graphics.Stroke(2, '#000000');
  this.currentFill_   = new goog.graphics.SolidFill('#ffff00');
  this.currentFont_   = new goog.graphics.Font(16, 'sans-serif');
  this.handleStroke_  = new goog.graphics.Stroke(1, '#000000');
  this.handleFill_    = new goog.graphics.SolidFill('#ffffff', 0.8);

  // create operation mode objects
  closuredraw.AbstractMode.forEachMode(function(klass) {
	this.modes_.push(new klass(this));
  }, this);

  // create a toolbar
  this.toolbar_ = new closuredraw.Toolbar(this.modes_, null, null, opt_domHelper);
  this.addChild(this.toolbar_, false);
  this.toolbar_.getModeSelector().setSelectedIndex(this.currentMode_);
  this.toolbar_.setStroke(this.currentStroke_);
  this.toolbar_.setFill(this.currentFill_);
  this.toolbar_.setFont(this.currentFont_);

  // create a graphics object
  this.canvasEl_ = null;
  this.graphics_ = goog.graphics.createGraphics(width, height, opt_domHelper);
  this.addChild(this.graphics_, false);
};
goog.inherits(closuredraw.Widget, goog.ui.Component);

/** @constructor */
closuredraw.Widget.ImportParams = function(owner, doc, element) {
  this.owner   = owner;
  this.doc     = doc;
  this.element = element;
};

closuredraw.Widget.prototype.createDom = function() {
  this.decorateInternal(this.dom_.createElement('div'));
};

closuredraw.Widget.prototype.decorateInternal = function(element) {
  closuredraw.Widget.superClass_.decorateInternal.call(this, element);
  var dom = this.getDomHelper();

  // decorate the root element itself
  var rootEl = this.getElement();
  goog.dom.classes.add(rootEl, 'closuredraw-component');
  rootEl.tabIndex = 0;

  // decorate the toolbar
  var toolbarEl = dom.createDom('div', { 'class':'closure-toolbar' });
  this.toolbar_.decorateInternal(toolbarEl);
  dom.appendChild(rootEl, toolbarEl);

  // decorate the canvas
  this.canvasEl_ = dom.createDom('div', { 'class': 'closure-canvas' });
  this.graphics_.createDom();
  dom.appendChild(this.canvasEl_, this.graphics_.getElement());
  dom.appendChild(rootEl, this.canvasEl_);

  // a dummy element for dragging.
  this.dragTarget_ = dom.createDom('div', { 'style' : 'display:none;' });
};

closuredraw.Widget.prototype.enterDocument = function() {
  closuredraw.Widget.superClass_.enterDocument.call(this);

  this.eventHandler_.listen(
	this.canvasEl_, goog.events.EventType.MOUSEDOWN, this.onMouseDownCanvas_);
  this.eventHandler_.listen(
	this.canvasEl_, goog.events.EventType.MOUSEMOVE, this.onMouseMoveCanvas_);

  if(goog.userAgent.IE) {
	this.eventHandler_.listen(
	  this.canvasEl_, goog.events.EventType.DBLCLICK, this.onMouseDownCanvas_);
  }

  this.getCurrentMode().onEnter(this.currentShape_);
};

closuredraw.Widget.prototype.exitDocument = function() {
  if(this.handleShapes_) this.removeAllHandleShapes();
  if(this.eventHandler_) this.eventHandler_.removeAll();
  closuredraw.Widget.superClass_.exitDocument.call(this);
};

closuredraw.Widget.prototype.disposeInternal = function() {
  if(this.eventHandler_) this.eventHandler_.dispose();
  if(this.dragger_)      this.dragger_.dispose();
  if(this.graphics_)     this.graphics_.dispose();
  this.modes_         = null;
  this.eventHandler_  = null;
  this.handleShapes_  = null;
  this.dragger_       = null;
  this.dragTarget_    = null;
  this.shapes_        = null;
  this.currentStroke_ = null;
  this.currentFill_   = null;
  this.currentFont_   = null;
  this.handleStroke_  = null;
  this.handleFill_    = null;
  this.toolbar_       = null;
  this.canvasEl_      = null;
  this.graphics_      = null;
  closuredraw.Widget.superClass_.disposeInternal.call(this);
};

closuredraw.Widget.prototype.getModeIndex = function() {
  return this.currentMode_;
};

closuredraw.Widget.prototype.getCurrentMode = function() {
  return this.modes_[this.currentMode_];
};

closuredraw.Widget.prototype.setModeIndex = function(index, opt_updateToolbar) {
  if(this.currentMode_ != index) {
	var shapeIndex = this.getCurrentMode().onExit();
	this.endDrag();
	this.setCurrentShapeIndex(-1);
	this.removeAllHandleShapes();
	this.currentMode_ = index;
	if(opt_updateToolbar)
	  this.toolbar_.getModeSelector().setSelectedIndex(index);
	this.toolbar_.updateStatus();
	this.getCurrentMode().onEnter(shapeIndex);
  }
};

closuredraw.Widget.prototype.getGraphics = function() {
  return this.graphics_;
};

closuredraw.Widget.prototype.clientToCanvas = function(x, y) {
  var bounds = this.canvasEl_.getBoundingClientRect();
  return new goog.math.Vec2(x - bounds.left, y - bounds.top);
}

closuredraw.Widget.prototype.getShape = function(index) {
  return this.shapes_[index];
};

closuredraw.Widget.prototype.getShapeIndexAt = function(x, y) {
  var shapes = this.shapes_;
  for(var i = 0, l = shapes.length ; i < l ; ++i) {
	if(shapes[i].contains(x, y))
	  return i;
  }
  return -1;
};

closuredraw.Widget.prototype.addShape = function(shape) {
  this.shapes_.unshift(shape);
};

closuredraw.Widget.prototype.reconstructShapes = function() {
  this.graphics_.clear();
  goog.array.forEachRight(this.shapes_, function(shape) {
	shape.reconstruct();
  });
};

closuredraw.Widget.prototype.getCurrentShapeIndex = function() {
  return this.currentShape_;
};

closuredraw.Widget.prototype.setCurrentShapeIndex = function(index) {
  if(this.currentShape_ != index) {
	if(index >= this.shapes_.length)
	  index = -1;
	this.removeAllHandleShapes();
	this.currentShape_ = index;
	if(index >= 0) {
	  var shape = this.getShape(index);
	  this.addHandleShape('leftTop',     'corner');
	  this.addHandleShape('rightTop',    'corner');
	  this.addHandleShape('leftBottom',  'corner');
	  this.addHandleShape('rightBottom', 'corner');
	  this.addHandleShape('rot',         'rotation');
	  this.updateCornerHandles();
	  this.setCurrentStroke(shape.getStroke());
	  this.setCurrentFill(shape.getFill());
	  this.setCurrentFont(shape.getFont(), false);
	}
	this.toolbar_.updateStatus();
  }
};

closuredraw.Widget.prototype.deleteShape = function(index) {
  if(this.currentShape_ == index)
	this.setCurrentShapeIndex(-1);
  var shape = this.getShape(index);
  if(shape) {
	goog.array.removeAt(this.shapes_, index);
	shape.dispose();
  }
};

closuredraw.Widget.prototype.deleteAllShapes = function() {
  this.setModeIndex(0, true);
  if(this.currentShape_ >= 0)
	this.setCurrentShapeIndex(-1);

  var shapes = this.shapes_, shape;
  for(var i = 0, l = shapes.length ; i < l ; ++i) {
	shape = shapes[i];
	if(shape)
	  shape.dispose();
  }
  this.shapes_ = [];
};

closuredraw.Widget.prototype.moveCurrentShapeUp = function() {
  if(this.currentShape_ > 0) {
	var index = this.currentShape_;
	var shape = this.getShape(index);
	this.setCurrentShapeIndex(-1);
	this.shapes_[index]     = this.shapes_[index - 1];
	this.shapes_[index - 1] = shape;
	this.reconstructShapes();
	this.setCurrentShapeIndex(index - 1);
  }
};

closuredraw.Widget.prototype.moveCurrentShapeDown = function() {
  if(0 <= this.currentShape_ && this.currentShape_ < this.shapes_.length - 1) {
	var index = this.currentShape_;
	var shape = this.getShape(index);
	this.setCurrentShapeIndex(-1);
	this.shapes_[index]     = this.shapes_[index + 1];
	this.shapes_[index + 1] = shape;
	this.reconstructShapes();
	this.setCurrentShapeIndex(index + 1);
  }
};

closuredraw.Widget.prototype.moveCurrentShapeToTop = function() {
  if(this.currentShape_ > 0) {
	var index = this.currentShape_;
	var shape = this.getShape(index);
	this.setCurrentShapeIndex(-1);
	goog.array.removeAt(this.shapes_, index);
	this.shapes_.unshift(shape);
	this.reconstructShapes();
	this.setCurrentShapeIndex(0);
  }
};

closuredraw.Widget.prototype.moveCurrentShapeToBottom = function() {
  if(0 <= this.currentShape_ && this.currentShape_ < this.shapes_.length - 1) {
	var index = this.currentShape_;
	var shape = this.getShape(index);
	this.setCurrentShapeIndex(-1);
	goog.array.removeAt(this.shapes_, index);
	this.shapes_.push(shape);
	this.reconstructShapes();
	this.setCurrentShapeIndex(this.shapes_.length - 1);
  }
};

closuredraw.Widget.prototype.getHandleShape = function(label) {
  var handle = this.handleShapes_[label];
  return handle && handle.element;
};

closuredraw.Widget.prototype.addHandleShape = function(label, type) {
  var g        = this.graphics_;
  var usingVml = g instanceof goog.graphics.VmlGraphics;
  var shape    = null;
  if(type == 'corner' || type == 'vertex') {
	if(usingVml) {
	  shape = new closuredraw.VmlElementWrapper(g, function(group) {
		return g.drawRect(-3, -3, 6, 6, this.handleStroke_, this.handleFill_, group);
	  }, this);
	  shape.setPosition(-3, -3); shape.setSize(6, 6);
	} else {
	  shape = g.drawRect(-3, -3, 6, 6, this.handleStroke_, this.handleFill_);
	}
  } else if(type == 'rotation') {
	if(usingVml) {
	  shape = new closuredraw.VmlElementWrapper(g, function(group) {
		return g.drawCircle(0, 0, 4, this.handleStroke_, this.handleFill_, group);
	  }, this);
	  shape.setRadius(4, 4);
	} else {
	  shape = g.drawCircle(0, 0, 4, this.handleStroke_, this.handleFill_);
	}
  } else if(type == 'newtext') {
	shape = g.drawRect(0, 0, 0, 0, this.handleStroke_, this.handleFill_);
  }
  if(shape) {
	var handle = this.handleShapes_[label];
	if(handle && handle.element) {
	  if(handle.element instanceof closuredraw.VmlElementWrapper)
		handle.element.remove();
	  else
		g.removeElement(handle.element);
	}
	this.handleShapes_[label] = { x:0, y:0, element:shape };
  }
  return shape;
};

closuredraw.Widget.prototype.transformHandleShape = function(label, x, y, rot, rx, ry) {
  var handle = this.handleShapes_[label];
  if(handle && handle.element) {
	handle.x = x;
	handle.y = y;
	handle.element.setTransformation(x, y, rot || 0, rx || 0, ry || 0);
  }
};

closuredraw.Widget.prototype.removeAllHandleShapes = function() {
  var usingVml = this.graphics_ instanceof goog.graphics.VmlGraphics;
  goog.object.forEach(this.handleShapes_, function(handle) {
	if(handle) {
	  if(handle.element instanceof goog.graphics.Element)
		this.graphics_.removeElement(handle.element);
	  else if(handle.element instanceof closuredraw.VmlElementWrapper)
		handle.element.remove();
	}
  }, this);
  this.handleShapes_ = {};
};

closuredraw.Widget.prototype.updateCornerHandles = function() {
  if(this.currentShape_ >= 0) {
	var shape     = this.getShape(this.currentShape_);
	var center    = new goog.math.Vec2(shape.x, shape.y);
	var axes      = closuredraw.utils.computeAxes(shape.rot);
	var scaledX   = axes.x.clone().scale(shape.width);
	var scaledY   = axes.y.clone().scale(shape.height);
	var sum       = goog.math.Vec2.sum(scaledX, scaledY);
	var diff      = goog.math.Vec2.difference(scaledX, scaledY);
	var positions = {};
	positions['leftTop']     = goog.math.Vec2.difference(center, sum);
	positions['rightTop']    = goog.math.Vec2.sum(center, diff);
	positions['leftBottom']  = goog.math.Vec2.difference(center, diff);
	positions['rightBottom'] = goog.math.Vec2.sum(center, sum);
	positions['rot'] = (goog.math.Vec2.lerp(positions['leftTop'], positions['rightTop'], 0.5)
						.subtract(axes.y.clone().scale(30)));
	goog.object.forEach(positions, function(vec, label) {
	  var handle = this.handleShapes_[label];
	  handle.x   = vec.x;
	  handle.y   = vec.y;
	  if(handle.element)
		handle.element.setTransformation(vec.x, vec.y, shape.rot, 0, 0);
	}, this);
  }
};

closuredraw.Widget.prototype.getHandleLabelAt = function(x, y) {
  var nearestLabel = null, nearestDistance = 5 * 5;
  goog.object.forEach(this.handleShapes_, function(handle, label) {
	var diff     = new goog.math.Vec2(Math.abs(handle.x - x), Math.abs(handle.y - y));
	var distance = diff.squaredMagnitude();
	if(distance < nearestDistance) {
	  nearestLabel    = label;
	  nearestDistance = distance;
	}
  });
  return nearestLabel;
};

closuredraw.Widget.prototype.beginDrag = function(e, ondrag, onend, opt_scope) {
  if(!this.dragger_) {
	this.dragger_   = new goog.fx.Dragger(this.dragTarget_);
	var eventType   = goog.fx.Dragger.EventType;
	goog.events.listen(this.dragger_, eventType.DRAG, ondrag, false, opt_scope || this);
	goog.events.listen(this.dragger_, eventType.END,  onend,  false, opt_scope || this);
	this.dragger_.startDrag(e);
  }
};

closuredraw.Widget.prototype.endDrag = function() {
  if(this.dragger_) {
	this.dragger_.dispose();
	this.dragger_   = null;
  }
}

closuredraw.Widget.prototype.dragging = function() {
  return this.dragger_ ? true : false;
};

closuredraw.Widget.prototype.getCurrentStroke = function() {
  return this.currentStroke_;
};

closuredraw.Widget.prototype.setCurrentStroke = function(stroke, setToolbar) {
  this.currentStroke_ = stroke;
  if(this.currentShape_ >= 0)
	this.getShape(this.currentShape_).setStroke(stroke);
  if(setToolbar !== false)
	this.toolbar_.setStroke(this.currentStroke_);
};

closuredraw.Widget.prototype.getCurrentFill = function() {
  return this.currentFill_;
};

closuredraw.Widget.prototype.setCurrentFill = function(fill, setToolbar) {
  this.currentFill_ = fill;
  if(this.currentShape_ >= 0)
	this.getShape(this.currentShape_).setFill(fill);
  if(setToolbar !== false)
	this.toolbar_.setFill(this.currentFill_);
};

closuredraw.Widget.prototype.getCurrentFont = function() {
  return this.currentFont_;
}

closuredraw.Widget.prototype.setCurrentFont = function(font, setToShape) {
  this.currentFont_ = font;
  if(setToShape !== false && this.currentShape_ >= 0) {
	var currentShape = this.currentShape_;
	this.getShape(currentShape).setFont(font);
	this.setCurrentShapeIndex(-1);
	this.reconstructShapes();
	this.setCurrentShapeIndex(currentShape);
  }
};

closuredraw.Widget.prototype.onMouseDownCanvas_ = function(e) {
  this.getCurrentMode().onMouseDownCanvas(e);
};

closuredraw.Widget.prototype.onMouseMoveCanvas_ = function(e) {
  this.getCurrentMode().onMouseMoveCanvas(e);
};

closuredraw.Widget.prototype.getToolbar = function() {
  return this.toolbar_;
};

closuredraw.Widget.prototype.exportSVG = function() {
  var doc = goog.dom.xml.loadXml(
	'<?xml version="1.0" encoding="UTF-8"?>' +
	  '<svg xmlns="' + closuredraw.XmlNS.SVG +
	  '" xmlns:svg="' + closuredraw.XmlNS.SVG +
	  '" xmlns:xlink="' + closuredraw.XmlNS.XLINK +
	  '" xmlns:closuredraw="' + closuredraw.XmlNS.CLOSUREDRAW +
	  '"></svg>');
  var docEl   = doc.documentElement;
  var groupEl = closuredraw.utils.createElement(doc, closuredraw.XmlNS.SVG, 'g');
  docEl.appendChild(groupEl);
  goog.array.forEachRight(this.shapes_, function(shape) {
	var el = shape.exportSVG(doc);
	if(el) {
	  groupEl.appendChild(el);
	}
  }, this);

  return doc;
};

closuredraw.Widget.prototype.importSVG = function(doc) {
  this.deleteAllShapes();
  var elements = [];
  try {
	elements = goog.dom.xml.selectNodes(doc, 'descendant::svg:g/node()');
  } catch(e) {}
  if(elements.length <= 0) {
	elements = [];
	goog.array.forEach(doc.documentElement.getElementsByTagName('g'), function(group) {
	  goog.array.forEach(group.childNodes, function(el) {
		if(el.nodeType == 1)
		  elements[elements.length] = el;
	  });
	});
  }
  goog.array.forEach(elements, function(element) {
	var klass = closuredraw.AbstractShape.SvgShapes[element.nodeName];
	if(klass) {
	  try {
		this.addShape(new klass(new closuredraw.Widget.ImportParams(this, doc, element)));
	  } catch(e) {
		throw e;
	  }
	}
  }, this);
};
