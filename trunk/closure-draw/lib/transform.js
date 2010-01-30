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

// Copyright 2007 Google Inc. All Rights Reserved.

goog.provide('closuredraw.Transform');
goog.require('goog.math.Vec2');

/**
 * Closure Draw widget.
 *
 * @param {number} x The x coordinate of origin.
 * @param {number} y The y coordinate of origin.
 * @param {number} rot The rotation angle.
 * @constructor
 */
closuredraw.Transform = function(x, y, rot) {
  this.origin = new goog.math.Vec2(x, y);
  this.axes   = closuredraw.computeAxes(rot);
};

closuredraw.Transform.prototype.transform = function(pt) {
  var x = { x:this.axes.x.x*pt.x, y:this.axes.x.y*pt.x };
  var y = { x:this.axes.y.x*pt.y, y:this.axes.y.y*pt.y };
  return new goog.math.Vec2(this.origin.x + x.x + y.x, this.origin.y + x.y + y.y);
};

closuredraw.Transform.prototype.inverseTransform = function(pt) {
  pt = goog.math.Vec2.difference(pt, this.origin);
  return new goog.math.Vec2(goog.math.Vec2.dot(this.axes.x, pt),
							goog.math.Vec2.dot(this.axes.y, pt));
};
