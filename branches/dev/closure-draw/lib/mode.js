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

goog.provide('closuredraw.AbstractMode');
goog.provide('closuredraw.MoveMode');
goog.provide('closuredraw.ModifyMode');
goog.provide('closuredraw.DrawMode');
goog.provide('closuredraw.RectMode');
goog.provide('closuredraw.EllipseMode');
goog.provide('closuredraw.PathMode');
goog.provide('closuredraw.TextMode');

goog.require('goog.array');
goog.require('goog.math.Vec2');
goog.require('closuredraw.Rect');
goog.require('closuredraw.Ellipse');
goog.require('closuredraw.Path');
goog.require('closuredraw.Text');

//----------------------------------------------------------

/** @constructor */
closuredraw.AbstractMode = function(owner) {
  this.owner = owner;
}

closuredraw.AbstractMode.modes_ = [];

closuredraw.AbstractMode.addMode = function(mode) {
  closuredraw.AbstractMode.modes_.push(mode);
};

closuredraw.AbstractMode.forEachMode = function(func, scope) {
  goog.array.forEach(closuredraw.AbstractMode.modes_, func, scope);
};

closuredraw.AbstractMode.prototype.computeBounds = function(pt1, pt2, shape, opt_square) {
  var Vec2   = goog.math.Vec2;
  var trans  = shape.getTransform();
  pt1        = trans.inverseTransform(pt1);
  pt2        = trans.inverseTransform(pt2);
  var lt     = new Vec2(Math.min(pt1.x, pt2.x), Math.min(pt1.y, pt2.y));
  var rb     = new Vec2(Math.max(pt1.x, pt2.x), Math.max(pt1.y, pt2.y));
  var center = Vec2.lerp(lt, rb, 0.5);
  var size   = Vec2.difference(rb, center);
  center     = trans.transform(center);
  var bounds = { x: center.x, y: center.y, w: size.x, h: size.y };
  if(opt_square) {
	if(bounds.w < bounds.h) {
	  var adjust = bounds.h - bounds.w, sign = pt1.x < pt2.x ? -1 : +1;
	  bounds.x += adjust * sign;
	  bounds.w += adjust;
	} else {
	  var adjust = bounds.w - bounds.h, sign = pt1.y < pt2.y ? -1 : +1;
	  bounds.y += adjust * sign;
	  bounds.h += adjust;
	}
  }
  return bounds;
}

closuredraw.AbstractMode.prototype.onExit = function() {
  return this.owner.getCurrentShapeIndex();
};

closuredraw.AbstractMode.prototype.onEnter           = goog.nullFunction;
closuredraw.AbstractMode.prototype.onMouseDownCanvas = goog.abstractMethod;
closuredraw.AbstractMode.prototype.onMouseMoveCanvas = goog.nullFunction;

//----------------------------------------------------------

/** @constructor */
closuredraw.MoveMode = function(owner) {
  closuredraw.AbstractMode.call(this, owner);
  this.startPt_ = null;
  this.basePt_  = null;
}
goog.inherits(closuredraw.MoveMode, closuredraw.AbstractMode);
closuredraw.AbstractMode.addMode(closuredraw.MoveMode);

closuredraw.MoveMode.prototype.getCaption = function(domHelper) {
  return domHelper.htmlToDocumentFragment(
	'<div class="closuredraw-icon closuredraw-mode-move">&nbsp</div>');
};

closuredraw.MoveMode.prototype.onEnter = function(shapeIndex) {
  this.owner.setCurrentShapeIndex(shapeIndex);
};

closuredraw.MoveMode.prototype.onMouseDownCanvas = function(e) {
  var owner = this.owner;
  if(!owner.dragging()) {
	var pt    = owner.clientToCanvas(e.clientX, e.clientY);
	var label = owner.getHandleLabelAt(pt.x, pt.y);
	var index = owner.getCurrentShapeIndex();
	if(label && index >= 0) {
	  var shape = owner.getShape(index);
	  if(label == 'rot') {
		owner.beginDrag(e, this.onDragRotationHandle_, this.onDragEnd_, this);
	  } else if(/^(left|right)(Top|Bottom)$/.exec(label)) {
		this.basePt_ = new goog.math.Vec2(
		  shape.width  * (RegExp.$1 == 'left' ? +1  : -1),
		  shape.height * (RegExp.$2 == 'Top'  ? +1  : -1));
		this.basePt_ = shape.getTransform().transform(this.basePt_);
		owner.beginDrag(e, this.onDragCornerHandle_, this.onDragEnd_, this);
	  }
	} else {
	  index = owner.getShapeIndexAt(pt.x, pt.y);
	  owner.setCurrentShapeIndex(index);
	  if(index >= 0) {
		var shape  = owner.getShape(index);
		this.startPt_ = pt;
		this.basePt_  = new goog.math.Vec2(shape.x, shape.y);
		owner.beginDrag(e, this.onDragShape_, this.onDragEnd_, this);
	  }
	}
  }
};

