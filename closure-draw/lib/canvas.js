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

goog.provide('closuredraw.Canvas');

goog.require('goog.object');
goog.require('goog.array');
goog.require('goog.math');
goog.require('goog.userAgent')
goog.require('goog.dom');
goog.require('goog.dom.DomHelper');
goog.require('goog.dom.xml');
goog.require('goog.events');
goog.require('goog.events.EventHandler');
goog.require('goog.graphics');
goog.require('goog.graphics.Font');
goog.require('goog.fx.Dragger');
goog.require('goog.ui.Prompt');
goog.require('closuredraw.XmlNS');
goog.require('closuredraw.utils');
goog.require('closuredraw.Command');
goog.require('closuredraw.Mode');
goog.require('closuredraw.CanvasEvent');
goog.require('closuredraw.MoveMode');
goog.require('closuredraw.ModifyMode');
goog.require('closuredraw.RectMode');
goog.require('closuredraw.EllipseMode');
goog.require('closuredraw.PathMode');
goog.require('closuredraw.TextMode');

/**
 * The canvas component.
 *
 * @param {number|string} width The width of the canvas in pixels or percent.
 * @param {number|string} height The height of the canvas in pixels or percent.
 * @param {goog.dom.DomHelper=} opt_domHelper The DOM helper object for the
 *     document we want to render in.
 * @constructor
 * @extends {goog.ui.Component}
 */
closuredraw.Canvas = function(width, height, opt_domHelper) {
  goog.base(this, opt_domHelper);

  // initialize member variables
  this.modes_         = [];
  this.handleShapes_  = {};
  this.dragger_       = null;
  this.dragTarget_    = null;
  this.shapes_        = [];
  this.currentMode_   = closuredraw.Mode.RECT;
  this.currentShape_  = -1;
  this.strokeWidth_   = 2;
  this.strokeColor_   = '#000000';
  this.currentFill_   = new goog.graphics.SolidFill('#ffff00');
  this.currentFont_   = new goog.graphics.Font(16, 'sans-serif');
  this.handleStroke_  = new goog.graphics.Stroke(1, '#000000');
  this.handleFill_    = new goog.graphics.SolidFill('#ffffff', 0.8);
  this.promptDialogs_ = {};
  this.promptScope_   = null;
  this.promptHandler_ = null;
  this.clickTime_     = 0;

  // create operation mode objects
  this.modes_ = {};
  this.modes_[closuredraw.Mode.MOVE]    = new closuredraw.MoveMode(this);
  this.modes_[closuredraw.Mode.MODIFY]  = new closuredraw.ModifyMode(this);
  this.modes_[closuredraw.Mode.RECT]    = new closuredraw.RectMode(this);
  this.modes_[closuredraw.Mode.ELLIPSE] = new closuredraw.EllipseMode(this),
  this.modes_[closuredraw.Mode.PATH]    = new closuredraw.PathMode(this),
  this.modes_[closuredraw.Mode.TEXT]    = new closuredraw.TextMode(this)

  // create a graphics object
  this.graphics_    = goog.graphics.createGraphics(width, height, opt_domHelper);
  this.shapeGroup_  = null;
  this.handleGroup_ = null;
  this.addChild(this.graphics_, false);
};
goog.inherits(closuredraw.Canvas, goog.ui.Component);

/**
 * Event types dispatched by closuredraw.Canvas.
 * @enum {string}
 */
closuredraw.Canvas.EventType = {
  STATUS_CHANGED: 'CLOSUREDRAW_STATUS_CHANGED'
};

/** @constructor */
closuredraw.Canvas.ImportParams = function(owner, doc, element) {
  this.owner   = owner;
  this.doc     = doc;
  this.element = element;
};

/** @inheritDoc */
closuredraw.Canvas.prototype.createDom = function() {
  this.decorateInternal(this.dom_.createElement('div'));
};

/** @inheritDoc */
closuredraw.Canvas.prototype.decorateInternal = function(element) {
  goog.base(this, 'decorateInternal', element);
  var dom = this.getDomHelper();

  // decorate the root element itself
  var rootEl = this.getElement();
  goog.dom.classes.add(rootEl, 'closuredraw-canvas');
  rootEl.tabIndex = -1;

  // create the graphics elements.
  this.graphics_.createDom();
  dom.appendChild(rootEl, this.graphics_.getElement());

  // a dummy element for dragging.
  this.dragTarget_ = dom.createDom('div', { 'style' : 'display:none;' });
};

