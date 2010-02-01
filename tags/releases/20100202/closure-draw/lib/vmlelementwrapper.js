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

goog.provide('closuredraw.VmlElementWrapper');
goog.require('goog.graphics.VmlGraphics');

/**
 * A wrapper to fix some bugs in VmlGraphics
 *
 * @param {closuredraw.Widget} owner The owner of this shape.
 * @constructor
 * @extends {goog.Disposable}
 */
closuredraw.VmlElementWrapper = function(graphics, createProc, scope) {
  this.group_   = graphics.createGroup();
  this.element_ = createProc.call(scope, this.group_);
  this.x_       = 0;
  this.y_       = 0;
  this.rot_     = 0;
};

closuredraw.VmlElementWrapper.prototype.remove = function() {
  this.group_.getGraphics().removeElement(this.group_);
};

closuredraw.VmlElementWrapper.prototype.setStroke = function(stroke) {
  this.element_.setStroke(stroke);
};

closuredraw.VmlElementWrapper.prototype.setFill = function(fill) {
  this.element_.setFill(fill);
};

closuredraw.VmlElementWrapper.prototype.setText = function(text) {
  this.element_.setText(text);
};

closuredraw.VmlElementWrapper.prototype.setPath = function(path) {
  this.element_.setPath(path);
};

closuredraw.VmlElementWrapper.prototype.setPosition = function(x, y) {
  this.x_ = x;
  this.y_ = y;
  this.element_.setTransformation(this.x_, this.y_, this.rot_, 0, 0);
};

closuredraw.VmlElementWrapper.prototype.setSize = function(x, y) {
  this.element_.setSize(x, y);
};

closuredraw.VmlElementWrapper.prototype.setRadius = function(x, y) {
  this.x_ = -x;
  this.y_ = -y;
  this.element_.setCenter(-x, -y);
  this.element_.setRadius(x, y);
};

closuredraw.VmlElementWrapper.prototype.setTransformation = function(x, y, rot, cx, cy) {
  this.rot_ = rot;
  this.group_.setTransformation(x, y, 0, 0, 0);
  this.element_.setTransformation(this.x_, this.y_, rot, 0, 0);
};
