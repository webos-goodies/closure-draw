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

goog.provide('closuredraw.AbstractShape');
goog.provide('closuredraw.Rect');
goog.provide('closuredraw.Ellipse');
goog.provide('closuredraw.Path');
goog.provide('closuredraw.Text');
goog.provide('closuredraw.Image');

goog.require('goog.string');
goog.require('goog.array');
goog.require('goog.math.Vec2');
goog.require('goog.graphics.Path');
goog.require('goog.graphics.AffineTransform');
goog.require('closuredraw.Transform');
goog.require('closuredraw.VmlElementWrapper');

/**
 * An abstract shape class.
 *
 * @param {closuredraw.Widget} owner The owner of this shape.
 * @constructor
 * @extends {goog.Disposable}
 */
closuredraw.AbstractShape = function(owner) {
  goog.Disposable.call(this);
  this.owner_   = owner;
  this.x        = this.x      || 0;
  this.y        = this.y      || 0;
  this.width    = this.width  || 0.5;
  this.height   = this.height || 0.5;
  this.rot      = this.rot    || 0;
  this.element_ = null;
  if(this.importing_(owner)) {
	this.owner_ = owner.owner;
	this.importSVG_.call(this, owner.doc, owner.element);
  } else {
	this.recreateElement();
  }
};
goog.inherits(closuredraw.AbstractShape, goog.Disposable);

closuredraw.AbstractShape.minimumValue = 0.01;
closuredraw.AbstractShape.SvgShapes    = {};

closuredraw.AbstractShape.prototype.disposeInternal = function() {
  this.remove_();
  this.owner_   = null;
  this.element_ = null;
  closuredraw.AbstractShape.superClass_.disposeInternal.call(this);
};

closuredraw.AbstractShape.prototype.remove_ = function() {
  if(this.owner_ && this.element_) {
	if(this.element_ instanceof closuredraw.VmlElementWrapper)
	  this.element_.remove();
	else
	  this.owner_.getGraphics().removeElement(this.element_);
  }
};

closuredraw.AbstractShape.prototype.reconstruct = function() {
  this.element_ = null;
  this.recreateElement();
  this.element_.setTransformation(this.x, this.y, this.rot, 0, 0);
};

closuredraw.AbstractShape.prototype.contains = function(x, y) {
  var pt = this.getTransform().inverseTransform(new goog.math.Vec2(x, y));
  return Math.abs(pt.x) < this.width + 1 && Math.abs(pt.y) < this.height + 1;
};

closuredraw.AbstractShape.prototype.setTransform = function(x, y, width, height, rot, opt_force) {
  if(opt_force || this.width != width || this.height != height) {
	this.width  = Math.max(closuredraw.AbstractShape.minimumValue, width);
	this.height = Math.max(closuredraw.AbstractShape.minimumValue, height);
	this.updateSize_();
  }
  if(opt_force || this.x != x || this.y != y || this.rot != rot) {
	this.x   = x;
	this.y   = y;
	this.rot = rot;
	this.element_.setTransformation(x, y, rot, 0, 0);
  }
};

closuredraw.AbstractShape.prototype.getTransform = function() {
  return new closuredraw.Transform(this.x, this.y, this.rot);
};

closuredraw.AbstractShape.prototype.getStroke = function() {
  return this.owner_.getCurrentStroke();
};

closuredraw.AbstractShape.prototype.getFill = function() {
  return this.owner_.getCurrentFill();
};

closuredraw.AbstractShape.prototype.getFont = function() {
  return this.owner_.getCurrentFont();
};

closuredraw.AbstractShape.prototype.squaredDistanceLinePoint = function(pt, pt1, pt2) {
  var v    = new goog.math.Vec2(pt2.x-pt1.x, pt2.y-pt1.y);
  var vv   = v.x*v.x + v.y*v.y;
  pt       = new goog.math.Vec2(pt.x-pt1.x, pt.y-pt1.y);
  var t;
  if(vv < closuredraw.AbstractShape.minimumValue ||
	 (t = (pt.x*v.x + pt.y*v.y) / vv) < 0) {
	t = 0;
  } else if(t > 1) {
	t = 1;
  }
  v.x = pt.x - v.x*t;
  v.y = pt.y - v.y*t;
  return v.x*v.x + v.y*v.y;
}