closuredraw.MoveMode.prototype.onDragShape_ = function(e) {
  var owner = this.owner;
  var index = owner.getCurrentShapeIndex();
  if(owner.dragging() && index >= 0) {
	var pt    = owner.clientToCanvas(e.clientX, e.clientY);
	var shape = owner.getShape(index);
	shape.setTransform(this.basePt_.x + pt.x - this.startPt_.x,
					   this.basePt_.y + pt.y - this.startPt_.y,
					   shape.width, shape.height, shape.rot);
	owner.updateCornerHandles();
  }
};

closuredraw.MoveMode.prototype.onDragCornerHandle_ = function(e) {
  var owner = this.owner;
  var index = owner.getCurrentShapeIndex();
  if(owner.dragging() && index >= 0) {
	var shape = owner.getShape(index);
	var pt    = owner.clientToCanvas(e.clientX, e.clientY);
	var b     = this.computeBounds(pt, this.basePt_, shape);
	shape.setTransform(b.x, b.y, b.w, b.h, shape.rot);
	owner.updateCornerHandles();
  }
};

closuredraw.MoveMode.prototype.onDragRotationHandle_ = function(e) {
  var owner = this.owner;
  var index = owner.getCurrentShapeIndex();
  if(owner.dragging() && index >= 0) {
	var shape = owner.getShape(index);
	var pt    = owner.clientToCanvas(e.clientX, e.clientY);
	var angle = Math.atan2(pt.x - shape.x, -(pt.y - shape.y)) * 180.0 / Math.PI;
	owner.getShape(index).setTransform(shape.x, shape.y, shape.width, shape.height, angle);
	owner.updateCornerHandles();
  }
};

closuredraw.MoveMode.prototype.onDragEnd_ = function(e) {
  this.owner.endDrag();
};

//----------------------------------------------------------

/** @constructor */
closuredraw.ModifyMode = function(owner) {
  closuredraw.AbstractMode.call(this, owner);
  this.editingIndex_  = -1;
  this.editingVertex_ = -1;
  this.startPt_       = null;
  this.basePt_        = null;
}

goog.inherits(closuredraw.ModifyMode, closuredraw.AbstractMode);
closuredraw.AbstractMode.addMode(closuredraw.ModifyMode);

closuredraw.ModifyMode.prototype.getCaption = function(domHelper) {
  return domHelper.htmlToDocumentFragment(
	'<div class="closuredraw-icon closuredraw-mode-modify">&nbsp</div>');
};

closuredraw.ModifyMode.prototype.onEnter = function(shapeIndex) {
  this.editingIndex_ = shapeIndex;
  this.recreateVertexHandles_(this.owner.getShape(shapeIndex));
};

closuredraw.ModifyMode.prototype.onExit = function() {
  var result          = this.editingIndex_;
  this.editingIndex_  = -1;
  this.editingVertex_ = -1;
  this.startPt_       = null;
  this.basePt_        = null;
  closuredraw.ModifyMode.superClass_.onExit.call(this);
  return result;
};