/** @inheritDoc */
closuredraw.Canvas.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  // create groups of each shape type.
  this.shapeGroup_  = this.graphics_.createGroup();
  this.handleGroup_ = this.graphics_.createGroup();

  // regist event handlers.
  var eh     = this.getHandler();
  var rootEl = this.getElement();
  eh.listen(rootEl, goog.events.EventType.MOUSEDOWN, this.onMouseDownCanvas_);
  eh.listen(rootEl, goog.events.EventType.MOUSEMOVE, this.onMouseMoveCanvas_);

  if(goog.userAgent.IE) {
	eh.listen(rootEl, goog.events.EventType.DBLCLICK, this.onMouseDownCanvas_);
  }

  // initialize the current mode.
  this.getCurrentMode_().onEnter(this.currentShape_);
};

closuredraw.Canvas.prototype.exitDocument = function() {
  this.graphics_.clear();
  goog.base(this, 'exitDocument');
};

/** @inheritDoc */
closuredraw.Canvas.prototype.disposeInternal = function() {
  if(this.dragger_)  this.dragger_.dispose();
  if(this.graphics_) this.graphics_.dispose();
  if(this.promptDialogs_) {
	goog.object.forEach(this.promptDialogs_ ,function(prompt) { prompt.dispose(); });
  }
  this.modes_         = null;
  this.handleShapes_  = null;
  this.dragger_       = null;
  this.dragTarget_    = null;
  this.shapes_        = null;
  this.strokeWidth_   = null;
  this.strokeColor_   = null;
  this.currentFill_   = null;
  this.currentFont_   = null;
  this.handleStroke_  = null;
  this.handleFill_    = null;
  this.toolbar_       = null;
  this.graphics_      = null;
  this.shapeGroup_    = null;
  this.handleGroup_   = null;
  this.promptDialogs_ = null;
  this.promptScope_   = null;
  this.promptHandler_ = null;
  goog.base(this, 'disposeInternal');
};

/**
 * Execute the specific command.
 * @param {closuredraw.Command} command The command to execute.
 * @param {*} arg The argument of the command.
 */
closuredraw.Canvas.prototype.execCommand = function(command, arg) {
  if(command == closuredraw.Command.SET_MODE) {

	this.setMode(arg);

  } else if(command == closuredraw.Command.INSERT_IMAGE) {

	this.showPrompt('Image URL:', 'http://', this.onInsertImage_, this);

  } else if(command == closuredraw.Command.SET_STROKE_WIDTH) {

	this.strokeWidth_ = Math.max(parseFloat(arg), 0.5);
	if(this.currentShape_ >= 0)
	  this.getShape(this.currentShape_).setStroke(this.getCurrentStroke());

  } else if(command == closuredraw.Command.SET_STROKE_COLOR) {

	this.strokeColor_ = arg;
	if(this.currentShape_ >= 0)
	  this.getShape(this.currentShape_).setStroke(this.getCurrentStroke());

  } else if(command == closuredraw.Command.SET_FILL_COLOR) {

	this.currentFill_ = arg ? new goog.graphics.SolidFill(arg) : null;
	if(this.currentShape_ >= 0)
	  this.getShape(this.currentShape_).setFill(this.currentFill_);

  } else if(command == closuredraw.Command.SET_FONT_SIZE) {

	this.currentFont_ =
	  new goog.graphics.Font(Math.max(parseFloat(arg), '4'), 'sans-serif');
	if(this.currentShape_ >= 0) {
	  var currentShape = this.currentShape_;
	  this.getShape(currentShape).setFont(this.currentFont_);
	  this.setCurrentShapeIndex(-1);
	  this.reconstructShapes();
	  this.setCurrentShapeIndex(currentShape);
	}

  } else if(command == closuredraw.Command.BRING_UP) {

	this.bringTo_('-1');

  } else if(command == closuredraw.Command.BRING_DOWN) {

	this.bringTo_('+1');

  } else if(command == closuredraw.Command.BRING_TO_TOP) {

	this.bringTo_('0');

  } else if(command == closuredraw.Command.BRING_TO_BOTTOM) {

	this.bringTo_(this.getShapeCount());

  } else if(command == closuredraw.Command.COPY) {

	if(this.currentShape_ >= 0)
	  this.copyShape(this.currentShape_);

  } else if(command == closuredraw.Command.DELETE) {

	if(this.currentShape_ >= 0)
	  this.deleteShape(this.currentShape_);

  }
};