closuredraw.AbstractShape.prototype.exportSVG = function(doc, element) {
  if(element) {
	element.setAttribute('transform',
						 'translate(' + this.x + ',' + this.y + ') rotate(' +
						 this.rot + ' 0 0)');
  }
  return element;
};

closuredraw.AbstractShape.prototype.importSVG_ = function(doc, element, opt_defer) {
  this.x = this.y = this.rot = 0;
  var transform = element.getAttribute('transform');
  if(/translate\s*\(([^\)]+)/.exec(transform)) {
	var params = RegExp.$1.split(',');
	this.x = parseFloat(params[0] || 0);
	this.y = parseFloat(params[1] || 0);
  }
  if(/rotate\s*\(([^\s\)]+)/.exec(transform)) {
	this.rot = parseFloat(RegExp.$1);
  }
  if(!opt_defer) {
	this.recreateElement();
	this.element_.setTransformation(this.x, this.y, this.rot, 0, 0);
  }
};

closuredraw.AbstractShape.prototype.usingVml_ = function() {
  return this.owner_.getGraphics() instanceof goog.graphics.VmlGraphics;
};

closuredraw.AbstractShape.prototype.importing_ = function(arg0) {
  return arg0 instanceof closuredraw.Widget.ImportParams;
};

closuredraw.AbstractShape.prototype.isPath = function() { return false; }
closuredraw.AbstractShape.prototype.isText = function() { return false; }

closuredraw.AbstractShape.prototype.recreateElement = goog.abstractMethod;
closuredraw.AbstractShape.prototype.setStroke       = goog.nullFunction;
closuredraw.AbstractShape.prototype.setFill         = goog.nullFunction;
closuredraw.AbstractShape.prototype.setFont         = goog.nullFunction;
closuredraw.AbstractShape.prototype.updateSize_     = goog.abstractMethod;

//----------------------------------------------------------

/**
 * An abstract class for all stroke and fill shapes.
 *
 * @param {closuredraw.Widget} owner The owner of this shape.
 * @param {goog.graphics.Stroke?} stroke The stroke to use for this element.
 * @param {goog.graphics.Fill?} fill The fill to use for this element.
 * @constructor
 * @extends {closuredraw.AbstractShape}
 */
closuredraw.StrokeAndFillShape = function(owner, stroke, fill) {
  this.stroke_ = stroke;
  this.fill_   = fill;
  closuredraw.AbstractShape.call(this, owner);
};
goog.inherits(closuredraw.StrokeAndFillShape, closuredraw.AbstractShape);

closuredraw.StrokeAndFillShape.prototype.disposeInternal = function() {
  this.stroke_ = null;
  this.fill_   = null;
  closuredraw.StrokeAndFillShape.superClass_.disposeInternal.call(this);
}

closuredraw.StrokeAndFillShape.prototype.getStroke = function() {
  return this.stroke_;
};

closuredraw.StrokeAndFillShape.prototype.setStroke = function(stroke) {
  this.stroke_ = stroke;
  this.element_.setStroke(stroke);
};

closuredraw.StrokeAndFillShape.prototype.getFill = function() {
  return this.fill_;
};

closuredraw.StrokeAndFillShape.prototype.setFill = function(fill) {
  this.fill_ = fill;
  this.element_.setFill(fill);
};

closuredraw.StrokeAndFillShape.prototype.exportSVG = function(doc, element) {
  if(element) {
	if(this.stroke_) {
	  element.setAttribute('stroke', this.stroke_.getColor());
	  element.setAttribute('stroke-width', this.stroke_.getWidth());
	} else {
	  element.setAttribute('stroke', 'none');
	}
	element.setAttribute('fill', this.fill_ ? this.fill_.getColor() : 'none');
  }
  return closuredraw.StrokeAndFillShape.superClass_.exportSVG.call(this, doc, element);
};

closuredraw.StrokeAndFillShape.prototype.importSVG_ = function(doc, element, opt_defer) {
  var strokeColor = element.getAttribute('stroke')       || '#000000';
  var strokeWidth = element.getAttribute('stroke-width') || 1;
  var fillColor   = element.getAttribute('fill')         || '#ffffff';

  this.stroke_ = this.fill_ = null;
  if(goog.string.trim(strokeColor) != 'none')
	this.stroke_ = new goog.graphics.Stroke(strokeWidth, strokeColor);
  if(goog.string.trim(fillColor) != 'none')
	this.fill_ = new goog.graphics.SolidFill(fillColor);

  closuredraw.StrokeAndFillShape.superClass_.importSVG_.apply(this, arguments);
};