closuredraw.ModifyMode.prototype.onMouseDownCanvas = function(e) {
  var owner = this.owner;
  if(!owner.dragging()) {
	var pt    = owner.clientToCanvas(e.clientX, e.clientY);
	var label = owner.getHandleLabelAt(pt.x, pt.y);
	if(label && this.editingIndex_ >= 0 && /^vertex(\d+)$/.exec(label)) {
	  var vindex = RegExp.$1 - 0;
	  var shape  = owner.getShape(this.editingIndex_);
	  if(shape.isPath()) {
		var vertex = shape.getVertices()[vindex];
		if(vertex) {
		  this.startPt_ = pt;
		  this.basePt_  = shape.transform(new goog.math.Vec2(vertex.x, vertex.y));
		  if(owner.beginDrag(e, this.onDragVertex_, this.onDragVertexEnd_, this))
			this.editingVertex_ = vindex;
		}
	  }
	} else {
	  var index = owner.getShapeIndexAt(pt.x, pt.y);
	  if(index != this.editingIndex_)
		owner.removeAllHandleShapes();
	  if(index >= 0) {
		var shape     = owner.getShape(index);
		this.startPt_ = pt;
		this.basePt_  = new goog.math.Vec2(shape.x, shape.y);
		if(owner.beginDrag(e, this.onDragShape_, this.onDragShapeEnd_, this)) {
		  if(index != this.editingIndex_ && shape.isPath())
			this.recreateVertexHandles_(shape);
		}
	  }
	  this.editingIndex_ = index;
	}
  }
};

closuredraw.ModifyMode.prototype.onDragShape_ = function(e) {
  var owner = this.owner;
  var index = this.editingIndex_;
  if(owner.dragging() && index >= 0) {
	var pt    = owner.clientToCanvas(e.clientX, e.clientY);
	var shape = owner.getShape(index);
	shape.setTransform(this.basePt_.x + pt.x - this.startPt_.x,
					   this.basePt_.y + pt.y - this.startPt_.y,
					   shape.width, shape.height, shape.rot);
	this.updateVertexHandles_(shape);
  }
};

closuredraw.ModifyMode.prototype.onDragShapeEnd_ = function(e) {
  this.owner.endDrag();
};

closuredraw.ModifyMode.prototype.onDragVertex_ = function(e) {
  var owner = this.owner;
  var index = this.editingIndex_;
  if(owner.dragging() && index >= 0) {
	var pt     = owner.clientToCanvas(e.clientX, e.clientY);
	var shape  = owner.getShape(index);
	var vindex = this.editingVertex_;
	if(shape.isPath() && vindex >= 0) {
	  var vertices = shape.getVertices();
	  if(vindex < vertices.length) {
		vertices[vindex] = shape.inverseTransform(pt.add(this.basePt_).subtract(this.startPt_));
		owner.transformHandleShape('vertex'+vindex, pt.x, pt.y);
		shape.updatePath();
	  }
	}
  }
};

closuredraw.ModifyMode.prototype.onDragVertexEnd_ = function(e) {
  var owner = this.owner;
  if(owner.dragging() && this.editingIndex_ >= 0) {
	owner.getShape(this.editingIndex_).updateBounds();
  }
  this.editingVertex_ = -1;
  this.owner.endDrag();
};

closuredraw.ModifyMode.prototype.recreateVertexHandles_ = function(shape) {
  var owner = this.owner;
  owner.removeAllHandleShapes();
  if(shape && shape.isPath()) {
	goog.array.forEach(shape.getVertices(), function(vertex, i) {
	  owner.addHandleShape('vertex'+i, 'vertex');
	}, this);
	this.updateVertexHandles_(shape);
  }
};

closuredraw.ModifyMode.prototype.updateVertexHandles_ = function(shape) {
  if(shape && shape.isPath()) {
	var owner = this.owner, pt;
	goog.array.forEach(shape.getVertices(), function(vertex, i) {
	  pt = shape.transform(vertex);
	  owner.transformHandleShape('vertex'+i, pt.x, pt.y);
	}, this);
  }
};

//----------------------------------------------------------

/** @constructor */
closuredraw.DrawMode = function(owner) {
  closuredraw.AbstractMode.call(this, owner);
  this.startPt_ = null;
};
goog.inherits(closuredraw.DrawMode, closuredraw.AbstractMode);

closuredraw.DrawMode.createShape_ = goog.abstractMethod;

closuredraw.DrawMode.prototype.onMouseDownCanvas = function(e) {
  var owner = this.owner;
  if(!owner.dragging()) {
	this.startPt_ = owner.clientToCanvas(e.clientX, e.clientY);
	var shape     = this.createShape_(owner);
	shape.setTransform(this.startPt_.x, this.startPt_.y, shape.width, shape.height, 0);
	owner.addShape(shape);
	owner.beginDrag(e, this.onDrag_, this.onDragEnd_, this);
  }
};