closuredraw.Canvas.prototype.getCurrentMode_ = function() {
  return this.modes_[this.currentMode_];
};

closuredraw.Canvas.prototype.setMode = function(mode) {
  if(this.currentMode_ != mode && this.modes_[mode]) {
	var shapeIndex = this.getCurrentMode_().onExit();
	this.endDrag();
	this.setCurrentShapeIndex(-1);
	this.removeAllHandleShapes();
	this.currentMode_ = mode;
	closuredraw.CanvasEvent.dispatch(
	  closuredraw.Canvas.EventType.STATUS_CHANGED, this);
	this.getCurrentMode_().onEnter(shapeIndex);
  }
};

closuredraw.Canvas.prototype.clientToCanvas = function(x, y) {
  var bounds = this.getElement().getBoundingClientRect();
  return new goog.math.Vec2(x - bounds.left, y - bounds.top);
}

closuredraw.Canvas.prototype.getGraphics = function() {
  return this.graphics_;
};

closuredraw.Canvas.prototype.getShapeGroup = function() {
  return this.shapeGroup_;
};

closuredraw.Canvas.prototype.getCurrentStroke = function() {
  return new goog.graphics.Stroke(this.strokeWidth_, this.strokeColor_);
};

closuredraw.Canvas.prototype.getCurrentFill = function() {
  return this.currentFill_;
};

closuredraw.Canvas.prototype.getCurrentFont = function() {
  return this.currentFont_;
}

closuredraw.Canvas.prototype.getShape = function(index) {
  return this.shapes_[index];
};

closuredraw.Canvas.prototype.getShapeCount = function() {
  return this.shapes_.length;
};

closuredraw.Canvas.prototype.getShapeIndexAt = function(x, y) {
  var shapes = this.shapes_;
  for(var i = 0, l = shapes.length ; i < l ; ++i) {
	if(shapes[i].contains(x, y))
	  return i;
  }
  return -1;
};

closuredraw.Canvas.prototype.addShape = function(shape) {
  this.shapes_.unshift(shape);
};

closuredraw.Canvas.prototype.reconstructShapes = function() {
  this.shapeGroup_.clear();
  goog.array.forEachRight(this.shapes_, function(shape) {
	shape.detach();
	shape.reconstruct();
  });
};

closuredraw.Canvas.prototype.getCurrentShapeIndex = function() {
  return this.currentShape_;
};

closuredraw.Canvas.prototype.setCurrentShapeIndex = function(index) {
  if(this.currentShape_ != index) {
	if(index >= this.shapes_.length)
	  index = -1;
	this.removeAllHandleShapes();
	this.currentShape_ = index;
	if(index >= 0) {
	  var shape  = this.getShape(index);
	  var stroke = shape.getStroke();
	  this.addHandleShape('leftTop',     'corner');
	  this.addHandleShape('rightTop',    'corner');
	  this.addHandleShape('leftBottom',  'corner');
	  this.addHandleShape('rightBottom', 'corner');
	  this.addHandleShape('rot',         'rotation');
	  this.updateCornerHandles();
	  this.strokeWidth_ = stroke.getWidth();
	  this.strokeColor_ = stroke.getColor();
	  this.currentFill_ = shape.getFill();
	  this.currentFont_ = shape.getFont();
	}
	closuredraw.CanvasEvent.dispatch(
	  closuredraw.Canvas.EventType.STATUS_CHANGED, this);
  }
};

closuredraw.Canvas.prototype.deleteShape = function(index) {
  if(this.currentShape_ == index)
	this.setCurrentShapeIndex(-1);
  var shape = this.getShape(index);
  if(shape) {
	goog.array.removeAt(this.shapes_, index);
	shape.remove();
	shape.dispose();
  }
};