closuredraw.StrokeAndFillShape.prototype.getStrokeWidthForHitTest = function() {
  return this.stroke_ ? Math.max(2, parseFloat(this.stroke_.getWidth() || 0, 10)/2) : 2;
};

//----------------------------------------------------------

/**
 * A shape class for rect.
 *
 * @param {closuredraw.Widget} owner The owner of this shape.
 * @param {goog.graphics.Stroke?} stroke The stroke to use for this element.
 * @param {goog.graphics.Fill?} fill The fill to use for this element.
 * @constructor
 * @extends {closuredraw.StrokeAndFillShape}
 */
closuredraw.Rect = function(owner, stroke, fill) {
  closuredraw.StrokeAndFillShape.call(this, owner, stroke, fill);
};
goog.inherits(closuredraw.Rect, closuredraw.StrokeAndFillShape);
closuredraw.AbstractShape.SvgShapes['rect'] = closuredraw.Rect;

closuredraw.Rect.prototype.recreateElement = function() {
  var g = this.owner_.getGraphics(), w = this.width, h = this.height;
  this.remove_();
  if(this.usingVml_()) {
	this.element_ = new closuredraw.VmlElementWrapper(g, function(group) {
	  return g.drawRect(-w, -h, w*2, h*2, this.stroke_, this.fill_, group);
	}, this);
	this.element_.setPosition(-w, -h);
	this.element_.setSize(w*2, h*2);
  } else {
	this.element_ = g.drawRect(-w, -h, w*2, h*2, this.stroke_, this.fill_);
  }
};

closuredraw.Rect.prototype.contains = function(x, y) {
  if(this.width < 2 || this.height < 2 || !this.getStroke() || this.getFill())
	return closuredraw.Rect.superClass_.contains.apply(this, arguments);
  var pt          = this.getTransform().inverseTransform(new goog.math.Vec2(x, y));
  var strokeWidth = this.getStrokeWidthForHitTest();
  var diffX       = Math.abs(pt.x) - this.width;
  var diffY       = Math.abs(pt.y) - this.height;
  var strokeW2    = strokeWidth * strokeWidth;
  var range, value;
  if(diffX*diffX < strokeW2) {
	value = pt.y;
	range = this.height + strokeWidth;
  } else if(diffY*diffY < strokeW2) {
	value = pt.x;
	range = this.width + strokeWidth;
  } else {
	return false;
  }
  return value*value <= range*range
};

closuredraw.Rect.prototype.exportSVG = function(doc, element) {
  element = element || closuredraw.utils.createElement(doc, closuredraw.XmlNS.SVG, 'rect');
  element.setAttribute('x',      -this.width);
  element.setAttribute('y',      -this.height);
  element.setAttribute('width',  this.width  * 2);
  element.setAttribute('height', this.height * 2);
  return closuredraw.Rect.superClass_.exportSVG.call(this, doc, element);
};

closuredraw.Rect.prototype.importSVG_ = function(doc, element, opt_defer) {
  this.width  = parseFloat(element.getAttribute('width')  || 10) / 2;
  this.height = parseFloat(element.getAttribute('height') || 10) / 2;
  closuredraw.Rect.superClass_.importSVG_.apply(this, arguments);
};

closuredraw.Rect.prototype.updateSize_ = function() {
  var w = this.width, h = this.height;
  this.element_.setPosition(-w, -h);
  this.element_.setSize(w*2, h*2);
};

//----------------------------------------------------------

/**
 * A shape class for ellipse.
 *
 * @param {closuredraw.Widget} owner The owner of this shape.
 * @param {goog.graphics.Stroke?} stroke The stroke to use for this element.
 * @param {goog.graphics.Fill?} fill The fill to use for this element.
 * @constructor
 * @extends {closuredraw.StrokeAndFillShape}
 */
