goog.provide('closuredraw.CanvasEvent');
goog.provide('closuredraw.CommandEvent');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');

/**
 * An event class for closuredraw.Canvas
 * @param {closuredraw.Canvas.EventType} type The type of the event.
 * @param {goog.events.EventTarget} target The target of this event.
 * @param {*=} opt_data The related data of this event.
 * @constructor
 * @extends {goog.events.Event}
 */
closuredraw.CanvasEvent = function(type, target, opt_data) {
  goog.base(this, type, target);
  this.data = goog.isDef(opt_data) ? opt_data : null;
};
goog.inherits(closuredraw.CanvasEvent, goog.events.Event);

/**
 * Dispatches the action event.
 * @param {closuredraw.Canvas.EventType} type The type of the event.
 * @param {goog.events.EventTarget} target The event target.
 * @param {*=} opt_data The related data of this event.
 */
closuredraw.CanvasEvent.dispatch = function(type, target, opt_data) {
  target.dispatchEvent(new closuredraw.CanvasEvent(type, target, opt_data));
}

/**
 * The related data of this event.
 * @type {*}
 */
closuredraw.CanvasEvent.prototype.data;


/**
 * An event class to send a command.
 * @param {goog.events.EventTarget} target The target of this event.
 * @param {string} command command string.
 * @param {*=} opt_arg The related data of the command.
 * @constructor
 * @extends {goog.events.Event}
 */
closuredraw.CommandEvent = function(target, command, opt_arg) {
  goog.base(this, closuredraw.CommandEvent.EVENT_TYPE, target);
  this.command = command;
  this.arg     = goog.isDef(opt_arg) ? opt_arg : null;
};
goog.inherits(closuredraw.CommandEvent, goog.events.Event);

/**
 * The event type of CommandEvent.
 * @type {string}
 * @const
 */
closuredraw.CommandEvent.EVENT_TYPE = 'closuredraw_command';

/**
 * Dispatches the action event.
 * @param {goog.events.EventTarget} target The event target.
 * @param {string} command command string.
 * @param {*=} opt_arg The related data of the command.
 */
closuredraw.CommandEvent.dispatch = function(target, command, opt_arg) {
  target.dispatchEvent(new closuredraw.CommandEvent(target, command, opt_arg));
}

/**
 * Command string
 * @type {string}
 */
closuredraw.CommandEvent.prototype.command;

/**
 * The related data of this event.
 * @type {*}
 */
closuredraw.CommandEvent.prototype.arg;