closuredraw.DrawMode.prototype.onDrag_ = function(e) {
  var owner = this.owner;
  var shape = owner.getShape(0);
  if(shape) {
	var pt = owner.clientToCanvas(e.clientX, e.clientY);
	var b  = this.computeBounds(pt, this.startPt_, shape);
	shape.setTransform(b.x, b.y, b.w, b.h, shape.rot);
  }
};

closuredraw.DrawMode.prototype.onDragEnd_ = function(e) {
  var owner = this.owner;
  owner.endDrag();
  owner.setModeIndex(0, true);
  owner.setCurrentShapeIndex(0);
}

//----------------------------------------------------------

/** @constructor */
closuredraw.RectMode = function(owner){
  closuredraw.DrawMode.call(this, owner);
};
goog.inherits(closuredraw.RectMode, closuredraw.DrawMode);
closuredraw.AbstractMode.addMode(closuredraw.RectMode);

closuredraw.RectMode.prototype.getCaption = function(domHelper) {
  return domHelper.htmlToDocumentFragment(
	'<div class="closuredraw-icon closuredraw-mode-rect">&nbsp</div>');
};

closuredraw.RectMode.prototype.createShape_ = function(owner) {
  return new closuredraw.Rect(owner, owner.getCurrentStroke(), owner.getCurrentFill());
};

//----------------------------------------------------------

/** @constructor */
closuredraw.EllipseMode = function(owner){
  closuredraw.DrawMode.call(this, owner);
};
goog.inherits(closuredraw.EllipseMode, closuredraw.DrawMode);
closuredraw.AbstractMode.addMode(closuredraw.EllipseMode);

closuredraw.EllipseMode.prototype.getCaption = function(domHelper) {
  return domHelper.htmlToDocumentFragment(
	'<div class="closuredraw-icon closuredraw-mode-ellipse">&nbsp</div>');
};

closuredraw.EllipseMode.prototype.createShape_ = function(owner) {
  return new closuredraw.Ellipse(owner, owner.getCurrentStroke(), owner.getCurrentFill());
};

//----------------------------------------------------------

/** @constructor */
closuredraw.PathMode = function(owner){
  closuredraw.DrawMode.call(this, owner);
  this.drawing_ = false;
};

goog.inherits(closuredraw.PathMode, closuredraw.DrawMode);
closuredraw.AbstractMode.addMode(closuredraw.PathMode);

closuredraw.PathMode.prototype.getCaption = function(domHelper) {
  return domHelper.htmlToDocumentFragment(
	'<div class="closuredraw-icon closuredraw-mode-path">&nbsp</div>');
};

closuredraw.PathMode.prototype.onMouseDownCanvas = function(e) {
  var owner = this.owner;
  var pt    = owner.clientToCanvas(e.clientX, e.clientY);
  if(!this.drawing_) {
	var shape    = new closuredraw.Path(owner, owner.getCurrentStroke(), owner.getCurrentFill());
	var vertices = shape.getVertices();
	owner.addShape(shape);
	vertices.push(pt);
	vertices.push(pt);
	shape.updatePath();
	this.drawing_ = true;
  } else {
	var shape    = owner.getShape(0);
	var vertices = shape.getVertices();
	var numVert  = vertices.length;
	if(goog.math.Vec2.squaredDistance(pt, vertices[0]) < 4*4) {
	  shape.close(true);
	  this.finishDrawing_();
	} else if(numVert > 2 && goog.math.Vec2.squaredDistance(pt, vertices[numVert - 2]) < 1) {
	  this.finishDrawing_();
	} else {
	  if(numVert > 1)
		vertices[numVert - 1] = pt.clone();
	  vertices.push(pt);
	  shape.updatePath();
	}
  }
};

closuredraw.PathMode.prototype.onMouseMoveCanvas = function(e) {
  var owner = this.owner;
  if(this.drawing_) {
	var pt       = owner.clientToCanvas(e.clientX, e.clientY);
	var shape    = owner.getShape(0);
	var vertices = shape.getVertices();
	if(vertices.length > 1)
	  vertices[vertices.length - 1] = pt;
	shape.updatePath();
  }
};