closuredraw.Canvas.prototype.deleteAllShapes_ = function() {
  this.setMode(closuredraw.Mode.MOVE);
  if(this.currentShape_ >= 0)
	this.setCurrentShapeIndex(-1);

  var shapes = this.shapes_, shape;
  for(var i = 0, l = shapes.length ; i < l ; ++i) {
	shape = shapes[i];
	if(shape) {
	  shape.detach();
	  shape.dispose();
	}
  }
  this.shapeGroup_.clear();
  this.shapes_ = [];
};

closuredraw.Canvas.prototype.bringTo_ = function(pos) {
  var nNumShapes = this.getShapeCount();
  if(nNumShapes > 1 && this.currentShape_ >= 0) {
	var index  = this.currentShape_;
	var nPos   = parseInt(pos, 10);
	var newPos = goog.math.clamp(/^[-+]/.test(pos) ? index + nPos : nPos, 0, nNumShapes - 1);
	if(index != newPos) {
	  var shape = this.getShape(index);
	  this.setCurrentShapeIndex(-1);
	  goog.array.removeAt(this.shapes_, index);
	  goog.array.insertAt(this.shapes_, shape, newPos);
	  this.reconstructShapes();
	  this.setCurrentShapeIndex(newPos);
	}
  }
};

closuredraw.Canvas.prototype.getHandleShape = function(label) {
  var handle = this.handleShapes_[label];
  return handle && handle.element;
};

closuredraw.Canvas.prototype.addHandleShape = function(label, type) {
  var gr    = this.handleGroup_;
  var shape = null;

  switch(type) {
  case 'corner':
  case 'vertex':
	shape = new closuredraw.VmlElementWrapper(gr, function(g, group) {
	  return g.drawRect(-3, -3, 6, 6, this.handleStroke_, this.handleFill_, group);
	}, this);
	shape.setPosition(-3, -3); shape.setSize(6, 6);
	break;

  case 'rotation':
	shape = new closuredraw.VmlElementWrapper(gr, function(g, group) {
	  return g.drawCircle(0, 0, 4, this.handleStroke_, this.handleFill_, group);
	}, this);
	shape.setRadius(4, 4);
	break;

  case 'newtext':
	shape = this.graphics_.drawRect(0, 0, 0, 0, this.handleStroke_, this.handleFill_, gr);
	break;
  }

  if(shape) {
	var handle = this.handleShapes_[label];
	if(handle && handle.element) {
	  if(handle.element instanceof closuredraw.VmlElementWrapper)
		handle.element.remove();
	  else
		this.graphics_.removeElement(handle.element);
	}
	this.handleShapes_[label] = { x:0, y:0, element:shape };
  }

  return shape;
};

closuredraw.Canvas.prototype.transformHandleShape = function(label, x, y, rot, rx, ry) {
  var handle = this.handleShapes_[label];
  if(handle && handle.element) {
	handle.x = x;
	handle.y = y;
	handle.element.setTransformation(x, y, rot || 0, rx || 0, ry || 0);
  }
};

closuredraw.Canvas.prototype.removeAllHandleShapes = function() {
  this.handleGroup_.clear();
  this.handleShapes_ = {};
};

