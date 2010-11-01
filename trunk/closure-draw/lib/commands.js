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

goog.provide('closuredraw.Command');
goog.provide('closuredraw.Mode');

/**
 * The definition of commands.
 * @enum {string}
 */
closuredraw.Command = {
  SET_MODE:         'SET_MODE',
  INSERT_IMAGE:     'INSERT_IMAGE',
  SET_STROKE_WIDTH: 'SET_STROKE_WIDTH',
  SET_STROKE_COLOR: 'SET_STROKE_COLOR',
  SET_FILL_COLOR:   'SET_FILL_COLOR',
  SET_FONT_SIZE:    'SET_FONT_SIZE',
  BRING_UP:         'BRING_UP',
  BRING_DOWN:       'BRING_DOWN',
  BRING_TO_TOP:     'BRING_TO_TOP',
  BRING_TO_BOTTOM:  'BRING_TO_BOTTOM',
  COPY:             'COPY',
  DELETE:           'DELETE'
};

/**
 * The definition of modes.
 * @enum {string}
 */
closuredraw.Mode = {
  MOVE:    'move',
  MODIFY:  'modify',
  RECT:    'rect',
  ELLIPSE: 'ellipse',
  PATH:    'path',
  TEXT:    'text'
};