closuredraw.Ellipse = function(owner, stroke, fill) {
  closuredraw.StrokeAndFillShape.call(this, owner, stroke, fill);
};
goog.inherits(closuredraw.Ellipse, closuredraw.StrokeAndFillShape);

closuredraw.Ellipse.prototype.recreateElement = function() {
  var g = this.owner_.getGraphics();
  this.remove_();
  if(this.usingVml_()) {
	this.element_ = new closuredraw.VmlElementWrapper(g, function(group) {
	  return g.drawEllipse(0, 0, this.width, this.height, this.stroke_, this.fill_, group);
	}, this);
	this.element_.setRadius(this.width, this.height);
  } else {
	this.element_ = g.drawEllipse(0, 0, this.width, this.height, this.stroke_, this.fill_);
  }
};
closuredraw.AbstractShape.SvgShapes['ellipse'] = closuredraw.Ellipse;

closuredraw.Ellipse.prototype.contains = function(x, y) {
  if(this.width < 2 || this.height < 2)
	return closuredraw.Ellipse.superClass_.contains.apply(this, arguments);
  var radius, pt = this.getTransform().inverseTransform(new goog.math.Vec2(x, y));
  if(this.width < this.height) {
	pt.y  *= this.width / this.height;
	radius = this.width;
  } else {
	pt.x  *= this.height / this.width;
	radius = this.height;
  }
  var distance = pt.magnitude();
  if(!this.getStroke() || this.getFill())
	return pt.magnitude() <= radius;
  else
	return Math.abs(pt.magnitude() - radius) <= this.getStrokeWidthForHitTest();
};

closuredraw.Ellipse.prototype.exportSVG = function(doc, element) {
  element = element || closuredraw.utils.createElement(doc, closuredraw.XmlNS.SVG, 'ellipse');
  element.setAttribute('cx', 0);
  element.setAttribute('cy', 0);
  element.setAttribute('rx', this.width);
  element.setAttribute('ry', this.height);
  return closuredraw.Ellipse.superClass_.exportSVG.call(this, doc, element);
};

closuredraw.Ellipse.prototype.importSVG_ = function(doc, element, opt_defer) {
  this.width  = parseFloat(element.getAttribute('rx') || 10);
  this.height = parseFloat(element.getAttribute('ry') || 10);
  closuredraw.Ellipse.superClass_.importSVG_.apply(this, arguments);
};

closuredraw.Ellipse.prototype.updateSize_ = function() {
  this.element_.setRadius(this.width, this.height);
};

//----------------------------------------------------------

/**
 * A shape class for path.
 *
 * @param {closuredraw.Widget} owner The owner of this shape.
 * @param {goog.graphics.Stroke?} stroke The stroke to use for this element.
 * @param {goog.graphics.Fill?} fill The fill to use for this element.
 * @constructor
 * @extends {closuredraw.StrokeAndFillShape}
 */
closuredraw.Path = function(owner, stroke, fill) {
  this.vertices_  = [];
  this.isClosed_  = false;
  this.center_    = new goog.math.Vec2(0, 0);
  this.size_      = new goog.math.Vec2(0.5, 0.5);
  this.transform_ = new closuredraw.Transform(0, 0, 0);
  closuredraw.StrokeAndFillShape.call(this, owner, stroke, fill);
  if(!this.importing_(owner)) {
	this.x = this.y = 0;
	this.width = this.height = 0.5;
  }
};
goog.inherits(closuredraw.Path, closuredraw.StrokeAndFillShape);
closuredraw.AbstractShape.SvgShapes['path'] = closuredraw.Path;

closuredraw.Path.prototype.isPath = function() { return true; };

closuredraw.Path.prototype.recreateElement = function() {
  var g = this.owner_.getGraphics();
  this.remove_();
  if(this.usingVml_()) {
	this.element_ = new closuredraw.VmlElementWrapper(g, function(group) {
	  return g.drawPath(this.createPath_(), this.stroke_, this.fill_, group);
	}, this);
  } else {
	this.element_ = g.drawPath(this.createPath_(), this.stroke_, this.fill_);
  }
};

closuredraw.Path.prototype.reconstruct = function() {
  this.element_ = null;
  this.recreateElement();
  this.setTransform(this.x, this.y, this.width, this.height, this.rot, true);
};

