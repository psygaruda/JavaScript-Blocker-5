"use strict";

function EventListener () {
	this.__listeners = {};

	Object.defineProperty(this, 'fnWrapper', {
		value: function (event, info) {
			this.event = event;
			this.info = info;
			this.defaultPrevented = false;
		}
	});

	this.fnWrapper.prototype.__run = function () {
		this.info.fn(this);

		return this;
	};

	this.fnWrapper.prototype.preventDefault = function () {
		this.defaultPrevented = true;
	};

	this.fnWrapper.prototype.unbind = function () {
		this.event.removeCustomEventListener(this.type, this.info.fn);
	};
};

EventListener.eventInfo = {};

EventListener.onMouseMove =  function (event) {
	Object._extend(EventListener.eventInfo, {
		pageX: event.pageX,
		pageY: event.pageY
	});
};

EventListener.onClick =  function (event) {
	Object._extend(EventListener.eventInfo, {
		target: event.target
	});
};

EventListener.prototype.listeners = function (name) {
	if (!this.__listeners.hasOwnProperty(name))
		this.__listeners[name] = {
			triggered: false,
			fns: []
		};

	return this.__listeners[name];
};

EventListener.prototype.addCustomEventListener = function (name, fn, once, shouldBeDelayed) {
	if (Array.isArray(name)) {
		for (var i = 0; i < name.length; i++)
			this.addCustomEventListener(name[i], fn, once);

		return this;
	}

	if (typeof fn !== 'function')
		throw new TypeError(fn + ' is not a function.');

	var listeners = this.listeners(name);

	listeners.fns.push({
		name: name,
		once: once,
		fn: fn,
		shouldBeDelayed: shouldBeDelayed
	});

	if (listeners.triggerSubsequentListeners)
		this.trigger(name, null, true);

	return this;
};

EventListener.prototype.addMissingCustomEventListener = function (name, fn, once, shouldBeDelayed) {
	if (Array.isArray(name)) {
		for (var i = 0; i < name.length; i++)
			this.addMissingCustomEventListener(name[i], fn, once, shouldBeDelayed);

		return this;
	}

	var listeners = this.listeners(name);

	for (var i = 0; i < listeners.fns.length; i++)
		if (listeners.fns[i].fn === fn)
			return this;

	return this.addCustomEventListener.apply(this, arguments);
};

EventListener.prototype.removeCustomEventListener = function (name, fn) {
	var listeners = this.listeners(name);

	listeners.fns = listeners.fns.filter(function (testFn) {
		return testFn.fn !== fn;
	});
};

EventListener.prototype.trigger = function (name, detail, triggerSubsequentListeners) {
	var info,
			fnInstance;

	var newListeners = [],
			defaultPrevented = false,
			listeners = this.listeners(name);

	listeners.triggerSubsequentListeners = !!triggerSubsequentListeners;

	for (var i = 0; i < listeners.fns.length; i++) {
		info = listeners.fns[i];

		if (info.shouldBeDelayed)
			Utilities.setImmediateTimeout(info.fn, [detail]);
		else {
			fnInstance = new this.fnWrapper(this, info);

			fnInstance.type = name;
			fnInstance.detail = detail;

			Object._extend(fnInstance, EventListener.eventInfo)

			defaultPrevented = fnInstance.__run().defaultPrevented || defaultPrevented;
		}

		if (!info.once)
			newListeners.push(info);
	}

	this.__listeners[name].fns = newListeners;

	return defaultPrevented;
};

document.addEventListener('mousemove', EventListener.onMouseMove, true);
document.addEventListener('click', EventListener.onClick, true);