closuredraw.Canvas.prototype.updateCornerHandles = function() {
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

closuredraw.Canvas.prototype.getHandleLabelAt = function(x, y) {
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

closuredraw.Canvas.prototype.beginDrag = function(e, ondrag, onend, opt_scope) {
  if(this.dragger_)
	return false;

  this.dragger_   = new goog.fx.Dragger(this.dragTarget_);
  var eventType   = goog.fx.Dragger.EventType;
  goog.events.listen(this.dragger_, eventType.DRAG, ondrag, false, opt_scope || this);
  goog.events.listen(this.dragger_, eventType.END,  onend,  false, opt_scope || this);
  this.dragger_.startDrag(e);
  return true;
};

closuredraw.Canvas.prototype.endDrag = function() {
  if(this.dragger_) {
	this.dragger_.dispose();
	this.dragger_   = null;
  }
}

closuredraw.Canvas.prototype.dragging = function() {
  return this.dragger_ ? true : false;
};

closuredraw.Canvas.prototype.onMouseDownCanvas_ = function(e) {
  var time = (new Date()).getTime();
  if(time - this.clickTime_ < 500 &&
	 this.currentMode_ != closuredraw.Mode.MOVE &&
	 this.currentMode_ != closuredraw.Mode.MODIFY) {
	this.setMode(closuredraw.Mode.MOVE);
  }
  this.clickTime_ = time;
  this.getCurrentMode_().onMouseDownCanvas(e);
};

closuredraw.Canvas.prototype.onMouseMoveCanvas_ = function(e) {
  this.getCurrentMode_().onMouseMoveCanvas(e);
};

closuredraw.Canvas.prototype.onInsertImage_ = function(url) {
  if(url) {
	this.setMode(closuredraw.Mode.MOVE);
	var size  = this.graphics_.getSize();
	var shape = new closuredraw.Image(this, url);
	shape.setTransform(size.width/2, size.height/2, size.width/4, size.height/4, 0);
	this.setCurrentShapeIndex(-1);
	this.addShape(shape);
	this.setCurrentShapeIndex(0);
  }
};

closuredraw.Canvas.prototype.showPrompt = function(message, value, handler, scope) {
  var prompt = this.promptDialogs_[message];
  if(!prompt) {
	prompt = new goog.ui.Prompt('Closure Draw', message, goog.bind(this.onClosePrompt_, this),
								null, 'closuredraw-modal', false, this.getDomHelper());
	this.promptDialogs_[message] = prompt;
  }
  this.promptScope_   = scope;
  this.promptHandler_ = handler;
  prompt.setDefaultValue(value);
  prompt.setVisible(true);
};

closuredraw.Canvas.prototype.onClosePrompt_ = function(result) {
  var scope           = this.promptScope_;
  var handler         = this.promptHandler_;
  this.promptScope_   = null;
  this.promptHandler_ = null;
  if(goog.isFunction(handler))
	handler.call(scope, result);
};

closuredraw.Canvas.prototype.exportSVG = function() {
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

closuredraw.Canvas.prototype.importSVG = function(doc) {
  this.deleteAllShapes_();
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
	var shapeType = goog.array.filter(
	  [element.nodeName, element.getAttribute('shape')], function(v) { return !!v; });
	var klass = closuredraw.AbstractShape.SvgShapes[shapeType.join('-')];
	if(klass) {
	  try {
		this.addShape(new klass(new closuredraw.Canvas.ImportParams(this, doc, element)));
	  } catch(e) {
		throw e;
	  }
	}
  }, this);
};

closuredraw.Canvas.prototype.copyShape = function(index) {
  var shape = this.getShape(index);
  if(shape) {
	if(this.currentShape_ >= 0)
	  this.setCurrentShapeIndex(-1);
	this.setMode(closuredraw.Mode.MOVE);
	var doc = goog.dom.xml.loadXml(
	  '<?xml version="1.0" encoding="UTF-8"?>' +
		'<svg xmlns="' + closuredraw.XmlNS.SVG +
		'" xmlns:svg="' + closuredraw.XmlNS.SVG +
		'" xmlns:xlink="' + closuredraw.XmlNS.XLINK +
		'" xmlns:closuredraw="' + closuredraw.XmlNS.CLOSUREDRAW +
		'"></svg>');
	var element = shape.exportSVG(doc);
	doc.documentElement.appendChild(element);
	var shapeType = goog.array.filter(
	  [element.nodeName, element.getAttribute('shape')], function(v) { return !!v; });
	var klass = closuredraw.AbstractShape.SvgShapes[shapeType.join('-')];
	if(klass) {
	  try {
		this.addShape(new klass(new closuredraw.Canvas.ImportParams(this, doc, element)));
	  } catch(e) {
		throw e;
	  }
	}
	this.setCurrentShapeIndex(0);
  }
};

closuredraw.Canvas.prototype.queryStatus = function() {
  var status = {
	mode:        this.currentMode_,
	strokeWidth: this.strokeWidth_,
	strokeColor: this.strokeColor_,
	fillColor:   this.currentFill_ && this.currentFill_.getColor(),
	fontSize:    this.currentFont_.size,
	isPath:      false,
	isText:      false
  };
  if(this.currentShape_ >= 0) {
	var shape = this.getShape(this.currentShape_);
	status.isPath = shape.isPath();
	status.isText = shape.isText();
  }
  return status;
};