closuredraw.Path.prototype.contains = function(x, y) {
  var vertices = this.vertices_;
  var numVert  = vertices.length;
  if(numVert <= 1 || this.width < 2 || this.height < 2)
	return closuredraw.Path.superClass_.contains.apply(this, arguments);
  var pt = this.inverseTransform(new goog.math.Vec2(x, y));
  if(numVert > 2 && (!this.getStroke() || this.getFill())) {
	var count = 0;
	for(var i = 1 ; i < numVert ; ++i) {
	  count += this.isLeftLine(pt, vertices[i-1], vertices[i]);
	}
	count += this.isLeftLine(pt, vertices[i-1], vertices[0]);
	return (count & 1) != 0;
  } else {
	var width = (this.getStrokeWidthForHitTest() *
				 Math.max(this.size_.x / this.width, this.size_.y / this.height));
	width *= width;
	for(var i = 1 ; i < numVert ; ++i) {
	  if(this.squaredDistanceLinePoint(pt, vertices[i - 1], vertices[i]) <= width)
		return true;
	}
	return (this.isClosed_ &&
			this.squaredDistanceLinePoint(pt, vertices[i-1], vertices[0]) <= width);
  }
};

closuredraw.Path.prototype.setTransform = function(x, y, width, height, rot, opt_force) {
  var updateRequest = false;
  if(opt_force || this.width != width || this.height != height) {
	this.width  = Math.max(closuredraw.AbstractShape.minimumValue, width);
	this.height = Math.max(closuredraw.AbstractShape.minimumValue, height);
	updateRequest = true;
  }
  if(opt_force || updateRequest || this.x != x || this.y != y || this.rot != rot) {
	var cx = this.center_.x * this.width  / this.size_.x;
	var cy = this.center_.y * this.height / this.size_.y
	this.x = x;
	this.y = y;
	if(!this.usingVml_()) {
	  this.rot = rot;
	  this.element_.setTransformation(x - cx, y - cy, rot, cx, cy);
	} else {
	  if(this.rot != rot || opt_force)
		updateRequest = true;
	  this.rot = rot;
	  this.element_.setTransformation(x - cx, y - cy, 0, 0, 0);
	}
	this.transform_ = this.getTransform();
  }
  if(updateRequest)
	this.updatePath();
};

closuredraw.Path.prototype.exportSVG = function(doc, element) {
  var svgPath   = [];
  var arrayPush = Array.prototype.push;
  this.createPath_(true).forEachSegment(function(segment, args) {
	switch(segment) {
	case goog.graphics.Path.Segment.MOVETO:
	  svgPath.push('M');
	  arrayPush.apply(svgPath, args);
	  break;
	case goog.graphics.Path.Segment.LINETO:
	  svgPath.push('L');
	  arrayPush.apply(svgPath, args);
	  break;
    case goog.graphics.Path.Segment.CLOSE:
      svgPath.push('Z');
      break;
	}
  });

  element = element || closuredraw.utils.createElement(doc, closuredraw.XmlNS.SVG, 'path');
  element.setAttribute('d', svgPath.join(' '));
  element = closuredraw.Path.superClass_.exportSVG.call(this, doc, element);

  var cx   = this.center_.x * this.width  / this.size_.x;
  var cy   = this.center_.y * this.height / this.size_.y
  element.setAttribute('transform',
					   'translate(' + (this.x - cx) + ',' + (this.y - cy) +
					   ') rotate(' + this.rot + ' ' + cx + ' ' + cy + ')');
  return element;
};

closuredraw.Path.prototype.importSVG_ = function(doc, element, opt_defer) {
  this.isClosed_ = false;

  // parse path data
  var data = [];
  goog.array.forEach((element.getAttribute('d')||'').split(' '), function(value) {
	if(!/^[a-zA-Z]$/.test(value = goog.string.trim(value))) {
	  data[data.length] = parseFloat(value);
	} else if(value == 'Z' || value == 'z') {
	  this.isClosed_ = true;
	}
  }, this);

  // create vertices
  var vertices = [];
  var numVert  = data.length / 2;
  for(var i = 0 ; i < numVert ; ++i) {
	vertices[i] = new goog.math.Vec2(data[i*2], data[i*2+1]);
  }
  this.vertices_ = vertices;

  // compute metrix
  var b = this.computeBounds_();
  this.center_  = new goog.math.Vec2((b.maxX + b.minX) / 2, (b.maxY + b.minY) / 2);
  this.size_    = new goog.math.Vec2(
	Math.max(closuredraw.AbstractShape.minimumValue, (b.maxX - b.minX) / 2),
	Math.max(closuredraw.AbstractShape.minimumValue, (b.maxY - b.minY) / 2));
  this.width  = this.size_.x;
  this.height = this.size_.y;

  // import other properties then adjust transformation
  closuredraw.Path.superClass_.importSVG_.call(this, doc, element, true);

  this.x += this.center_.x;
  this.y += this.center_.y;
  if(!opt_defer) {
	this.recreateElement();
	this.setTransform(this.x, this.y, this.width, this.height, this.rot, true);
  }
};