closuredraw.PathMode.prototype.onExit = function() {
  var owner = this.owner;
  if(this.drawing_)
	owner.deleteShape(0);
  this.drawing_ = false;
  return closuredraw.PathMode.superClass_.onExit.call(this);
};

closuredraw.PathMode.prototype.finishDrawing_ = function() {
  var owner     = this.owner;
  var shape     = owner.getShape(0);
  var vertices  = shape.getVertices();
  this.drawing_ = false;
  vertices.pop();
  if(vertices.length <= 1) {
	owner.deleteShape(0);
  } else {
	if(vertices.length <= 2)
	  shape.close(false);
	shape.updatePath();
	shape.updateBounds();
	owner.setModeIndex(0, true);
	owner.setCurrentShapeIndex(0);
  }
};

//----------------------------------------------------------

/** @constructor */
closuredraw.TextMode = function(owner){
  closuredraw.AbstractMode.call(this, owner);
  this.startPt_ = null;
};
goog.inherits(closuredraw.TextMode, closuredraw.AbstractMode);
closuredraw.AbstractMode.addMode(closuredraw.TextMode);

closuredraw.TextMode.prototype.getCaption = function(domHelper) {
  return domHelper.htmlToDocumentFragment(
	'<div class="closuredraw-icon closuredraw-mode-text">&nbsp</div>');
};

closuredraw.TextMode.prototype.onMouseDownCanvas = function(e) {
  var owner = this.owner;
  if(!owner.dragging()) {
	this.startPt_ = owner.clientToCanvas(e.clientX, e.clientY);
	var handle    = owner.addHandleShape('newtext', 'newtext');
	if(handle)
	  owner.beginDrag(e, this.onDrag_, this.onDragEnd_, this);
  }
};

closuredraw.TextMode.prototype.onDrag_ = function(e) {
  var owner = this.owner;
  if(owner.dragging()) {
	var handle = owner.getHandleShape('newtext');
	if(handle) {
	  var pt1  = owner.clientToCanvas(e.clientX, e.clientY);
	  var font = owner.getCurrentFont();
	  var b    = closuredraw.TextMode.computeTextBounds_(pt1, this.startPt_);
	  b.bottom = b.top + font.size;
	  handle.setPosition(b.left, b.top);
	  handle.setSize(Math.max(1, b.right - b.left), Math.max(1, b.bottom - b.top));
	}
  }
};

closuredraw.TextMode.prototype.onDragEnd_ = function(e) {
  var owner = this.owner;
  var pt1 = owner.clientToCanvas(e.clientX, e.clientY);
  var pt2 = this.startPt_;
  var index, shape;
  if(goog.math.Vec2.squaredDistance(pt1, pt2) < 3*3 &&
	 (index = owner.getShapeIndexAt(pt2.x, pt2.y)) >= 0 &&
	 (shape = owner.getShape(index)).isText()) {
	owner.endDrag();
	owner.showPrompt("Specify text to display", shape.getText(), function(text) {
	  if(text)
		shape.setText(text);
	}, this);
  } else {
	var b = closuredraw.TextMode.computeTextBounds_(pt1, pt2);
	owner.removeAllHandleShapes();
	owner.endDrag();
	owner.setModeIndex(0, true);
	if(b.right - b.left < 16) {
	  b.left  -= 8;
	  b.right += 8;
	}
	owner.showPrompt("Specify text to display", '', function(text) {
	  if(text) {
		var font  = owner.getCurrentFont();
		b.bottom  = b.top + font.size;
		var shape = new closuredraw.Text(
		  owner, owner.getCurrentStroke(), owner.getCurrentFill(), font, text);
		owner.addShape(shape);
		shape.setTransform((b.right + b.left) / 2, (b.bottom + b.top) / 2,
						   (b.right - b.left) / 2, (b.bottom - b.top) / 2, 0);
		owner.setCurrentShapeIndex(0);
	  }
	}, this);
  }
};

closuredraw.TextMode.computeTextBounds_ = function(pt1, pt2) {
  return {
	left:   Math.min(pt1.x, pt2.x),
	top:    Math.min(pt1.y, pt2.y),
	right:  Math.max(pt1.x, pt2.x),
	bottom: Math.max(pt1.y, pt2.y)
  };
};
