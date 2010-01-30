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

goog.provide('closuredraw');
goog.require('goog.math.Vec2');
goog.require('closuredraw.Widget');

closuredraw.computeAxes = function(angle) {
  angle   = angle / 180.0 * Math.PI;
  var sin = Math.sin(angle);
  var cos = Math.cos(angle);
  return {
	x: new goog.math.Vec2( cos, sin),
	y: new goog.math.Vec2(-sin, cos)
  };
};