closuredraw.Path.prototype.createPath_ = function(opt_forceSVG) {
  var path        = new goog.graphics.Path();
  var numVertices = this.vertices_.length;
  var scaleX      = this.width  / this.size_.x;
  var scaleY      = this.height / this.size_.y;
  if(numVertices > 0) {
	var vertex = this.vertices_[0];
	path.moveTo(vertex.x * scaleX, vertex.y * scaleY);
	for(var i = 1 ; i < numVertices ; ++i) {
	  vertex = this.vertices_[i];
	  path.lineTo(vertex.x * scaleX, vertex.y * scaleY);
	}
	if(this.isClosed_)
	  path.close();
	if(this.usingVml_() && !opt_forceSVG) {
	  var m = new goog.graphics.AffineTransform.getRotateInstance(
		this.rot * Math.PI / 180.0, this.center_.x * scaleX, this.center_.y * scaleY);
	  path = path.createTransformedPath(m);
	}
  }
  return path;
};

closuredraw.Path.prototype.updatePath = function() {
  this.element_.setPath(this.createPath_());
};

closuredraw.Path.prototype.computeBounds_ = function() {
  var minX      = Number.MAX_VALUE;
  var minY      = Number.MAX_VALUE;
  var maxX      = -Number.MAX_VALUE;
  var maxY      = -Number.MAX_VALUE;
  var vertices  = this.vertices_;
  var numVert   = vertices.length;
  var vertex;
  for(var i = 0 ; i < numVert ; ++i) {
	vertex = vertices[i];
	minX = minX < vertex.x ? minX : vertex.x;
	minY = minY < vertex.y ? minY : vertex.y;
	maxX = maxX > vertex.x ? maxX : vertex.x;
	maxY = maxY > vertex.y ? maxY : vertex.y;
  }
  return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
};

closuredraw.Path.prototype.updateBounds = function() {
  var b         = this.computeBounds_();
  var oldCenter = this.center_;
  var oldSize   = this.size_;
  var scaleX    = this.width  / oldSize.x;
  var scaleY    = this.height / oldSize.y;
  var axes      = this.transform_.axes;
  this.center_  = new goog.math.Vec2((b.maxX + b.minX) / 2, (b.maxY + b.minY) / 2);
  this.size_    = new goog.math.Vec2(
	Math.max(closuredraw.AbstractShape.minimumValue, (b.maxX - b.minX) / 2),
	Math.max(closuredraw.AbstractShape.minimumValue, (b.maxY - b.minY) / 2));
  var offsetX = (this.center_.x - oldCenter.x) * scaleX;
  var offsetY = (this.center_.y - oldCenter.y) * scaleY;
  this.setTransform(this.x + axes.x.x * offsetX + axes.y.x * offsetY,
					this.y + axes.x.y * offsetX + axes.y.y * offsetY,
					this.size_.x * scaleX,
					this.size_.y * scaleY,
					this.rot);
};

closuredraw.Path.prototype.getVertices = function() {
  return this.vertices_;
};

closuredraw.Path.prototype.close = function(flag) {
  this.isClosed_ = flag;
}

closuredraw.Path.prototype.transform = function(pt) {
  return this.transform_.transform(new goog.math.Vec2(
	(pt.x - this.center_.x) * this.width  / this.size_.x,
	(pt.y - this.center_.y) * this.height / this.size_.y));
};

closuredraw.Path.prototype.inverseTransform = function(pt) {
  var newPt = this.transform_.inverseTransform(pt);
  newPt.x = newPt.x * this.size_.x / this.width  + this.center_.x;
  newPt.y = newPt.y * this.size_.y / this.height + this.center_.y;
  return newPt;
};

closuredraw.Path.prototype.isLeftLine = function(pt, pt1, pt2) {
  if(Math.min(pt1.y, pt2.y) <= pt.y && pt.y < Math.max(pt1.y, pt2.y)) {
	var t = (pt.y - pt1.y) / (pt2.y - pt1.y);
	return pt1.x + (pt2.x - pt1.x)*t < pt.x ? 1 : 0;
  }
  return 0;
};

//----------------------------------------------------------

/**
 * A shape class for text.
 *
 * @param {closuredraw.Widget} owner The owner of this shape.
 * @param {goog.graphics.Stroke?} stroke The stroke to use for this element.
 * @param {goog.graphics.Fill?} fill The fill to use for this element.
 * @param {goog.graphics.Font?} font The font to use for this element.
 * @param {String} text The text to display.
 * @constructor
 * @extends {closuredraw.StrokeAndFillShape}
 */
closuredraw.Text = function(owner, stroke, fill, font, text) {
  this.font_  = font;
  this.text_  = text;
  closuredraw.StrokeAndFillShape.call(this, owner, stroke, fill);
};
goog.inherits(closuredraw.Text, closuredraw.StrokeAndFillShape);
closuredraw.AbstractShape.SvgShapes['text'] = closuredraw.Text;

closuredraw.Text.prototype.recreateElement = function() {
  var g = this.owner_.getGraphics(), w = this.width, h = this.height;
  this.remove_();
  if(this.usingVml_()) {
	this.element_ = new closuredraw.VmlElementWrapper(g, function(group) {
	  return this.vmlDrawText(group);
	}, this);
  } else {
	this.element_ = g.drawText(this.text_, -w, -h, w*2, h*2, 'center', 'center',
							   this.font_, this.stroke_, this.fill_);
  }
};

closuredraw.Text.prototype.reconstruct = function() {
  this.element_ = null;
  this.recreateElement();
  this.element_.setTransformation(this.x, this.y, this.usingVml_() ? 0 : this.rot, 0, 0);
};

closuredraw.Text.prototype.setTransform = function(x, y, width, height, rot, opt_force) {
  if(this.usingVml_()) {
	this.width  = Math.max(closuredraw.AbstractShape.minimumValue, width);
	this.height = Math.max(closuredraw.AbstractShape.minimumValue, height);
	if(opt_force || this.x != x || this.y != y || this.rot != rot) {
	  this.x = x;
	  this.y = y;
	  if(this.rot != rot) {
		this.rot = rot;
		this.element_.group_.clear();
		this.element_.element_ = this.vmlDrawText(this.element_.group_);
	  }
	  this.element_.setTransformation(x, y, 0, 0, 0);
	}
  } else {
	closuredraw.Text.superClass_.setTransform.apply(this, arguments);
  }
};

closuredraw.Text.prototype.getFont = function() {
  return this.font_;
};

closuredraw.Text.prototype.setFont = function(font) {
  this.font_ = font;
};

closuredraw.Text.prototype.getText = function() {
  return this.text_;
};

closuredraw.Text.prototype.setText = function(text) {
  this.text_ = text;
  this.element_.setText(text);
};

closuredraw.Text.prototype.exportSVG = function(doc, element) {
  var fontSize = this.font_.size;
  var y        = Math.round(Math.round(fontSize*0.85) - fontSize/2);
  element = element || closuredraw.utils.createElement(doc, closuredraw.XmlNS.SVG, 'text');
  element.setAttribute('x',                  0);
  element.setAttribute('y',                  y);
  element.setAttribute('font-family',        this.font_.family);
  element.setAttribute('font-size',          fontSize);
  element.setAttribute('text-anchor',        'middle');
  element.setAttribute('closuredraw:width',  this.width);
  element.setAttribute('closuredraw:height', this.height);
  element.appendChild(doc.createTextNode(this.text_));
  return closuredraw.Text.superClass_.exportSVG.call(this, doc, element);
};

closuredraw.Text.prototype.importSVG_ = function(doc, element, opt_defer) {
  var fontSize = Math.max(parseFloat(element.getAttribute('font-size')), '4');
  this.width   = element.getAttribute('width')  || fontSize / 2;
  this.height  = element.getAttribute('height') || fontSize / 2;

  this.font_ = new goog.graphics.Font(
	fontSize, element.getAttribute('font-family') || 'sans-serif');

  var text = [];
  goog.array.forEach(element.childNodes, function(node) {
	if(node.nodeType == 3 || node.nodeType == 4)
	  text[text.length] = node.data;
  });
  this.text_ = text.join('');

  closuredraw.Text.superClass_.importSVG_.call(this, doc, element, true);
  if(!opt_defer) {
	this.recreateElement();
	this.element_.setTransformation(this.x, this.y, this.usingVml_() ? 0 : this.rot, 0, 0);
  }
};

closuredraw.Text.prototype.vmlDrawText = function(group) {
  var y     = this.font_.size * 0.4;
  var trans = new closuredraw.Transform(0, 0, this.rot);
  var pt1   = trans.transform(new goog.math.Vec2(-this.width, y));
  var pt2   = trans.transform(new goog.math.Vec2(this.width, y));
  return this.owner_.getGraphics().drawTextOnLine(
	this.text_, pt1.x, pt1.y, pt2.x, pt2.y,
	'center', this.font_, this.stroke_, this.fill_, group);
};

closuredraw.Text.prototype.isText      = function() { return true; }
closuredraw.Text.prototype.updateSize_ = function() {};


//----------------------------------------------------------

/**
 * A shape class for image.
 *
 * @param {closuredraw.Widget} owner The owner of this shape.
 * @param {String} url The source URL of the image.
 * @constructor
 * @extends {closuredraw.AbstractShape}
 */
closuredraw.Image = function(owner, url) {
  this.url_ = url;
  closuredraw.AbstractShape.call(this, owner);
};
goog.inherits(closuredraw.Image, closuredraw.AbstractShape);
closuredraw.AbstractShape.SvgShapes['image'] = closuredraw.Image;

closuredraw.Image.prototype.recreateElement = function() {
  var g = this.owner_.getGraphics(), w = this.width, h = this.height;
  this.remove_();
  if(this.usingVml_()) {
	this.element_ = new closuredraw.VmlElementWrapper(g, function(group) {
	  return g.drawImage(-w, -h, w*2, h*2, this.url_, group);
	}, this);
  } else {
	this.element_ = g.drawImage(-w, -h, w*2, h*2, this.url_);
  }
};

closuredraw.Image.prototype.reconstruct = function() {
  this.element_ = null;
  this.recreateElement();
  this.setTransform(this.x, this.y, this.width, this.height, this.rot, true);
};

closuredraw.Image.prototype.exportSVG = function(doc, element) {
  element = element || closuredraw.utils.createElement(doc, closuredraw.XmlNS.SVG, 'image');
  element.setAttribute('x',         -this.width);
  element.setAttribute('y',         -this.height);
  element.setAttribute('width',      this.width  * 2);
  element.setAttribute('height',     this.height * 2);
  element.setAttribute('xlink:href', this.url_);
  element.setAttribute('image-rendering', 'optimizeQuality');
  element.setAttribute('preserveAspectRatio', 'none');
  return closuredraw.Image.superClass_.exportSVG.call(this, doc, element);
};

closuredraw.Image.prototype.importSVG_ = function(doc, element, opt_defer) {
  this.width  = parseFloat(element.getAttribute('width')  || 10) / 2;
  this.height = parseFloat(element.getAttribute('height') || 10) / 2;
  this.url_   = (element.getAttribute('href') || element.getAttribute('xlink:href'));
  closuredraw.Image.superClass_.importSVG_.call(this, doc, element, true);
  if(!opt_defer) {
	this.recreateElement();
	this.setTransform(this.x, this.y, this.width, this.height, this.rot, true);
  }
};

closuredraw.Image.prototype.updateSize_ = function() {
  var w = this.width, h = this.height;
  this.element_.setPosition(-w, -h);
  this.element_.setSize(w*2, h*2);
};

closuredraw.Image.prototype.getImageUrl = function() {
  return this.url_;
};

closuredraw.Image.prototype.setImageUrl = function(url) {
  this.url_ = url;
  this.element_.setSource(url);
};
