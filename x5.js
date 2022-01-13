var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
/**
* @file observable.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/x4_events", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventSource = exports.EvDrag = exports.EvMessage = exports.EvTimer = exports.EvContextMenu = exports.EvSelectionChange = exports.EvChange = exports.EvClick = exports.BasicEvent = void 0;
    // default stopPropagation implementation for Events
    const stopPropagation = function () {
        this.propagationStopped = true;
    };
    // default preventDefault implementation for Events
    const preventDefault = function () {
        this.defaultPrevented = true;
    };
    ;
    /**
     * BasicEvent Builder
     * this function is responsable of BasicEvent creation
     * ie. is equivalent of new BasicEvent( xxx );
     * @param params
     * @returns BasicEvent
     */
    function BasicEvent(params) {
        return {
            stopPropagation,
            preventDefault,
            ...params,
        };
    }
    exports.BasicEvent = BasicEvent;
    function EvClick(context = null) {
        return BasicEvent({ context });
    }
    exports.EvClick = EvClick;
    function EvChange(value, context = null) {
        return BasicEvent({ value, context });
    }
    exports.EvChange = EvChange;
    function EvSelectionChange(selection, context = null) {
        return BasicEvent({ selection, context });
    }
    exports.EvSelectionChange = EvSelectionChange;
    function EvContextMenu(uievent, context = null) {
        return BasicEvent({ uievent, context });
    }
    exports.EvContextMenu = EvContextMenu;
    function EvTimer(timer, time = 0, context = null) {
        return BasicEvent({ timer, time, context });
    }
    exports.EvTimer = EvTimer;
    function EvMessage(msg, params, source) {
        return BasicEvent({ msg, params, source });
    }
    exports.EvMessage = EvMessage;
    function EvDrag(element, data, ctx) {
        return BasicEvent({ element, data, context: ctx });
    }
    exports.EvDrag = EvDrag;
    /**
     * Event emitter class
     * this class allow you to emit and handle events
     *
     * @example:
     * ```ts
     *
     * interface EvDoIt extends BasicEvent {
     *   param: unknown;
     * }
     *
     * function EvDoIt( e: EvDoIt ) : EvDoIt {
     *   return BasicEvent<EvDoIt>( e );
     * }
     *
     * interface TestEventMap extends EventMap {
     *	doit: EvDoIt;
     * }
     *
     * let ee = new EventSource<TestEventMap>(null);
     * ee.listen({
     *	doit: (e) => {
     *		console.log(e);
     *		e.preventDefault();
     *	},
     * });
     *
     * ee.defaults({
     *	doit: (e) => {
     *		console.log('default handler for ', e.type, e.selection);
     *	},
     * })
     *
     * ee.on('doit', (e) => {
     *	debugger;
     * })
     *
     * const ev = EvDoIt({ param: 10 });
     * ee.emit('change', ev);
     * if (ev.defaultPrevented) {
     *	console.log('prevented');
     * }
     * ```
     */
    class EventSource {
        m_source;
        m_eventRegistry;
        m_defaultHandlers;
        constructor(source = null) {
            this.m_source = source ?? this;
        }
        /**
         * emit an event
         * you can stop propagation of event or prevent default
         * @param eventName - name of event to emit
         * @param event - event data
         */
        emit(type, event) {
            this._emit(type, event);
        }
        _emit(eventName, e) {
            let listeners = this.m_eventRegistry?.get(eventName);
            const defaultHandler = this.m_defaultHandlers?.get(eventName);
            if (!e) {
                e = {};
            }
            if (!e.source) {
                e.source = this.m_source;
            }
            if (!e.type) {
                e.type = eventName;
            }
            if (listeners && listeners.length) {
                if (!e.preventDefault) {
                    e.preventDefault = preventDefault;
                }
                if (!e.stopPropagation) {
                    e.stopPropagation = stopPropagation;
                }
                // small optimisation
                if (listeners.length == 1) {
                    listeners[0](e);
                }
                else {
                    const temp = listeners.slice();
                    for (let i = 0, n = temp.length; i < n; i++) {
                        temp[i](e);
                        if (e.propagationStopped) {
                            break;
                        }
                    }
                }
            }
            if (defaultHandler && defaultHandler.length && !e.defaultPrevented) {
                return defaultHandler[0](e);
            }
        }
        /**
         * signal en event
         * signaled event are notification : no way to prevent default not stop propagation
         * @param eventName name of event to signal
         * @param event event data
         */
        signal(type, event, delay = -1) {
            this._signal(type, event, delay);
        }
        _signal(eventName, e, delay = -1) {
            if (!this.m_eventRegistry) {
                return;
            }
            const listeners = this.m_eventRegistry.get(eventName);
            if (!listeners || !listeners.length) {
                return;
            }
            if (!e) {
                e = {};
            }
            if (!e.type) {
                e.type = eventName;
            }
            if (!e.source) {
                e.source = this.m_source;
            }
            e.preventDefault = e.stopPropagation = () => {
                console.error('this event cannot be stopped not default prevented');
            };
            // small optimisation
            if (listeners.length == 1 && delay == -1) {
                listeners[0](e);
            }
            else {
                const temp = listeners.slice();
                const call = () => {
                    for (let i = 0, n = temp.length; i < n; i++) {
                        temp[i](e);
                    }
                };
                if (delay == -1) {
                    call();
                }
                else {
                    setTimeout(call, delay);
                }
            }
        }
        /**
         * handle an event one time
         * @param eventName - event name to handle
         * @param callback - callback to call when event is signaled
         * @returns Promise if callback is null
         *
         * take care with that because if the event is never fired and you await it,
         * the system may overflow
         */
        once(type, callback) {
            this._once(type, callback);
        }
        _once(eventName, callback) {
            const newCallback = (ev) => {
                this.off(eventName, newCallback);
                callback(ev);
            };
            this._on(eventName, newCallback);
            if (!callback) {
                return new Promise(function (resolve) {
                    callback = resolve;
                });
            }
        }
        /**
         * set the event default handler
         * @param eventName - name of the event
         * @param callback - callback to call when the event is not handled (and preventDeault has not been called)
         */
        setDefaultHandler(eventName, callback) {
            let handlers = this.m_defaultHandlers;
            if (!handlers) {
                handlers = this.m_defaultHandlers = new Map();
            }
            let stack = handlers.get(eventName);
            if (stack) {
                // if already in the stack, remove it
                const idx = stack.indexOf(callback);
                if (idx != -1) {
                    stack.splice(idx, 1);
                }
                // then make it first
                stack.unshift(callback);
            }
            else {
                handlers.set(eventName, [callback]);
            }
        }
        /**
         * remove the previous default handler installed for an event
         * @param eventName - event name
         * @param callback - callback handler to remove (must be the same as in setDefaultHandler)
         */
        removeDefaultHandler(eventName, callback) {
            const handlers = this.m_defaultHandlers;
            if (!handlers) {
                return;
            }
            const stack = handlers.get(eventName);
            if (stack) {
                const idx = stack.indexOf(callback);
                if (idx != -1) {
                    stack.splice(idx, 1);
                }
            }
        }
        /**
         * define a set of listeners in one call
         * @param events
         */
        listen(events) {
            for (let n in events) {
                this._on(n, events[n]);
            }
        }
        /**
         * define a set of default handlers in one call
         * @param events
         */
        defaults(events) {
            for (let n in events) {
                this.setDefaultHandler(n, events[n]);
            }
        }
        /**
         * listen for an event
         * @param eventName - event name to listen on
         * @param callback - callback to call
         * @param capturing - if true, capture event before other registred event handlers
         */
        on(type, callback) {
            return this._on(type, callback);
        }
        _on(eventName, callback, capturing = false) {
            if (!this.m_eventRegistry) {
                this.m_eventRegistry = new Map();
            }
            let listeners = this.m_eventRegistry.get(eventName);
            if (!listeners) {
                listeners = [];
                this.m_eventRegistry.set(eventName, listeners);
            }
            if (listeners.indexOf(callback) == -1) {
                if (capturing) {
                    listeners.unshift(callback);
                }
                else {
                    listeners.push(callback);
                }
            }
            return {
                dispose: () => { this.off(eventName, callback); }
            };
        }
        /**
         * stop listening to an event
         * @param eventName - event name
         * @param callback - callback to remove (must be the same as in on )
         */
        off(eventName, callback) {
            if (!this.m_eventRegistry) {
                return;
            }
            let listeners = this.m_eventRegistry.get(eventName);
            if (!listeners) {
                return;
            }
            const idx = listeners.indexOf(callback);
            if (idx !== -1) {
                listeners.splice(idx, 1);
            }
        }
        /**
         * remove all listeners for an event
         * @param eventName - event name
         */
        removeAllListeners(eventName) {
            if (!eventName) {
                this.m_eventRegistry = this.m_defaultHandlers = undefined;
            }
            else {
                if (this.m_eventRegistry) {
                    this.m_eventRegistry[eventName] = undefined;
                }
                if (this.m_defaultHandlers) {
                    this.m_defaultHandlers[eventName] = undefined;
                }
            }
        }
    }
    exports.EventSource = EventSource;
});
define("x4/base_component", ["require", "exports", "x4/x4_events"], function (require, exports, x4_events_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseComponent = void 0;
    /**
     * BaseComponent class
     */
    class BaseComponent extends x4_events_js_1.EventSource {
        m_props;
        m_timers;
        constructor(props) {
            super();
            //this.m_props = { ...props };
            this.m_props = props;
            if (props.events) {
                this.listen(props.events);
            }
        }
        /**
         * start a new timer
         * @param name timer name
         * @param timeout time out in ms
         * @param repeat if true this is an auto repeat timer
         * @param callback if !null, the callback to call else a EvTimer is fired
         */
        startTimer(name, timeout, repeat = true, callback = null) {
            if (!this.m_timers) {
                this.m_timers = new Map();
            }
            else {
                this.stopTimer(name);
            }
            const id = (repeat ? setInterval : setTimeout)((tm) => {
                const now = Date.now();
                if (callback) {
                    callback(name, now);
                }
                else {
                    this.emit('timer', (0, x4_events_js_1.EvTimer)(name, now));
                }
            }, timeout);
            this.m_timers.set(name, () => { (repeat ? clearInterval : clearTimeout)(id); });
        }
        /**
         * stop the given timer
         * @param name
         */
        stopTimer(name) {
            const clear = this.m_timers.get(name);
            if (clear) {
                clear();
            }
        }
        /**
         * stop all timers
         */
        disposeTimers() {
            this.m_timers?.forEach(v => v());
            this.m_timers = undefined;
        }
        /**
         *
         * @param callback
         * @param timeout
         */
        singleShot(callback, timeout = 0) {
            setTimeout(callback, timeout);
        }
    }
    exports.BaseComponent = BaseComponent;
});
/**
* @file i18n.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/i18n", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extendTranslation = exports.selectLanguage = exports.isLanguage = exports._tr = void 0;
    /**
     * language definition
     * x4 specific strings
     */
    let fr = {
        global: {
            ok: 'OK',
            cancel: 'Annuler',
            ignore: 'Ignorer',
            yes: 'Oui',
            no: 'Non',
            open: 'Ouvrir',
            new: 'Nouveau',
            delete: 'Supprimer',
            close: 'Fermer',
            save: 'Enregistrer',
            search: 'Rechercher',
            search_tip: 'Saisissez le texte à rechercher. <b>Enter</b> pour lancer la recherche. <b>Esc</b> pour annuler.',
            required_field: "information requise",
            invalid_format: "format invalide",
            invalid_email: 'adresse mail invalide',
            invalid_number: 'valeur numérique invalide',
            diff_date_seconds: '{0} seconds',
            diff_date_minutes: '{0} minutes',
            diff_date_hours: '{0} hours',
            invalid_date: 'Date non reconnue ({0})',
            empty_list: 'Liste vide',
            date_input_formats: 'd/m/y|d.m.y|d m y|d-m-y|dmy',
            date_format: 'D/M/Y',
            day_short: ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'],
            day_long: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
            month_short: ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jui', 'aoû', 'sep', 'oct', 'nov', 'déc'],
            month_long: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
            property: 'Propriété',
            value: 'Valeur',
            err_403: `Vous n'avez pas les droits suffisants pour effectuer cette action`,
            copy: 'Copier',
            cut: 'Couper',
            paste: 'Coller'
        }
    };
    /** @ignore */
    let en = {
        global: {
            ok: 'OK',
            cancel: 'Cancel',
            ignore: 'Ignore',
            yes: 'Yes',
            no: 'No',
            required_field: "required field",
            invalid_format: "invalid format",
            diff_date_seconds: '{0} seconds',
            diff_date_minutes: '{0} minutes',
            diff_date_hours: '{0} hours',
            invalid_date: 'Bad date format {0}',
            copy: 'Copy',
            cut: 'Cut',
            paste: 'Paste'
        }
    };
    /** @ignore */
    let all_langs = {
        'fr': fr,
        'en': _mk_proxy(_patch({}, en))
    };
    /**
     * current language
     * FR by default
     * @example ```typescript
     * console.log( _tr.global.ok );
     */
    exports._tr = all_langs['fr'];
    /**
     * check if the language is known
     * @param name - language name to test
     * @example ```typescript
     * if( isLanguage('fr') ) {
     * }
     */
    function isLanguage(name) {
        return all_langs[name] !== undefined;
    }
    exports.isLanguage = isLanguage;
    /**
     * select the current language
     * @param name - language name
     * @example ```typescript
     * selectLanguage( 'en' );
     */
    function selectLanguage(name) {
        if (!isLanguage(name)) {
            return;
        }
        exports._tr = all_langs[name];
    }
    exports.selectLanguage = selectLanguage;
    /**
     * define a translation
     * you can also patch 'global' elements witch are defined by x4
     * @param name - language name
     * @param definition - definition of the language
     * @example ```typescript
     * setTranslation( 'fr', {
     * 	this_is_an_example: 'ceci est un exemple',
     * 	this_is: {
     * 		another_example: 'ceci est un autre exemple'
     *  },
     *  global: {
     *    ok: 'O.K.'
     *  }
     * });
     * console.log( _tr.this_is_an_example ); // defined by the previous line
     * selectLanguage( 'en' );
     * console.log( _tr.this_is_an_example ); // 'en' do not define this, so we get 'fr' one
     *
     */
    function extendTranslation(name, definition) {
        if (!isLanguage(name)) {
            return;
        }
        _patch(all_langs[name], definition);
    }
    exports.extendTranslation = extendTranslation;
    function _patch(obj, by) {
        for (let n in by) {
            if (obj[n] instanceof Object) {
                _patch(obj[n], by[n]);
            }
            else {
                obj[n] = by[n];
                if (obj[n] instanceof Object) {
                    obj[n] = _mk_proxy(obj[n]);
                }
            }
        }
        return obj;
    }
    function _mk_proxy(obj) {
        return new Proxy(obj, {
            get: function (target, prop, receiver) {
                let value = target[prop];
                if (value === undefined) {
                    return fr[prop];
                }
                return value;
            }
        });
    }
});
/**
* @file tools.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/tools", ["require", "exports", "x4/i18n"], function (require, exports, i18n_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.classNames = exports.mix = exports.crc32 = exports.Clipboard = exports.isHtmlString = exports.html = exports.HtmlString = exports.clamp = exports.getMousePos = exports.NetworkError = exports.markdownToHtml = exports.asap = exports.deferCall = exports.waitFontLoading = exports.isNumber = exports.pad = exports.isLiteralObject = exports.isFunction = exports.isArray = exports.isString = exports.downloadData = exports.calcAge = exports.formatIntlDate = exports.parseIntlDate = exports.date_calc_weeknum = exports.date_clone = exports.date_hash = exports.date_sql_utc = exports.date_to_sql = exports.date_diff = exports.date_format = exports._date_set_locale = exports.removeHtmlTags = exports.escapeHtml = exports.sprintf = exports.Rect = exports.Size = exports.Point = exports.pascalCase = exports.parseIntlFloat = exports.roundTo = exports.isTouchDevice = void 0;
    // :: ENVIRONMENT ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    /**
     * @return true is the device has touch
     */
    function isTouchDevice() {
        return 'ontouchstart' in window;
    }
    exports.isTouchDevice = isTouchDevice;
    // :: NUMBERS ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    /**
     * round to a given number of decimals
     * @param num numbre to round
     * @param ndec number of decimals
     * @returns number rounded
     */
    function roundTo(num, ndec) {
        let mul = Math.pow(10, ndec);
        let res = Math.round(num * mul) / mul;
        if (res === -0.00) {
            res = 0;
        }
        return res;
    }
    exports.roundTo = roundTo;
    /**
     * parse an intl formatted number
     * understand grouping and ',' separator
     * @review us format: grouping = ','
     * @param num
     */
    function parseIntlFloat(num) {
        num = num.replace(/\s*/g, ''); // group separator
        num = num.replace(',', '.'); // decimal separator
        // accept empty & return 0.0
        if (num.length == 0) {
            return 0.0;
        }
        return parseFloat(num);
    }
    exports.parseIntlFloat = parseIntlFloat;
    // :: STRING MANIP ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    const RE_PCASE = /([a-z][A-Z])/g;
    const RE_PCASE2 = /[^-a-z0-9]+/g;
    /**
     * inverse of camel case
     * theThingToCase -> the-thing-to-case
     * @param {String} str
     */
    function pascalCase(string) {
        let result = string;
        result = result.replace(/([a-z])([A-Z])/g, "$1 $2");
        result = result.toLowerCase();
        result = result.replace(/[^- a-z0-9]+/g, ' ');
        if (result.indexOf(' ') < 0) {
            return result;
        }
        result = result.trim();
        return result.replace(/ /g, '-');
    }
    exports.pascalCase = pascalCase;
    class Point {
        x;
        y;
        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
        }
    }
    exports.Point = Point;
    class Size {
        width;
        height;
        constructor(w = 0, h = 0) {
            this.width = w;
            this.height = h;
        }
    }
    exports.Size = Size;
    class Rect {
        left;
        top;
        width;
        height;
        constructor(left, top, width, height) {
            if (left === undefined) {
                this.left = this.top = this.right = this.bottom = 0;
            }
            else if (left instanceof Rect || left instanceof DOMRect) {
                let rc = left;
                this.left = rc.left;
                this.top = rc.top;
                this.width = rc.width;
                this.height = rc.height;
            }
            else {
                this.left = left;
                this.top = top;
                this.width = width;
                this.height = height;
            }
        }
        set(left, top, width, height) {
            this.left = left;
            this.top = top;
            this.width = width;
            this.height = height;
        }
        get bottom() {
            return this.top + this.height;
        }
        set bottom(bottom) {
            this.height = bottom - this.top;
        }
        get right() {
            return this.left + this.width;
        }
        set right(right) {
            this.width = right - this.left;
        }
        get topLeft() {
            return new Point(this.left, this.top);
        }
        get bottomRight() {
            return new Point(this.right, this.bottom);
        }
        get size() {
            return new Size(this.width, this.height);
        }
        moveTo(left, top) {
            this.left = left;
            this.top = top;
            return this;
        }
        movedTo(left, top) {
            return new Rect(left, top, this.width, this.height);
        }
        moveBy(dx, dy) {
            this.left += dx;
            this.top += dy;
            return this;
        }
        movedBy(dx, dy) {
            return new Rect(this.left + dx, this.top + dy, this.width, this.height);
        }
        isEmpty() {
            return this.width == 0 && this.height == 0;
        }
        normalize() {
            let w = this.width, h = this.height;
            if (w < 0) {
                this.left += w;
                this.width = -w;
            }
            if (h < 0) {
                this.top += h;
                this.height = -h;
            }
            return this;
        }
        normalized() {
            let rc = new Rect(this);
            let w = rc.width, h = rc.height;
            if (w < 0) {
                rc.left += w;
                rc.width = -w;
            }
            if (h < 0) {
                rc.top += h;
                rc.height = -h;
            }
            return rc;
        }
        /**
         * @deprecated
         */
        containsPt(x, y) {
            return x >= this.left && x <= this.right && y >= this.top && y <= this.bottom;
        }
        contains(arg) {
            if (arg instanceof Rect) {
                return arg.left >= this.left && arg.right <= this.right && arg.top >= this.top && arg.bottom <= this.bottom;
            }
            else {
                return arg.x >= this.left && arg.x < this.right && arg.y >= this.top && arg.y < this.bottom;
            }
        }
        touches(rc) {
            if (this.left > rc.right || this.right < rc.left || this.top > rc.bottom || this.bottom < rc.top) {
                return false;
            }
            return true;
        }
        inflate(dx, dy) {
            if (dy === undefined) {
                dy = dx;
            }
            this.left -= dx;
            this.top -= dy;
            this.width += dx + dx;
            this.height += dy + dy;
        }
        inflatedBy(dx, dy) {
            if (dy === undefined) {
                dy = dx;
            }
            return new Rect(this.left - dx, this.top - dy, this.width + dx + dx, this.height + dy + dy);
        }
        combine(rc) {
            let left = Math.min(this.left, rc.left);
            let top = Math.min(this.top, rc.top);
            let right = Math.max(this.right, rc.right);
            let bottom = Math.max(this.bottom, rc.bottom);
            this.left = left;
            this.top = top;
            this.right = right;
            this.bottom = bottom;
        }
    }
    exports.Rect = Rect;
    /**
     * replace {0..9} by given arguments
     * @param format string
     * @param args
     *
     * @example ```ts
     *
     * console.log( sprintf( 'here is arg 1 {1} and arg 0 {0}', 'argument 0', 'argument 1' ) )
     */
    function sprintf(format, ...args) {
        return format.replace(/{(\d+)}/g, function (match, index) {
            return typeof args[index] != 'undefined' ? args[index] : match;
        });
    }
    exports.sprintf = sprintf;
    /**
     * replace special characters for display
     * @param unsafe
     *
     * console.log( escapeHtml('<div style="width:50px; height: 50px; background-color:red"></div>') );
     */
    function escapeHtml(unsafe, nl_br = false) {
        if (!unsafe || unsafe.length == 0) {
            return unsafe;
        }
        let result = unsafe.replace(/[<>\&\"\']/g, function (c) {
            return '&#' + c.charCodeAt(0) + ';';
        });
        if (nl_br) {
            result = result.replace(/(\r\n|\n\r|\r|\n)/g, '<br/>');
        }
        return result;
    }
    exports.escapeHtml = escapeHtml;
    /**
     * replace special characters for display
     * @author Steven Levithan <http://slevithan.com/>
     * @param unsafe
     *
     * console.log( removeHtmlTags('<h1>sss</h1>') );
     */
    function removeHtmlTags(unsafe, nl_br = false) {
        if (!unsafe || unsafe.length == 0) {
            return unsafe;
        }
        debugger;
        let ret_val = '';
        for (let i = 0; i < unsafe.length; i++) {
            const ch = unsafe.codePointAt(i);
            if (ch > 127) {
                ret_val += '&#' + ch + ';';
            }
            else if (ch == 60 /*<*/) {
                ret_val += '&lt;';
            }
            else {
                ret_val += unsafe.charAt(i);
            }
        }
        return ret_val;
    }
    exports.removeHtmlTags = removeHtmlTags;
    // :: DATES ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    let cur_locale = 'fr-FR';
    /**
     * change the current locale for misc translations (date...)
     * @param locale
     */
    function _date_set_locale(locale) {
        cur_locale = locale;
    }
    exports._date_set_locale = _date_set_locale;
    /**
     *
     * @param date
     * @param options
     * @example
     * let date = new Date( );
     * let options = { day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' };
     * let text = date_format( date, options );
     */
    function date_format(date, options) {
        //return new Intl.DateTimeFormat(cur_locale, options).format( date );
        return formatIntlDate(date);
    }
    exports.date_format = date_format;
    /**
     *
     * @param date
     * @param options
     */
    function date_diff(date1, date2, options) {
        var dt = (date1.getTime() - date2.getTime()) / 1000;
        // seconds
        let sec = dt;
        if (sec < 60) {
            return sprintf(i18n_js_1._tr.global.diff_date_seconds, Math.round(sec));
        }
        // minutes
        let min = Math.floor(sec / 60);
        if (min < 60) {
            return sprintf(i18n_js_1._tr.global.diff_date_minutes, Math.round(min));
        }
        // hours
        let hrs = Math.floor(min / 60);
        return sprintf(i18n_js_1._tr.global.diff_date_hours, hrs, min % 60);
    }
    exports.date_diff = date_diff;
    function date_to_sql(date, withHours) {
        if (withHours) {
            return formatIntlDate(date, 'Y-M-D H:I:S');
        }
        else {
            return formatIntlDate(date, 'Y-M-D');
        }
    }
    exports.date_to_sql = date_to_sql;
    /**
     * construct a date from an utc date time (sql format)
     * YYYY-MM-DD HH:MM:SS
     */
    function date_sql_utc(date) {
        let result = new Date(date + ' GMT');
        return result;
    }
    exports.date_sql_utc = date_sql_utc;
    /**
     * return a number that is a representation of the date
     * this number can be compared with another hash
     */
    function date_hash(date) {
        return date.getFullYear() << 16 | date.getMonth() << 8 | date.getDate();
    }
    exports.date_hash = date_hash;
    Date.prototype.hash = () => {
        return date_hash(this);
    };
    /**
     * return a copy of a date
     */
    function date_clone(date) {
        return new Date(date.getTime());
    }
    exports.date_clone = date_clone;
    /**
     * return the week number of a date
     */
    function date_calc_weeknum(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.valueOf() - firstDayOfYear.valueOf()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }
    exports.date_calc_weeknum = date_calc_weeknum;
    /**
     * parse a date according to the given format
     * @param value - string date to parse
     * @param fmts - format list - i18 tranlation by default
     * allowed format specifiers:
     * d or D: date (1 or 2 digits)
     * m or M: month (1 or 2 digits)
     * y or Y: year (2 or 4 digits)
     * h or H: hours (1 or 2 digits)
     * i or I: minutes (1 or 2 digits)
     * s or S: seconds (1 or 2 digits)
     * <space>: 1 or more spaces
     * any other char: <0 or more spaces><the char><0 or more spaces>
     * each specifiers is separated from other by a pipe (|)
     * more specific at first
     * @example
     * 'd/m/y|d m Y|dmy|y-m-d h:i:s|y-m-d'
     */
    function parseIntlDate(value, fmts = i18n_js_1._tr.global.date_input_formats) {
        let formats = fmts.split('|');
        for (let fmatch of formats) {
            //review: could do that only once & keep result
            //review: add hours, minutes, seconds
            let smatch = '';
            for (let c of fmatch) {
                if (c == 'd' || c == 'D') {
                    smatch += '(?<day>\\d{1,2})';
                }
                else if (c == 'm' || c == 'M') {
                    smatch += '(?<month>\\d{1,2})';
                }
                else if (c == 'y' || c == 'Y') {
                    smatch += '(?<year>\\d{1,4})';
                }
                else if (c == 'h' || c == 'H') {
                    smatch += '(?<hour>\\d{1,2})';
                }
                else if (c == 'i' || c == 'I') {
                    smatch += '(?<min>\\d{1,2})';
                }
                else if (c == 's' || c == 'S') {
                    smatch += '(?<sec>\\d{1,2})';
                }
                else if (c == ' ') {
                    smatch += '\\s+';
                }
                else {
                    smatch += '\\s*\\' + c + '\\s*';
                }
            }
            let rematch = new RegExp('^' + smatch + '$', 'm');
            let match = rematch.exec(value);
            if (match) {
                let d = parseInt(match.groups.day ?? '1');
                let m = parseInt(match.groups.month ?? '1');
                let y = parseInt(match.groups.year ?? '1970');
                let h = parseInt(match.groups.hour ?? '0');
                let i = parseInt(match.groups.min ?? '0');
                let s = parseInt(match.groups.sec ?? '0');
                if (y > 0 && y < 100) {
                    y += 2000;
                }
                let result = new Date(y, m - 1, d, h, i, s, 0);
                // we test the vdate validity (without adjustments)
                // without this test, date ( 0, 0, 0) is accepted and transformed to 1969/11/31 (not fun)
                let ty = result.getFullYear(), tm = result.getMonth() + 1, td = result.getDate();
                if (ty != y || tm != m || td != d) {
                    //debugger;
                    return null;
                }
                return result;
            }
        }
        return null;
    }
    exports.parseIntlDate = parseIntlDate;
    /**
     * format a date as string
     * @param date - date to format
     * @param fmt - format
     * format specifiers:
     * d: date
     * D: 2 digits date padded with 0
     * j: day of week short mode 'mon'
     * J: day of week long mode 'monday'
     * w: week number
     * m: month
     * M: 2 digits month padded with 0
     * o: month short mode 'jan'
     * O: month long mode 'january'
     * y or Y: year
     * h: hour (24 format)
     * H: 2 digits hour (24 format) padded with 0
     * i: minutes
     * I: 2 digits minutes padded with 0
     * s: seconds
     * S: 2 digits seconds padded with 0
     * a: am or pm
     * anything else is inserted
     * if you need to insert some text, put it between {}
     *
     * @example
     *
     * 01/01/1970 11:25:00 with '{this is my demo date formatter: }H-i*M'
     * "this is my demo date formatter: 11-25*january"
     */
    function formatIntlDate(date, fmt = i18n_js_1._tr.global.date_format) {
        if (!date) {
            return '';
        }
        let result = '';
        let esc = 0;
        for (let c of fmt) {
            if (c == '{') {
                if (++esc == 1) {
                    continue;
                }
            }
            else if (c == '}') {
                if (--esc == 0) {
                    continue;
                }
            }
            if (esc) {
                result += c;
                continue;
            }
            if (c == 'd') {
                result += date.getDate();
            }
            else if (c == 'D') {
                result += pad(date.getDate(), -2);
            }
            else if (c == 'j') { // day short
                let d = date.getDay();
                result += i18n_js_1._tr.global.day_short[d];
            }
            else if (c == 'J') { // day long
                let d = date.getDay();
                result += i18n_js_1._tr.global.day_long[d];
            }
            else if (c == 'w') { // week
                result += date_calc_weeknum(date);
            }
            else if (c == 'W') { // week
                result += pad(date_calc_weeknum(date), -2);
            }
            else if (c == 'm') {
                result += date.getMonth() + 1;
            }
            else if (c == 'M') {
                result += pad(date.getMonth() + 1, -2);
            }
            else if (c == 'o') { // month short
                let m = date.getMonth();
                result += i18n_js_1._tr.global.month_short[m];
            }
            else if (c == 'O') { // month long
                let m = date.getMonth();
                result += i18n_js_1._tr.global.month_long[m];
            }
            else if (c == 'y' || c == 'Y') {
                result += pad(date.getFullYear(), -4);
            }
            else if (c == 'a' || c == 'A') {
                result += date.getHours() < 12 ? 'am' : 'pm';
            }
            else if (c == 'h') {
                result += date.getHours();
            }
            else if (c == 'H') {
                result += pad(date.getHours(), -2);
            }
            else if (c == 'i') {
                result += date.getMinutes();
            }
            else if (c == 'I') {
                result += pad(date.getMinutes(), -2);
            }
            else if (c == 's') {
                result += date.getSeconds();
            }
            else if (c == 'S') {
                result += pad(date.getSeconds(), -2);
            }
            else {
                result += c;
            }
        }
        return result;
    }
    exports.formatIntlDate = formatIntlDate;
    function calcAge(birth, ref) {
        if (ref === undefined) {
            ref = new Date();
        }
        if (!birth) {
            return 0;
        }
        let age = ref.getFullYear() - birth.getFullYear();
        if (ref.getMonth() < birth.getMonth() || (ref.getMonth() == birth.getMonth() && ref.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }
    exports.calcAge = calcAge;
    Date.prototype.isSameDay = function (date) {
        return this.getDate() == date.getDate() && this.getMonth() == date.getMonth() && this.getFullYear() == date.getFullYear();
    };
    Date.prototype.hash = function () {
        return date_hash(this);
    };
    Date.prototype.clone = function () {
        return date_clone(this);
    };
    Date.prototype.weekNum = function () {
        return date_calc_weeknum(this);
    };
    Date.prototype.format = function (fmt) {
        return formatIntlDate(this, fmt);
    };
    // :: FILE CREATION ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    /**
     *
     * @param data data to export
     * @param mimetype - 'text/plain'
     */
    function downloadData(data, mimetype, filename) {
        //if (data !== null && navigator.msSaveBlob) {
        //	return navigator.msSaveBlob(new Blob([data], { type: mimetype }), filename);
        //}
        let blob = new Blob([data], { type: mimetype });
        let url = window.URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.style['display'] = "none";
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    }
    exports.downloadData = downloadData;
    // :: MISC ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    /**
     * check if a value is a string
     * @param val
     */
    function isString(val) {
        return typeof val === 'string';
    }
    exports.isString = isString;
    /**
     * check is a value is an array
     * @param val
     */
    function isArray(val) {
        return val instanceof Array;
    }
    exports.isArray = isArray;
    /**
     *
     */
    function isFunction(val) {
        return val instanceof Function;
    }
    exports.isFunction = isFunction;
    /**
     *
     */
    function isLiteralObject(val) {
        return (!!val) && (val.constructor === Object);
    }
    exports.isLiteralObject = isLiteralObject;
    ;
    /**
     * prepend 0 to a value to a given length
     * @param value
     * @param length
     */
    function pad(what, size, ch = '0') {
        let padding;
        let value;
        if (!isString(what)) {
            value = '' + what;
        }
        else {
            value = what;
        }
        if (size > 0) {
            padding = ch.repeat(size);
            value = value + padding;
            return value.substr(0, size);
        }
        else {
            padding = ch.repeat(-size);
            value = padding + value;
            return value.substr(size);
        }
    }
    exports.pad = pad;
    /**
     * return true if val is a finite number
     */
    function isNumber(val) {
        return typeof val === 'number' && isFinite(val);
    }
    exports.isNumber = isNumber;
    /**
     *
     * @param name
     */
    function waitFontLoading(name) {
        // tip for waiting font loading:
        // by default, body is created invisible ((opacity = 0)
        // we create a div inside with the font we need to wait the loading
        // as soon as the font is loaded, it's size will change, the browser end font loading
        // we can remove the div.
        // pitfall: if the font is already loaded, ne never end.
        // @review that
        let ct = document.createElement('div');
        ct.style.position = 'absolute';
        ct.style.fontFamily = name;
        ct.style.fontSize = '44px';
        ct.style.opacity = '0.001';
        ct.innerText = 'X';
        document.body.appendChild(ct);
        return new Promise((resolve) => {
            let irc = ct.getBoundingClientRect();
            let tm = setInterval(() => {
                let nrc = ct.getBoundingClientRect();
                if (nrc.height != irc.height) {
                    clearInterval(tm);
                    document.body.removeChild(ct);
                    resolve();
                }
            }, 0);
        });
    }
    exports.waitFontLoading = waitFontLoading;
    /**
     *
     * @param fn
     * @param tm
     *
     * @example:
     *
     * defer( ( ) => {
     * 	console.log( x );
     * } )(  );
     */
    function deferCall(fn, tm = 0, ...args) {
        setTimeout(fn, tm, ...args);
    }
    exports.deferCall = deferCall;
    /**
     *
     */
    function asap(cb) {
        requestAnimationFrame(cb);
    }
    exports.asap = asap;
    /**
     * micro md to html
     *
     * understand:
     * 	**bold**
     * 	*italic*
     *
     *  > quote
     *  - list
     *  # title lvl 1
     *  ## title lvl 2
     *  ### title lvl 3 ...
     *
     */
    function markdownToHtml(text) {
        if (!text) {
            return '';
        }
        let lines = text.split('\n');
        let state = 'para';
        let div = 'p';
        let result = [];
        lines.forEach((l) => {
            let txt = l.trim();
            if (state == 'para') {
                // entree en mode list
                if (txt[0] == '-') {
                    txt = txt.substr(1);
                    result.push('<ul>');
                    state = 'list';
                    div = 'li';
                }
                else if (txt[0] == '>') {
                    txt = txt.substr(1);
                    result.push('<blockquote>');
                    state = 'quote';
                    div = 'p';
                }
                else if (txt[0] == '#') {
                    let lvl = 0;
                    do {
                        txt = txt.substr(1);
                        lvl++;
                    } while (txt[0] == '#' && lvl < 5);
                    div = 'h' + lvl;
                    state = 'title';
                }
            }
            else if (state == 'list') {
                // sortie du mode list
                if (txt[0] != '-') {
                    result.push('</ul>');
                    state = 'para';
                    div = 'p';
                }
                else {
                    txt = txt.substr(1);
                }
            }
            else if (state == 'quote') {
                // sortie du mode blockquote
                if (txt[0] != '>') {
                    result.push('</blockquote>');
                    state = 'para';
                    div = 'p';
                }
                else {
                    txt = txt.substr(1);
                }
            }
            let reBold = /\*\*([^*]+)\*\*/gi;
            txt = escapeHtml(txt, false);
            txt = txt.replace(reBold, (sub, ...a) => {
                return '<b>' + sub.substr(2, sub.length - 4) + '</b>';
            });
            let reItalic = /\*([^*]+)\*/gi;
            txt = txt.replace(reItalic, (sub, ...a) => {
                return '<i>' + sub.substr(1, sub.length - 2) + '</i>';
            });
            // keep empty lines
            if (txt == '') {
                txt = '&nbsp;';
            }
            result.push(`<${div}>` + txt + `</${div}>`);
            if (state == 'title') {
                state = 'para';
                div = 'p';
            }
        });
        if (state == 'list') {
            result.push('</ul>');
        }
        else if (state == 'quote') {
            result.push('</blockquote>');
        }
        return result.join('');
    }
    exports.markdownToHtml = markdownToHtml;
    /**
     *
     */
    class NetworkError extends Error {
        m_code;
        constructor(a, b) {
            if (a instanceof Response) {
                super(a.statusText);
                this.m_code = a.status;
            }
            else {
                super(b);
                this.m_code = a;
            }
        }
        get code() {
            return this.m_code;
        }
    }
    exports.NetworkError = NetworkError;
    /**
     * return the mouse pos in client coordinates
     * handle correctly touch & mouse
     */
    function getMousePos(ev, fromDoc) {
        let x_name = 'offsetX', y_name = 'offsetY';
        if (fromDoc) {
            x_name = 'clientX';
            y_name = 'clientY';
        }
        if (ev.type == 'mousemove' || ev.type == 'mousedown' || ev.type == 'mouseup') {
            let em = ev;
            return new Point(em[x_name], em[y_name]);
        }
        else if (ev.type == 'pointermove' || ev.type == 'pointerdown' || ev.type == 'pointerup') {
            let em = ev;
            return new Point(em[x_name], em[y_name]);
        }
        else if (ev.type == 'touchmove' || ev.type == 'touchstart') {
            let et = ev;
            return new Point(et.touches[0][x_name], et.touches[0][y_name]);
        }
        else if (ev.type == 'contextmenu') {
            let em = ev;
            return new Point(em[x_name], em[y_name]);
        }
        else {
            return new Point(0, 0);
        }
    }
    exports.getMousePos = getMousePos;
    /**
     * clamp a value
     * @param v - value to clamp
     * @param min - min value
     * @param max - max value
     * @returns clamped value
     */
    function clamp(v, min, max) {
        return Math.min(Math.max(v, min), max);
    }
    exports.clamp = clamp;
    // :: HTML strings ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    class HtmlString extends String {
        constructor(text) { super(text); }
        static from(text) {
            return new HtmlString(text);
        }
    }
    exports.HtmlString = HtmlString;
    function html(a, ...b) {
        return HtmlString.from(String.raw(a, ...b));
    }
    exports.html = html;
    function isHtmlString(val) {
        return val instanceof HtmlString;
    }
    exports.isHtmlString = isHtmlString;
    // :: CLIPBOARD ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    class Clipboard {
        static copy(data) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(JSON.stringify(data));
            }
        }
        static paste(cb) {
            if (navigator.clipboard) {
                navigator.clipboard.readText().then(v => cb(v));
            }
            else {
                console.error('no clipboard, are you in https ?');
            }
        }
    }
    exports.Clipboard = Clipboard;
    // :: CRC32 ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    /**
     * Calculates the CRC32 checksum of a string.
     * taken from: https://gist.github.com/wqli78/1330293/6d85cc967f32cccfcbad94ae7d088a3dcfc14bd9
     *
     * @param {String} str
     * @param {Boolean} hex
     * @return {String} checksum
     * @api public
     */
    function crc32(str) {
        let crc = ~0;
        for (let i = 0, l = str.length; i < l; i++) {
            crc = (crc >>> 8) ^ crc32tab[(crc ^ str.charCodeAt(i)) & 0xff];
        }
        return Math.abs(crc ^ -1);
    }
    exports.crc32 = crc32;
    var crc32tab = [
        0x00000000, 0x77073096, 0xee0e612c, 0x990951ba,
        0x076dc419, 0x706af48f, 0xe963a535, 0x9e6495a3,
        0x0edb8832, 0x79dcb8a4, 0xe0d5e91e, 0x97d2d988,
        0x09b64c2b, 0x7eb17cbd, 0xe7b82d07, 0x90bf1d91,
        0x1db71064, 0x6ab020f2, 0xf3b97148, 0x84be41de,
        0x1adad47d, 0x6ddde4eb, 0xf4d4b551, 0x83d385c7,
        0x136c9856, 0x646ba8c0, 0xfd62f97a, 0x8a65c9ec,
        0x14015c4f, 0x63066cd9, 0xfa0f3d63, 0x8d080df5,
        0x3b6e20c8, 0x4c69105e, 0xd56041e4, 0xa2677172,
        0x3c03e4d1, 0x4b04d447, 0xd20d85fd, 0xa50ab56b,
        0x35b5a8fa, 0x42b2986c, 0xdbbbc9d6, 0xacbcf940,
        0x32d86ce3, 0x45df5c75, 0xdcd60dcf, 0xabd13d59,
        0x26d930ac, 0x51de003a, 0xc8d75180, 0xbfd06116,
        0x21b4f4b5, 0x56b3c423, 0xcfba9599, 0xb8bda50f,
        0x2802b89e, 0x5f058808, 0xc60cd9b2, 0xb10be924,
        0x2f6f7c87, 0x58684c11, 0xc1611dab, 0xb6662d3d,
        0x76dc4190, 0x01db7106, 0x98d220bc, 0xefd5102a,
        0x71b18589, 0x06b6b51f, 0x9fbfe4a5, 0xe8b8d433,
        0x7807c9a2, 0x0f00f934, 0x9609a88e, 0xe10e9818,
        0x7f6a0dbb, 0x086d3d2d, 0x91646c97, 0xe6635c01,
        0x6b6b51f4, 0x1c6c6162, 0x856530d8, 0xf262004e,
        0x6c0695ed, 0x1b01a57b, 0x8208f4c1, 0xf50fc457,
        0x65b0d9c6, 0x12b7e950, 0x8bbeb8ea, 0xfcb9887c,
        0x62dd1ddf, 0x15da2d49, 0x8cd37cf3, 0xfbd44c65,
        0x4db26158, 0x3ab551ce, 0xa3bc0074, 0xd4bb30e2,
        0x4adfa541, 0x3dd895d7, 0xa4d1c46d, 0xd3d6f4fb,
        0x4369e96a, 0x346ed9fc, 0xad678846, 0xda60b8d0,
        0x44042d73, 0x33031de5, 0xaa0a4c5f, 0xdd0d7cc9,
        0x5005713c, 0x270241aa, 0xbe0b1010, 0xc90c2086,
        0x5768b525, 0x206f85b3, 0xb966d409, 0xce61e49f,
        0x5edef90e, 0x29d9c998, 0xb0d09822, 0xc7d7a8b4,
        0x59b33d17, 0x2eb40d81, 0xb7bd5c3b, 0xc0ba6cad,
        0xedb88320, 0x9abfb3b6, 0x03b6e20c, 0x74b1d29a,
        0xead54739, 0x9dd277af, 0x04db2615, 0x73dc1683,
        0xe3630b12, 0x94643b84, 0x0d6d6a3e, 0x7a6a5aa8,
        0xe40ecf0b, 0x9309ff9d, 0x0a00ae27, 0x7d079eb1,
        0xf00f9344, 0x8708a3d2, 0x1e01f268, 0x6906c2fe,
        0xf762575d, 0x806567cb, 0x196c3671, 0x6e6b06e7,
        0xfed41b76, 0x89d32be0, 0x10da7a5a, 0x67dd4acc,
        0xf9b9df6f, 0x8ebeeff9, 0x17b7be43, 0x60b08ed5,
        0xd6d6a3e8, 0xa1d1937e, 0x38d8c2c4, 0x4fdff252,
        0xd1bb67f1, 0xa6bc5767, 0x3fb506dd, 0x48b2364b,
        0xd80d2bda, 0xaf0a1b4c, 0x36034af6, 0x41047a60,
        0xdf60efc3, 0xa867df55, 0x316e8eef, 0x4669be79,
        0xcb61b38c, 0xbc66831a, 0x256fd2a0, 0x5268e236,
        0xcc0c7795, 0xbb0b4703, 0x220216b9, 0x5505262f,
        0xc5ba3bbe, 0xb2bd0b28, 0x2bb45a92, 0x5cb36a04,
        0xc2d7ffa7, 0xb5d0cf31, 0x2cd99e8b, 0x5bdeae1d,
        0x9b64c2b0, 0xec63f226, 0x756aa39c, 0x026d930a,
        0x9c0906a9, 0xeb0e363f, 0x72076785, 0x05005713,
        0x95bf4a82, 0xe2b87a14, 0x7bb12bae, 0x0cb61b38,
        0x92d28e9b, 0xe5d5be0d, 0x7cdcefb7, 0x0bdbdf21,
        0x86d3d2d4, 0xf1d4e242, 0x68ddb3f8, 0x1fda836e,
        0x81be16cd, 0xf6b9265b, 0x6fb077e1, 0x18b74777,
        0x88085ae6, 0xff0f6a70, 0x66063bca, 0x11010b5c,
        0x8f659eff, 0xf862ae69, 0x616bffd3, 0x166ccf45,
        0xa00ae278, 0xd70dd2ee, 0x4e048354, 0x3903b3c2,
        0xa7672661, 0xd06016f7, 0x4969474d, 0x3e6e77db,
        0xaed16a4a, 0xd9d65adc, 0x40df0b66, 0x37d83bf0,
        0xa9bcae53, 0xdebb9ec5, 0x47b2cf7f, 0x30b5ffe9,
        0xbdbdf21c, 0xcabac28a, 0x53b39330, 0x24b4a3a6,
        0xbad03605, 0xcdd70693, 0x54de5729, 0x23d967bf,
        0xb3667a2e, 0xc4614ab8, 0x5d681b02, 0x2a6f2b94,
        0xb40bbe37, 0xc30c8ea1, 0x5a05df1b, 0x2d02ef8d
    ];
    // :: MIXINS ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    /**
     * taken from this excellent article:
     *	https://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/
     *
     * @example:
     *	class MyClass extends mix(MyBaseClass).with(Mixin1, Mixin2) {
     *  }
     **/
    const mix = (superclass) => new MixinBuilder(superclass);
    exports.mix = mix;
    class MixinBuilder {
        superclass;
        constructor(superclass) {
            this.superclass = superclass;
        }
        with(...mixins) {
            return mixins.reduce((c, mixin) => mixin(c), this.superclass);
        }
    }
    /**
     * @example
     *
     * ```
     * 	const cls = classNames( 'class1 class2', {
     * 		'class3': false,
     * 		'class4': true,
     *  });
     *
     *  // even shorter
     *  const class1 = true, class2 = false;
     *  const cls = classNames( { class1, class2 } );  // cls = "class1"
     *
     * ```
     *
     * @returns
     */
    function classNames(...args) {
        let result = '';
        for (const cls of args) {
            if (typeof cls === 'string') {
                result += ' ' + cls;
            }
            else if (cls) {
                for (const c in cls) {
                    if (cls[c])
                        result += ' ' + c;
                }
            }
        }
        return result;
    }
    exports.classNames = classNames;
});
/**
* @file styles.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/styles", ["require", "exports", "x4/tools"], function (require, exports, tools_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ComputedStyle = exports.CSSParser = exports.Stylesheet = void 0;
    /**
     *  -- [ @STYLESHEET ] -----------------------------------------------------------------
     */
    class Stylesheet {
        m_sheet;
        m_rules = new Map();
        constructor() {
            function getStyleSheet(name) {
                for (let i = 0; i < document.styleSheets.length; i++) {
                    let sheet = document.styleSheets[i];
                    if (sheet.title === name) {
                        return sheet;
                    }
                }
            }
            this.m_sheet = getStyleSheet('@dynamic-css');
            if (!this.m_sheet) {
                let dom = document.createElement('style');
                dom.setAttribute('id', '@dynamic-css');
                document.head.appendChild(dom);
                this.m_sheet = dom.sheet;
            }
        }
        /**
         * add a new rule to the style sheet
         * @param {string} name - internal rule name
         * @param {string} definition - css definition of the rule
         * @example
         * setRule('xbody', "body { background-color: #ff0000; }" );
         */
        setRule(name, definition) {
            if ((0, tools_js_1.isString)(definition)) {
                let index = this.m_rules.get(name);
                if (index !== undefined) {
                    this.m_sheet.deleteRule(index);
                }
                else {
                    index = this.m_sheet.cssRules.length;
                }
                this.m_rules.set(name, this.m_sheet.insertRule(definition, index));
            }
            else {
                let idx = 1;
                for (let r in definition) {
                    let rule = r + " { ", css = definition[r];
                    for (let i in css) {
                        let values = css[i]; // this is an array !
                        for (let j = 0; j < values.length; j++) {
                            rule += i + ": " + values[j] + "; ";
                        }
                    }
                    rule += '}';
                    console.log(rule);
                    this.setRule(name + '--' + idx, rule);
                    idx++;
                }
            }
        }
        /**
         * return the style variable value
         * @param name - variable name without '--'
         * @example
         * ```
         * let color = Component.getCss( ).getVar( 'button-color' );
         * ```
         */
        static getVar(name) {
            if (!Stylesheet.doc_style) {
                Stylesheet.doc_style = getComputedStyle(document.documentElement);
            }
            return Stylesheet.doc_style.getPropertyValue('--' + name); // #999999
        }
        static guid = 1;
        static doc_style;
    }
    exports.Stylesheet = Stylesheet;
    /**
     *  -- [ @CSSPARSER ] -----------------------------------------------------------------
     *
     * adaptation of jss-for-node-js
     */
    class CSSParser {
        result = {};
        parse(css) {
            this.result = {};
            this.parse_json('', css);
            return CSSParser.mk_string(this.result);
        }
        static mk_string(rules) {
            // output result:	
            let ret = '';
            for (let a in rules) {
                let css = rules[a];
                ret += a + " { ";
                for (let i in css) {
                    let values = css[i]; // this is an array !
                    for (let j = 0; j < values.length; j++) {
                        ret += i + ": " + values[j] + "; ";
                    }
                }
                ret += "}\n";
            }
            return ret;
        }
        parse_json(scope, css) {
            if (scope && !this.result[scope]) {
                this.result[scope] = {};
            }
            for (let property in css) {
                let value = css[property];
                if ((0, tools_js_1.isArray)(value)) {
                    let values = value;
                    for (let i = 0; i < values.length; i++) {
                        this.addProperty(scope, property, values[i]);
                    }
                }
                /*else if (value instanceof Color) {
                    this.addProperty(scope, property, value.toString());
                }*/
                else {
                    switch (typeof (value)) {
                        case "number": {
                            this.addProperty(scope, property, value);
                            break;
                        }
                        case "string": {
                            this.addProperty(scope, property, value);
                            break;
                        }
                        case "object": {
                            this.parse_json(this.makeSelectorName(scope, property), value);
                            break;
                        }
                        default: {
                            console.error("ignoring unknown type " + typeof (value) + " in property " + property);
                            break;
                        }
                    }
                }
            }
        }
        makePropertyName(n) {
            return (0, tools_js_1.pascalCase)(n);
        }
        makeSelectorName(scope, name) {
            let snames = [];
            let names = name.split(/\s*,\s*/);
            let scopes = scope.split(/\s*,\s*/);
            for (let s = 0; s < scopes.length; s++) {
                let scope = scopes[s];
                for (let i = 0; i < names.length; i++) {
                    let name = names[i], sub = false;
                    if (name.charAt(0) == "&") {
                        name = name.substr(1);
                        sub = true;
                    }
                    if (name.charAt(0) === '%') {
                        name = '.o-' + name.substr(1);
                    }
                    if (sub) {
                        snames.push(scope + name);
                    }
                    else {
                        snames.push(scope ? scope + " " + name : name);
                    }
                }
            }
            return snames.join(", ");
        }
        addProperty(scope, property, value) {
            let properties = property.split(/\s*,\s*/);
            for (let i = 0; i < properties.length; i++) {
                let property = this.makePropertyName(properties[i]);
                if (this.result[scope][property]) {
                    this.result[scope][property].push(value);
                }
                else {
                    this.result[scope][property] = [value];
                }
                let specials = {
                    "box-shadow": [
                        "-moz-box-shadow",
                        "-webkit-box-shadow"
                    ],
                    "border-radius": [
                        "-moz-border-radius",
                        "-webkit-border-radius"
                    ],
                    "border-radius-topleft": [
                        "-moz-border-radius-topleft",
                        "-webkit-border-top-left-radius"
                    ],
                    "border-radius-topright": [
                        "-moz-border-radius-topright",
                        "-webkit-border-top-right-radius"
                    ],
                    "border-radius-bottomleft": [
                        "-moz-border-radius-bottomleft",
                        "-webkit-border-bottom-left-radius"
                    ],
                    "border-radius-bottomright": [
                        "-moz-border-radius-bottomright",
                        "-webkit-border-bottom-right-radius"
                    ]
                };
                let browser_specials = specials[property];
                for (let j = 0; browser_specials && j < browser_specials.length; j++) {
                    this.addProperty(scope, browser_specials[j], value);
                }
            }
        }
    }
    exports.CSSParser = CSSParser;
    class ComputedStyle {
        m_style;
        constructor(style) {
            this.m_style = style;
        }
        /**
         * return the raw value
         */
        value(name) {
            name = (0, tools_js_1.pascalCase)(name);
            return this.m_style[name];
        }
        /**
         * return the interpreted value
         */
        parse(name) {
            name = (0, tools_js_1.pascalCase)(name);
            return parseInt(this.m_style[name]);
        }
    }
    exports.ComputedStyle = ComputedStyle;
});
define("x4/dom_events", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
/**
 * @file components.ts
 * @author Etienne Cochard
 * @license
 * Copyright (c) 2019-2021 R-libre ingenierie
 *
 *	This program is free software; you can redistribute it and/or modify
 *	it under the terms of the GNU General Public License as published by
 *	the Free Software Foundation; either version 3 of the License, or
 *	(at your option) any later version.
 *
 *	This program is distributed in the hope that it will be useful,
 *	but WITHOUT ANY WARRANTY; without even the implied warranty of
 *	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *	GNU General Public License for more details.
 *
 *	You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>..
 */
define("x4/component", ["require", "exports", "x4/tools", "x4/styles", "x4/x4_events", "x4/base_component", "x4/tools"], function (require, exports, tools_js_2, styles_js_1, x4_events_js_2, base_component_js_1, tools_js_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Container = exports.SizerOverlay = exports.EvOverlayResize = exports.Separator = exports.EvSize = exports.Space = exports.Flex = exports.flyWrap = exports.Component = exports.EvFocus = exports.EvDblClick = exports.html = exports.isHtmlString = exports.HtmlString = void 0;
    Object.defineProperty(exports, "HtmlString", { enumerable: true, get: function () { return tools_js_3.HtmlString; } });
    Object.defineProperty(exports, "isHtmlString", { enumerable: true, get: function () { return tools_js_3.isHtmlString; } });
    Object.defineProperty(exports, "html", { enumerable: true, get: function () { return tools_js_3.html; } });
    /** @ignore classname prefix for system classes */
    const _x4_ns_prefix = 'x-';
    // -- elements -----------
    /** @ignore where event handlers are stored */
    const _x4_el_store = Symbol();
    /** @ignore where Component is stored in dom */
    const _x4_el_sym = Symbol();
    /** @ignore properties without 'px' unit */
    const _x4_unitless = {
        animationIterationCount: 1, borderImageOutset: 1, borderImageSlice: 1, borderImageWidth: 1, boxFlex: 1, boxFlexGroup: 1,
        boxOrdinalGroup: 1, columnCount: 1, flex: 1, flexGrow: 1, flexPositive: 1, flexShrink: 1, flexNegative: 1, flexOrder: 1,
        gridRow: 1, gridColumn: 1, fontWeight: 1, lineClamp: 1, lineHeight: 1, opacity: 1, order: 1, orphans: 1, tabSize: 1, widows: 1,
        zIndex: 1, zoom: 1,
        // SVG-related _properties
        fillOpacity: 1, floodOpacity: 1, stopOpacity: 1, strokeDasharray: 1, strokeDashoffset: 1, strokeMiterlimit: 1, strokeOpacity: 1,
        strokeWidth: 1,
    };
    /** @ignore this events must be defined on domNode (do not bubble) */
    const unbubbleEvents = {
        mouseleave: 1, mouseenter: 1, load: 1, unload: 1, scroll: 1, focus: 1, blur: 1, rowexit: 1, beforeunload: 1, stop: 1,
        dragdrop: 1, dragenter: 1, dragexit: 1, draggesture: 1, dragover: 1, contextmenu: 1, create: 2, sizechange: 2
    };
    /** @ignore */
    const passiveEvents = {
        touchstart: 1, touchmove: 1, touchend: 1,
        //pointerdown: 1, pointermove: 1, pointerup: 1,
    };
    /** ignore */
    const reNumber = /^-?\d+(\.\d+)?$/;
    function EvDblClick(context = null) {
        return (0, x4_events_js_2.BasicEvent)({ context });
    }
    exports.EvDblClick = EvDblClick;
    function EvFocus(focus = true, context = null) {
        return (0, x4_events_js_2.BasicEvent)({ focus, context });
    }
    exports.EvFocus = EvFocus;
    /**
     *
     */
    class Component extends base_component_js_1.BaseComponent {
        m_dom;
        m_iprops;
        static __sb_width; // scrollbar width
        static __comp_guid = 1000; // component global unique id
        static __privateEvents = {};
        static __sizeObserver; // resize observer
        static __createObserver; // creation observer
        static __intersectionObserver; // visibility observer
        static __capture = null;
        static __capture_mask = null;
        static __css = null;
        constructor(props = null) {
            super(props ?? {});
            this.m_iprops = {
                classes: {},
                dom_events: {},
                uid: Component.__comp_guid++,
            };
        }
        /**
         *
         */
        get uid() {
            return this.m_iprops.uid;
        }
        /**
         * change the component content
         * @param content new content or null
         */
        setContent(content, refreshAll = true) {
            this.m_props.content = content ?? [];
            if (refreshAll) {
                this.update();
            }
            else {
                this._updateContent();
            }
        }
        /**
         * add a new child to the component content
         * @param content
         */
        appendChild(content) {
            if (!content) {
                return;
            }
            const append = (c) => {
                if (!this.m_props.content) {
                    this.m_props.content = [];
                }
                else if (!(0, tools_js_2.isArray)(this.m_props.content)) {
                    this.m_props.content = [this.m_props.content];
                }
                this.m_props.content.push(c);
                if (this.m_dom) {
                    this._appendChild(c);
                }
            };
            if ((0, tools_js_2.isArray)(content)) {
                content.forEach(append);
            }
            else {
                append(content);
            }
        }
        /**
         * get the Component value
         * @param name name to get
         */
        getProp(name) {
            return this.m_props[name];
        }
        /**
         * change a Component value
         * @param name name to set
         * @param value new value
         */
        setProp(name, value) {
            this.m_props[name] = value;
        }
        /**
         * get the Component data value
         * @param name name to get
         */
        getData(name) {
            if (this.m_props.data !== undefined) {
                return this.m_props.data[name];
            }
            return undefined;
        }
        /**
         * set the Component data value
         * @param name name to get
         * @param value
         */
        setData(name, value) {
            let data = this.m_props.data;
            if (data === undefined) {
                data = this.m_props.data = {};
            }
            data[name] = value;
        }
        /**
         * return the DOM associated with the Component (if any)
         */
        get dom() {
            return this.m_dom;
        }
        /**
         * shows the element
         * @param show
         */
        show(show) {
            if (show === undefined || show === true) {
                this.removeClass('@hidden');
            }
            else {
                this.addClass('@hidden');
            }
        }
        /**
         * hides the element
         */
        hide() {
            this.addClass('@hidden');
        }
        /**
         * enable or disable the element
         * @param enable
         */
        enable(enable) {
            if (enable === undefined || enable === true) {
                this.removeClass('@disable');
                this.removeAttribute('disabled');
            }
            else {
                this.disable();
            }
        }
        /**
         * disable the element
         */
        disable() {
            this.addClass('@disable');
            this.setAttribute('disabled', '');
        }
        /**
         * set the focus on the element
         */
        focus() {
            console.assert(!!this.m_dom);
            this.m_dom.focus();
        }
        /**
         * change the object style
         * @param style - style to add
         * @example ```typescript
         * el.setStyle( {left:100} );
         */
        setStyle(style) {
            for (let s in style) {
                this.setStyleValue(s, style[s]);
            }
        }
        /**
         * change a style value
         * @param name string style nale
         * @param value any style value or null to remove style
         */
        setStyleValue(name, value) {
            let style = this.m_props.style;
            if (!style) {
                style = this.m_props.style = {};
            }
            style[name] = value;
            this._setDomStyleValue(name, value);
        }
        _setDomStyleValue(name, value) {
            if (this.m_dom) {
                if (value === undefined) {
                    value = null;
                }
                else if (!_x4_unitless[name] && ((0, tools_js_2.isNumber)(value) || reNumber.test(value))) {
                    value = value + 'px';
                }
                this.m_dom.style[name] = value;
            }
        }
        /**
         * compute the element style
         * @return all styles computed
         */
        getComputedStyle(pseudoElt) {
            if (this.dom) {
                return new styles_js_1.ComputedStyle(getComputedStyle(this.dom, pseudoElt ?? null));
            }
            return new styles_js_1.ComputedStyle(this.m_props.style);
        }
        /**
         * return a single stype value
         * @param name - value to get
         */
        getStyleValue(name) {
            return this.getComputedStyle()[name];
        }
        /**
         * define the elements attributes
         * @param attrs
         */
        setAttributes(attrs) {
            for (let a in attrs) {
                this.setAttribute(a, attrs[a]);
            }
        }
        /**
         * change a single attribute
         * @param name attribute name
         * @param value new value
         */
        setAttribute(name, value) {
            if (value === false || value === undefined) {
                this.removeAttribute(name);
            }
            else {
                if (value === true) {
                    value = '';
                }
                else if ((0, tools_js_2.isNumber)(value)) {
                    value = '' + value;
                }
                let attrs = this.m_props.attrs;
                if (!attrs) {
                    attrs = this.m_props.attrs = {};
                }
                attrs[name] = value;
                this._setDomAttribute(name, value);
            }
        }
        _setDomAttribute(name, value) {
            if (this.m_dom) {
                this.m_dom.setAttribute(name, value);
            }
        }
        /**
         * remove an atrribute
         * @param name name of the attribute
         */
        removeAttribute(name) {
            let attrs = this.m_props.attrs;
            if (!attrs) {
                return;
            }
            delete attrs[name];
            if (this.m_dom) {
                this.m_dom.removeAttribute(name);
            }
        }
        /**
         * get an attribute value
         * @param {string} name - attribute name
         * @return {string} attribute value
         * @example ```typescript
         * let chk = el.getAttribute( 'checked' );
         * @review double cache
         */
        getAttribute(name) {
            if (this.m_dom) {
                return this.m_dom.getAttribute(name);
            }
            else {
                if (!this.m_props.attrs) {
                    return undefined;
                }
                return this.m_props.attrs[name];
            }
        }
        /**
         * check if the element has an attribute
         * @param name attribute name
         * @return true is attribute is present
         * @example ```typescript
         * if( el.hasAttribute('checked') ) {
         * }
         */
        hasAttribute(name) {
            if (this.m_dom) {
                return this.m_dom.hasAttribute(name);
            }
            else {
                return this.m_props.attrs.hasOwnProperty(name);
            }
        }
        /**
         * a some classnames to the component
         * classes can be separated by a space
         * @param cls class to add
         * @example ```typescript
         * addClass( 'my class name @flex' );
         */
        addClass(name) {
            if (name === null || name === undefined) {
                return;
            }
            name = name.trim();
            if (name === '') {
                return;
            }
            let add = (c) => {
                if (c === undefined || c === null || c === '') {
                    return;
                }
                c = this._makeCls(c);
                // update vdom
                classes[c] = true;
                // update dom
                if (this.m_dom) {
                    this.m_dom.classList.add(c);
                }
            };
            let classes = this.m_iprops.classes;
            if (name.indexOf(' ') < 0) {
                add(name);
            }
            else {
                let names = name.split(' ');
                names.forEach((n) => add(n));
            }
        }
        /**
         * Remove a class from the element
         * @param {string|array} name - classes in string form can be space separated
         *
         * @example ```typescript
         * el.removeClass( 'myclass' );
         * el.removeClass( 'myclass1 myclass2' );
         */
        removeClass(name) {
            if (name === undefined) {
                return;
            }
            let remove = (c) => {
                if (c === undefined || c === null || c === '') {
                    return;
                }
                c = this._makeCls(c);
                delete this.m_iprops.classes[c];
                if (this.m_dom) {
                    this.m_dom.classList.remove(c);
                }
            };
            // faster
            if (name.indexOf(' ') < 0) {
                remove(name);
            }
            else {
                //  build class list
                let classes = name.trim().split(' ');
                for (let c of classes) {
                    if (c !== undefined && c !== null && c !== '') {
                        remove(c);
                    }
                }
            }
        }
        /**
         *
         * @param cls
         * @param set
         */
        setClass(cls, set) {
            if (set) {
                this.addClass(cls);
            }
            else {
                this.removeClass(cls);
            }
            return this;
        }
        /**
         * Toggle a class from the element (if present remove, if absent add)
         * @param {string|string[]} name - classes in string form can be space separated
         * @example ```typescript
         * el.toggleClass( 'myclass' );
         * el.toggleClass( 'myclass1 myclass2');
         * el.toggleClass( ['myclass1','myclass2']);
         */
        toggleClass(name) {
            let toggle = (c) => {
                if (c === undefined && c === null && c === '') {
                    return;
                }
                c = this._makeCls(c);
                if (this.m_iprops.classes[c]) {
                    delete this.m_iprops.classes[c];
                }
                else {
                    this.m_iprops.classes[c] = true;
                }
                if (this.m_dom) {
                    this.m_dom.classList.toggle(c);
                }
            };
            // faster
            if (name.indexOf(' ') < 0) {
                toggle(name);
            }
            else {
                //  build class list
                let classes = name.trim().split(' ');
                for (let c of classes) {
                    toggle(c);
                }
            }
        }
        /**
         * check if the object has the class
         * @param cls
         */
        hasClass(cls) {
            let c = this._makeCls(cls);
            if (this.m_dom) {
                return this.dom.classList.contains(c);
            }
            else {
                return !!this.m_iprops.classes[c];
            }
        }
        /**
         * remove all classes from the object
         * this is usefull for component recycling & reusing
         */
        clearClasses() {
            this.m_iprops.classes = {};
            if (this.m_dom) {
                return this.m_dom.classList.value = '';
            }
        }
        ///@deprecated
        //private build(): void  {}
        /**
         * @deprecated
         */
        Build() { }
        _build() {
            if (this.m_dom) {
                return this.m_dom;
            }
            this._createDOM();
            return this.m_dom;
        }
        render(props) {
            if (this.m_props.tag == 'footer') {
                debugger;
            }
        }
        _createDOM() {
            if (this.m_dom) {
                return this.m_dom;
            }
            // setup props
            const props = this.m_props;
            if (props.tabIndex !== undefined) {
                this._setTabIndex(props.tabIndex);
            }
            this.render(props);
            // shortcuts ---------
            if (props.left !== undefined) {
                this.setStyleValue('left', props.left);
            }
            if (props.top !== undefined) {
                this.setStyleValue('top', props.top);
            }
            if (props.width !== undefined) {
                this.setStyleValue('width', props.width);
            }
            if (props.height !== undefined) {
                this.setStyleValue('height', props.height);
            }
            if (props.flex !== undefined) {
                this.addClass('@flex');
                if (props.flex != 1) {
                    this.setStyleValue('flex', props.flex);
                }
            }
            if (props.enabled === false) {
                this.disable();
            }
            // shortcut: tip
            if (props.tooltip !== undefined) {
                this.setAttribute('tip', props.tooltip.replace(/\n/gi, '<br/>'));
            }
            // prepare iprops
            if (props.dom_events) {
                for (let ename in props.dom_events) {
                    this._setDomEvent(ename, props.dom_events[ename]);
                }
            }
            this._genClassName();
            this.m_props.cls = undefined; // now classes are tranfered to m_iprops
            // create self
            let vdom = this.m_iprops;
            if (this.m_props.ns) {
                this.m_dom = document.createElementNS(props.ns, props.tag ?? 'div');
            }
            else {
                this.m_dom = document.createElement(props.tag ?? 'div');
            }
            this.m_dom[_x4_el_sym] = this;
            //let me = Object.getPrototypeOf(this);
            //console.log( 'create', this.m_iprops.uid, me.constructor.name );
            // classes
            this.m_dom.classList.add(...Object.keys(vdom.classes));
            // styles
            let sty = props.style;
            if (sty) {
                for (let s in sty) {
                    this._setDomStyleValue(s, sty[s]);
                }
            }
            // attributes
            let att = props.attrs;
            if (att) {
                for (let a in att) {
                    const attr = att[a];
                    if (attr !== false && attr !== undefined) {
                        this._setDomAttribute(a, att[a]);
                    }
                }
            }
            // special properties
            if (this.m_props.id) {
                this._setDomAttribute('id', this.m_props.id);
            }
            // events
            let evt = this.m_iprops.dom_events;
            if (evt) {
                for (let e in evt) {
                    let handlers = evt[e];
                    for (let h of handlers) {
                        this.createEvent(e, h);
                    }
                }
            }
            // create children
            let content = props.content;
            if (content) {
                if (!(0, tools_js_2.isArray)(content)) {
                    content = [content];
                }
                content.forEach((el) => {
                    if (!el) {
                        return;
                    }
                    if ((0, tools_js_2.isString)(el)) {
                        this.m_dom.insertAdjacentText('beforeend', el);
                    }
                    else if ((0, tools_js_2.isHtmlString)(el)) {
                        this.m_dom.insertAdjacentHTML('beforeend', el);
                    }
                    else if (el instanceof Component) {
                        this.m_dom.append(el._build());
                    }
                    else {
                        console.log('unknown element type: ', el);
                    }
                });
            }
            // wait for dom insertion inside document.body
            if (!Component.__createObserver) {
                Component.__createObserver = new MutationObserver(Component._observeCreation);
                Component.__createObserver.observe(document.body, { childList: true, subtree: true });
            }
            return this.m_dom;
        }
        _setTabIndex(tabIndex, defValue = 0) {
            if (tabIndex === true) {
                tabIndex = 0;
            }
            else if (tabIndex === undefined) {
                tabIndex = defValue;
            }
            if (tabIndex !== false && tabIndex !== undefined) {
                this.setAttribute('tabindex', tabIndex);
            }
            this.m_props.tabIndex = tabIndex;
        }
        static _observeCreation(mutations) {
            // notify descendants that we have been created (dom exists)
            for (let mutation of mutations) {
                if (mutation.type == 'childList') {
                    for (let i = 0, n = mutation.addedNodes.length; i < n; i++) {
                        let add = mutation.addedNodes[i];
                        let el = add[_x4_el_sym];
                        if (el) {
                            el.enumChilds((c) => {
                                if (c.dom && c.m_iprops.dom_events && c.m_iprops.dom_events.create) {
                                    c.dom.dispatchEvent(new Event('create'));
                                }
                                c.componentCreated();
                            }, true);
                            if (el.m_iprops.dom_events && el.m_iprops.dom_events.create) {
                                el.dom.dispatchEvent(new Event('create'));
                            }
                            el.componentCreated();
                        }
                    }
                }
            }
        }
        dispose() {
            if (this.m_dom) {
                this._dispose(true);
            }
        }
        _dispose(with_dom) {
            let _dom = this.m_dom;
            // free attached resources
            delete _dom[_x4_el_sym];
            delete _dom[_x4_el_store];
            //
            if (with_dom) {
                _dom.remove();
            }
            // notify every child that they will be removed
            this.enumChilds((c) => {
                c._dispose(false);
            });
            this.m_dom = null;
            this.disposeTimers();
            this.componentDisposed();
            // todo: pb on update this.removeAllListeners( null );
        }
        componentDisposed() {
        }
        componentCreated() {
        }
        /**
         *
         */
        update(delay = 0) {
            if (this.m_dom) {
                const _update = () => {
                    let oldDOM = this.m_dom;
                    this._dispose(false);
                    let newDOM = this._build();
                    console.assert(!!oldDOM.parentNode, 'update in componentCreated is not allowed, use updateContent');
                    oldDOM.parentNode.replaceChild(newDOM, oldDOM);
                };
                if (delay) {
                    this.singleShot(_update, delay);
                }
                else {
                    _update();
                }
            }
        }
        _updateContent() {
            if (!this.m_dom) {
                return;
            }
            this.m_dom.innerText = '';
            let content = this.m_props.content;
            // create children
            if (content) {
                if (!(0, tools_js_2.isArray)(content)) {
                    content = [content];
                }
                content.forEach((el) => {
                    if (!el) {
                        return;
                    }
                    if ((0, tools_js_2.isHtmlString)(el)) {
                        this.m_dom.insertAdjacentHTML('beforeend', el);
                    }
                    else if (el instanceof Component) {
                        this.m_dom.append(el._build());
                    }
                    else {
                        this.m_dom.insertAdjacentText('beforeend', el + '');
                    }
                });
            }
        }
        /**
         * @return the bounding rectangle
         * @example ```typescript
         * let rc = el.getBoundingRect( );
         * console.log( rc.left, rc.top, rc.right, rc.bottom );
         */
        getBoundingRect(withMargins = false) {
            console.assert(this.dom != null, 'cannot get bounding rect of an non DOM element');
            let r = this.dom.getBoundingClientRect();
            let rc = new tools_js_2.Rect(r.left, r.top, r.width, r.height);
            if (withMargins) {
                let st = this.getComputedStyle();
                let tm = st.parse('marginTop'), bm = st.parse('marginBottom'), lm = st.parse('marginLeft'), rm = st.parse('marginRight');
                rc.left -= lm;
                rc.width += lm + rm;
                rc.top -= tm;
                rc.height += tm + bm;
            }
            return rc;
        }
        /**
         * append a new dom event handler
         * @param name - you can specify multiple names separated by a space
         * @param handler
         * @example
         *
         * this.setDomEvent( 'drag drop', this._handleDrag, this );
         * this.setDomEvent( 'dblclick', this._handleDblClick, this );
         */
        setDomEvent(type, listener) {
            let _listener = listener;
            this._setDomEvent(type, _listener);
        }
        _setDomEvent(type, listener) {
            // add event to the vdom
            if (!this.m_iprops.dom_events) {
                this.m_iprops.dom_events = {};
            }
            let listeners = this.m_iprops.dom_events[type];
            if (!listeners) {
                listeners = this.m_iprops.dom_events[type] = [listener];
            }
            else {
                listeners.push(listener);
            }
            if (this.m_dom) {
                //this.m_dom.addEventListener(type, listener);
                this.createEvent(type, listener);
            }
        }
        /**
         *
         */
        clearDomEvent(type) {
            if (!this.m_iprops.dom_events) {
                return;
            }
            delete this.m_iprops.dom_events[type];
            let _dom = this.m_dom;
            if (_dom) {
                let store = _dom[_x4_el_store];
                if (store) {
                    delete store[type];
                }
            }
        }
        mapPropEvents(props, ...elements) {
            elements.forEach(name => {
                if (props[name]) {
                    this._on(name, props[name]);
                }
            });
        }
        /**
         *
         * @param name
         * @param handler
         */
        createEvent(name, handler) {
            let _dom = this.m_dom;
            let store = _dom[_x4_el_store];
            if (!store) {
                store = _dom[_x4_el_store] = {};
            }
            if (!store[name]) {
                // no handler for this event...
                store[name] = [handler];
            }
            else {
                // append the handler
                store[name].push(handler);
            }
            if (unbubbleEvents[name] === 1) {
                _dom['on' + name] = Component._dispatchUnbubbleEvent;
            }
            else if (!Component.__privateEvents[name]) {
                Component.__privateEvents[name] = true; // todo count it
                if (passiveEvents[name]) {
                    document.addEventListener(name, Component._dispatchEvent, { passive: false, capture: true });
                }
                else {
                    document.addEventListener(name, Component._dispatchEvent, true);
                }
            }
            if (name === 'sizechange') {
                if (!Component.__sizeObserver) {
                    Component.__sizeObserver = new ResizeObserver(Component._observeSize);
                }
                Component.__sizeObserver.observe(this.m_dom);
            }
        }
        /**
         * dispatch a dom event to the appropriated component
         * called by the system
         */
        static _dispatchEvent(ev) {
            let target = ev.target, noup = unbubbleEvents[ev.type] === 2;
            while (target) {
                if (target[_x4_el_store]) {
                    let store = target[_x4_el_store][ev.type];
                    if (store) {
                        let el = target[_x4_el_sym];
                        let root = el?.root ?? null;
                        if (store instanceof Array) {
                            store.some((fn) => {
                                fn(ev, root);
                                if (!el.dom) {
                                    return true;
                                }
                            });
                        }
                        else {
                            store(ev, root);
                        }
                        if (ev.cancelBubble || ev.defaultPrevented || noup) {
                            break;
                        }
                    }
                }
                target = target.parentNode;
                // no need to go above
                if (target == document) {
                    break;
                }
            }
        }
        /**
         * dispatch a dom event to the appropriated component
         * called by the system
         */
        static _dispatchUnbubbleEvent(ev) {
            let target = ev.currentTarget || ev.target, eventType = ev.type;
            let eventStore = target[_x4_el_store], store = eventStore && eventStore[eventType];
            if (store) {
                let el = target[_x4_el_sym];
                let root = el?.root ?? null;
                if (store instanceof Array) {
                    store.forEach((fn) => {
                        fn(ev, root);
                    });
                }
                else {
                    store(ev, root);
                }
            }
        }
        /**
         * called when a size change on an observed component
         */
        static _observeSize(entries) {
            entries.forEach((entry) => {
                let dom = entry.target;
                if (dom.offsetParent !== null) {
                    dom.dispatchEvent(new Event('sizechange'));
                }
            });
        }
        /**
         * enum all children recursively
         * @param recursive - if true do a full sub-child search
         * @param cb - callback
         * return true to stop enumeration
         */
        enumChilds(cb, recursive = false) {
            // use dom if available
            if (this.m_dom) {
                let el = this.m_dom.firstChild;
                while (el) {
                    // get component (if any)
                    let cel = el[_x4_el_sym];
                    if (cel) {
                        cb(cel);
                        if (recursive && cel.enumChilds(cb, true) === true) {
                            return true;
                        }
                    }
                    el = el.nextSibling;
                }
            }
            else {
                let content = this.m_props.content;
                if (!content) {
                    return;
                }
                if (!(0, tools_js_2.isArray)(content)) {
                    content = [content];
                }
                content.some((el) => {
                    if (!el || (0, tools_js_2.isString)(el) || (0, tools_js_2.isHtmlString)(el)) {
                        return;
                    }
                    if (cb(el)) {
                        return true;
                    }
                    if (recursive && el.enumChilds(cb, true) === true) {
                        return true;
                    }
                });
            }
            return false;
        }
        /**
         * apprend a child to the DOM
         * @param props child to append (or string)
         */
        _appendChild(el) {
            if ((0, tools_js_2.isString)(el)) {
                this.m_dom.insertAdjacentText('beforeend', el);
            }
            else if ((0, tools_js_2.isHtmlString)(el)) {
                this.m_dom.insertAdjacentHTML('beforeend', el);
            }
            else {
                let component = el;
                try {
                    component._build();
                    this.m_dom.appendChild(component.m_dom);
                }
                catch (e) {
                    console.error(e);
                }
            }
        }
        /**
         * generate classes from the component inheritance
         * @example
         * Button extends Component will give
         * x-comp x-button
         */
        _genClassName() {
            this.addClass('@comp');
            let me = Object.getPrototypeOf(this);
            while (me && me.constructor !== Component) {
                let clsname = me.constructor.name;
                this.addClass('@' + (0, tools_js_2.pascalCase)(clsname));
                me = Object.getPrototypeOf(me);
            }
            this.addClass(this.m_props.cls);
        }
        /**
         * prepend the system class name prefix on a name if needed (if class starts with @)
         */
        _makeCls(cls) {
            if (cls[0] == '@') {
                return cls = _x4_ns_prefix + cls.substring(1);
            }
            else {
                return cls;
            }
        }
        /**
         *
         */
        static dispatchCaptures(event) {
            Component.__capture.handler(event);
        }
        /**
         * capture mouse events
         * @param capture name of the current capture
         * @param callback funciton to call on captured mouse events
         *
         * @example
         * Component.setCapture( this, ( ev: MouseEvent, initiator: Component ) => {
         *		if( ev.type=='mousemove' ) {
         *			this.setStyle( {
         *				left: ev.clientX,
         *				top: ev.clientY
         *			} );
         *		}
         *		else if( ev.type=='mouseup' ) {
         *			Component.releaseCapture( );
         *		}
         *	} );
         */
        static setCapture(initiator, listener) {
            console.assert(!Component.__capture);
            if (Component.__capture) {
                debugger;
            }
            //	todo: review that
            let iframes = document.querySelectorAll("iframe");
            iframes.forEach(f => {
                flyWrap(f).setStyleValue('pointer-events', 'none');
            });
            let overs = document.querySelectorAll(":hover");
            let cursor = null;
            if (overs.length) {
                let elementOver = overs[overs.length - 1];
                let style = window.getComputedStyle(elementOver);
                cursor = style.cursor;
            }
            Component.__capture_mask = document.createElement('div');
            let mask = flyWrap(Component.__capture_mask);
            mask.addClass('@capture-mask');
            if (cursor) {
                mask.setStyleValue('cursor', cursor);
            }
            document.body.appendChild(mask.dom);
            document.addEventListener('mousedown', Component.dispatchCaptures);
            document.addEventListener('mousemove', Component.dispatchCaptures);
            document.addEventListener('mouseup', Component.dispatchCaptures);
            document.addEventListener('touchstart', Component.dispatchCaptures);
            document.addEventListener('touchmove', Component.dispatchCaptures);
            document.addEventListener('touchend', Component.dispatchCaptures);
            Component.__capture = {
                initiator,
                handler: listener,
                iframes
            };
        }
        static releaseCapture() {
            console.assert(!!Component.__capture);
            document.removeEventListener('touchstart', Component.dispatchCaptures);
            document.removeEventListener('touchmove', Component.dispatchCaptures);
            document.removeEventListener('touchend', Component.dispatchCaptures);
            document.removeEventListener('mousedown', Component.dispatchCaptures);
            document.removeEventListener('mousemove', Component.dispatchCaptures);
            document.removeEventListener('mouseup', Component.dispatchCaptures);
            Component.__capture.iframes.forEach(f => {
                flyWrap(f).setStyleValue('pointer-events', null);
            });
            Component.__capture = null;
            if (Component.__capture_mask) {
                document.body.removeChild(Component.__capture_mask);
                Component.__capture_mask = null;
            }
        }
        /**
         * ensure the component is visible
         * @param: alignToTop
         */
        scrollIntoView(arg) {
            if (this.m_dom) {
                const rel = new tools_js_2.Rect(this.dom.getBoundingClientRect());
                let top = undefined;
                let bot = undefined;
                let pn = this.dom.parentElement;
                while (pn && pn != document.body) {
                    const pr = pn.getBoundingClientRect();
                    if (top === undefined || top < pr.top) {
                        top = pr.top;
                    }
                    if (bot === undefined || bot > pr.bottom) {
                        bot = pr.bottom;
                    }
                    pn = pn.parentElement;
                }
                if (top === undefined || rel.top < top || rel.bottom > bot) {
                    //this.m_dom.scrollIntoView( true );
                    this.m_dom.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'start' });
                }
                //this.m_dom.scrollIntoView(arg);
            }
        }
        /**
         * search for a given css selector
         * @param selector
         * @returns child or null
         */
        queryItem(selector) {
            let result = this.dom.querySelector(selector);
            return result ? Component.getElement(result) : null;
        }
        queryAll(selector, cb) {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el) => {
                cb(flyWrap(el));
            });
        }
        /**
         * find a child with the given ID
         * @param id id (without '#')
         * @returns child or null
         *
         * @example
         * let btn = this.childWithId<Button>( 'myButtonId' );
         */
        itemWithId(id) {
            let result = this.dom.querySelector('#' + id);
            return result ? Component.getElement(result) : null;
        }
        /**
         * find a child with given ref
         * @param ref
         * @return found child or null
         */
        itemWithRef(ref) {
            let result = null;
            this.enumChilds((c) => {
                if (c.m_props.ref === ref) {
                    result = c;
                    return true;
                }
            }, true);
            return result;
        }
        /**
         *
         */
        get ref() {
            return this.m_props.ref;
        }
        /**
         *
         */
        static getCss() {
            if (!Component.__css) {
                Component.__css = new styles_js_1.Stylesheet();
            }
            return Component.__css;
        }
        /**
         * return the parent element
         * care, object must have been created (dom!=null)
         */
        getParent() {
            console.assert(!!this.m_dom);
            let elParent = this.dom.parentNode;
            return Component.getElement(elParent);
        }
        /**
         * get a component from a DOM element
         * move up to the hierarchy to find the request class type.
         * @param dom
         * @param classname
         * @returns
         *
         * @example
         *
         * with a DOM like that:
         * 	 Button
         * 	 	Label
         * 		Icon <- the DOM you have (dom-icon)
         *
         *  let btn = Comppnent.getElement( dom-icon, Button );
         */
        static getElement(dom, classname) {
            if (classname) {
                const srhCls = (0, tools_js_2.isString)(classname);
                while (dom) {
                    let el = dom[_x4_el_sym];
                    if (srhCls) {
                        if (el && el.hasClass(classname)) {
                            return el;
                        }
                    }
                    else if (el instanceof classname) {
                        return el;
                    }
                    dom = dom.parentElement;
                }
                return null;
            }
            else {
                return dom ? dom[_x4_el_sym] : null;
            }
        }
        /**
         * compute the scrollbar size ( width = height)
         */
        static getScrollbarSize() {
            if (Component.__sb_width === undefined) {
                let outerDiv = document.createElement('div');
                outerDiv.style.cssText = 'overflow:auto;position:absolute;top:0;width:100px;height:100px';
                let innerDiv = document.createElement('div');
                innerDiv.style.width = '200px';
                innerDiv.style.height = '200px';
                outerDiv.appendChild(innerDiv);
                document.body.appendChild(outerDiv);
                Component.__sb_width = outerDiv.offsetWidth - outerDiv.clientWidth;
                document.body.removeChild(outerDiv);
            }
            return Component.__sb_width;
        }
        /**
         * check if the Component is visible to the user
         */
        isUserVisible() {
            if (!this.m_dom) {
                return false;
            }
            return (this.m_dom.offsetParent !== null);
        }
    }
    exports.Component = Component;
    /** @ignore */
    let fly_element = null;
    /**
     * warp <b>temporarily</b> a DOM element to be able to acces to exact API
     * @param dom dom element to wrap
     * @review qui libere le fly_element ? -> timeout
     */
    function flyWrap(dom) {
        if (dom[_x4_el_sym]) {
            return dom[_x4_el_sym];
        }
        let f = fly_element;
        if (!f) {
            f = fly_element = new Component({});
        }
        f.m_dom = dom;
        return f;
    }
    exports.flyWrap = flyWrap;
    /**
     * simple flex spacer
     */
    class Flex extends Component {
        constructor(props = {}) {
            if (!props.flex) {
                props.flex = 1;
            }
            super(props);
        }
    }
    exports.Flex = Flex;
    /**
     * simple space between 2 elements
     */
    class Space extends Component {
        m_size;
        constructor(size) {
            super({});
            this.m_size = size;
        }
        componentCreated() {
            // try to find if we are in a hz / vt / abs container
            let dom = this.dom;
            let style = null;
            while (dom) {
                let el = dom[_x4_el_sym];
                if (el.hasClass('@hlayout')) {
                    style = { width: this.m_size };
                    break;
                }
                else if (el.hasClass('@vlayout')) {
                    style = { height: this.m_size };
                    break;
                }
                dom = dom.parentElement;
            }
            if (!style) {
                style = { width: this.m_size, height: this.m_size };
            }
            this.setStyle(style);
        }
    }
    exports.Space = Space;
    function EvSize(size, mode = null, context = null) {
        return (0, x4_events_js_2.BasicEvent)({ size, mode, context });
    }
    exports.EvSize = EvSize;
    class Separator extends Component {
        m_irect;
        m_delta;
        m_target;
        constructor(props) {
            super(props);
            this.setDomEvent('mousedown', (e) => this._mousedown(e));
            this.setDomEvent('touchstart', (e) => this._mousedown(e));
            this.setDomEvent('dblclick', (e) => this._collapse(e));
        }
        render() {
            this.addClass(this.m_props.orientation);
        }
        _collapse(ev) {
            if (this.m_props.collapsible) {
                this._findTarget();
                if (this.m_target) {
                    this.m_target.toggleClass('@collapsed');
                }
            }
        }
        _mousedown(ev) {
            if (ev.type == 'touchstart') {
                let te = ev;
                if (te.touches.length == 1) {
                    this._startMoving(te.touches[0].pageX, te.touches[0].pageY, ev);
                }
            }
            else {
                let me = ev;
                this._startMoving(me.pageX, me.pageY, ev);
            }
        }
        _startMoving(x, y, ev) {
            //if( this.m_props.callback ) {
            //	this.m_props.callback( ev, this );
            //}
            //else 
            {
                this._findTarget();
                if (this.m_target) {
                    if (this.m_props.orientation == 'horizontal') {
                        if (this.m_props.sizing == 'before') {
                            this.m_delta = x - this.m_irect.right;
                        }
                        else {
                            this.m_delta = x - this.m_irect.left;
                        }
                    }
                    else {
                        if (this.m_props.sizing == 'before') {
                            this.m_delta = y - this.m_irect.bottom;
                        }
                        else {
                            this.m_delta = y - this.m_irect.top;
                        }
                    }
                    ev.preventDefault();
                    ev.stopPropagation();
                    this.m_target.addClass('sizing');
                    Component.setCapture(this, (e) => this._pointerMoved(e));
                }
            }
        }
        _pointerMoved(ev) {
            let __move = (ex, ey) => {
                if (this.m_props.orientation == 'horizontal') {
                    let width;
                    if (this.m_props.sizing == 'after') {
                        width = this.m_irect.right - (ex - this.m_delta);
                    }
                    else {
                        width = (ex - this.m_delta) - this.m_irect.left;
                    }
                    if (width > 0) {
                        let size = new tools_js_2.Size(width, 0);
                        this.emit('resize', EvSize(size));
                        this.m_target.setStyleValue('width', size.width);
                        this.m_target.setStyleValue('flex', null); // for flex>1
                        this.m_target.removeClass('@flex');
                    }
                }
                else {
                    let height;
                    if (this.m_props.sizing == 'after') {
                        height = this.m_irect.bottom - (ey - this.m_delta);
                    }
                    else {
                        height = (ey - this.m_delta) - this.m_irect.top;
                    }
                    if (height > 0) {
                        let size = new tools_js_2.Size(0, height);
                        this.emit('resize', EvSize(size));
                        this.m_target.setStyleValue('height', size.height);
                        this.m_target.setStyleValue('flex', null); // for flex>1
                        this.m_target.removeClass('@flex');
                    }
                }
            };
            if (ev.type == 'mousemove') {
                let mev = ev;
                __move(mev.pageX, mev.pageY);
                ev.preventDefault();
                ev.stopPropagation();
            }
            else if (ev.type == 'touchmove') {
                let tev = ev;
                __move(tev.touches[0].pageX, tev.touches[0].pageY);
                ev.preventDefault();
                ev.stopPropagation();
            }
            else if (ev.type == 'mouseup' || ev.type == 'touchend') {
                this.m_target.removeClass('sizing');
                Component.releaseCapture();
                ev.preventDefault();
                ev.stopPropagation();
            }
        }
        _findTarget() {
            if (!this.m_target) {
                if (this.m_props.sizing == 'before') {
                    let prevDom = this.dom.previousElementSibling;
                    let prevEl = prevDom ? Component.getElement(prevDom) : null;
                    this.m_target = prevEl;
                }
                else {
                    let nextDom = this.dom.nextElementSibling;
                    let nextEl = nextDom ? Component.getElement(nextDom) : null;
                    this.m_target = nextEl;
                }
            }
            if (this.m_target) {
                this.m_irect = this.m_target.getBoundingRect();
            }
            else {
                this.m_irect = null;
            }
        }
    }
    exports.Separator = Separator;
    function EvOverlayResize(ui_event, sens, context = null) {
        return (0, x4_events_js_2.BasicEvent)({ ui_event, sens, context });
    }
    exports.EvOverlayResize = EvOverlayResize;
    class SizerOverlay extends Component {
        m_delta;
        m_irect;
        constructor(props) {
            super(props);
            this.addClass(props.sens);
            this.setDomEvent('mousedown', (e) => this._mousedown(e));
            this.setDomEvent('touchstart', (e) => this._mousedown(e));
            this.setDomEvent('dblclick', (e) => this.resetflex(e)); // todo: add option for that
            props.target.appendChild(this);
            if (props.resize) {
                this.on('resize', this.m_props.resize);
            }
        }
        resetflex(event) {
            this.m_props.target.addClass('@flex');
            this.emit('resize', EvSize({ width: -1, height: 0 })); // todo: see that
            event.preventDefault();
            event.stopPropagation();
        }
        // @review move that in component
        _mousedown(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            let eev = EvOverlayResize(ev, this.m_props.sens);
            this.emit('rawresize', eev);
            if (eev.defaultPrevented) {
                return;
            }
            let pos = (0, tools_js_2.getMousePos)(ev, true);
            this.m_irect = this.m_props.target.getBoundingRect();
            if (this.m_props.sens == 'right') {
                this.m_delta = pos.x - this.m_irect.right;
            }
            else if (this.m_props.sens == 'left') {
                this.m_delta = pos.x - this.m_irect.left;
            }
            else if (this.m_props.sens == 'bottom') {
                this.m_delta = pos.y - this.m_irect.bottom;
            }
            else if (this.m_props.sens == 'top') {
                this.m_delta = pos.y - this.m_irect.top;
            }
            this.m_props.target.addClass('sizing');
            Component.setCapture(this, (e) => this._handle_mouse(e));
        }
        _is_horz() {
            return this.m_props.sens == 'left' || this.m_props.sens == 'right';
        }
        get sens() {
            return this.m_props.sens;
        }
        _handle_mouse(ev) {
            let __move = (ex, ey) => {
                if (this._is_horz()) {
                    let width;
                    if (this.m_props.sens == 'left') {
                        width = this.m_irect.right - (ex - this.m_delta);
                    }
                    else {
                        width = (ex - this.m_delta) - this.m_irect.left;
                    }
                    if (width > 0) {
                        let size = {
                            width,
                            height: undefined
                        };
                        this.emit('resize', EvSize(size));
                        this.m_props.target.setStyleValue('width', size.width);
                        this.m_props.target.setStyleValue('flex', null); // for flex>1
                        this.m_props.target.removeClass('@flex');
                    }
                }
                else {
                    let height;
                    if (this.m_props.sens == 'top') {
                        height = this.m_irect.bottom - (ey - this.m_delta);
                    }
                    else {
                        height = (ey - this.m_delta) - this.m_irect.top;
                    }
                    if (height > 0) {
                        let size = new tools_js_2.Size(0, height);
                        this.emit('resize', EvSize(size));
                        this.m_props.target.setStyleValue('height', size.height);
                        this.m_props.target.setStyleValue('flex', null); // for flex>1
                        this.m_props.target.removeClass('@flex');
                    }
                }
            };
            if (ev.type == 'mousemove') {
                let mev = ev;
                __move(mev.pageX, mev.pageY);
                ev.preventDefault();
                ev.stopPropagation();
            }
            else if (ev.type == 'touchmove') {
                let tev = ev;
                __move(tev.touches[0].pageX, tev.touches[0].pageY);
                ev.preventDefault();
                ev.stopPropagation();
            }
            else if (ev.type == 'mouseup' || ev.type == 'touchend') {
                this.m_props.target.removeClass('sizing');
                Component.releaseCapture();
                ev.preventDefault();
                ev.stopPropagation();
            }
        }
    }
    exports.SizerOverlay = SizerOverlay;
    function EvShortcut(name) {
        return (0, x4_events_js_2.BasicEvent)({ name });
    }
    /**
     *
     */
    class Container extends Component {
        m_shortcuts;
        constructor(props) {
            super(props);
        }
        /**
         * add an application shortcut
         * @param sequence key sequence Shift+Ctrl+Alt+K
         * @param callback callback to call
         */
        addShortcut(sequence, name, callback = null, immediate = false) {
            // first time
            if (!this.m_shortcuts) {
                this.m_shortcuts = [];
                this.setDomEvent('keydown', (e) => this._handleKeydown(e));
            }
            if (!(0, tools_js_2.isArray)(sequence)) {
                sequence = [sequence];
            }
            sequence.forEach((seq) => {
                let reseq = '';
                let shift = seq.match(/SHIFT/i);
                if (shift) {
                    seq = seq.replace(/SHIFT/i, '');
                    reseq += 'shift+';
                }
                let ctrl = seq.match(/CTRL/i);
                if (ctrl) {
                    seq = seq.replace(/CTRL/i, '');
                    reseq += 'ctrl+';
                }
                let alt = seq.match(/ALT/i);
                if (alt) {
                    seq = seq.replace(/ALT/i, '');
                    reseq += 'alt+';
                }
                reseq += seq.replace('+', '').toLowerCase();
                this.m_shortcuts.push({
                    sequence: reseq,
                    name,
                    immediate,
                    callback
                });
            });
        }
        /**
         * remove all shortcuts for a target
         */
        removeShortcuts() {
            if (this.m_shortcuts) {
                this.m_shortcuts = [];
            }
        }
        /** @ignore this function is binded */
        _handleKeydown(e) {
            if (!this.m_shortcuts) {
                return;
            }
            let seq = '';
            if (e.shiftKey) {
                seq += 'shift+';
            }
            if (e.ctrlKey) {
                seq += 'ctrl+';
            }
            if (e.altKey) {
                seq += 'alt+';
            }
            seq += e.key.toLowerCase();
            //console.log( seq );
            this.m_shortcuts.some((sk) => {
                if (sk.sequence == seq) {
                    if (sk.callback) {
                        if (sk.immediate) {
                            sk.callback(e);
                        }
                        else {
                            (0, tools_js_2.asap)(() => { sk.callback(e); });
                        }
                    }
                    else {
                        this.emit('shortcut', EvShortcut(sk.name));
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    return true;
                }
            });
        }
    }
    exports.Container = Container;
});
/**
* @file request.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/request", ["require", "exports", "x4/tools"], function (require, exports, tools_js_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ajax = exports.ajaxAsText = exports.ajaxAsJSON = exports.ajaxRequest = void 0;
    const DEFAULT_TIMEOUT = 10000;
    function ajaxRequest(cfg) {
        let params, url = cfg.url, method = cfg.method || 'GET', formdata = false;
        if (cfg.params instanceof FormData) {
            params = cfg.params;
            formdata = true;
        }
        else if (method == 'POST') {
            params = buildQuery(cfg.params, false);
        }
        else {
            url += buildQuery(cfg.params, true);
        }
        url = encodeURI(url);
        let xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.upload.addEventListener('progress', progress, false);
        xhr.addEventListener('timeout', failure);
        xhr.addEventListener('error', failure);
        xhr.addEventListener('load', success);
        if (!formdata) {
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
        }
        if (method != 'POST') {
            xhr.responseType = cfg.responseType || 'json';
            xhr.timeout = cfg.timeout || DEFAULT_TIMEOUT;
        }
        if (cfg.headers) {
            for (let h in cfg.headers) {
                this.xhr.setRequestHeader(h, cfg.headers[h]);
            }
        }
        function progress(ev) {
            console.log(ev);
            if (cfg.progress) {
                try {
                    if (ev.lengthComputable) {
                        let disp = humanSize(ev.loaded) + ' / ' + humanSize(ev.total);
                        cfg.progress(ev.loaded, ev.total, disp);
                    }
                }
                catch (e) {
                    console.error('unhandled exception:', e);
                }
            }
        }
        function humanSize(bytes) {
            let unit, value;
            if (bytes >= 1e9) {
                unit = 'Gb';
                value = bytes / 1e9;
            }
            else if (bytes >= 1e6) {
                unit = 'Mb';
                value = bytes / 1e6;
            }
            else if (bytes >= 1e3) {
                unit = 'Kb';
                value = bytes / 1e3;
            }
            else {
                unit = 'bytes';
                value = bytes;
            }
            return value.toFixed(2) + unit;
        }
        function failure() {
            if (cfg.failure) {
                cfg.failure(xhr.status, xhr.statusText, cfg.userData);
            }
        }
        function success() {
            if (xhr.status >= 200 && xhr.status < 300) {
                if (cfg.success) {
                    try {
                        cfg.success(xhr.response, cfg.userData);
                    }
                    catch (e) {
                        console.error('unhandled exception:', e);
                    }
                }
            }
            else {
                failure();
            }
        }
        if (formdata || method == 'POST') {
            xhr.send(params);
        }
        else {
            xhr.send();
        }
        return function () {
            xhr.abort();
        };
    }
    exports.ajaxRequest = ajaxRequest;
    function buildQuery(params, getMethod) {
        if (!params) {
            return '';
        }
        let query = [];
        for (let key in params) {
            let param = params[key];
            // array
            if ((0, tools_js_4.isArray)(param)) {
                for (let i = 0, n = param.length; i < n; i++) {
                    query.push(encodeURIComponent(key) + '[]=' + encodeURIComponent('' + param[i]));
                }
            }
            // simple string ...
            else {
                if (param === undefined) {
                    param = '';
                }
                query.push(encodeURIComponent(key) + '=' + encodeURIComponent('' + param));
            }
        }
        let result = query.join('&');
        if (getMethod) {
            return '?' + result;
        }
        else {
            return result;
        }
    }
    async function ajaxAsJSON(url, init) {
        let response = await ajax(url, init, 'application/json');
        return response.json();
    }
    exports.ajaxAsJSON = ajaxAsJSON;
    async function ajaxAsText(url, init) {
        let response = await ajax(url, init, 'text/plain');
        return response.text();
    }
    exports.ajaxAsText = ajaxAsText;
    /**
     * use encodeURIComponent for elements in url
     */
    async function ajax(url, init, type) {
        let options = {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };
        if (type) {
            options.headers['Content-Type'] = type;
        }
        if (init) {
            options = { ...options, ...init };
            if (init.body && !(0, tools_js_4.isString)(init.body)) {
                let cvt = false;
                if ((0, tools_js_4.isLiteralObject)(init.body)) {
                    cvt = true;
                }
                else if (!(init.body instanceof Blob) && !(init.body instanceof ArrayBuffer) && !(init.body instanceof FormData) &&
                    !(init.body instanceof URLSearchParams) && !(init.body instanceof ReadableStream)) {
                    cvt = true;
                }
                if (cvt) {
                    options.body = JSON.stringify(init.body);
                }
                else {
                    options.body = init.body;
                }
            }
        }
        let response = await fetch(url, options);
        if (init && init.noGenX) {
            return response;
        }
        else {
            if (!response.ok) {
                throw new tools_js_4.NetworkError(response);
            }
            return response;
        }
    }
    exports.ajax = ajax;
});
/**
* @file datastore.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/datastore", ["require", "exports", "x4/request", "x4/tools", "x4/x4_events", "x4/base_component"], function (require, exports, request_js_1, tools_js_5, x4_events_js_3, base_component_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DataView = exports.EvViewChange = exports.DataStore = exports.DataProxy = exports.AutoRecord = exports.Record = exports.data_array = exports.data_calc = exports.data_date = exports.data_bool = exports.data_float = exports.data_int = exports.data_string = exports.data_field = exports.data_id = void 0;
    function EvDataChange(type, id) {
        return (0, x4_events_js_3.BasicEvent)({ type, id });
    }
    /**
     *
     */
    class MetaInfos {
        id; // field name holding 'id' record info
        fields; // field list
        constructor() {
            this.id = undefined;
            this.fields = [];
        }
    }
    function _getMetas(obj, create = true) {
        let ctor = obj.constructor;
        let meta_name = `~meta~${ctor.name.toLowerCase()}~infos`;
        let metas = ctor[meta_name];
        if (metas === undefined) {
            if (!create) {
                console.assert(metas !== undefined);
            }
            // construct our metas
            metas = obj.constructor[meta_name] = new MetaInfos();
            // merge with parent class metas
            let proto = Object.getPrototypeOf(ctor);
            while (proto != Record) {
                ctor = proto;
                let parent_metas = _getMetas(ctor.prototype, false);
                metas.fields = [...parent_metas.fields, ...metas.fields];
                proto = Object.getPrototypeOf(ctor);
                console.assert(metas.id === undefined, 'cannot define mutiple record id');
                if (!metas.id) {
                    metas.id = parent_metas.id;
                }
            }
        }
        return metas;
    }
    /**
     * define a record id
     * @example
     *	\@data_id()
     *  id: string; // this field is the record id
     **/
    function data_id() {
        return (ownerCls, fldName) => {
            let metas = _getMetas(ownerCls);
            metas.fields.push({
                name: fldName,
                type: 'any',
                required: true,
            });
            metas.id = fldName;
        };
    }
    exports.data_id = data_id;
    /**
     * @ignore
     */
    function data_field(data) {
        return (ownerCls, fldName) => {
            let metas = _getMetas(ownerCls);
            metas.fields.push({
                name: fldName,
                ...data
            });
        };
    }
    exports.data_field = data_field;
    /**
     * following member is a string field
     * @example
     * \@data_string()
     * my_field: string;	// this field will be seen as a string
     */
    function data_string(props) {
        return data_field({ ...props, type: 'string' });
    }
    exports.data_string = data_string;
    /**
     * following member is an integer field
     * @example
     * \@data_string()
     * my_field: number;	// this field will be seen as an integer
     */
    function data_int(props) {
        return data_field({ ...props, type: 'int' });
    }
    exports.data_int = data_int;
    /**
     * following member is a float field
     * @example
     * \@data_float()
     * my_field: number;	// this field will be seen as a float
     */
    function data_float(props) {
        return data_field({ ...props, type: 'float' });
    }
    exports.data_float = data_float;
    /**
     * following member is a boolean field
     * @example
     * \@data_bool()
     * my_field: boolean;	// this field will be seen as a boolean
     */
    function data_bool(props) {
        return data_field({ ...props, type: 'bool' });
    }
    exports.data_bool = data_bool;
    /**
     * following member is a date field
     * @example
     * \@data_date()
     * my_field: date;	// this field will be seen as a date
     */
    function data_date(props) {
        return data_field({ ...props, type: 'date' });
    }
    exports.data_date = data_date;
    /**
     * following member is a calculated field
     * @example
     * \@data_calc( )
     * get my_field(): string => {
     * 	return 'hello';
     * };
     */
    function data_calc(props) {
        return data_field({ ...props, type: 'calc' });
    }
    exports.data_calc = data_calc;
    /**
     * following member is a record array
     * @example
     * \@data_array( )
     * my_field(): TypedRecord[];
     */
    function data_array(ctor, props) {
        return data_field({ ...props, type: 'array', model: new ctor() });
    }
    exports.data_array = data_array;
    /**
     * record model
     */
    class Record {
        constructor(data, id) {
            if (data !== undefined) {
                this.unSerialize(data, id);
            }
        }
        clone(source) {
            let rec = new this.constructor();
            if (source) {
                rec.unSerialize(source);
            }
            return rec;
        }
        /**
         * get the record unique identifier
         * by default the return value is the first field
         * @return unique identifier
         */
        getID() {
            let metas = _getMetas(this, false);
            return this[metas.id];
        }
        /**
         * MUST IMPLEMENT
         * @returns fields descriptors
         */
        getFields() {
            let metas = _getMetas(this, false);
            return metas.fields;
        }
        /**
         *
         */
        validate() {
            let errs = null;
            let fields = this.getFields();
            fields.forEach((fi) => {
                if (fi.required && !this.getField(fi.name)) {
                    if (errs) {
                        errs = [];
                    }
                    errs.push(new Error(`field ${fi.name} is required.`));
                }
            });
            return errs;
        }
        //mapAnyFields() {
        //	this.getFields = ( ) => {
        //		return Object.keys( this ).map( (name) => {
        //			return <FieldInfo>{ name };
        //		});			
        //	}
        //}
        getFieldIndex(name) {
            let fields = this.getFields();
            return fields.findIndex((fd) => fd.name == name);
        }
        /**
         * default serializer
         * @returns an object with known record values
         */
        serialize() {
            let rec = {};
            this.getFields().forEach((f) => {
                if (f.calc === undefined) {
                    rec[f.name] = rec[f.name];
                }
            });
            return rec;
        }
        /**
         * default unserializer
         * @param data - input data
         * @returns a new Record
         */
        unSerialize(data, id) {
            let fields = this.getFields();
            fields.forEach((sf) => {
                let value = data[sf.name];
                if (value !== undefined) {
                    this[sf.name] = this._convertField(sf, value);
                }
            });
            if (id !== undefined) {
                this[fields[0].name] = id;
            }
            else {
                console.assert(this.getID() !== undefined); // store do not have ID field
            }
            return this;
        }
        /**
         * field conversion
         * @param field - field descriptor
         * @param input - value to convert
         * @returns the field value in it's original form
         */
        _convertField(field, input) {
            //TODO: boolean
            switch (field.type) {
                case 'float': {
                    let ffv = typeof (input) === 'number' ? input : parseFloat(input);
                    if (field.prec !== undefined) {
                        let mul = Math.pow(10, field.prec);
                        ffv = Math.round(ffv * mul) / mul;
                    }
                    return ffv;
                }
                case 'int': {
                    return typeof (input) === 'number' ? input : parseInt(input);
                }
                case 'date': {
                    return (0, tools_js_5.isString)(input) ? new Date(input) : input;
                }
                case 'array': {
                    let result = [];
                    if (field.model) {
                        input.forEach((v) => {
                            result.push(field.model.clone(v));
                        });
                        return result;
                    }
                    break;
                }
            }
            return input;
        }
        /**
         * get raw value of a field
         * @param name - field name or field index
         */
        getRaw(name) {
            let idx;
            let fields = this.getFields();
            if (typeof (name) === 'string') {
                idx = fields.findIndex(fi => fi.name == name);
                if (idx < 0) {
                    console.assert(false, 'unknown field: ' + name);
                    return undefined;
                }
            }
            else if (name >= 0 && name < fields.length) {
                idx = name;
            }
            else {
                console.assert(false, 'bad field name: ' + name);
                return undefined;
            }
            let fld = fields[idx];
            if (fld.calc !== undefined) {
                return fld.calc.call(this);
            }
            return this[fld.name];
        }
        /**
         *
         * @param name
         * @param data
         */
        setRaw(name, data) {
            this[name] = data;
        }
        /**
         * get field value (as string)
         * @param name - field name
         * @example
         * let value = record.get('field1');
         */
        getField(name) {
            let v = this.getRaw(name);
            return (v === undefined || v === null) ? '' : '' + v;
        }
        /**
         * set field value
         * @param name - field name
         * @param value - value to set
         * @example
         * record.set( 'field1', 7 );
         */
        setField(name, value) {
            let fields = this.getFields();
            let idx = fields.findIndex(fi => fi.name == name);
            if (idx < 0) {
                console.assert(false, 'unknown field: ' + name);
                return;
            }
            let fld = fields[idx];
            if (fld.calc !== undefined) {
                console.assert(false, 'cannot set calc field: ' + name);
                return;
            }
            this.setRaw(fld.name, value);
        }
    }
    exports.Record = Record;
    /**
     * by default, the field id is rhe first member or the record
     */
    class AutoRecord extends Record {
        m_data;
        m_fid;
        constructor(data) {
            super();
            this.m_data = data;
        }
        getID() {
            if (!this.m_fid) {
                let fnames = Object.keys(this.m_data);
                this.m_fid = fnames[0];
            }
            return this.m_data[this.m_fid];
        }
        getFields() {
            let fnames = Object.keys(this.m_data);
            let fields = fnames.map((n) => {
                return {
                    name: n
                };
            });
            return fields;
        }
        getRaw(name) {
            return this.m_data[name];
        }
        setRaw(name, data) {
            this.m_data[name] = data;
        }
        clone(data) {
            return new AutoRecord({ ...data });
        }
    }
    exports.AutoRecord = AutoRecord;
    class DataProxy extends base_component_js_2.BaseComponent {
        constructor(props) {
            super(props);
        }
        load() {
            this._refresh();
        }
        save(data) {
            if (this.m_props.type == 'local') {
                console.assert(false); // not imp
                /*
                const fs = require('fs');
                fs.writeFileSync( this.m_path, data );
                */
            }
        }
        _refresh(delay = 0) {
            if (this.m_props.type == 'local') {
                console.assert(false); // not imp
                /*
                const fs = require('fs');
                fs.readFile( this.m_path, ( _, bdata ) => {;
                    let data = JSON.parse(bdata);
                    this.emit( 'dataready', data );
                } );
                */
            }
            else {
                setTimeout(() => {
                    (0, request_js_1.ajaxRequest)({
                        url: this.m_props.path,
                        method: 'GET',
                        params: this.m_props.params,
                        success: (data) => {
                            this.emit('change', (0, x4_events_js_3.EvChange)(data));
                        }
                    });
                }, delay);
            }
        }
    }
    exports.DataProxy = DataProxy;
    /**
     *
     */
    class DataStore extends x4_events_js_3.EventSource {
        m_model;
        m_fields;
        m_records;
        m_proxy;
        m_rec_index;
        constructor(props) {
            super();
            this.m_fields = undefined;
            this.m_records = [];
            this.m_rec_index = null;
            this.m_model = props.model;
            this.m_fields = props.model.getFields();
            if (props.data) {
                this.setRawData(props.data);
            }
            else if (props.url) {
                this.load(props.url);
            }
        }
        /**
         *
         * @param records
         */
        load(url) {
            //todo: that
            if (url.substr(0, 7) === 'file://') {
                this.m_proxy = new DataProxy({
                    type: 'local',
                    path: url.substr(7),
                    events: { change: (ev) => { this.setData(ev.value); } }
                });
                this.m_proxy.load();
            }
            else {
                this.m_proxy = new DataProxy({
                    type: 'ajax',
                    path: url,
                    events: { change: (ev) => { this.setData(ev.value); } }
                });
                this.m_proxy.load();
            }
        }
        reload() {
            this.m_proxy.load();
        }
        /**
         * convert raw objects to real records from model
         * @param records
         */
        setData(records) {
            let realRecords = [];
            records.forEach((rec) => {
                realRecords.push(this.m_model.clone(rec));
            });
            this.setRawData(realRecords);
        }
        /**
         * just set the records
         * @param records - must be of the same type as model
         */
        setRawData(records) {
            this.m_records = records;
            this._rebuildIndex();
            this.emit('data_change', EvDataChange('change'));
        }
        _rebuildIndex() {
            this.m_rec_index = null; // null to signal that we have to run on records instead of index
            this.m_rec_index = this.createIndex(null); // prepare index (remove deleted)
            this.m_rec_index = this.sortIndex(this.m_rec_index, null); // sort by id
        }
        /**
         *
         */
        update(rec) {
            let id = rec.getID();
            let index = this.indexOfId(id);
            if (index < 0) {
                return false;
            }
            this.m_records[this.m_rec_index[index]] = rec;
            this.emit('data_change', EvDataChange('update', id));
            return true;
        }
        /**
         *
         * @param data
         */
        append(rec) {
            if (!(rec instanceof Record)) {
                let nrec = this.m_model.clone();
                rec = nrec.unSerialize(rec);
            }
            console.assert(rec.getID());
            this.m_records.push(rec);
            this._rebuildIndex();
            this.emit('data_change', EvDataChange('create', rec.getID()));
        }
        /**
         *
         */
        getMaxId() {
            let maxID = undefined;
            this.m_records.forEach((r) => {
                let rid = r.getID();
                if (maxID === undefined || maxID < rid) {
                    maxID = rid;
                }
            });
            return maxID;
        }
        /**
         *
         * @param id
         */
        delete(id) {
            let idx = this.indexOfId(id);
            if (idx < 0) {
                return false;
            }
            idx = this.m_rec_index[idx];
            // mark as deleted
            this.m_records.splice(idx, 1);
            this._rebuildIndex();
            this.emit('data_change', EvDataChange('delete', id));
            return true;
        }
        /**
         * return the number of records
         */
        get count() {
            return this.m_rec_index ? this.m_rec_index.length : this.m_records.length;
        }
        /**
         * return the fields
         */
        get fields() {
            return this.m_fields;
        }
        /**
         * find the index of the element with the given id
         */
        indexOfId(id) {
            //if( this.count<10 ) {
            //	this.forEach( (rec) => rec.getID() == id );
            //}
            for (let lim = this.count, base = 0; lim != 0; lim >>= 1) {
                let p = base + (lim >> 1); // int conversion
                let idx = this.m_rec_index[p];
                let rid = this.m_records[idx].getID();
                if (rid == id) {
                    return p;
                }
                if (rid < id) {
                    base = p + 1;
                    lim--;
                }
            }
            return -1;
        }
        /**
         * return the record by it's id
         * @returns record or null
         */
        getById(id) {
            let idx = this.indexOfId(id);
            if (idx < 0) {
                return null;
            }
            idx = this.m_rec_index[idx];
            return this.m_records[idx];
        }
        /**
         * return a record by it's index
         * @returns record or null
         */
        getByIndex(index) {
            let idx = this.m_rec_index[index];
            return this._getRecord(idx);
        }
        _getRecord(index) {
            return this.m_records[index] ?? null;
        }
        moveTo(other) {
            other.setRawData(this.m_records);
        }
        /**
         * create a new view on the DataStore
         * @param opts
         */
        createView(opts) {
            let eopts = { ...opts, store: this };
            return new DataView(eopts);
        }
        /**
         *
         */
        createIndex(filter) {
            if (filter && filter.op === 'empty-result') {
                return new Uint32Array(0);
            }
            let index = new Uint32Array(this.m_records.length);
            let iidx = 0;
            if (!filter) {
                // reset filter
                this.forEach((rec, idx) => {
                    index[iidx++] = idx;
                });
            }
            else {
                if (typeof (filter.op) === 'function') {
                    let fn = filter.op;
                    // scan all records and append only interesting ones
                    this.forEach((rec, idx) => {
                        // skip deleted
                        if (!rec) {
                            return;
                        }
                        if (fn(rec)) {
                            index[iidx++] = idx;
                        }
                    });
                }
                else {
                    let filterFld = this.m_model.getFieldIndex(filter.field); // field index to filter on
                    if (filterFld < 0) {
                        // unknown filter field, nothing inside
                        console.assert(false, 'unknown field name in filter');
                        return new Uint32Array(0);
                    }
                    let filterValue = filter.value;
                    if ((0, tools_js_5.isString)(filterValue) && !filter.caseSensitive) {
                        filterValue = filterValue.toUpperCase();
                    }
                    function _lt(recval) {
                        return recval < filterValue;
                    }
                    function _le(recval) {
                        return recval <= filterValue;
                    }
                    function _eq(recval) {
                        return recval == filterValue;
                    }
                    function _neq(recval) {
                        return recval != filterValue;
                    }
                    function _ge(recval) {
                        return recval >= filterValue;
                    }
                    function _gt(recval) {
                        return recval > filterValue;
                    }
                    function _re(recval) {
                        filterRe.lastIndex = -1;
                        return filterRe.test(recval);
                    }
                    let filterFn; // filter fn 
                    let filterRe; // if fielter is regexp
                    if (filterValue instanceof RegExp) {
                        filterRe = filterValue;
                        filterFn = _re;
                    }
                    else {
                        switch (filter.op) {
                            case '<': {
                                filterFn = _lt;
                                break;
                            }
                            case '<=': {
                                filterFn = _le;
                                break;
                            }
                            case '=': {
                                filterFn = _eq;
                                break;
                            }
                            case '>=': {
                                filterFn = _ge;
                                break;
                            }
                            case '>': {
                                filterFn = _gt;
                                break;
                            }
                            case '<>': {
                                filterFn = _neq;
                                break;
                            }
                        }
                    }
                    // scan all records and append only interesting ones
                    this.forEach((rec, idx) => {
                        // skip deleted
                        if (!rec) {
                            return;
                        }
                        let field = rec.getRaw(filterFld);
                        if (field === null || field === undefined) {
                            field = '';
                        }
                        else {
                            field = '' + field;
                            if (!filter.caseSensitive) {
                                field = field.toUpperCase();
                            }
                        }
                        let keep = filterFn(field);
                        if (keep) {
                            index[iidx++] = idx;
                        }
                        ;
                    });
                }
            }
            return index.slice(0, iidx);
        }
        sortIndex(index, sort) {
            let bads = 0; // unknown fields
            let fidxs = []; // fields indexes
            // if no fields are given, reset sort by id
            if (sort === null) {
                fidxs.push({ fidx: 0, asc: true });
            }
            else {
                fidxs = sort.map((si) => {
                    let fi = this.m_model.getFieldIndex(si.field);
                    if (fi == -1) {
                        console.assert(false, 'unknown field name in sort');
                        bads++;
                    }
                    return { fidx: fi, asc: si.ascending };
                });
            }
            // unknown field or nothing to sort on ??
            if (bads || fidxs.length == 0) {
                return index;
            }
            // sort only by one field : optimize it
            if (fidxs.length == 1) {
                let field = fidxs[0].fidx;
                index.sort((ia, ib) => {
                    let va = this.getByIndex(ia).getRaw(field) ?? '';
                    let vb = this.getByIndex(ib).getRaw(field) ?? '';
                    if (va > vb) {
                        return 1;
                    }
                    if (va < vb) {
                        return -1;
                    }
                    return 0;
                });
                // just reverse if 
                if (!fidxs[0].asc) {
                    index.reverse();
                }
            }
            else {
                index.sort((ia, ib) => {
                    for (let fi = 0; fi < fidxs.length; fi++) {
                        let fidx = fidxs[fi].fidx;
                        let mul = fidxs[fi].asc ? 1 : -1;
                        let va = this.getByIndex(ia).getRaw(fidx) ?? '';
                        let vb = this.getByIndex(ib).getRaw(fidx) ?? '';
                        if (va > vb) {
                            return mul;
                        }
                        if (va < vb) {
                            return -mul;
                        }
                    }
                    return 0;
                });
            }
            return index;
        }
        /**
         *
         */
        forEach(cb) {
            if (this.m_rec_index) {
                this.m_rec_index.some((ri, index) => {
                    if (cb(this.m_records[ri], index)) {
                        return index;
                    }
                });
            }
            else {
                this.m_records.some((rec, index) => {
                    if (rec) {
                        if (cb(rec, index)) {
                            return index;
                        }
                    }
                });
            }
        }
        export() {
            return this.m_records;
        }
        changed() {
            this.emit('data_change', EvDataChange('change'));
        }
    }
    exports.DataStore = DataStore;
    function EvViewChange(action) {
        return (0, x4_events_js_3.BasicEvent)({ action });
    }
    exports.EvViewChange = EvViewChange;
    /**
     * Dataview allow different views of the DataStore.
     * You can sort the columns & filter data
     * You can have multiple views for a single DataStore
     */
    class DataView extends base_component_js_2.BaseComponent {
        m_index;
        m_store;
        m_sort;
        m_filter;
        constructor(props) {
            super(props);
            this.m_store = props.store;
            this.m_index = null;
            this.m_filter = null;
            this.m_sort = null;
            this.filter(props.filter);
            if (props.order) {
                if ((0, tools_js_5.isString)(props.order)) {
                    this.sort([{ field: props.order, ascending: true }]);
                }
                else if ((0, tools_js_5.isArray)(props.order)) {
                    this.sort(props.order);
                }
                else {
                    this.sort([props.order]);
                }
            }
            else {
                this.sort(null);
            }
            this.m_store.on('data_change', (e) => this._storeChange(e));
        }
        _storeChange(ev) {
            this._filter(this.m_filter, ev.type != 'change');
            this._sort(this.m_sort, ev.type != 'change');
            this.emit('view_change', EvViewChange('change'));
        }
        /**
         *
         * @param filter
         */
        filter(filter) {
            this.m_index = null; // null to signal that we have to run on records instead of index
            return this._filter(filter, true);
        }
        _filter(filter, notify) {
            this.m_index = this.m_store.createIndex(filter);
            this.m_filter = filter;
            // need to sort again:
            if (this.m_sort) {
                this.sort(this.m_sort);
            }
            if (notify) {
                this.emit('view_change', EvViewChange('filter'));
            }
            return this.m_index.length;
        }
        /**
         *
         * @param columns
         * @param ascending
         */
        sort(props) {
            this._sort(props, true);
        }
        _sort(props, notify) {
            this.m_index = this.m_store.sortIndex(this.m_index, props);
            this.m_sort = props;
            if (notify) {
                this.emit('view_change', EvViewChange('sort'));
            }
        }
        /**
         *
         */
        get store() {
            return this.m_store;
        }
        /**
         *
         */
        get count() {
            return this.m_index.length;
        }
        /**
         *
         * @param id
         */
        indexOfId(id) {
            let ridx = this.m_store.indexOfId(id);
            return this.m_index.findIndex((rid) => rid === ridx);
        }
        /**
         *
         * @param index
         */
        getByIndex(index) {
            if (index >= 0 && index < this.m_index.length) {
                let rid = this.m_index[index];
                return this.m_store.getByIndex(rid);
            }
            return null;
        }
        /**
         *
         * @param id
         */
        getById(id) {
            return this.m_store.getById(id);
        }
        changed() {
            this.emit('view_change', EvViewChange('change'));
        }
        /**
         *
         */
        forEach(cb) {
            debugger;
            this.m_index.some((index) => {
                let rec = this.m_store.getByIndex(index);
                if (rec) {
                    if (cb(rec, index)) {
                        return index;
                    }
                }
            });
        }
    }
    exports.DataView = DataView;
});
/**
* @file host.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/hosts/host", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.host = exports.Host = void 0;
    class Host {
        constructor() {
            exports.host = this;
        }
        makePath(...els) {
            return els.join('/');
        }
        readBinary(path) {
            return Promise.reject('not imp');
        }
        writeBinary(path, data) {
            return Promise.reject('not imp');
        }
        readUtf8(path) {
            return Promise.reject('not imp');
        }
        writeUtf8(path, data) {
            return Promise.reject('not imp');
        }
        compress(data) {
            return Promise.reject('not imp');
        }
        decompress(data) {
            return Promise.reject('not imp');
        }
        readLocalStorage(name) {
            return localStorage.getItem(name);
        }
        writeLocalStorage(name, data) {
            localStorage.setItem(name, data);
        }
        stat(name) {
            throw 'not imp';
        }
        readDir(path) {
            throw 'not imp';
        }
        require(name) {
            throw 'not imp';
        }
        cwd() {
            throw 'not imp';
        }
        getPath(type) {
            throw 'not imp';
        }
        getPathPart(path, type) {
            throw 'not imp';
        }
    }
    exports.Host = Host;
    exports.host = null;
});
/**
* @file local_storage.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/settings", ["require", "exports", "x4/hosts/host"], function (require, exports, host_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Settings = void 0;
    class Settings {
        m_data;
        m_name;
        constructor(name) {
            this.m_data = null;
            this.m_name = name ?? 'settings';
        }
        set(name, value) {
            this._load();
            this.m_data[name] = value;
            this._save();
        }
        get(name, defValue) {
            this._load();
            return this.m_data[name] ?? defValue;
        }
        _save() {
            let data = JSON.stringify(this.m_data);
            host_js_1.host.writeLocalStorage(this.m_name, data);
        }
        _load() {
            if (this.m_data) {
                return;
            }
            this.m_data = {};
            let data = host_js_1.host.readLocalStorage(this.m_name);
            if (data !== null) {
                data = JSON.parse(data);
                if (data) {
                    this.m_data = data;
                }
                else {
                    console.info('There was an error attempting to read your settings.');
                }
            }
            // console.info('There was an error attempting to read your settings.');
        }
    }
    exports.Settings = Settings;
});
define("x4/application", ["require", "exports", "x4/base_component", "x4/settings", "x4/tools", "x4/i18n"], function (require, exports, base_component_js_3, settings_js_1, tools_js_6, i18n_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Application = void 0;
    /**
     * Represents an x4 application, which is typically a single page app.
     * You should inherit Application to define yours.
     * Application derives from BaseComponent so you can use that to implement a global messaging system.
     * @example ```ts
     *
     * // in yout main caode
     * let app = new Application( );
     *
     * app.events.close.on( ( ev ) => {
     * 	... do something
     * });
     *
     * // somewhere else in the source
     * function xxx( ) {
     * 	let app = Application.instance( );
     * 	app.events.close.emit( new Events.close() );
     * }
     */
    class Application extends base_component_js_3.BaseComponent {
        static self = null;
        /**
         * the application singleton
         */
        static instance() {
            return Application.self;
        }
        m_mainView;
        m_locale;
        moneyFormatter; //@review: find a better solution
        moneySymbol; //@review: find a better solution
        m_app_name;
        m_app_version;
        m_app_uid;
        m_local_storage;
        m_user_data;
        constructor(props) {
            console.assert(Application.self === null, 'application is a singleton');
            super(props);
            this.m_app_name = props.app_name ?? 'application';
            this.m_app_version = props.app_version ?? '1.0';
            this.m_app_uid = props.app_uid ?? 'application';
            this.m_locale = props.locale ?? 'fr-FR';
            this.setCurrencySymbol(null);
            let settings_name = `${this.m_app_name}.${this.m_app_version}.settings`;
            this.m_local_storage = new settings_js_1.Settings(settings_name);
            this.m_user_data = {};
            Application.self = this;
            if ('onload' in globalThis) {
                globalThis.addEventListener('load', () => {
                    this.ApplicationCreated();
                });
            }
            else {
                this.ApplicationCreated();
            }
        }
        ApplicationCreated() {
        }
        get locale() {
            return this.m_locale;
        }
        get app_name() {
            return this.m_app_name;
        }
        get app_uid() {
            return this.m_app_uid;
        }
        get app_version() {
            return this.m_app_version;
        }
        get local_storage() {
            return this.m_local_storage;
        }
        get user_data() {
            return this.m_user_data;
        }
        get history() {
            //if( !this.m_history ) {
            //	this.m_history = new NavigationHistory( );
            //}
            //
            //return this.m_history;
            debugger;
            return null;
        }
        setCurrencySymbol(symbol) {
            if (symbol) {
                this.moneyFormatter = new Intl.NumberFormat(this.locale, { style: 'currency', currency: symbol, currencyDisplay: 'symbol' });
            }
            else {
                this.moneyFormatter = new Intl.NumberFormat(this.locale, { style: 'decimal', useGrouping: true, minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
        }
        /**
         * define the application root object (MainView)
         * @example ```ts
         *
         * let myApp = new Application( ... );
         * let mainView = new VLayout( ... );
         * myApp.setMainView( mainView  );
         */
        set mainView(root) {
            this.m_mainView = root;
            (0, tools_js_6.deferCall)(() => {
                document.body.appendChild(root._build());
            });
        }
        get mainView() {
            return this.m_mainView;
        }
        /**
         * return an application DataStore
         * @param name
         */
        getStore(name) {
            console.assert(false, "not implemented");
            return null;
        }
        setTitle(title) {
            document.title = i18n_js_2._tr.global.app_name + ' > ' + title;
        }
        disableZoomWheel() {
            window.addEventListener('mousewheel', function (ev) {
                if (ev.ctrlKey) {
                    ev.preventDefault();
                    //ev.stopPropagation( );
                }
            }, { passive: false, capture: true });
        }
        enterModal(enter) {
        }
    }
    exports.Application = Application;
    ;
});
/**
* @file icon.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/icon", ["require", "exports", "x4/component", "x4/styles", "x4/tools", "x4/x4_events"], function (require, exports, component_js_1, styles_js_2, tools_js_7, x4_events_js_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Icon = exports.EvLoaded = void 0;
    function EvLoaded(url, svg, context = null) {
        return (0, x4_events_js_4.BasicEvent)({ url, svg, context });
    }
    exports.EvLoaded = EvLoaded;
    class Loader extends x4_events_js_4.EventSource {
        svgs;
        constructor() {
            super();
            this.svgs = new Map();
        }
        load(url) {
            if (this.svgs.has(url)) {
                const svg = this.svgs.get(url);
                if (svg) {
                    //console.log( 'cached=', url );
                    this.signal('loaded', EvLoaded(url, svg));
                }
            }
            else {
                // mark it as loading
                this.svgs.set(url, null);
                // then start loading
                const _load = async (url) => {
                    const r = await fetch(url);
                    if (r.ok) {
                        const svg = await r.text();
                        this.svgs.set(url, svg);
                        //console.log( 'signal=', url );
                        this.signal('loaded', EvLoaded(url, svg));
                    }
                };
                _load(url);
            }
        }
    }
    const svgLoader = new Loader();
    /**
     * standard icon
     */
    class Icon extends component_js_1.Component {
        m_icon;
        m_iconName;
        constructor(props) {
            super(props);
            this._setIcon(props.icon, false);
            if (props.size) {
                this.setStyleValue('fontSize', props.size);
            }
        }
        _setIcon(icon, remove_old) {
            const reUrl = /\s*url\s*\(\s*(.+)\s*\)\s*/gi;
            const reSvg = /\s*svg\s*\(\s*(.+)\s*\)\s*/gi;
            const reSvg2 = /(.*\.svg)$/gi;
            if (!icon) {
                this.m_iconName = '';
                return;
            }
            let name;
            let url;
            if (typeof (icon) === 'number') {
                icon = icon.toString(16);
                name = icon;
            }
            else {
                let match_svg = reSvg.exec(icon) || reSvg2.exec(icon);
                if (match_svg) {
                    url = match_svg[1].trim();
                    this._setSVG(url);
                    return;
                }
                else {
                    this.removeClass('@svg');
                    let match_url = reUrl.exec(icon);
                    if (match_url) {
                        url = match_url[1].trim();
                        name = url.replace(/[/\\\.\* ]/g, '_');
                    }
                    else {
                        name = icon;
                        icon = styles_js_2.Stylesheet.getVar('icon-' + icon);
                        if (icon == '' || icon === undefined) {
                            // name your icon 'icon-xxx'
                            // ex:
                            // :root { --icon-zoom-p: f00e; }
                            console.assert(false);
                            icon = '0';
                        }
                    }
                }
            }
            this.m_iconName = name;
            if (this.m_icon === icon) {
                return;
            }
            let css = component_js_1.Component.getCss(), rulename;
            if (remove_old && this.m_icon) {
                rulename = 'icon-' + name;
                this.removeClass(rulename);
            }
            // generate dynamic css icon rule
            rulename = 'icon-' + name;
            if (Icon.icon_cache[rulename] === undefined) {
                Icon.icon_cache[rulename] = true;
                let rule;
                if (url) {
                    rule = `display: block; content: ' '; background-image: url(${url}); background-size: contain; width: 100%; height: 100%; background-repeat: no-repeat; color: white;`;
                }
                else {
                    rule = `content: "\\${icon}";`;
                }
                css.setRule(rulename, `.${rulename}::before {${rule}}`);
            }
            this.addClass(rulename);
            this.m_icon = icon;
        }
        /**
         * change the icon
         * @param icon - new icon
         */
        set icon(icon) {
            this._setIcon(icon, true);
        }
        get icon() {
            return this.m_iconName;
        }
        _setSVG(url) {
            const set = (ev) => {
                //console.log( 'set=', ev.url, 'url=', url );
                if (ev.url == url) {
                    this.addClass('@svg-icon');
                    this.setContent(tools_js_7.HtmlString.from(ev.svg), false);
                    svgLoader.off('loaded', set);
                }
            };
            svgLoader.on('loaded', set);
            svgLoader.load(url);
        }
        /**
         *
         */
        static icon_cache = [];
    }
    exports.Icon = Icon;
});
/**
* @file label.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/label", ["require", "exports", "x4/component", "x4/tools", "x4/icon"], function (require, exports, component_js_2, tools_js_8, icon_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Label = void 0;
    /**
     * Standard label
     */
    class Label extends component_js_2.Component {
        constructor(param) {
            if (typeof (param) === 'string' || param instanceof tools_js_8.HtmlString) {
                super({ text: param });
            }
            else {
                super(param);
            }
        }
        /** @ignore */
        render(props) {
            if (!props.icon) {
                this.setContent(this.m_props.text);
            }
            else {
                this.setProp('tag', 'span');
                this.addClass('@hlayout');
                this.setContent([
                    new icon_js_1.Icon({ icon: props.icon }),
                    new component_js_2.Component({ content: this.m_props.text, ref: 'text' })
                ]);
            }
            this.addClass(props.align ?? 'left');
        }
        /**
         * change the displayed text
         * @param text - new text
         */
        set text(text) {
            let props = this.m_props;
            if (props.text !== text) {
                props.text = text;
                if (this.dom) {
                    let comp = this;
                    if (this.m_props.icon) {
                        comp = this.itemWithRef('text');
                    }
                    comp.setContent(this.m_props.text);
                }
            }
        }
        /**
         *
         */
        get text() {
            return this.m_props.text;
        }
    }
    exports.Label = Label;
});
/**
* @file popup.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/popup", ["require", "exports", "x4/component", "x4/tools", "x4/x4_events", "x4/application"], function (require, exports, component_js_3, tools_js_9, x4_events_js_5, application_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Popup = exports.EvMove = void 0;
    function EvMove(pos) {
        return (0, x4_events_js_5.BasicEvent)({ pos });
    }
    exports.EvMove = EvMove;
    /**
     * base class for all popup elements
     */
    class Popup extends component_js_3.Container {
        m_ui_mask;
        m_hasMask = true;
        static modal_stack = [];
        constructor(props) {
            super(props);
            this.addClass('@hidden');
        }
        enableMask(enable = true) {
            this.m_hasMask = enable;
        }
        /**
         * display the popup on screen
         */
        show(modal) {
            if (modal !== undefined) {
                this.m_hasMask = modal ? true : false;
            }
            else {
                modal = this.m_hasMask;
            }
            if (this.m_hasMask) {
                // remove the focus
                const focus = document.activeElement;
                if (focus) {
                    focus.blur();
                }
                this.m_ui_mask = document.body.lastChild;
                while (this.m_ui_mask) {
                    if (this.m_ui_mask.nodeType == 1) { // only element nodes
                        let elUI = (0, component_js_3.flyWrap)(this.m_ui_mask);
                        if (elUI.hasClass('@menu') || elUI.hasClass('@non-maskable')) {
                            /* avoid circular dependencies instanceof Menu*/
                            /* avoid nonmaskable elements tobe masked */
                        }
                        else if (elUI.getStyleValue('display') == 'none' || !elUI.isUserVisible()) {
                            /* avoid masking hidden elements */
                        }
                        else if (!elUI.hasClass('@comp')) {
                            /* avoid masking element that are not to us */
                        }
                        else {
                            break;
                        }
                    }
                    this.m_ui_mask = this.m_ui_mask.previousSibling;
                }
                if (this.m_ui_mask) {
                    (0, component_js_3.flyWrap)(this.m_ui_mask).addClass('@mask');
                }
            }
            if (modal) {
                application_js_1.Application.instance().enterModal(true);
            }
            // to avoid body growing because of appendChild
            this.setStyle({
                left: 0,
                top: 0
            });
            document.body.appendChild(this._build());
            this.removeClass('@hidden');
            let rc = this.getBoundingRect();
            let x = (document.body.clientWidth - rc.width) / 2, y = (document.body.clientHeight - rc.height) / 2;
            this.setStyleValue('left', x);
            this.setStyleValue('top', y);
            if (modal) {
                let focus = document.activeElement;
                if (!this.dom.contains(focus)) {
                    const autofocus = this.queryItem('[autofocus]');
                    if (autofocus) {
                        autofocus.focus();
                    }
                    else {
                        let tabbable = this.queryItem('[tabindex]');
                        if (tabbable) {
                            let tab_indexes = [].map.call(tabbable, (e) => { return e; });
                            // remove hidden elements
                            tab_indexes = tab_indexes.filter((el) => el.offsetParent !== null);
                            if (tab_indexes.length) {
                                tab_indexes[0].focus();
                            }
                        }
                    }
                }
                Popup.modal_stack.push(this.dom);
            }
        }
        /**
        * display the popup at a specific position
        * @param x
        * @param y
        */
        displayAt(x, y, align = 'top left', offset) {
            this.show();
            let halign = 'l', valign = 't';
            if (align.indexOf('right') >= 0) {
                halign = 'r';
            }
            if (align.indexOf('bottom') >= 0) {
                valign = 'b';
            }
            // @TODO: this is a minimal overflow problem solution
            let rc = document.body.getBoundingClientRect(), rm = this.getBoundingRect();
            if (halign == 'r') {
                x -= rm.width;
            }
            if (valign == 'b') {
                y -= rm.height;
            }
            if (offset) {
                x += offset.x;
                y += offset.y;
            }
            if (x < 4) {
                x = 4;
            }
            if ((x + rm.width) > rc.right - 4) {
                x = rc.right - 4 - rm.width;
                if (offset?.x < 0) {
                    x += offset.x;
                }
            }
            if (y < 4) {
                y = 4;
            }
            if ((y + rm.height) > rc.bottom - 4) {
                y = rc.bottom - 4 - rm.height;
                if (offset?.y < 0) {
                    y += offset.y;
                }
            }
            this.setStyle({ left: x, top: y });
        }
        /**
         * close the popup
         */
        close() {
            this.hide();
            if (this.m_hasMask && this.m_ui_mask) {
                (0, component_js_3.flyWrap)(this.m_ui_mask).removeClass('@mask');
                const app = application_js_1.Application.instance();
                app.enterModal(false);
            }
            let index = Popup.modal_stack.indexOf(this.dom);
            if (index >= 0) {
                Popup.modal_stack.splice(index);
            }
            this.dispose();
        }
        componentCreated() {
            if (this.m_props.sizable) {
                this.addClass('@size-all');
                let els = ['top', 'right', 'bottom', 'left', 'topleft', 'topright', 'bottomleft', 'bottomright'];
                for (let sens of els) {
                    new component_js_3.SizerOverlay({
                        target: this,
                        sens: sens,
                        events: { rawresize: (e) => this._mouseResize(e) }
                    });
                }
            }
        }
        /**
         * resize for 'all' resize attribute
         */
        _mouseResize(event) {
            event.preventDefault();
            let irc = this.getBoundingRect();
            let st = this.getComputedStyle();
            let ev = event.ui_event;
            let tm = st.parse('marginTop'), lm = st.parse('marginLeft'), rm = st.parse('marginRight'), bm = st.parse('marginBottom');
            let ix = 0, iy = 0;
            let mp = (0, tools_js_9.getMousePos)(ev, true);
            // horz
            switch (event.sens) {
                case 'topright':
                case 'bottomright':
                case 'right':
                    ix = (irc.right - rm) - mp.x;
                    break;
                case 'topleft':
                case 'bottomleft':
                case 'left':
                    ix = (irc.left - lm) - mp.x;
                    break;
            }
            // vert
            switch (event.sens) {
                case 'bottomleft':
                case 'bottomright':
                case 'bottom':
                    iy = (irc.bottom - bm) - mp.y;
                    break;
                case 'topleft':
                case 'topright':
                case 'top':
                    iy = (irc.top - tm) - mp.y;
                    break;
            }
            // left & top are with margin
            // width & height not
            irc.left -= lm;
            irc.top -= tm;
            //console.log( 'capture' );
            let sens = event.sens;
            component_js_3.Component.setCapture(this, (ne) => {
                //console.log( ne );
                let __move = (ex, ey) => {
                    let left = irc.left, top = irc.top, width = irc.width, height = irc.height;
                    let dx, dy;
                    let px = ex + ix, py = ey + iy;
                    if (px < 0) {
                        px = 0;
                    }
                    if (py < 0) {
                        py = 0;
                    }
                    // horz
                    switch (sens) {
                        case 'topright':
                        case 'bottomright':
                        case 'right':
                            width = px - left;
                            break;
                        case 'topleft':
                        case 'bottomleft':
                        case 'left':
                            dx = left - px;
                            width += dx;
                            left -= dx;
                            break;
                    }
                    // vert
                    switch (sens) {
                        case 'bottomleft':
                        case 'bottomright':
                        case 'bottom':
                            height = py - top;
                            break;
                        case 'topleft':
                        case 'topright':
                        case 'top':
                            dy = top - py;
                            height += dy;
                            top -= dy;
                            break;
                    }
                    let newsize = new tools_js_9.Size(width, height);
                    this.setStyle({ left, top, width: newsize.width, height: newsize.height });
                    this.emit('size', (0, component_js_3.EvSize)(newsize));
                };
                if (ne.type == 'mouseup' || ne.type == 'touchend') {
                    component_js_3.Component.releaseCapture();
                }
                else if (ne.type == 'mousemove') {
                    let me = ne;
                    __move(me.pageX, me.pageY);
                }
                else if (ne.type == 'touchmove') {
                    let tev = ne;
                    __move(tev.touches[0].pageX, tev.touches[0].pageY);
                }
            });
        }
    }
    exports.Popup = Popup;
    /**
     * handle tab key
     */
    function x4handleKeyDown(e) {
        if (e.key == 'Tab' || e.key == 'Enter') {
            const target = e.target;
            if (target.tagName == 'TEXTAREA') {
                return;
            }
            const el = component_js_3.Component.getElement(target);
            if (el && (el.hasAttribute('wants-tab') || el.hasAttribute('wants-enter'))) {
                return;
            }
            let topStack = document.body;
            if (Popup.modal_stack.length) {
                topStack = Popup.modal_stack[Popup.modal_stack.length - 1];
            }
            _nextTab(topStack, e.target, e.shiftKey);
            e.stopPropagation();
            e.preventDefault();
        }
    }
    /**
     * cycle through tabs
     */
    function _nextTab(root, el, prev) {
        // first check if the focus is one of our child (disabled...)
        let focusEl = document.activeElement;
        if (!root.contains(focusEl)) {
            return;
        }
        let comp = component_js_3.Component.getElement(el);
        // get a list of elements with tab index, this way we should abble to
        // cycle on them (not on browser address nor under dialog elements)
        let tabbable = root.querySelectorAll('[tabindex]');
        let tab_indexes = [].map.call(tabbable, (e) => { return e; });
        // remove hidden elements
        tab_indexes = tab_indexes.filter((el) => el.offsetParent !== null);
        if (!tab_indexes.length) {
            return;
        }
        let ct = tab_indexes.indexOf(el);
        if (ct < 0) {
            ct = 0;
        }
        else {
            if (prev) {
                if (ct > 0) {
                    ct--;
                }
                else {
                    ct = tab_indexes.length - 1;
                }
            }
            else {
                if (ct < tab_indexes.length - 1) {
                    ct++;
                }
                else {
                    ct = 0;
                }
            }
        }
        tab_indexes[ct].focus();
    }
    function installKBHandler() {
        // set on body to be called after document (where all component domevent go)
        document.body.addEventListener('keydown', x4handleKeyDown, true);
    }
    // too early ?
    document.body ? installKBHandler() : window.addEventListener('load', installKBHandler);
});
/**
 * @file layout.ts
 * @author Etienne Cochard
 * @license
 * Copyright (c) 2019-2021 R-libre ingenierie
 *
 *	This program is free software; you can redistribute it and/or modify
 *	it under the terms of the GNU General Public License as published by
 *	the Free Software Foundation; either version 3 of the License, or
 *	(at your option) any later version.
 *
 *	This program is distributed in the hope that it will be useful,
 *	but WITHOUT ANY WARRANTY; without even the implied warranty of
 *	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *	GNU General Public License for more details.
 *
 *	You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>..
 */
define("x4/layout", ["require", "exports", "x4/component", "x4/tools"], function (require, exports, component_js_4, tools_js_10) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ScrollView = exports.TableLayout = exports.GridLayout = exports.AutoLayout = exports.VLayout = exports.HLayout = exports.AbsLayout = void 0;
    // ============================================================================
    // [ABSLAYOUT]
    // ============================================================================
    class AbsLayout extends component_js_4.Container {
    }
    exports.AbsLayout = AbsLayout;
    // ============================================================================
    // [HLAYOUT]
    // ============================================================================
    class HLayout extends component_js_4.Container {
    }
    exports.HLayout = HLayout;
    // ============================================================================
    // [VLAYOUT]
    // ============================================================================
    class VLayout extends component_js_4.Container {
    }
    exports.VLayout = VLayout;
    class AutoLayout extends component_js_4.Container {
        constructor(props) {
            super(props);
            this.setDomEvent('sizechange', () => this._updateLayout());
        }
        componentCreated() {
            super.componentCreated();
            this._updateLayout();
        }
        _updateLayout() {
            let horz = this.m_props.defaultLayout == 'horizontal' ? true : false;
            if (this.m_props.switchSize <= 0 && window.screen.height > window.screen.width) {
                horz = !horz;
            }
            else {
                let rc = this.getBoundingRect();
                if ((horz && rc.width < this.m_props.switchSize) || (!horz && rc.height < this.m_props.switchSize)) {
                    horz = !horz;
                }
            }
            if (horz) {
                this.removeClass('@vlayout');
                this.addClass('@hlayout');
            }
            else {
                this.addClass('@vlayout');
                this.removeClass('@hlayout');
            }
        }
    }
    exports.AutoLayout = AutoLayout;
    class GridLayout extends component_js_4.Container {
        constructor(props) {
            /// @ts-ignore
            // Argument of type 'GridLayoutProps' is not assignable to parameter of type 'P'.
            // 'GridLayoutProps' is assignable to the constraint of type 'P', but 'P' could be instantiated with a different subtype of constraint 'GridLayoutProps'.
            super(props);
        }
        /** @ignore */
        render() {
            if (this.m_props.colSizes) {
                this.setStyleValue('grid-template-columns', this.m_props.colSizes);
            }
            if (this.m_props.rowSizes) {
                this.setStyleValue('grid-template-rows', this.m_props.rowSizes);
            }
            if (this.m_props.colGap) {
                this.setStyleValue('grid-gap', this.m_props.colGap);
            }
            if (this.m_props.template) {
                this.setStyleValue('grid-template-areas', this.m_props.template.join('\n'));
            }
        }
    }
    exports.GridLayout = GridLayout;
    class TableLayout extends component_js_4.Container {
        m_cells;
        constructor(props) {
            super(props);
            this.setProp('tag', 'table');
            this.m_cells = new Map();
        }
        _getCell(row, col, create = true) {
            let idx = _mkid(row, col);
            return this.m_cells.get(idx) ?? (create ? { item: undefined } : null);
        }
        _setCell(row, col, cell, update = false) {
            let idx = _mkid(row, col);
            this.m_cells.set(idx, cell);
            if (this.dom && cell.item && update) {
                if (cell.item instanceof component_js_4.Component) {
                    cell.item.update();
                }
                else {
                    this.enumChilds((c) => {
                        let crow = c.getData('row');
                        if (crow == row) {
                            let ccol = c.getData('col');
                            if (ccol == col) {
                                c.setContent(cell.item);
                                c.update();
                                return true;
                            }
                        }
                    });
                }
            }
        }
        setCell(row, col, item) {
            let cell = this._getCell(row, col);
            cell.item = item;
            this._setCell(row, col, cell, true);
        }
        merge(row, col, rowCount, colCount) {
            let cell = this._getCell(row, col);
            cell.rowSpan = rowCount;
            cell.colSpan = colCount;
            this._setCell(row, col, cell);
        }
        setCellWidth(row, col, width) {
            let cell = this._getCell(row, col);
            cell.width = width;
            this._setCell(row, col, cell);
        }
        setCellHeight(row, col, height) {
            let cell = this._getCell(row, col);
            cell.height = height;
            this._setCell(row, col, cell);
        }
        setCellClass(row, col, cls) {
            let cell = this._getCell(row, col);
            cell.cls = cls;
            this._setCell(row, col, cell);
        }
        setColClass(col, cls) {
            let cell = this._getCell(-1, col);
            cell.cls = cls;
            this._setCell(-1, col, cell);
        }
        setRowClass(row, cls) {
            let cell = this._getCell(row, 999);
            cell.cls = cls;
            this._setCell(row, 999, cell);
        }
        getCell(row, col) {
            let cell = this._getCell(row, col);
            return cell?.item;
        }
        render() {
            let rows = [];
            let skip = [];
            for (let r = 0; r < this.m_props.rows; r++) {
                let cols = [];
                for (let c = 0; c < this.m_props.columns; c++) {
                    let idx = _mkid(r, c);
                    if (skip.indexOf(idx) >= 0) {
                        continue;
                    }
                    let cell = this.m_cells.get(idx);
                    let cdata = this.m_cells.get(_mkid(-1, c));
                    let cls = '';
                    if (cell && cell.cls) {
                        cls = cell.cls;
                    }
                    if (cdata && cdata.cls) {
                        cls += ' ' + cdata.cls;
                    }
                    let cc = new component_js_4.Component({
                        tag: 'td',
                        content: cell?.item,
                        width: cell?.width,
                        height: cell?.height,
                        data: { row: r, col: c },
                        cls
                    });
                    if (cell) {
                        let rs = cell.rowSpan ?? 0, cs = cell.colSpan ?? 0;
                        if (rs > 0) {
                            cc.setAttribute('rowspan', rs + 1);
                        }
                        if (cs > 0) {
                            cc.setAttribute('colspan', cs + 1);
                        }
                        if (rs || cs) {
                            for (let sr = 0; sr <= rs; sr++) {
                                for (let sc = 0; sc <= cs; sc++) {
                                    skip.push(_mkid(sr + r, sc + c));
                                }
                            }
                        }
                    }
                    cols.push(cc);
                }
                let rdata = this._getCell(r, 999, false);
                let rr = new component_js_4.Component({
                    tag: 'tr',
                    data: { row: r },
                    content: cols,
                    cls: rdata?.cls
                });
                rows.push(rr);
            }
            this.setContent(rows);
        }
    }
    exports.TableLayout = TableLayout;
    /**
     * @ignore
     */
    function _mkid(row, col) {
        return row * 1000 + col;
    }
    /**
     * @ignore
     */
    function _getid(key) {
        return {
            row: Math.floor(key / 1000) | 0,
            col: (key % 1000) | 0
        };
    }
    class ScrollView extends component_js_4.Component {
        constructor(props) {
            super(props);
            this.setContent(props.content);
        }
        setContent(content) {
            if (!content) {
                super.setContent(null);
            }
            else {
                let container;
                if ((0, tools_js_10.isArray)(content)) {
                    container = new VLayout({ content });
                }
                else {
                    container = content;
                }
                container.addClass('@scroll-container');
                super.setContent(container);
            }
        }
    }
    exports.ScrollView = ScrollView;
});
/**
* @file menu.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/menu", ["require", "exports", "x4/component", "x4/x4_events", "x4/popup", "x4/icon", "x4/label", "x4/layout"], function (require, exports, component_js_5, x4_events_js_6, popup_js_1, icon_js_2, label_js_1, layout_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MenuBar = exports.MenuItem = exports.Menu = exports.MenuTitle = exports.MenuSeparator = void 0;
    // ============================================================================
    // [MENU]
    // ============================================================================
    class MenuSeparator extends component_js_5.Component {
    }
    exports.MenuSeparator = MenuSeparator;
    class MenuTitle extends label_js_1.Label {
    }
    exports.MenuTitle = MenuTitle;
    class Menu extends popup_js_1.Popup {
        static watchCount = 0;
        static rootMenu = null;
        m_subMenu;
        m_opener;
        m_virtual;
        m_lock;
        constructor(props, opener) {
            super(props);
            this.addClass('@shadow');
            this.m_opener = opener;
            this.m_virtual = false;
            this.m_lock = 0;
            this.enableMask(false);
        }
        lock(yes) {
            this.m_lock += yes ? 1 : -1;
        }
        setVirtual() {
            this.m_virtual = true;
        }
        setSubMenu(menu) {
            this.m_subMenu = menu;
        }
        hideSubMenu() {
            if (this.m_subMenu) {
                this.m_subMenu.m_opener._close();
                this.m_subMenu.hide();
                this.m_subMenu = null;
            }
        }
        /** @ignore */
        render(props) {
            this.setContent(props.items);
        }
        /**
        *
        */
        show() {
            if (!this.m_virtual) {
                Menu._addMenu(this);
            }
            super.show();
        }
        /**
         *
        */
        close() {
            if (!this.dom && !this.m_virtual) {
                return;
            }
            if (this.m_opener) {
                this.m_opener._close();
            }
            if (this.m_subMenu) {
                this.m_subMenu.close();
                this.m_subMenu = null;
            }
            super.close();
            Menu._removeMenu();
        }
        /**
         *
         */
        clear() {
            this.m_props.items = [];
        }
        /**
        * @internal
        */
        static _addMenu(menu) {
            //console.log( 'addmenu' );
            if (Menu.watchCount == 0) {
                Menu.rootMenu = menu;
                document.addEventListener('mousedown', Menu._mouseWatcher);
            }
            Menu.watchCount++;
        }
        static _removeMenu() {
            //console.log( 'removemenu' );
            console.assert(Menu.watchCount > 0);
            Menu.watchCount--;
            if (Menu.watchCount == 0) {
                document.removeEventListener('mousedown', Menu._mouseWatcher);
            }
        }
        static _mouseWatcher(ev) {
            if (ev.defaultPrevented) {
                return;
            }
            let elOn = ev.target;
            while (elOn) {
                // is mouse on a menu
                let mouseon = component_js_5.Component.getElement(elOn);
                if (mouseon && (mouseon instanceof Menu /*|| elOn.$el instanceof Menubar*/)) {
                    return;
                }
                elOn = elOn.parentElement;
            }
            Menu._discardAll();
        }
        /**
        * hide all the visible menus
        */
        static _discardAll() {
            if (Menu.rootMenu) {
                Menu.rootMenu.close();
                Menu.rootMenu = null;
            }
        }
        displayAt(x, y, align = 'top left', offset) {
            if (!this.m_lock) {
                Menu._discardAll();
            }
            super.displayAt(x, y, align, offset);
        }
    }
    exports.Menu = Menu;
    class MenuItem extends component_js_5.Component {
        m_menu;
        m_isOpen;
        constructor(props) {
            super(props);
            this.m_menu = null;
            this.m_isOpen = false;
            this.setDomEvent('mousedown', (e) => this._mousedown(e));
            this.setDomEvent('click', (e) => this._click(e));
            this.mapPropEvents(props, 'click');
        }
        /** @ignore */
        render(props) {
            let icon = props.icon ?? 0x20;
            let text = props.text;
            if (props.checked !== undefined) {
                icon = props.checked ? 0xf00c : 0; //todo: use stylesheet
            }
            if (this.isPopup) {
                this.addClass('@popup-menu-item');
            }
            if (!text && !icon) {
                this.addClass('@separator');
            }
            if (props.cls) {
                this.addClass(props.cls);
            }
            this.setProp('tag', 'a');
            //@bug: do not kill focus on click 
            //	this.setAttribute( 'tabindex', '0' );
            this.setContent([
                icon < 0 ? null : new icon_js_2.Icon({ icon }),
                new label_js_1.Label({ flex: 1, text })
            ]);
        }
        get id() {
            return this.m_props.itemId;
        }
        get text() {
            return this.m_props.text;
        }
        get isPopup() {
            return !!this.m_props.items;
        }
        _close() {
            this.removeClass('@opened');
            this.m_isOpen = false;
        }
        _click(ev) {
            if (!this.isPopup) {
                this.emit('click', (0, x4_events_js_6.EvClick)());
                Menu._discardAll();
            }
        }
        _mousedown(ev) {
            if (this.isPopup) {
                if (!this.m_menu) {
                    this.m_menu = new Menu({ items: this.m_props.items }, this);
                }
                let doClose = this.m_isOpen;
                // if parent menu has an opened sub menu, close it
                let parent_menu = component_js_5.Component.getElement(this.dom, Menu);
                if (parent_menu) {
                    parent_menu.hideSubMenu();
                }
                if (!doClose) {
                    if (parent_menu) {
                        parent_menu.setSubMenu(this.m_menu);
                    }
                    this.m_isOpen = true;
                    let rc = this.getBoundingRect();
                    this.m_menu.lock(true);
                    if (parent_menu) {
                        // standard menu
                        this.m_menu.displayAt(rc.right, rc.top);
                    }
                    else {
                        // menubar / menubutton
                        this.m_menu.displayAt(rc.left, rc.bottom);
                    }
                    this.m_menu.lock(false);
                    this.addClass('@opened');
                }
                ev.preventDefault();
            }
        }
    }
    exports.MenuItem = MenuItem;
    /**
     *
     */
    class MenuBar extends layout_js_1.HLayout {
        m_items;
        constructor(props, opener) {
            super(props);
            console.assert(false, 'not imp');
            this.addClass('@shadow');
            this.m_items = props.items;
        }
        /** @ignore */
        render() {
            this.setContent(this.m_items);
        }
    }
    exports.MenuBar = MenuBar;
});
/**
* @file button.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/button", ["require", "exports", "x4/component", "x4/x4_events", "x4/icon", "x4/label", "x4/menu", "x4/tools"], function (require, exports, component_js_6, x4_events_js_7, icon_js_3, label_js_2, menu_js_1, tools_js_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleButton = exports.Button = exports.BaseButton = void 0;
    /**
     * Base button
     */
    class BaseButton extends component_js_6.Component {
        constructor(props) {
            super(props);
            this.setProp('tag', 'button');
            this.setDomEvent('click', (e) => this._handleClick(e));
            this.setDomEvent('mousedown', () => { this._startAutoRep(true); });
            this.setDomEvent('mouseup', () => { this._startAutoRep(false); });
            this.setDomEvent('keydown', (e) => this._handleKeyDown(e));
            this.mapPropEvents(props, 'click');
        }
        render(props) {
            let icon = props.icon ? new icon_js_3.Icon({ icon: props.icon, cls: 'left', ref: 'l_icon' }) : null;
            let label = new label_js_2.Label({ flex: 1, text: props.text ?? '', align: props.align, ref: 'label' });
            let ricon = props.rightIcon ? new icon_js_3.Icon({ icon: props.rightIcon, cls: 'right', ref: 'r_icon' }) : null;
            this.setContent([icon, label, ricon]);
            this._setTabIndex(props.tabIndex);
        }
        /**
         * starts/stops the autorepeat
         */
        _startAutoRep(start) {
            if (!this.m_props.autoRepeat) {
                return;
            }
            if (start) {
                // 1st timer 1s
                this.startTimer('repeat', 700, false, () => {
                    // auto click
                    this.startTimer('repeat', this.m_props.autoRepeat, true, this._sendClick);
                });
            }
            else {
                this.stopTimer('repeat');
            }
        }
        /**
         *
         */
        _handleKeyDown(ev) {
            if (!ev.ctrlKey && !ev.shiftKey && !ev.altKey) {
                if (ev.key == 'Enter' || ev.key == ' ') {
                    this._sendClick();
                    ev.preventDefault();
                    ev.stopPropagation();
                }
            }
        }
        /**
         * called by the system on click event
         */
        _handleClick(ev) {
            if (this.m_props.menu) {
                let menu = new menu_js_1.Menu({
                    items: (0, tools_js_11.isFunction)(this.m_props.menu) ? this.m_props.menu() : this.m_props.menu
                });
                let rc = this.getBoundingRect();
                menu.displayAt(rc.left, rc.bottom, 'tl');
            }
            else {
                this._sendClick();
            }
            ev.preventDefault();
            ev.stopPropagation();
        }
        /**
         * sends a click to the observers
         */
        _sendClick() {
            if (this.m_props.menu) {
                let menu = new menu_js_1.Menu({
                    items: (0, tools_js_11.isFunction)(this.m_props.menu) ? this.m_props.menu() : this.m_props.menu
                });
                let rc = this.getBoundingRect();
                menu.displayAt(rc.left, rc.bottom, 'tl');
            }
            else {
                this.emit('click', (0, x4_events_js_7.EvClick)());
            }
        }
        /**
         * change the button text
         * @example
         * ```ts
         * let btn = new Button( {
         * 	text: 'hello'
         * });
         *
         * btn.text = 'world';
         * ```
         */
        set text(text) {
            this.m_props.text = text;
            let label = this.itemWithRef('label');
            if (label) {
                label.text = text;
            }
        }
        get text() {
            let label = this.itemWithRef('label');
            return label?.text;
        }
        /**
         * change the button icon
         * todo: do nothing if no icon defined at startup
         *
         * @example
         * ```ts
         * let btn = new Button( {
         * 	text: 'hello',
         *  icon: 'close'
         * });
         * btn.setIcon( 'open' );
         * ```
         */
        set icon(icon) {
            this.m_props.icon = icon;
            let ico = this.itemWithRef('l_icon');
            if (ico) {
                ico.icon = icon;
            }
        }
        get icon() {
            let ico = this.itemWithRef('l_icon');
            return ico?.icon;
        }
        /**
         * change the button right icon
         * todo: do nothing if no icon defined at startup
         *
         * @example
         * ```ts
         * let btn = new Button( {
         * 	text: 'hello',
         *  icon: 'close'
         * });
         * btn.setIcon( 'open' );
         * ```
         */
        set rightIcon(icon) {
            this.m_props.rightIcon = icon;
            let ico = this.itemWithRef('r_icon');
            if (ico) {
                ico.icon = icon;
            }
        }
        get rightIcon() {
            let ico = this.itemWithRef('l_icon');
            return ico?.icon;
        }
        /**
         *
         */
        set menu(items) {
            this.m_props.menu = items;
        }
    }
    exports.BaseButton = BaseButton;
    // :: BUTTON ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    /**
     *
     */
    class Button extends BaseButton {
    }
    exports.Button = Button;
    /**
     *
     */
    class ToggleButton extends BaseButton {
        constructor(props) {
            super(props);
        }
        /**
         *
         */
        render(props) {
            super.render(props);
            if (props.checked) {
                this.addClass('checked');
                this._updateIcon();
            }
        }
        /**
         *
         */
        _sendClick() {
            super._sendClick();
            this.m_props.checked = !this.m_props.checked;
            this.setClass('checked', this.m_props.checked);
            this.emit('change', (0, x4_events_js_7.EvChange)(this.m_props.checked));
            this._updateIcon();
        }
        _updateIcon() {
            if (this.m_props.checkedIcon) {
                const ic = this.m_props.checked ? this.m_props.checkedIcon : this.m_props.icon;
                let ico = this.itemWithRef('l_icon');
                if (ico) {
                    ico.icon = ic;
                }
            }
        }
    }
    exports.ToggleButton = ToggleButton;
});
/**
* @file calendar.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/calendar", ["require", "exports", "x4/button", "x4/popup", "x4/component", "x4/x4_events", "x4/i18n", "x4/label", "x4/layout", "x4/tools", "x4/menu"], function (require, exports, button_js_1, popup_js_2, component_js_7, x4_events_js_8, i18n_js_3, label_js_3, layout_js_2, tools_js_12, menu_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PopupCalendar = exports.Calendar = void 0;
    /**
     * default calendar control
     *
     * fires:
     * 	EventChange ( value = Date )
     */
    class Calendar extends layout_js_2.VLayout {
        m_date;
        constructor(props) {
            super(props);
            this.mapPropEvents(props, 'change');
            this.m_date = props.date?.clone() ?? new Date();
        }
        /** @ignore */
        render(props) {
            let month_start = (0, tools_js_12.date_clone)(this.m_date);
            month_start.setDate(1);
            let day = month_start.getDay();
            if (day == 0) {
                day = 7;
            }
            month_start.setDate(-day + 1 + 1);
            let dte = (0, tools_js_12.date_clone)(month_start);
            let today = this.m_date.hash();
            let month_end = (0, tools_js_12.date_clone)(this.m_date);
            month_end.setDate(1);
            month_end.setMonth(month_end.getMonth() + 1);
            month_end.setDate(0);
            let end_of_month = (0, tools_js_12.date_hash)(month_end);
            let rows = [];
            // month selector
            let header = new layout_js_2.HLayout({
                cls: 'month-sel',
                content: [
                    new label_js_3.Label({
                        cls: 'month',
                        text: (0, tools_js_12.formatIntlDate)(this.m_date, 'O'),
                        dom_events: {
                            click: () => this._choose('month')
                        }
                    }),
                    new label_js_3.Label({
                        cls: 'year',
                        text: (0, tools_js_12.formatIntlDate)(this.m_date, 'Y'),
                        dom_events: {
                            click: () => this._choose('year')
                        }
                    }),
                    new component_js_7.Flex(),
                    new button_js_1.Button({ text: '<', click: () => this._next(false) }),
                    new button_js_1.Button({ text: '>', click: () => this._next(true) })
                ]
            });
            rows.push(header);
            // calendar part
            let day_names = [];
            // day names
            // empty week num
            day_names.push(new layout_js_2.HLayout({
                cls: 'weeknum cell',
            }));
            for (let d = 0; d < 7; d++) {
                day_names.push(new label_js_3.Label({
                    cls: 'cell',
                    flex: 1,
                    text: i18n_js_3._tr.global.day_short[(d + 1) % 7]
                }));
            }
            rows.push(new layout_js_2.HLayout({
                cls: 'week header',
                content: day_names
            }));
            let cmonth = this.m_date.getMonth();
            // weeks
            let first = true;
            while ((0, tools_js_12.date_hash)(dte) <= end_of_month) {
                let days = [
                    new layout_js_2.HLayout({ cls: 'weeknum cell', content: new component_js_7.Component({ tag: 'span', content: (0, tools_js_12.formatIntlDate)(dte, 'w') }) })
                ];
                // days
                for (let d = 0; d < 7; d++) {
                    let cls = 'cell day';
                    if (dte.hash() == today) {
                        cls += ' today';
                    }
                    if (dte.getMonth() != cmonth) {
                        cls += ' out';
                    }
                    days.push(new layout_js_2.HLayout({
                        cls,
                        flex: 1,
                        content: new component_js_7.Component({
                            tag: 'span',
                            content: (0, tools_js_12.formatIntlDate)(dte, 'd'),
                        }),
                        dom_events: {
                            click: () => this.select(dte.clone())
                        }
                    }));
                    dte.setDate(dte.getDate() + 1);
                    first = false;
                }
                rows.push(new layout_js_2.HLayout({
                    cls: 'week',
                    flex: 1,
                    content: days
                }));
            }
            this.setContent(rows);
        }
        /**
         * select the given date
         * @param date
         */
        select(date) {
            this.m_date = date;
            this.emit('change', (0, x4_events_js_8.EvChange)(date));
            this.update();
        }
        /**
         *
         */
        _next(n) {
            this.m_date.setMonth(this.m_date.getMonth() + (n ? 1 : -1));
            this.update();
        }
        /**
         *
         */
        _choose(type) {
            let items = [];
            if (type == 'month') {
                for (let m = 0; m < 12; m++) {
                    items.push(new menu_js_2.MenuItem({
                        text: i18n_js_3._tr.global.month_long[m],
                        click: () => { this.m_date.setMonth(m); this.update(); }
                    }));
                }
            }
            else if (type == 'year') {
                let min = this.m_props.minDate?.getFullYear() ?? 2000;
                let max = this.m_props.maxDate?.getFullYear() ?? 2048;
                for (let m = min; m < max; m++) {
                    items.push(new menu_js_2.MenuItem({
                        text: '' + m,
                        click: () => { this.m_date.setFullYear(m); this.update(); }
                    }));
                }
            }
            let menu = new menu_js_2.Menu({
                items
            });
            let rc = this.getBoundingRect();
            menu.displayAt(rc.left, rc.top);
        }
        get date() {
            return this.m_date;
        }
        set date(date) {
            this.m_date = date;
            this.update();
        }
    }
    exports.Calendar = Calendar;
    /**
     * default popup calendar
     */
    class PopupCalendar extends popup_js_2.Popup {
        m_cal;
        constructor(props) {
            super({ tabIndex: 1 });
            this.enableMask(false);
            this.m_cal = new Calendar(props);
            this.m_cal.addClass('@fit');
            this.setContent(this.m_cal);
        }
        // binded
        _handleClick = (e) => {
            if (!this.dom) {
                return;
            }
            let newfocus = e.target;
            // child of this: ok
            if (this.dom.contains(newfocus)) {
                return;
            }
            // menu: ok
            let dest = component_js_7.Component.getElement(newfocus, menu_js_2.MenuItem);
            if (dest) {
                return;
            }
            this.close();
        };
        /** @ignore */
        show(modal) {
            document.addEventListener('mousedown', this._handleClick);
            super.show(modal);
        }
        /** @ignore */
        close() {
            document.removeEventListener('mousedown', this._handleClick);
            super.close();
        }
    }
    exports.PopupCalendar = PopupCalendar;
});
/**
* @file canvas.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/canvas", ["require", "exports", "x4/component", "x4/x4_events"], function (require, exports, component_js_8, x4_events_js_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Canvas = void 0;
    function EvPaint(ctx) {
        return (0, x4_events_js_9.BasicEvent)({ ctx });
    }
    function mkPainter(c2d, w, h) {
        let cp = c2d;
        cp.width = w;
        cp.height = h;
        cp.smoothLine = smoothLine;
        cp.smoothLineEx = smoothLineEx;
        cp.line = line;
        cp.roundRect = roundRect;
        cp.calcTextSize = calcTextSize;
        cp.setFontSize = setFontSize;
        cp.circle = circle;
        return cp;
    }
    function smoothLine(points, path = null, move = true) {
        if (points.length < 2) {
            return;
        }
        if (!path) {
            path = this;
        }
        if (points.length == 2) {
            if (move !== false) {
                path.moveTo(points[0].x, points[0].y);
            }
            else {
                path.lineTo(points[0].x, points[0].y);
            }
            path.lineTo(points[1].x, points[1].y);
            return;
        }
        function midPointBtw(p1, p2) {
            return {
                x: p1.x + (p2.x - p1.x) / 2,
                y: p1.y + (p2.y - p1.y) / 2
            };
        }
        function getQuadraticXY(t, sx, sy, cp1x, cp1y, ex, ey) {
            return {
                x: (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cp1x + t * t * ex,
                y: (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cp1y + t * t * ey
            };
        }
        let p1 = points[0], p2 = points[1], p3 = p1;
        path.moveTo(p1.x, p1.y);
        for (let i = 1, len = points.length; i < len; i++) {
            // we pick the point between pi+1 & pi+2 as the
            // end point and p1 as our control point
            let midPoint = midPointBtw(p1, p2);
            //this.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
            for (let i = 0; i < 8; i++) {
                let { x, y } = getQuadraticXY(i / 8, p3.x, p3.y, p1.x, p1.y, midPoint.x, midPoint.y);
                path.lineTo(x, y);
            }
            p1 = points[i];
            p2 = points[i + 1];
            p3 = midPoint;
        }
        // Draw last line as a straight line while
        // we wait for the next point to be able to calculate
        // the bezier control point
        path.lineTo(p1.x, p1.y);
    }
    function smoothLineEx(_points, tension = 0.5, numOfSeg = 10, path = null, move = true, close = false) {
        let points = [];
        //pts = points.slice(0);
        for (let p = 0, pc = _points.length; p < pc; p++) {
            points.push(_points[p].x);
            points.push(_points[p].y);
        }
        let pts, i = 1, l = points.length, rPos = 0, rLen = (l - 2) * numOfSeg + 2 + (close ? 2 * numOfSeg : 0), res = new Float32Array(rLen), cache = new Float32Array((numOfSeg + 2) * 4), cachePtr = 4;
        pts = points.slice(0);
        if (close) {
            pts.unshift(points[l - 1]); // insert end point as first point
            pts.unshift(points[l - 2]);
            pts.push(points[0], points[1]); // first point as last point
        }
        else {
            pts.unshift(points[1]); // copy 1. point and insert at beginning
            pts.unshift(points[0]);
            pts.push(points[l - 2], points[l - 1]); // duplicate end-points
        }
        // cache inner-loop calculations as they are based on t alone
        cache[0] = 1; // 1,0,0,0
        for (; i < numOfSeg; i++) {
            var st = i / numOfSeg, st2 = st * st, st3 = st2 * st, st23 = st3 * 2, st32 = st2 * 3;
            cache[cachePtr++] = st23 - st32 + 1; // c1
            cache[cachePtr++] = st32 - st23; // c2
            cache[cachePtr++] = st3 - 2 * st2 + st; // c3
            cache[cachePtr++] = st3 - st2; // c4
        }
        cache[cachePtr] = 1; // 0,1,0,0
        // calc. points
        parse(pts, cache, l);
        if (close) {
            //l = points.length;
            pts = [];
            pts.push(points[l - 4], points[l - 3], points[l - 2], points[l - 1]); // second last and last
            pts.push(points[0], points[1], points[2], points[3]); // first and second
            parse(pts, cache, 4);
        }
        function parse(pts, cache, l) {
            for (var i = 2, t; i < l; i += 2) {
                var pt1 = pts[i], pt2 = pts[i + 1], pt3 = pts[i + 2], pt4 = pts[i + 3], t1x = (pt3 - pts[i - 2]) * tension, t1y = (pt4 - pts[i - 1]) * tension, t2x = (pts[i + 4] - pt1) * tension, t2y = (pts[i + 5] - pt2) * tension;
                for (t = 0; t < numOfSeg; t++) {
                    var c = t << 2, //t * 4;
                    c1 = cache[c], c2 = cache[c + 1], c3 = cache[c + 2], c4 = cache[c + 3];
                    res[rPos++] = c1 * pt1 + c2 * pt3 + c3 * t1x + c4 * t2x;
                    res[rPos++] = c1 * pt2 + c2 * pt4 + c3 * t1y + c4 * t2y;
                }
            }
        }
        // add last point
        l = close ? 0 : points.length - 2;
        res[rPos++] = points[l];
        res[rPos] = points[l + 1];
        if (!path) {
            path = this;
        }
        // add lines to path
        for (let i = 0, l = res.length; i < l; i += 2) {
            if (i == 0 && move !== false) {
                path.moveTo(res[i], res[i + 1]);
            }
            else {
                path.lineTo(res[i], res[i + 1]);
            }
        }
    }
    function line(x1, y1, x2, y2, color, lineWidth = 1) {
        this.save();
        this.beginPath();
        this.moveTo(x1, y1);
        this.lineTo(x2, y2);
        this.lineWidth = lineWidth;
        this.strokeStyle = color;
        this.stroke();
        this.restore();
    }
    function roundRect(x, y, width, height, radius) {
        //this.beginPath( );
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    }
    function calcTextSize(text, rounded = false) {
        let fh = this.measureText(text);
        let lh = fh.fontBoundingBoxAscent + fh.fontBoundingBoxDescent;
        if (rounded) {
            return { width: Math.round(fh.width), height: Math.round(lh) };
        }
        else {
            return { width: fh.width, height: lh };
        }
    }
    function setFontSize(fs) {
        let fsize = Math.round(fs) + 'px';
        this.font = this.font.replace(/\d+px/, fsize);
    }
    function circle(x, y, radius) {
        this.moveTo(x + radius, y);
        this.arc(x, y, radius, 0, Math.PI * 2);
    }
    /**
     *
     */
    //export class CanvasProps extends CProps
    //{
    // low level handlers
    //mousedown?:  (ev: MouseEvent) => any;
    //mousemove?:  (ev: MouseEvent) => any;
    //mouseup?:  (ev: MouseEvent) => any;
    //mouseleave?:  (ev: MouseEvent) => any;
    //mousewheel?: (ev: WheelEvent) => any;
    //click?: (ev: MouseEvent) => any;
    //dblclick?: (ev: MouseEvent) => any;
    //touchstart?: (ev: TouchEvent) => any;
    //touchmove?: (ev: TouchEvent) => any;
    //touchend?: (ev: TouchEvent) => any;
    //keydown?: (ev: KeyboardEvent) => any;
    //keyup?: (ev: KeyboardEvent) => any;
    //}
    /**
     * Standard Canvas
     */
    class Canvas extends component_js_8.Component {
        m_iwidth = -1;
        m_iheight = -1;
        m_scale = 1.0;
        m_canvas;
        constructor(props) {
            super(props);
            //if( props.mousedown )	{ this.setDomEvent( 'mousedown', props.mousedown ); }
            //if( props.mousemove )	{ this.setDomEvent( 'mousemove', props.mousemove ); }
            //if( props.mouseup )		{ this.setDomEvent( 'mouseup', props.mouseup ); }
            //if( props.mousewheel )	{ this.setDomEvent( 'wheel', props.mousewheel ); }
            //if( props.mouseleave )	{ this.setDomEvent( 'mouseleave', props.mouseleave ); }
            //if( props.click )		{ this.setDomEvent( 'click', props.click ); }
            //if( props.dblclick )	{ this.setDomEvent( 'dblclick', props.dblclick ); }
            //if( props.touchstart )	{ this.setDomEvent( 'touchstart', props.touchstart ); }
            //if( props.touchmove )	{ this.setDomEvent( 'touchmove', props.touchmove ); }
            //if( props.touchend )	{ this.setDomEvent( 'touchend', props.touchend ); }
            //if( props.keydown )		{ this.setDomEvent( 'keydown', props.keydown ); this.setAttribute( 'tabindex', 0 ); }
            //if( props.keyup )		{ this.setDomEvent( 'keyup', props.keyup ); this.setAttribute( 'tabindex', 0 ); }
            //if( props.paint ) 		{ this.onPaint( props.paint ); }
            this.setDomEvent('sizechange', () => { this._paint(); });
            this.mapPropEvents(props, 'paint');
        }
        /** @ignore */
        render() {
            this.m_iwidth = -1;
            this.m_iheight = -1;
            this.m_canvas = new component_js_8.Component({
                tag: 'canvas'
            });
            this.setContent(this.m_canvas);
            //		this.redraw(10);
        }
        update(delay = 0) {
            this.m_iheight = this.m_iwidth = -1;
            super.update(delay);
        }
        /**
         * scale the whole canvas
         */
        scale(scale) {
            this.m_scale = scale;
            this.m_iwidth = -1; // force recalc
            this.redraw();
        }
        /**
         * return the internal canvas
         */
        get canvas() {
            return this.m_canvas;
        }
        /**
         * redraw the canvas (force a paint)
         */
        $update_rep = 0;
        redraw(wait) {
            if (wait !== undefined) {
                if (++this.$update_rep >= 20) {
                    this.stopTimer('update');
                    this._paint();
                }
                else {
                    this.startTimer('update', wait, false, () => this._paint());
                }
            }
            else {
                this.stopTimer('update');
                this._paint();
            }
        }
        /**
         *
         */
        _paint() {
            this.$update_rep = 0;
            let dom = this.dom;
            if (!this.isUserVisible()) {
                return;
            }
            let canvas = this.m_canvas.dom, w = dom.clientWidth, h = dom.clientHeight;
            let ctx = canvas.getContext('2d');
            if (w != this.m_iwidth || h != this.m_iheight) {
                // adjustment for HDPI
                let devicePixelRatio = window.devicePixelRatio || 1;
                let backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                    ctx.mozBackingStorePixelRatio ||
                    ctx.msBackingStorePixelRatio ||
                    ctx.oBackingStorePixelRatio ||
                    ctx.backingStorePixelRatio || 1;
                let canvas = this.canvas;
                if (devicePixelRatio !== backingStoreRatio || this.m_scale != 1.0) {
                    let ratio = devicePixelRatio / backingStoreRatio, rw = w * ratio, rh = h * ratio;
                    canvas.setAttribute('width', '' + rw);
                    canvas.setAttribute('height', '' + rh);
                    canvas.setStyleValue('width', w);
                    canvas.setStyleValue('height', h);
                    ratio *= this.m_scale;
                    ctx.scale(ratio, ratio);
                }
                else {
                    canvas.setAttribute('width', '' + w);
                    canvas.setAttribute('height', '' + h);
                    canvas.setStyleValue('width', w);
                    canvas.setStyleValue('height', h);
                    ctx.scale(1, 1);
                }
                this.m_iwidth = w;
                this.m_iheight = h;
            }
            if (w && h) {
                let cc = mkPainter(ctx, w, h);
                if (this.m_props.autoClear) {
                    cc.clearRect(0, 0, w, h);
                }
                cc.save();
                cc.translate(-0.5, -0.5);
                this.paint(cc);
                cc.restore();
            }
        }
        paint(ctx) {
            try {
                if (this.m_props.painter) {
                    this.m_props.painter(ctx);
                }
                else {
                    this.emit('paint', EvPaint(ctx));
                }
            }
            catch (x) {
                console.assert(false, x);
            }
        }
    }
    exports.Canvas = Canvas;
});
/**
* @file input.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/input", ["require", "exports", "x4/component"], function (require, exports, component_js_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Input = void 0;
    /**
     * base class for elements implementing an input
     * CARE derived classes must set this.ui.input
     */
    class Input extends component_js_9.Component {
        constructor(props) {
            super(props);
        }
        /** @ignore */
        render(props) {
            this.setProp('tag', 'input');
            this._setTabIndex(props.tabIndex);
            this.setAttributes({
                value: props.value,
                type: props.type || 'text',
                name: props.name,
                placeholder: props.placeHolder,
                autofocus: props.autoFocus,
                readonly: props.readOnly,
                autocomplete: 'chrome-off',
                tabindex: props.tabIndex,
                min: props.min,
                max: props.max,
                ...props.attrs
            });
            if (props.uppercase) {
                this.setStyleValue('textTransform', 'uppercase');
            }
        }
        getType() {
            return this.m_props.type;
        }
        /**
         * return the current editor value
         */
        get value() {
            if (this.dom) {
                this.m_props.value = this.dom.value;
            }
            if (this.m_props.uppercase) {
                let upper = this.m_props.value.toUpperCase(); // todo: locale ?
                if (this.dom && upper != this.m_props.value) {
                    this.dom.value = upper; // update the input
                }
                this.m_props.value = upper;
            }
            return this.m_props.value;
        }
        /**
         * Change the editor value
         * @param value - new value to set
         */
        set value(value) {
            this.m_props.value = value;
            if (this.dom) {
                this.dom.value = value;
            }
        }
        getStoreValue() {
            if (this.m_props.value_hook) {
                return this.m_props.value_hook.get();
            }
            else {
                let type = this.getAttribute('type');
                if (type) {
                    type = type.toLowerCase();
                }
                let value, dom = this.dom;
                if (type === "file") {
                    value = [];
                    let files = dom.files;
                    for (let file = 0; file < files.length; file++) {
                        value.push(files[file].name);
                    }
                }
                else if (type === 'checkbox') {
                    if (dom.checked) {
                        value = 1;
                    }
                    else {
                        value = 0;
                    }
                }
                else if (type === 'radio') {
                    if (dom.checked) {
                        value = this.value;
                    }
                }
                else if (type === 'date') {
                    debugger;
                }
                else {
                    value = this.value;
                }
                return value;
            }
        }
        setStoreValue(v) {
            if (this.m_props.value_hook) {
                return this.m_props.value_hook.set(v);
            }
            else {
                let type = this.getAttribute('type'), dom = this.dom;
                if (type) {
                    type = type.toLowerCase();
                }
                if (type === 'checkbox') {
                    let newval = v !== null && v !== '0' && v !== 0 && v !== false;
                    if (newval !== dom.checked) {
                        dom.setAttribute('checked', '' + newval);
                        dom.dispatchEvent(new Event('change'));
                    }
                }
                else {
                    this.value = v;
                }
            }
        }
        set readOnly(ro) {
            this.setAttribute('readonly', ro);
        }
        /**
         * select all the text
         */
        selectAll() {
            this.dom.select();
        }
        /**
         * select a part of the text
         * @param start
         * @param length
         */
        select(start, length = 9999) {
            this.dom.setSelectionRange(start, start + length);
        }
        /**
         * get the selection as { start, length }
         */
        getSelection() {
            let idom = this.dom;
            return {
                start: idom.selectionStart,
                length: idom.selectionEnd - idom.selectionStart,
            };
        }
    }
    exports.Input = Input;
});
/**
* @file checkbox.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/checkbox", ["require", "exports", "x4/component", "x4/x4_events", "x4/input", "x4/label"], function (require, exports, component_js_10, x4_events_js_10, input_js_1, label_js_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CheckBox = void 0;
    /**
     * Standard CheckBox
     */
    class CheckBox extends component_js_10.Component {
        constructor(props) {
            super(props);
            this.setDomEvent('focus', () => this._setFocus());
            this.mapPropEvents(props, 'change');
        }
        /** @ignore */
        render(props) {
            // checkbox
            let labelWidth = props.labelWidth ?? -1;
            let uid = '__cb_' + this.uid;
            this.addClass('@hlayout');
            this.addClass(props.align ?? 'left');
            this.setProp('tag', 'label');
            this.setContent([
                new input_js_1.Input({
                    ref: 'input',
                    type: 'checkbox',
                    name: props.name,
                    id: uid,
                    tabIndex: props.tabIndex,
                    value: props.value ?? 'on',
                    attrs: {
                        checked: props.checked ? '' : undefined
                    },
                    dom_events: {
                        change: this._change.bind(this),
                    }
                }),
                new label_js_4.Label({
                    text: props.text ?? '',
                    width: labelWidth < 0 ? undefined : labelWidth,
                    flex: labelWidth < 0 ? -labelWidth : undefined,
                    align: props.labelAlign ?? 'left',
                    style: {
                        order: props.align == 'right' ? -1 : 1,
                    },
                    attrs: {
                        "for": uid
                    }
                })
            ]);
        }
        /**
         * check state changed
         */
        _change() {
            this.emit('change', (0, x4_events_js_10.EvChange)(this.check));
        }
        /**
         * focus gained/loosed
         */
        _setFocus() {
            let input = this.itemWithRef('input');
            input.focus();
        }
        /**
         * @return the checked value
         */
        get check() {
            if (this.dom) {
                let input = this.itemWithRef('input');
                let dom = input.dom;
                return dom.checked;
            }
            return this.m_props.checked;
        }
        /**
         * change the checked value
         * @param {boolean} ck new checked value
         */
        set check(ck) {
            if (this.dom) {
                let input = this.itemWithRef('input');
                const dom = input.dom;
                if (dom) {
                    dom.checked = ck;
                }
            }
            this.m_props.checked = ck;
            //this._change();	// todo: is it needed when changed by code ? -> no
        }
        get text() {
            return this.itemWithRef('label').text;
        }
        set text(text) {
            this.itemWithRef('label').text = text;
        }
        /**
         * toggle the checkbox
         */
        toggle() {
            this.check = !this.check;
        }
    }
    exports.CheckBox = CheckBox;
});
/**
* @file listview.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/listview", ["require", "exports", "x4/component", "x4/layout", "x4/popup", "x4/tools", "x4/menu", "x4/x4_events"], function (require, exports, component_js_11, layout_js_3, popup_js_3, tools_js_13, menu_js_3, x4_events_js_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PopupListView = exports.EvCancel = exports.ListView = exports.ListViewItem = void 0;
    /**
     * item definition
     */
    class ListViewItem {
        id;
        text; // if you need pure text
        html; // if text is html
        icon;
        data;
    }
    exports.ListViewItem = ListViewItem;
    ;
    /**
     * Standard listview class
     */
    class ListView extends layout_js_3.VLayout {
        m_selection;
        m_defer_sel;
        m_container;
        m_view;
        m_topIndex;
        m_itemHeight;
        m_cache; // recycling elements
        constructor(props) {
            super(props);
            this.setDomEvent('keydown', (e) => this._handleKey(e));
            this.setDomEvent('click', (e) => this._handleClick(e));
            this.setDomEvent('dblclick', (e) => this._handleClick(e));
            this.setDomEvent('contextmenu', (e) => this._handleCtxMenu(e));
            this._setTabIndex(props.tabIndex, 0);
            this.mapPropEvents(props, 'click', 'dblClick', 'contentMenu', 'selectionChange', 'cancel');
        }
        componentCreated() {
            if (this.m_props.virtual) {
                this._buildItems();
            }
            else if (this.m_props.populate) {
                this.items = this.m_props.populate();
            }
        }
        render(props) {
            props.items = props.items || [];
            props.gadgets = props.gadgets;
            props.renderItem = props.renderItem;
            props.virtual = props.virtual ?? false;
            this.m_topIndex = 0;
            if (props.virtual) {
                console.assert(props.itemheight !== undefined);
                this.m_itemHeight = props.itemheight;
                this.m_cache = new Map();
                this.addClass('virtual');
            }
            else {
                this.m_itemHeight = undefined;
                this.m_cache = undefined;
            }
            this._buildContent();
        }
        /**
         * change the list of item displayed
         * @param items - new array of items
         */
        set items(items) {
            this.m_props.items = items;
            this.m_selection = null;
            this._buildContent();
        }
        _handleKey(ev) {
            let moveSel = (sens) => {
                let items;
                if ((0, tools_js_13.isFunction)(this.m_props.items)) {
                    items = this.m_props.items();
                    this.m_props.items = items;
                }
                else {
                    items = this.m_props.items;
                }
                let newsel;
                if (!this.m_selection) {
                    if (items) {
                        newsel = items[0];
                    }
                }
                else {
                    let index = items.findIndex((item) => item === this.m_selection.item);
                    if (sens > 0 && index < (items.length - 1)) {
                        newsel = items[index + 1];
                    }
                    else if (sens < 0 && index > 0) {
                        newsel = items[index - 1];
                    }
                    else {
                        newsel = this.selection;
                    }
                }
                let citem = this._findItemWithId(newsel?.id);
                this._selectItem(newsel, citem, true);
            };
            switch (ev.key) {
                case 'ArrowDown': {
                    moveSel(1);
                    ev.stopPropagation();
                    break;
                }
                case 'ArrowUp': {
                    moveSel(-1);
                    ev.stopPropagation();
                    break;
                }
            }
        }
        /** @ignore */
        _buildContent() {
            let props = this.m_props;
            if (props.virtual) {
                this.m_container = new component_js_11.Container({
                    cls: '@scroll-container',
                    content: []
                });
                this.m_view = new component_js_11.Container({
                    cls: '@scroll-view',
                    flex: 1,
                    content: this.m_container,
                    dom_events: {
                        sizechange: () => this._updateScroll(true),
                        scroll: () => this._updateScroll(false),
                    }
                });
                this.setContent([
                    this.m_view,
                    props.gadgets ? new layout_js_3.HLayout({
                        cls: 'gadgets',
                        content: props.gadgets
                    }) : null,
                ]);
            }
            else {
                this.m_view = undefined;
                this.m_container = new layout_js_3.VLayout({
                    cls: '@scroll-container',
                    content: []
                });
                this.addClass('@scroll-view');
                this.setContent(this.m_container, false);
            }
            if (props.virtual) {
                this.m_container.setStyleValue('height', props.items.length * this.m_itemHeight);
            }
            if (this.dom || !props.virtual) {
                this._buildItems();
            }
        }
        /**
         *
         */
        _updateScroll(forceUpdate) {
            const update = () => {
                let newTop = Math.floor(this.m_view.dom.scrollTop / this.m_itemHeight);
                if (newTop != this.m_topIndex || forceUpdate) {
                    this.m_topIndex = newTop;
                    this._buildItems();
                }
            };
            if (forceUpdate) {
                this.startTimer('scroll', 10, false, update);
            }
            else {
                update();
            }
        }
        async _buildItems() {
            let props = this.m_props;
            let items = [];
            let list_items = props.items;
            if ((0, tools_js_13.isFunction)(list_items)) {
                list_items = list_items();
            }
            if (props.virtual) {
                let rc = this.getBoundingRect();
                let limit = 100;
                let y = 0;
                let top = this.m_topIndex * this.m_itemHeight;
                let index = this.m_topIndex;
                let height = rc.height;
                let count = props.items.length;
                let newels = [];
                let cache = this.m_cache;
                this.m_cache = new Map();
                let selId = this.m_selection?.item.id;
                while (y < height && index < count && --limit > 0) {
                    let it = props.items[index];
                    let itm;
                    if (cache.has(index)) {
                        itm = cache.get(index); // reuse it
                        cache.delete(index); // cache will contain only elements to remove
                    }
                    else {
                        itm = this._renderItem(it);
                        itm.addClass('@list-item');
                        itm.setData('item-id', it.id);
                        newels.push(itm);
                    }
                    if (selId == it.id) {
                        itm.addClass('@selected');
                    }
                    itm.setStyleValue('top', top + y);
                    items.push(itm);
                    this.m_cache.set(index, itm); // keep it for next time
                    y += this.m_itemHeight;
                    index++;
                }
                // all element remaining here are to remove
                cache.forEach((c) => {
                    c.dispose();
                });
                //	append new elements
                newels.forEach((c) => {
                    this.m_container.appendChild(c);
                });
            }
            else {
                let selId = this.m_selection?.item.id;
                list_items.forEach((it) => {
                    let itm = this._renderItem(it);
                    itm.addClass('@list-item');
                    itm.setData('item-id', it.id);
                    if (selId == it.id) {
                        itm.addClass('@selected');
                    }
                    items.push(itm);
                });
                this.m_container.setContent(items);
            }
            if (this.m_defer_sel) {
                let t = this.m_defer_sel;
                this.m_defer_sel = undefined;
                this.selection = t;
            }
        }
        /** @ignore
         * default rendering of an item
         */
        _renderItem(item) {
            if (this.m_props.renderItem) {
                return this.m_props.renderItem(item);
            }
            return new layout_js_3.HLayout({ content: item.text });
        }
        /** @ignore */
        _handleClick(e) {
            let dom = e.target, self = this.dom, list_items = this.m_props.items; // already created by build
            // go up until we find something interesting
            while (dom && dom != self) {
                let itm = component_js_11.Component.getElement(dom), id = itm?.getData('item-id');
                if (id !== undefined) {
                    // find the element
                    let item = list_items.find((item) => item.id == id);
                    if (item) {
                        let event;
                        if (e.type == 'click') {
                            event = (0, x4_events_js_11.EvClick)(item);
                            this.emit('click', event);
                        }
                        else {
                            event = (0, component_js_11.EvDblClick)(item);
                            this.emit('dblClick', event);
                        }
                        if (!event.defaultPrevented) {
                            this._selectItem(item, itm);
                        }
                    }
                    else {
                        this._selectItem(null, null);
                    }
                    return;
                }
                dom = dom.parentElement;
            }
        }
        /** @ignore */
        _handleCtxMenu(e) {
            let dom = e.target, self = this.dom, list_items = this.m_props.items; // already created by build;
            while (dom && dom != self) {
                let itm = component_js_11.Component.getElement(dom), id = itm?.getData('item-id');
                if (id) {
                    // find the element
                    let item = list_items.find((item) => item.id == id);
                    if (item) {
                        this._selectItem(item, itm);
                        this.emit('contextMenu', (0, x4_events_js_11.EvContextMenu)(e, item));
                        e.preventDefault();
                    }
                    return;
                }
                dom = dom.parentElement;
            }
        }
        /**
         * @ignore
         * called when an item is selected by mouse
         */
        _selectItem(item, citem, notify = true) {
            if (this.m_selection && this.m_selection.citem) {
                this.m_selection.citem.removeClass('@selected');
            }
            this.m_selection = {
                item: item,
                citem: citem
            };
            if (this.m_selection && this.m_selection.citem) {
                this.m_selection.citem.addClass('@selected');
            }
            if (notify) {
                this.emit('selectionChange', (0, x4_events_js_11.EvSelectionChange)(item));
            }
        }
        /**
         * return the current seleciton or null
         */
        get selection() {
            return this.m_selection ? this.m_selection.item : null;
        }
        set selection(id) {
            if (id === null || id === undefined) {
                this._selectItem(null, null);
            }
            else {
                if ((0, tools_js_13.isFunction)(this.m_props.items)) {
                    this.m_defer_sel = id;
                }
                else {
                    let item = this.m_props.items.find((item) => item.id == id);
                    let citem = this._findItemWithId(item.id);
                    this._selectItem(item, citem, false);
                }
            }
        }
        _findItemWithId(id) {
            let citem = null;
            if (this.dom) {
                // make the element visible to user
                // todo: problem with virtual listview
                this.m_container.enumChilds((c) => {
                    if (c.getData('item-id') == id) {
                        c.scrollIntoView();
                        citem = c;
                        return true;
                    }
                });
            }
            return citem;
        }
        append(item, prepend = false) {
            if (prepend) {
                this.m_props.items.unshift(item);
            }
            else {
                this.m_props.items.push(item);
            }
            if (!this.m_view) {
                this._buildContent();
            }
            else {
                this.m_view._updateContent();
            }
        }
    }
    exports.ListView = ListView;
    function EvCancel(context = null) {
        return (0, x4_events_js_11.BasicEvent)({ context });
    }
    exports.EvCancel = EvCancel;
    /**
     *
     */
    class PopupListView extends popup_js_3.Popup {
        m_list;
        constructor(props) {
            super({ tabIndex: false });
            this.enableMask(false);
            props.tabIndex = false;
            this.m_list = new ListView(props);
            //this.m_list.addClass( '@fit' );
            this.setContent(this.m_list);
            this.mapPropEvents(props, 'cancel');
        }
        set items(items) {
            this.m_list.items = items;
        }
        // @override
        // todo: move into popup
        _handleClick = (e) => {
            if (!this.dom) {
                return;
            }
            let newfocus = e.target;
            // child of this: ok
            if (this.dom.contains(newfocus)) {
                return;
            }
            // menu: ok
            let dest = component_js_11.Component.getElement(newfocus, menu_js_3.MenuItem);
            if (dest) {
                return;
            }
            this.signal('cancel', EvCancel());
            this.close();
        };
        // todo: move into popup
        show(modal) {
            document.addEventListener('mousedown', this._handleClick);
            super.show(modal);
        }
        hide() {
            document.removeEventListener('mousedown', this._handleClick);
            super.hide();
        }
        // todo: move into popup
        close() {
            document.removeEventListener('mousedown', this._handleClick);
            super.close();
        }
        get selection() {
            return this.m_list.selection;
        }
        set selection(itemId) {
            this.m_list.selection = itemId;
        }
    }
    exports.PopupListView = PopupListView;
});
/**
* @file combobox.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/combobox", ["require", "exports", "x4/component", "x4/x4_events", "x4/input", "x4/label", "x4/button", "x4/layout", "x4/listview", "x4/datastore", "x4/tools"], function (require, exports, component_js_12, x4_events_js_12, input_js_2, label_js_5, button_js_2, layout_js_4, listview_js_1, datastore_js_1, tools_js_14) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ComboBox = void 0;
    /**
     * @review use textedit
     */
    class ComboBox extends layout_js_4.HLayout {
        m_ui_input;
        m_ui_button;
        m_popup;
        m_selection;
        m_defer_sel;
        constructor(props) {
            super(props);
            this.setDomEvent('keypress', () => this.showPopup());
            this.setDomEvent('click', () => this.showPopup());
            this.mapPropEvents(props, 'selectionChange');
        }
        set items(items) {
            this.m_props.items = items;
            if (this.m_popup) {
                this.m_popup.items = items;
            }
        }
        /** @ignore */
        render(props) {
            if (!props.renderer) {
                this.m_ui_input = new input_js_2.Input({
                    flex: 1,
                    readOnly: true,
                    tabIndex: 0,
                    name: props.name,
                    value_hook: {
                        get: () => { return this.value; },
                        set: (v) => { this.value = v; }
                    }
                });
            }
            else {
                this.m_ui_input = new component_js_12.Component({
                    flex: 1,
                    cls: '@fake-input @hlayout',
                    tabIndex: 1
                });
            }
            let width = undefined, flex = undefined;
            let labelWidth = props.labelWidth ?? 0;
            if (labelWidth > 0) {
                width = labelWidth;
            }
            else if (labelWidth < 0) {
                flex = -labelWidth;
            }
            this.setContent([
                // todo: why 'label1' class name
                new label_js_5.Label({
                    cls: 'label1' + (props.label ? '' : ' @hidden'),
                    text: props.label,
                    width,
                    flex,
                    align: props.labelAlign
                }),
                new layout_js_4.HLayout({
                    flex: 1,
                    content: [
                        this.m_ui_input,
                        this.m_ui_button = new button_js_2.Button({
                            cls: 'gadget',
                            icon: 0xf107,
                            tabIndex: false,
                            click: () => this.showPopup(),
                            dom_events: {
                                focus: () => { this.dom.focus(); },
                            }
                        })
                    ]
                }),
            ]);
            if (props.value !== undefined) {
                this.value = props.value;
            }
        }
        componentDisposed() {
            if (this.m_popup) {
                this.m_popup.close();
            }
            super.componentDisposed();
        }
        /**
         * display the popup
         */
        showPopup() {
            let props = this.m_props;
            if (props.readOnly) {
                return;
            }
            // need creation ?
            if (!this.m_popup) {
                let cstyle = this.getComputedStyle();
                let fontFamily = cstyle.value('fontFamily');
                let fontSize = cstyle.value('fontSize');
                // prepare the combo listview
                this.m_popup = new listview_js_1.PopupListView({
                    cls: '@combo-popup',
                    items: props.items,
                    populate: props.populate,
                    renderItem: this.m_props.renderer,
                    selectionChange: (e) => this._selectItem(e),
                    cancel: (e) => this.signal('cancel', e),
                    style: {
                        fontFamily,
                        fontSize
                    }
                });
            }
            let r1 = this.m_ui_button.getBoundingRect(), r2 = this.m_ui_input.getBoundingRect();
            this.m_popup.setStyle({
                minWidth: r1.right - r2.left,
            });
            this.m_popup.displayAt(r2.left, r2.bottom);
            if (this.value !== undefined) {
                this.m_popup.selection = this.value;
            }
        }
        /** @ignore
          */
        _selectItem(ev) {
            let item = ev.selection;
            this._setInput(item);
            this.m_selection = {
                id: item.id,
                text: item.text
            };
            this.emit('selectionChange', (0, x4_events_js_12.EvSelectionChange)(item));
            this.emit('change', (0, x4_events_js_12.EvChange)(item.id));
            this.m_popup.hide();
        }
        /**
         *
         */
        _setInput(item) {
            if (this.m_ui_input) {
                if (this.m_ui_input instanceof input_js_2.Input) {
                    this.m_ui_input.value = item.text;
                }
                else {
                    this.m_ui_input.setContent(this.m_props.renderer(item));
                }
            }
        }
        /**
         *
         */
        get value() {
            return this.m_selection ? this.m_selection.id : undefined;
        }
        get valueText() {
            return this.m_selection ? this.m_selection.text : undefined;
        }
        /**
         *
         */
        set value(id) {
            let items = this.m_props.items;
            if ((0, tools_js_14.isFunction)(items)) {
                items = items();
            }
            items.some((v) => {
                if (v.id === id) {
                    this._setInput(v);
                    this.m_selection = v;
                    return true;
                }
            });
        }
        get input() {
            return this.m_ui_input instanceof input_js_2.Input ? this.m_ui_input : null;
        }
        static storeProxy(props) {
            let view = props.store instanceof datastore_js_1.DataStore ? props.store.createView() : props.store;
            return () => {
                let result = new Array(props.store.count);
                props.store.forEach((rec, index) => {
                    result[index] = {
                        id: rec.getID(),
                        text: props.display(rec)
                    };
                });
                return result;
            };
        }
    }
    exports.ComboBox = ComboBox;
});
/*
 export type CBComboBoxRenderer = ( rec: Record ) => string;
export interface ComboBoxStore {
    store: DataStore;
    display: string | CBComboBoxRenderer;		// if string, the field name to display
}

*/
/**
* @file color.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/color", ["require", "exports", "x4/styles"], function (require, exports, styles_js_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Color = void 0;
    const colorValues = {
        'lightsalmon': 0xFFFFA07A,
        'lightseagreen': 0xFF20B2AA,
        'lightskyblue': 0xFF87CEFA,
        'lightslategray': 0xFF778899,
        'lightsteelblue': 0xFFB0C4DE,
        'lightyellow': 0xFFFFFFE0,
        'lime': 0xFF00FF00,
        'limegreen': 0xFF32CD32,
        'linen': 0xFFFAF0E6,
        'magenta': 0xFFFF00FF,
        'maroon': 0xFF800000,
        'mediumaquamarine': 0xFF66CDAA,
        'mediumblue': 0xFF0000CD,
        'mediumorchid': 0xFFBA55D3,
        'mediumpurple': 0xFF9370DB,
        'mediumseagreen': 0xFF3CB371,
        'mediumslateblue': 0xFF7B68EE,
        'mediumspringgreen': 0xFF00FA9A,
        'mediumturquoise': 0xFF48D1CC,
        'mediumvioletred': 0xFFC71585,
        'midnightblue': 0xFF191970,
        'mintcream': 0xFFF5FFFA,
        'mistyrose': 0xFFFFE4E1,
        'moccasin': 0xFFFFE4B5,
        'navajowhite': 0xFFFFDEAD,
        'navy': 0xFF000080,
        'oldlace': 0xFFFDF5E6,
        'olive': 0xFF808000,
        'olivedrab': 0xFF6B8E23,
        'orange': 0xFFFFA500,
        'orangered': 0xFFFF4500,
        'orchid': 0xFFDA70D6,
        'palegoldenrod': 0xFFEEE8AA,
        'palegreen': 0xFF98FB98,
        'paleturquoise': 0xFFAFEEEE,
        'palevioletred': 0xFFDB7093,
        'papayawhip': 0xFFFFEFD5,
        'peachpuff': 0xFFFFDAB9,
        'peru': 0xFFCD853F,
        'pink': 0xFFFFC0CB,
        'plum': 0xFFDDA0DD,
        'powderblue': 0xFFB0E0E6,
        'purple': 0xFF800080,
        'red': 0xFFFF0000,
        'rosybrown': 0xFFBC8F8F,
        'royalblue': 0xFF4169E1,
        'saddlebrown': 0xFF8B4513,
        'salmon': 0xFFFA8072,
        'sandybrown': 0xFFFAA460,
        'seagreen': 0xFF2E8B57,
        'seashell': 0xFFFFF5EE,
        'sienna': 0xFFA0522D,
        'silver': 0xFFC0C0C0,
        'skyblue': 0xFF87CEEB,
        'slateblue': 0xFF6A5ACD,
        'slategray': 0xFF708090,
        'snow': 0xFFFFFAFA,
        'springgreen': 0xFF00FF7F,
        'steelblue': 0xFF4682B4,
        'tan': 0xFFD2B48C,
        'teal': 0xFF008080,
        'thistle': 0xFFD8BFD8,
        'tomato': 0xFFFF6347,
        'turquoise': 0xFF40E0D0,
        'violet': 0xFFEE82EE,
        'wheat': 0xFFF5DEB3,
        'white': 0xFFFFFFFF,
        'whitesmoke': 0xFFF5F5F5,
        'yellow': 0xFFFFFF00,
        'yellowgreen': 0xFF9ACD32,
        'aliceblue': 0xFFF0F8FF,
        'antiquewhite': 0xFFFAEBD7,
        'aqua': 0xFF00FFFF,
        'aquamarine': 0xFF7FFFD4,
        'azure': 0xFFF0FFFF,
        'beige': 0xFFF5F5DC,
        'bisque': 0xFFFFE4C4,
        'black': 0xFF000000,
        'blanchedalmond': 0xFFFFEBCD,
        'blue': 0xFF0000FF,
        'blueviolet': 0xFF8A2BE2,
        'brown': 0xFFA52A2A,
        'burlywood': 0xFFDEB887,
        'cadetblue': 0xFF5F9EA0,
        'chartreuse': 0xFF7FFF00,
        'chocolate': 0xFFD2691E,
        'coral': 0xFFFF7F50,
        'cornflowerblue': 0xFF6495ED,
        'cornsilk': 0xFFFFF8DC,
        'crimson': 0xFFDC143C,
        'cyan': 0xFF00FFFF,
        'darkblue': 0xFF00008B,
        'darkcyan': 0xFF008B8B,
        'darkgoldenrod': 0xFFB8860B,
        'darkgray': 0xFFA9A9A9,
        'darkgreen': 0xFF006400,
        'darkkhaki': 0xFFBDB76B,
        'darkmagenta': 0xFF8B008B,
        'darkolivegreen': 0xFF556B2F,
        'darkorange': 0xFFFF8C00,
        'darkorchid': 0xFF9932CC,
        'darkred': 0xFF8B0000,
        'darksalmon': 0xFFE9967A,
        'darkseagreen': 0xFF8FBC8F,
        'darkslateblue': 0xFF483D8B,
        'darkslategray': 0xFF2F4F4F,
        'darkturquoise': 0xFF00CED1,
        'darkviolet': 0xFF9400D3,
        'deeppink': 0xFFFF1493,
        'deepskyblue': 0xFF00BFFF,
        'dimgray': 0xFF696969,
        'dodgerblue': 0xFF1E90FF,
        'firebrick': 0xFFB22222,
        'floralwhite': 0xFFFFFAF0,
        'forestgreen': 0xFF228B22,
        'fuchsia': 0xFFFF00FF,
        'gainsboro': 0xFFDCDCDC,
        'ghostwhite': 0xFFF8F8FF,
        'gold': 0xFFFFD700,
        'goldenrod': 0xFFDAA520,
        'gray': 0xFF808080,
        'green': 0xFF008000,
        'greenyellow': 0xFFADFF2F,
        'honeydew': 0xFFF0FFF0,
        'hotpink': 0xFFFF69B4,
        'indianred': 0xFFCD5C5C,
        'indigo': 0xFF4B0082,
        'ivory': 0xFFFFFFF0,
        'khaki': 0xFFF0E68C,
        'lavender': 0xFFE6E6FA,
        'lavenderblush': 0xFFFFF0F5,
        'lawngreen': 0xFF7CFC00,
        'lemonchiffon': 0xFFFFFACD,
        'lightblue': 0xFFADD8E6,
        'lightcoral': 0xFFF08080,
        'lightcyan': 0xFFE0FFFF,
        'lightgoldenrodyellow': 0xFFFAFAD2,
        'lightgreen': 0xFF90EE90,
        'lightgrey': 0xFFD3D3D3,
        'lightpink': 0xFFFFB6C1,
        'none': 0,
        'transparent': 0,
    };
    class Color {
        m_value;
        static custom = [];
        constructor(r, g, b, a) {
            let argc = arguments.length;
            let self = this;
            function _init() {
                if (!argc) {
                    return 0xff000000;
                }
                if (argc == 1) {
                    if (Number.isSafeInteger(r)) {
                        return 0xff000000 | (r & 0xffffff);
                    }
                    return self._getCustomColor(r);
                }
                else if (argc == 2) {
                    let base, alpha = (((g * 255) | 0) & 0xff) << 24;
                    if (Number.isSafeInteger(r)) {
                        base = r;
                    }
                    else {
                        base = self._getCustomColor(r);
                    }
                    return (base & 0xffffff) | alpha;
                }
                else if (argc == 4 && a !== undefined && a <= 1.0) {
                    if (a <= 0) {
                        return 0;
                    }
                    a = a * 255;
                    a |= 0; // convert to int
                    return ((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
                }
                return 0xff000000 | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
            }
            this.m_value = _init();
        }
        /**
         *
         */
        _shade(percent) {
            let t = percent < 0 ? 0 : 255, p = percent < 0 ? -percent : percent;
            let v = this._split();
            return new Color(Math.round((t - v.r) * p) + v.r, Math.round((t - v.g) * p) + v.g, Math.round((t - v.b) * p) + v.b, v.a / 255);
        }
        /**
         * return a color darken by percent
         * @param percent
         */
        darken(percent) {
            if (percent < 0)
                percent = 0;
            if (percent > 100)
                percent = 100;
            return this._shade(-percent / 100);
        }
        /**
         * return a color lighten by percent
         * @param percent
         */
        lighten(percent) {
            if (percent < 0)
                percent = 0;
            if (percent > 100)
                percent = 100;
            return this._shade(percent / 100);
        }
        /**
         * mix 2 colors
         * @param {rgb} c1 - color 1
         * @param {rgb} c2 - color 2
         * @param {float} percent - 0.0 to 1.0
         * @example
         * ```js
         * let clr = Color.mix( color1, color2, 0.5 );
         * ```
         */
        static mix(c1, c2, p) {
            let e1 = c1._split(), e2 = c2._split();
            let A = e1.a === e2.a ? e1.a : Math.round(e2.a * p + e1.a * (1 - p)), R = e1.r === e2.r ? e1.r : Math.round(e2.r * p + e1.r * (1 - p)), G = e1.g === e2.g ? e1.g : Math.round(e2.g * p + e1.g * (1 - p)), B = e1.b === e2.b ? e1.b : Math.round(e2.b * p + e1.b * (1 - p));
            return new Color(R, G, B, A / 255);
        }
        /**
         * split the color into it's base element r,g,b & a (!a 1-255)
         */
        _split() {
            let f = this.m_value;
            return {
                a: (f >> 24) & 0xff,
                r: (f >> 16) & 0xff,
                g: (f >> 8) & 0xff,
                b: (f & 0xff)
            };
        }
        /**
         * change the alpha value
         */
        fadeout(percent) {
            let el = this._split();
            el.a = el.a / 255;
            el.a = el.a - el.a * percent / 100.0;
            if (el.a > 1.0) {
                el.a = 1.0;
            }
            else if (el.a <= 0.0) {
                return Color.NONE;
            }
            return new Color(el.r, el.g, el.b, el.a);
        }
        /**
         *
         */
        static fromHSV(h, s, v, a = 1) {
            let i = Math.min(5, Math.floor(h * 6)), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
            let R, G, B;
            switch (i) {
                case 0:
                    R = v;
                    G = t;
                    B = p;
                    break;
                case 1:
                    R = q;
                    G = v;
                    B = p;
                    break;
                case 2:
                    R = p;
                    G = v;
                    B = t;
                    break;
                case 3:
                    R = p;
                    G = q;
                    B = v;
                    break;
                case 4:
                    R = t;
                    G = p;
                    B = v;
                    break;
                case 5:
                    R = v;
                    G = p;
                    B = q;
                    break;
            }
            return new Color(R * 255, G * 255, B * 255, a);
        }
        /**
         *
         */
        static toHSV(c) {
            let el = c._split();
            el.r /= 255.0;
            el.g /= 255.0;
            el.b /= 255.0;
            el.a /= 255.0;
            let max = Math.max(el.r, el.g, el.b), min = Math.min(el.r, el.g, el.b), delta = max - min, saturation = (max === 0) ? 0 : (delta / max), value = max;
            let hue;
            if (delta === 0) {
                hue = 0;
            }
            else {
                switch (max) {
                    case el.r:
                        hue = (el.g - el.b) / delta / 6 + (el.g < el.b ? 1 : 0);
                        break;
                    case el.g:
                        hue = (el.b - el.r) / delta / 6 + 1 / 3;
                        break;
                    case el.b:
                        hue = (el.r - el.g) / delta / 6 + 2 / 3;
                        break;
                }
            }
            return { h: hue, s: saturation, v: value, a: el.a };
        }
        /**
         *
         */
        static fromHLS(h, l, s) {
            let r, g, b;
            if (s == 0) {
                r = g = b = l; // achromatic
            }
            else {
                function hue2rgb(p, q, t) {
                    if (t < 0)
                        t += 1.0;
                    if (t > 1)
                        t -= 1.0;
                    if (t < 1 / 6)
                        return p + (q - p) * 6 * t;
                    if (t < 1 / 2)
                        return q;
                    if (t < 2 / 3)
                        return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                }
                let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                let p = 2 * l - q;
                r = hue2rgb(p, q, h + 1 / 3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1 / 3);
            }
            r = ((r * 255) | 0) & 0xff;
            g = ((g * 255) | 0) & 0xff;
            b = ((b * 255) | 0) & 0xff;
            return new Color(r, g, b);
        }
        /**
         *
         */
        static toHLS(color) {
            let f = color.m_value, r = ((f >> 16) & 0xff) / 255, g = ((f >> 8) & 0xff) / 255, b = (f & 0xff) / 255;
            let minval = r, maxval = r;
            if (g < minval) {
                minval = g;
            }
            if (b < minval) {
                minval = b;
            }
            if (g > maxval) {
                maxval = g;
            }
            if (b > maxval) {
                maxval = b;
            }
            let rnorm = 0, gnorm = 0, bnorm = 0;
            let mdiff = maxval - minval;
            let msum = maxval + minval;
            let light = 0.5 * msum;
            let satur, hue;
            if (maxval != minval) {
                rnorm = (maxval - r) / mdiff;
                gnorm = (maxval - g) / mdiff;
                bnorm = (maxval - b) / mdiff;
            }
            else {
                return { h: 0, l: light, s: 0 };
            }
            if (light < 0.5) {
                satur = mdiff / msum;
            }
            else {
                satur = mdiff / (2.0 - msum);
            }
            if (r == maxval) {
                hue = 60.0 * (6.0 + bnorm - gnorm);
            }
            else if (g == maxval) {
                hue = 60.0 * (2.0 + rnorm - bnorm);
            }
            else {
                hue = 60.0 * (4.0 + gnorm - rnorm);
            }
            if (hue > 360) {
                hue = hue - 360;
            }
            return { h: hue / 360.0, l: light, s: satur };
        }
        /**
         * get the red value of the color
         */
        red() {
            return (this.m_value >> 16) & 0xff;
        }
        /**
         * get the green value of the color
         */
        green() {
            return (this.m_value >> 8) & 0xff;
        }
        /**
         * get the blue value of the color
         */
        blue() {
            return this.m_value & 0xff;
        }
        /**
         * get the alpha value of the color
         */
        alpha() {
            return ((this.m_value >> 24) & 0xff) / 255;
        }
        /**
         *
         */
        value() {
            return this.m_value;
        }
        /**
         * convert the color into string value
         */
        toString() {
            let color = this.m_value;
            if (color === 0) {
                return 'transparent';
            }
            let el = this._split();
            if (el.a === 0xff) {
                return `rgb(${el.r},${el.g},${el.b})`;
            }
            else {
                el.a /= 255;
                let alpha = el.a.toFixed(3);
                return `rgba(${el.r},${el.g},${el.b},${alpha})`;
            }
        }
        toHex(with_alpha = true) {
            let color = this.m_value;
            if (color === 0) {
                return 'transparent';
            }
            let el = this._split();
            if (el.a === 0xff || !with_alpha) {
                return `#${_hx(el.r)}${_hx(el.g)}${_hx(el.b)}`;
            }
            else {
                return `#${_hx(el.r)}${_hx(el.g)}${_hx(el.b)}${_hx(el.a)}`;
            }
        }
        static addCustomColor(name, value) {
            Color.custom[name] = value;
        }
        static addCssColor(name) {
            let c = styles_js_3.Stylesheet.getVar(name);
            Color.custom['css:' + name] = Color.parse(c);
        }
        static parse(str) {
            let m;
            if (str[0] == '#') {
                const re1 = /#(?<r>[a-fA-F0-9]{2})(?<g>[a-fA-F0-9]{2})(?<b>[a-fA-F0-9]{2})(?<a>[a-fA-F0-9]{2})?/;
                if ((m = re1.exec(str)) !== null) {
                    let g = m.groups;
                    return new Color(parseInt(g.r, 16), parseInt(g.g, 16), parseInt(g.b, 16), g.a !== undefined ? parseInt(g.a, 16) / 255.0 : 1.0);
                }
                const re4 = /#(?<r>[a-fA-F0-9])(?<g>[a-fA-F0-9])(?<b>[a-fA-F0-9])/;
                if ((m = re4.exec(str)) !== null) {
                    let gr = m.groups;
                    const r = parseInt(gr.r, 16);
                    const g = parseInt(gr.g, 16);
                    const b = parseInt(gr.b, 16);
                    return new Color(r << 4 | r, g << 4 | g, b << 4 | b, 1.0);
                }
            }
            if (str[0] == 'r') {
                const re2 = /rgb\(\s*(?<r>\d+)\s*\,\s*(?<g>\d+)\s*\,\s*(?<b>\d+)\s*\)/;
                if ((m = re2.exec(str)) !== null) {
                    let g = m.groups;
                    return new Color(parseInt(g.r, 10), parseInt(g.g, 10), parseInt(g.b, 10), 1.0);
                }
                const re3 = /rgba\(\s*(?<r>\d+)\s*\,\s*(?<g>\d+)\s*\,\s*(?<b>\d+)\s*\,\s*(?<a>[0-9.]+)\s*\)/;
                if ((m = re3.exec(str)) !== null) {
                    let g = m.groups;
                    return new Color(parseInt(g.r, 10), parseInt(g.g, 10), parseInt(g.b, 10), parseFloat(g.a));
                }
            }
            console.log("invalid color value: " + str);
            return new Color(0);
        }
        _getCustomColor(name) {
            if (name === null) {
                return 0;
            }
            let std = colorValues[name];
            if (std !== undefined) {
                return std;
            }
            if (Color.custom[name] !== undefined) {
                return Color.custom[name].m_value;
            }
            if (name.substr(0, 4) == 'css:') {
                Color.addCssColor(name.substr(4));
                return Color.custom[name].m_value;
            }
            return Color.parse(name).m_value;
        }
        static contrastColor(color) {
            let el = color._split();
            // Calculate the perceptive luminance (aka luma) - human eye favors green color... 
            let luma = ((0.299 * el.r) + (0.587 * el.g) + (0.114 * el.b)) / 255;
            // Return black for bright colors, white for dark colors
            return luma > 0.5 ? Color.BLACK : Color.WHITE;
        }
        /**
         *
         */
        static WHITE = new Color(255, 255, 255);
        /**
         *
         */
        static BLACK = new Color(0, 0, 0);
        /**
         *
         */
        static NONE = new Color(0, 0, 0, 0);
        static valueFromColorName(name) {
            let v = colorValues[name];
            if (v) {
                return new Color(v);
            }
            else {
                return null;
            }
        }
        static fromCssVar(varName) {
            return new Color(varName).toString();
        }
    }
    exports.Color = Color;
    function _hx(n) {
        return ('00' + n.toString(16)).substr(-2).toUpperCase();
    }
});
/**
* @file tooltips.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/tooltips", ["require", "exports", "x4/component", "x4/label", "x4/icon", "x4/tools"], function (require, exports, component_js_13, label_js_6, icon_js_4, tools_js_15) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.initTooltips = exports.Tooltip = void 0;
    let tipTmo;
    let tooltip;
    /**
     *
     */
    class Tooltip extends component_js_13.Component {
        m_text;
        set text(text) {
            this.m_text.text = text;
        }
        /** @ignore */
        render() {
            this.setClass('@non-maskable', true);
            this.setContent([
                new icon_js_4.Icon({ icon: 0xf05a }),
                this.m_text = new label_js_6.Label({ text: 'help' })
            ]);
        }
        /**
        * display the menu at a specific position
        * @param x
        * @param y
        */
        displayAt(x, y, align = 'top left') {
            this.show();
            let halign = 'l', valign = 't';
            if (align.indexOf('right') >= 0) {
                halign = 'r';
            }
            if (align.indexOf('bottom') >= 0) {
                valign = 'b';
            }
            // @TODO: this is a minimal overflow problem solution
            let rc = document.body.getBoundingClientRect(), rm = this.getBoundingRect();
            if (halign == 'r') {
                x -= rm.width;
            }
            if (valign == 'b') {
                y -= rm.height;
            }
            if ((x + rm.width) > rc.right) {
                x = rc.right - rm.width;
            }
            if ((y + rm.height) > rc.bottom) {
                y = rc.bottom - rm.height - 17; // default cursor height
            }
            this.setStyle({ left: x, top: y });
        }
    }
    exports.Tooltip = Tooltip;
    function initTooltips(cb) {
        if ((0, tools_js_15.isTouchDevice)()) {
            return;
        }
        let tipTarget = {
            target: null,
            x: 0,
            y: 0
        };
        function handle_mpos(event) {
            tipTarget.x = event.pageX;
            tipTarget.y = event.pageY;
        }
        function handle_mouse(event) {
            let target = event.target;
            let tip = null;
            tipTarget.x = event.pageX + 10;
            tipTarget.y = event.pageY + 15;
            while (target) {
                tip = target.getAttribute('tip');
                if (tip) {
                    break;
                }
                target = target.parentElement;
            }
            if (target == tipTarget.target || (tooltip && target == tooltip.dom)) {
                return;
            }
            if (!target || !tip) {
                tipTarget.target = null;
                if (cb) {
                    cb(null);
                }
                else {
                    _hideTip();
                }
                return;
            }
            tipTarget.target = target;
            if (cb) {
                cb(null);
            }
            else {
                _hideTip();
            }
            if (cb) {
                cb(tip);
            }
            else {
                tipTmo = setTimeout(() => {
                    if (tooltip === undefined) {
                        tooltip = new Tooltip({});
                        document.body.appendChild(tooltip._build());
                    }
                    tooltip.text = tip;
                    tooltip.displayAt(tipTarget.x + 17, tipTarget.y + 17, 'top left');
                }, 700);
            }
        }
        function _hideTip() {
            if (tipTmo) {
                clearTimeout(tipTmo);
            }
            if (tooltip) {
                tooltip.hide();
            }
        }
        document.body.addEventListener('mouseover', handle_mouse);
        document.body.addEventListener('mouseout', handle_mouse);
        document.body.addEventListener('mousemove', handle_mpos);
    }
    exports.initTooltips = initTooltips;
});
/**
* @file textedit.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/textedit", ["require", "exports", "x4/component", "x4/input", "x4/button", "x4/layout", "x4/label", "x4/calendar", "x4/tools", "x4/tooltips", "x4/x4_events", "x4/i18n"], function (require, exports, component_js_14, input_js_3, button_js_3, layout_js_5, label_js_7, calendar_js_1, tools_js_16, tooltips_js_1, x4_events_js_13, i18n_js_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextEdit = void 0;
    /** @ignore */
    const reEmail = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    /**
     * TextEdit is a single line editor, it can have a label and an error descriptor.
     */
    class TextEdit extends component_js_14.Component {
        m_cal_popup;
        m_ui_input;
        m_error_tip;
        constructor(props) {
            super(props);
            this.addClass('@hlayout');
            this.mapPropEvents(props, 'change', 'click', 'focus');
        }
        componentCreated() {
            super.componentCreated();
            if (this.m_props.autoFocus) {
                this.focus();
            }
        }
        componentDisposed() {
            if (this.m_error_tip) {
                this.m_error_tip.dispose();
            }
            super.componentDisposed();
        }
        focus() {
            this.m_ui_input.focus();
        }
        /** @ignore */
        render(props) {
            let eprops = {
                flex: 1,
                dom_events: {
                    focus: this._focus.bind(this),
                    blur: this._blur.bind(this),
                    input: this._change.bind(this)
                },
                value: props.value,
                name: props.name,
                type: props.type,
                placeHolder: props.placeHolder,
                autoFocus: props.autoFocus,
                readOnly: props.readOnly,
                value_hook: props.value_hook,
                uppercase: props.uppercase,
                tabIndex: props.tabIndex === undefined ? true : props.tabIndex,
                attrs: props.attrs,
                min: props.min,
                max: props.max,
            };
            // date is handled manually with popupcalendar
            if (props.type == 'date') {
                props.format = props.format ?? 'Y-M-D';
                eprops.type = 'text';
                let def_hook = {
                    get: () => this._date_get_hook(),
                    set: (e) => this._date_set_hook(e)
                };
                eprops.value_hook = props.value_hook ?? def_hook;
            }
            this.m_ui_input = new input_js_3.Input(eprops);
            //	button
            let button = undefined;
            if (props.icon) {
                button = new button_js_3.Button({
                    icon: props.icon,
                    click: () => this._btnClick(),
                    tabIndex: false
                });
            }
            else if (props.type == 'date') {
                button = new button_js_3.Button({
                    cls: 'gadget',
                    icon: 0xf073,
                    tabIndex: false,
                    click: () => this._showDatePicker(button)
                });
                if (!props.validator) {
                    props.validator = this._date_validator;
                }
            }
            let ag = props.gadgets ?? [];
            ag.forEach(b => {
                b.addClass('gadget');
            });
            let gadgets = [button, ...ag];
            this.setClass('@required', props.required);
            if (props.gadgets && props.gadgets.length) {
                this.addClass('with-gadgets');
            }
            let width = undefined, flex = undefined, labelWidth = props.labelWidth;
            if (labelWidth > 0) {
                width = labelWidth;
            }
            if (labelWidth < 0) {
                flex = -labelWidth;
            }
            let label = undefined;
            let labelAlign = props.labelAlign;
            let top = false;
            if (props.label) {
                if (labelAlign == 'top') {
                    labelAlign = 'left';
                    top = true;
                    flex = 1;
                }
                label = new label_js_7.Label({
                    ref: 'label',
                    tag: 'label',
                    cls: 'label1' + (props.label ? '' : ' @hidden'),
                    text: props.label ?? '',
                    width,
                    flex,
                    align: labelAlign
                });
            }
            if (top) {
                this.removeClass('@hlayout');
                this.addClass('@vlayout vertical');
                this.setContent([
                    label,
                    new layout_js_5.HLayout({ width, content: [this.m_ui_input, ...gadgets] })
                ]);
            }
            else {
                this.addClass('@hlayout');
                this.setContent([label, this.m_ui_input, ...gadgets]);
            }
        }
        enable(ena) {
            if (ena === true) {
                this.m_ui_input.enable();
            }
            super.enable(ena);
        }
        disable() {
            this.m_ui_input.disable();
            super.disable();
        }
        _btnClick() {
            this.emit('click', (0, x4_events_js_13.EvClick)(this.value));
        }
        /**
         * select the value format for input/output on textedit of type date
         * cf. formatIntlDate / parseIntlDate
         * @param fmt
         */
        setDateStoreFormat(fmt) {
            this.m_props.format = fmt;
        }
        setStoreValue(value) {
            this.m_ui_input.setStoreValue(value);
        }
        getStoreValue() {
            return this.m_ui_input.getStoreValue();
        }
        _date_get_hook() {
            let date = (0, tools_js_16.parseIntlDate)(this.value);
            let props = this.m_props;
            if (props.format == 'native') {
                return date;
            }
            else {
                return date ? (0, tools_js_16.formatIntlDate)(date, props.format) : null;
            }
        }
        _date_set_hook(dte) {
            let props = this.m_props;
            if (props.format == 'native') {
                this.value = (0, tools_js_16.formatIntlDate)(dte);
            }
            else if (dte) {
                let date = (0, tools_js_16.parseIntlDate)(dte, props.format);
                this.value = (0, tools_js_16.formatIntlDate)(date);
            }
            else {
                this.value = '';
            }
        }
        showError(text) {
            if (!this.m_error_tip) {
                this.m_error_tip = new tooltips_js_1.Tooltip({ cls: 'error' });
                document.body.appendChild(this.m_error_tip._build());
            }
            let rc = this.m_ui_input.getBoundingRect();
            this.m_error_tip.text = text;
            this.m_error_tip.displayAt(rc.right, rc.top, 'top left');
            this.addClass('@error');
        }
        clearError() {
            if (this.m_error_tip) {
                this.m_error_tip.hide();
                this.removeClass('@error');
            }
        }
        get value() {
            if (this.m_ui_input) {
                return this.m_ui_input.value;
            }
            else {
                return this.m_props.value;
            }
        }
        set value(value) {
            if (this.m_ui_input) {
                this.m_ui_input.value = value;
            }
            else {
                this.m_props.value = value;
            }
        }
        /**
         * select all the text
         */
        selectAll() {
            this.m_ui_input.selectAll();
        }
        select(start, length = 9999) {
            this.m_ui_input.select(start, length);
        }
        getSelection() {
            return this.m_ui_input.getSelection();
        }
        set readOnly(ro) {
            this.m_ui_input.readOnly = ro;
        }
        get label() {
            return this.itemWithRef('label')?.text;
        }
        set label(text) {
            this.itemWithRef('label').text = text;
        }
        /**
         * content changed
         * todo: should move into Input
         */
        _change() {
            let value = this.m_ui_input.value;
            this.emit('change', (0, x4_events_js_13.EvChange)(value));
        }
        /**
         * getting focus
         */
        _focus() {
            this.clearError();
            this.emit('focus', (0, component_js_14.EvFocus)(true));
        }
        /**
         * loosing focus
         * @param value
         */
        _blur() {
            this._validate(this.m_ui_input.value);
            this.emit('focus', (0, component_js_14.EvFocus)(false));
        }
        /**
         * todo: should move into Input
         * @returns
         */
        validate() {
            return this._validate(this.value);
        }
        _validate(value) {
            let props = this.m_props;
            let update = false;
            if (props.required && value.length == 0) {
                this.showError(i18n_js_4._tr.global.required_field);
                return false;
            }
            if (value != '') {
                let pattern = this.getAttribute('pattern');
                if (pattern) {
                    let re = new RegExp(pattern);
                    if (re && !re.test(value)) {
                        this.showError(i18n_js_4._tr.global.invalid_format);
                        return false;
                    }
                }
                if (props.type == 'email') {
                    if (!reEmail.test(value.toLowerCase())) {
                        this.showError(i18n_js_4._tr.global.invalid_email);
                        return false;
                    }
                }
                else if (props.type == 'number') {
                    const v = parseFloat(value);
                    if (isNaN(v)) {
                        this.showError(i18n_js_4._tr.global.invalid_number);
                        return false;
                    }
                    let min = parseFloat(this.m_ui_input.getAttribute('min'));
                    if (min !== undefined && v < min) {
                        value = '' + min;
                        update = true;
                    }
                    let max = parseFloat(this.m_ui_input.getAttribute('max'));
                    if (max !== undefined && v > max) {
                        value = '' + max;
                        update = true;
                    }
                }
            }
            if (props.validator) {
                try {
                    this.value = props.validator(value);
                }
                catch (err) {
                    this.showError(err instanceof Error ? err.message : err);
                    return false;
                }
            }
            else if (update) {
                this.value = value;
            }
            return true;
        }
        _date_validator(value) {
            value = value.trim();
            if (value == '') {
                return '';
            }
            let date;
            if (value == '@') {
                date = new Date();
            }
            else {
                date = (0, tools_js_16.parseIntlDate)(value);
                if (!date) {
                    throw (0, tools_js_16.sprintf)(i18n_js_4._tr.global.invalid_date, i18n_js_4._tr.global.date_format);
                }
            }
            return (0, tools_js_16.formatIntlDate)(date);
        }
        //onKeyDown( e ) {
        //    if( this.readOnly ) {
        //        if( this.type=='date' && (e.key==' ' || e.key=='Enter') ) {
        //            this.showDatePicker( );
        //            e.stopPropagation( );
        //            e.preventDefault( );
        //        }
        //    }
        //}
        //onClick( e ) {
        //    if( this.readOnly ) {
        //        if( this.type=='date' ) {
        //            this.showDatePicker( );
        //            e.stopPropagation( );
        //            e.preventDefault( );
        //        }
        //    }
        //}
        _showDatePicker(btn) {
            if (!this.m_cal_popup) {
                this.m_cal_popup = new calendar_js_1.PopupCalendar({
                    change: (ev) => {
                        this.value = (0, tools_js_16.formatIntlDate)(ev.value);
                        this.m_cal_popup.close();
                    }
                });
            }
            let rc = this.m_ui_input.getBoundingRect();
            this.m_cal_popup.displayAt(rc.left, rc.bottom, 'top left');
        }
        get input() {
            return this.m_ui_input;
        }
        get type() {
            return this.m_props.type;
        }
    }
    exports.TextEdit = TextEdit;
});
/**
* @file form.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/form", ["require", "exports", "x4/component", "x4/layout", "x4/button", "x4/textedit", "x4/request", "x4/dialog", "x4/i18n"], function (require, exports, component_js_15, layout_js_6, button_js_4, textedit_js_1, request_js_2, dialog_js_1, i18n_js_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Form = void 0;
    /**
     *
     */
    class Form extends layout_js_6.VLayout {
        m_height;
        m_container;
        m_buttons;
        constructor(props) {
            let content = props.content;
            props.content = null;
            // save height, because real form height is 'height' PLUS button bar height
            let height = props.height;
            props.height = undefined;
            super(props);
            this.setProp('tag', 'form');
            this.mapPropEvents(props, 'btnClick');
            this.updateContent(content, props.buttons, height);
        }
        get container() {
            return this.m_container;
        }
        onChange(cb) {
            debugger;
            /*
            if( !this.m_onchange_cb ) {
                this.m_onchange_cb = cb;
    
                // ask all editable sub elements to notify me when change
                // can only be done 1 time
                this.enumChilds( ( el ) => {
                    if( el.isEditable( ) ) {
                        el.on( 'change', cb );
                    }
                }, true );
            }
            */
        }
        /**
         *
         */
        updateContent(items, buttons, height = 0) {
            if (height) {
                // keep height for next time
                this.m_height = height;
            }
            let content = [
                this.m_container = new layout_js_6.VLayout({
                    cls: 'container',
                    height: this.m_height,
                    content: items
                }),
                this.m_buttons = this._makeButtons(buttons)
            ];
            this.setContent(content);
        }
        /**
         *
         */
        enableButton(name, enable = true) {
            let button = this.getButton(name);
            if (button) {
                button.enable(enable);
            }
        }
        getButton(name) {
            let button = this.itemWithRef('@' + name);
            return button;
        }
        /**
         *
         */
        _makeButtons(buttons) {
            if (!buttons) {
                return null;
            }
            let btns = [];
            for (let b of buttons) {
                if (b instanceof component_js_15.Component) {
                    btns.push(b);
                }
                else {
                    switch (b) {
                        case 'ok': {
                            btns.push(new button_js_4.Button({ ref: '@' + b, text: i18n_js_5._tr.global.ok, click: () => { this._click(b); } }));
                            break;
                        }
                        case 'cancel': {
                            btns.push(new button_js_4.Button({ ref: '@' + b, text: i18n_js_5._tr.global.cancel, click: () => { this._click(b); } }));
                            break;
                        }
                        case 'ignore': {
                            btns.push(new button_js_4.Button({ ref: '@' + b, text: i18n_js_5._tr.global.ignore, click: () => { this._click(b); } }));
                            break;
                        }
                        case 'yes': {
                            btns.push(new button_js_4.Button({ ref: '@' + b, text: i18n_js_5._tr.global.yes, click: () => { this._click(b); } }));
                            break;
                        }
                        case 'no': {
                            btns.push(new button_js_4.Button({ ref: '@' + b, text: i18n_js_5._tr.global.no, click: () => { this._click(b); } }));
                            break;
                        }
                        case 'close': {
                            btns.push(new button_js_4.Button({ ref: '@' + b, text: i18n_js_5._tr.global.close, click: () => { this._click(b); } }));
                            break;
                        }
                        case 'save': {
                            btns.push(new button_js_4.Button({ ref: '@' + b, text: i18n_js_5._tr.global.save, click: () => { this._click(b); } }));
                            break;
                        }
                        case 'dontsave': {
                            btns.push(new button_js_4.Button({ ref: '@' + b, text: i18n_js_5._tr.global.dontsave, click: () => { this._click(b); } }));
                            break;
                        }
                    }
                }
            }
            if (btns.length == 1) {
                btns[0].setAttribute('autofocus', true);
            }
            return new layout_js_6.HLayout({
                cls: 'footer',
                content: btns
            });
        }
        /**
         *
         */
        validate() {
            let inputs = this.dom.querySelectorAll('input'), result = true;
            for (let i = 0; i < inputs.length; i++) {
                let input = component_js_15.Component.getElement(inputs[i], textedit_js_1.TextEdit);
                if (input && !input.validate()) {
                    result = false;
                }
            }
            return result;
        }
        /**
         *
         */
        _click(btn) {
            this.emit('btnClick', (0, dialog_js_1.EvBtnClick)(btn));
        }
        /**
         *
         */
        setValues(values) {
            console.assert(!!this.dom);
            let elements = this.dom.elements;
            for (let e = 0; e < elements.length; e++) {
                let input = elements[e];
                let item = component_js_15.Component.getElement(input);
                if (!item.hasAttribute("name")) {
                    continue;
                }
                let name = item.getAttribute('name'), type = item.getAttribute('type');
                if (values[name] !== undefined) {
                    item.setStoreValue(values[name]);
                }
            }
        }
        /**
         * values are not escaped
         * checkbox set true when checked
         * radio set value when checked
         */
        getValues() {
            console.assert(!!this.dom);
            let result = {};
            let elements = this.dom.elements;
            for (let e = 0; e < elements.length; e++) {
                let el = elements[e];
                let item = component_js_15.Component.getElement(el);
                if (!item.hasAttribute("name")) {
                    continue;
                }
                let name = item.getAttribute('name'), value = item.getStoreValue();
                if (value !== undefined) {
                    result[name] = value;
                }
            }
            return result;
        }
        /**
         * send the query to the desired handler
         */
        submit(cfg, cbvalidation) {
            if (!this.validate()) {
                return false;
            }
            let values = this.getValues();
            if (cbvalidation) {
                if (!cbvalidation(values)) {
                    return false;
                }
            }
            let form = new FormData();
            for (let n in values) {
                if (values.hasOwnProperty(n)) {
                    form.append(n, values[n] === undefined ? '' : values[n]);
                }
            }
            cfg.params = form;
            return (0, request_js_2.ajaxRequest)(cfg);
        }
    }
    exports.Form = Form;
});
/**
* @file dialog.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/dialog", ["require", "exports", "x4/popup", "x4/icon", "x4/layout", "x4/label", "x4/form", "x4/component", "x4/x4_events", "x4/tools"], function (require, exports, popup_js_4, icon_js_5, layout_js_7, label_js_8, form_js_1, component_js_16, x4_events_js_14, tools_js_17) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Dialog = exports.EvBtnClick = void 0;
    function EvBtnClick(button) {
        return (0, x4_events_js_14.BasicEvent)({ button });
    }
    exports.EvBtnClick = EvBtnClick;
    /**
     * Standard dialog class
     */
    class Dialog extends popup_js_4.Popup {
        m_icon;
        m_title;
        m_form;
        m_buttons;
        m_closable;
        m_movable;
        m_maximized;
        m_minimized;
        m_maximizable;
        m_minimizable;
        m_needFormResize; // 1 -> hz, 2-> vt
        m_rc_max;
        m_rc_min;
        m_el_title;
        m_last_down;
        m_auto_close;
        m_ui_title;
        m_form_cb;
        constructor(props) {
            let content = props.content;
            let width, height;
            let formResize = 0;
            props.content = null;
            if (!(0, tools_js_17.isString)(props.width)) {
                width = props.width;
                props.width = undefined;
            }
            else {
                formResize |= 1;
            }
            if (!(0, tools_js_17.isString)(props.height)) {
                height = props.height;
                props.height = undefined;
            }
            else {
                formResize |= 2;
            }
            super(props);
            this.m_needFormResize = formResize;
            this.enableMask(true);
            if (props.form) {
                if (!(0, tools_js_17.isFunction)(props.form)) {
                    this.m_form = props.form,
                        this.m_form.setStyle({
                            width,
                            height
                        });
                    this.m_form.on('btnClick', (e) => this._handleClick(e));
                }
                else {
                    this.m_form_cb = props.form;
                }
            }
            else {
                this.m_form = new form_js_1.Form({
                    width,
                    height,
                    content,
                    buttons: props.buttons,
                    btnClick: (e) => this._handleClick(e)
                });
            }
            this.m_movable = props.movable;
            this.m_auto_close = props.autoClose ?? true;
            this.m_icon = props.icon;
            this.m_title = props.title;
            this.m_buttons = props.buttons ?? null;
            this.m_closable = props.closable ?? false;
            this.m_last_down = 0;
            this.on('size', (ev) => {
                this.addClass('@resized');
                this.m_form.setStyleValue('width', null);
                this.m_form.setStyleValue('height', null);
            });
            this.m_maximized = false;
            this.m_minimized = false;
            this.m_maximizable = false;
            this.m_minimizable = false;
            if (props.maximizable !== undefined) {
                this.m_maximizable = props.maximizable;
            }
            if (props.minimizable !== undefined) {
                this.m_minimizable = props.minimizable;
            }
            if (props.maximized == true) {
                this.m_maximizable = true;
            }
            if (props.btnClick) {
                this.on('btnClick', props.btnClick);
            }
        }
        componentCreated() {
            super.componentCreated();
            if (this.m_needFormResize) {
                this.addClass('@resized');
            }
            if (this.m_props.maximized) {
                this._maximize();
                this.emit('size', (0, component_js_16.EvSize)(null));
            }
        }
        _handleClick(ev) {
            this.emit('btnClick', ev);
            if (!ev.defaultPrevented) {
                this.close();
            }
        }
        /**
         *
         */
        setGeometry(geom) {
            if (geom.minimized && this.m_minimizable) {
                this._minimize(false);
                this.m_rc_min = new tools_js_17.Rect(geom.left, geom.top, geom.width, geom.height);
                this.displayAt(geom.left, geom.top, 'top-left');
            }
            else if (geom.maximized && this.m_maximizable) {
                this._maximize(false);
                this.m_rc_max = new tools_js_17.Rect(geom.left, geom.top, geom.width, geom.height);
            }
            else {
                this.setSize(geom.width, geom.height);
                this.displayAt(geom.left, geom.top, 'top-left');
            }
        }
        getGeometry() {
            if (this.m_minimized) {
                return {
                    left: this.m_rc_min.left,
                    top: this.m_rc_min.top,
                    width: this.m_rc_min.width,
                    height: this.m_rc_min.height,
                    minimized: true,
                    maximized: false
                };
            }
            else if (this.m_maximized) {
                return {
                    left: this.m_rc_max.left,
                    top: this.m_rc_max.top,
                    width: this.m_rc_max.width,
                    height: this.m_rc_max.height,
                    minimized: false,
                    maximized: true
                };
            }
            let rc = this.getBoundingRect();
            return {
                left: rc.left,
                top: rc.top,
                width: rc.width,
                height: rc.height,
                minimized: false,
                maximized: false
            };
        }
        setSize(width, height) {
            this.setStyle({ width, height });
            this.emit('size', (0, component_js_16.EvSize)({ width, height }));
        }
        /** @ignore */
        render() {
            if (this.m_form_cb) {
                this.m_form = this.m_form_cb();
                this.m_form.on('btnClick', (e) => this._handleClick(e));
                this.m_form_cb = null;
            }
            let hasTitle = this.m_icon !== undefined || this.m_closable || this.m_title !== undefined || this.m_movable;
            this.m_el_title = null;
            if (hasTitle) {
                this.m_el_title = new layout_js_7.HLayout({
                    cls: 'title',
                    content: [
                        this.m_icon ? new icon_js_5.Icon({ icon: this.m_icon }) : null,
                        this.m_ui_title = new label_js_8.Label({ flex: 1, text: this.m_title }),
                        this.m_minimizable ? new icon_js_5.Icon({ cls: 'min-btn', icon: 0xf2d1, dom_events: { click: () => this._toggleMin() } }) : null,
                        this.m_maximizable ? new icon_js_5.Icon({ cls: 'max-btn', icon: 0xf2d0, dom_events: { click: () => this._toggleMax() } }) : null,
                        this.m_closable ? new icon_js_5.Icon({ icon: 0xf410, dom_events: { click: () => this.close() } }) : null,
                    ]
                });
                if (this.m_movable) {
                    if ((0, tools_js_17.isTouchDevice)()) {
                        this.m_el_title.setDomEvent('touchstart', (e) => this._mouseDown(e));
                    }
                    else {
                        this.m_el_title.setDomEvent('mousedown', (e) => this._mouseDown(e));
                    }
                }
            }
            this.setContent([
                this.m_el_title,
                this.m_form
            ]);
        }
        get form() {
            return this.m_form;
        }
        close() {
            this.emit('close', {});
            super.close();
        }
        _toggleMax() {
            if (!this.m_maximizable) {
                return;
            }
            if (this.m_maximized) {
                this.removeClass('maximized');
                this.setStyle({
                    left: this.m_rc_max.left,
                    top: this.m_rc_max.top,
                    width: this.m_rc_max.width,
                    height: this.m_rc_max.height,
                });
                this.m_maximized = false;
                this.emit('size', (0, component_js_16.EvSize)(null, 'restore'));
            }
            else {
                this._maximize();
                this.emit('size', (0, component_js_16.EvSize)(null, 'maximize'));
            }
        }
        _toggleMin() {
            if (!this.m_minimizable) {
                return;
            }
            if (this.m_minimized) {
                this.removeClass('minimized');
                this.setStyle({
                    //left: 	this.m_rc_min.left,
                    //top: 	this.m_rc_min.top,
                    width: this.m_rc_min.width,
                    height: this.m_rc_min.height,
                });
                this.m_minimized = false;
                this.emit('size', (0, component_js_16.EvSize)(null, 'restore'));
            }
            else {
                this._minimize();
                this.emit('size', (0, component_js_16.EvSize)(null, 'minimize'));
            }
        }
        _isIcon(target) {
            let el = component_js_16.Component.getElement(target);
            return (el && el.hasClass('@icon'));
        }
        _mouseDown(event) {
            let { x, y } = (0, tools_js_17.getMousePos)(event, true);
            let wrc = (0, component_js_16.flyWrap)(document.body).getBoundingRect();
            let rc = this.getBoundingRect(true);
            let trc = this.m_el_title.getBoundingRect();
            let dx = x - rc.left, dy = y - rc.top;
            let cstyle = this.getComputedStyle();
            let topw = cstyle.parse('marginTop') + cstyle.parse('paddingTop') + cstyle.parse('borderTopWidth');
            let botw = cstyle.parse('marginBottom') + cstyle.parse('paddingBottom') + cstyle.parse('borderBottomWidth');
            let lftw = cstyle.parse('marginLeft') + cstyle.parse('paddingLeft') + cstyle.parse('borderLeftWidth');
            let rgtw = cstyle.parse('marginRight') + cstyle.parse('paddingRight') + cstyle.parse('borderRightWidth');
            wrc.top += topw - trc.height;
            wrc.height -= topw + botw - trc.height;
            wrc.left += lftw;
            wrc.width -= lftw + rgtw;
            // custom handling double click
            const now = Date.now();
            const delta = now - this.m_last_down;
            if (this.m_maximizable && delta < 700) {
                this._toggleMax();
                return;
            }
            this.m_last_down = now;
            if (this.m_maximized) {
                // cannot move in max state
                return;
            }
            let __move = (ex, ey) => {
                let x = ex - dx, y = ey - dy;
                if (x + rc.width < wrc.left) {
                    x = wrc.left - rc.width;
                }
                else if (x > wrc.right) {
                    x = wrc.right;
                }
                if (y < wrc.top) { // title grip is on top
                    y = wrc.top;
                }
                else if (y > wrc.bottom) {
                    y = wrc.bottom;
                }
                this.setStyle({
                    left: x,
                    top: y
                });
            };
            component_js_16.Component.setCapture(this, (ev) => {
                if (ev.type == 'mousemove') {
                    let mev = ev;
                    __move(mev.clientX, mev.clientY);
                }
                else if (ev.type == 'touchmove') {
                    let tev = ev;
                    if (tev.touches.length == 1) {
                        __move(tev.touches[0].clientX, tev.touches[0].clientY);
                    }
                }
                else if (ev.type == 'mouseup' || ev.type == 'touchend') {
                    component_js_16.Component.releaseCapture();
                    this.emit('move', (0, popup_js_4.EvMove)(null));
                }
                else if (ev.type == 'mousedown' || ev.type == 'touchstart') {
                }
            });
        }
        maximize() {
            if (!this.m_maximizable || this.m_maximized) {
                return;
            }
            this._maximize();
            this.emit('size', (0, component_js_16.EvSize)(null));
        }
        _maximize(saveRect = true) {
            if (saveRect) {
                this.m_rc_max = this.getBoundingRect(false);
            }
            this.addClass('maximized');
            this.m_maximized = true;
            this.setStyle({
                left: undefined,
                top: undefined,
                width: undefined,
                height: undefined,
            });
        }
        minimize() {
            if (!this.m_minimizable || this.m_minimized) {
                return;
            }
            this._minimize();
            this.emit('size', (0, component_js_16.EvSize)(null));
        }
        _minimize(saveRect = true) {
            if (saveRect) {
                this.m_rc_min = this.getBoundingRect(false);
            }
            this.addClass('minimized');
            this.m_minimized = true;
            this.setStyle({
                //left: undefined,
                //top: undefined,
                width: undefined,
                height: undefined,
            });
        }
        set title(title) {
            this.m_title = title;
            if (this.m_ui_title) {
                this.m_ui_title.text = title;
            }
        }
    }
    exports.Dialog = Dialog;
});
/**
* @file colorpicker.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/colorpicker", ["require", "exports", "x4/component", "x4/checkbox", "x4/dialog", "x4/x4_events", "x4/layout", "x4/label", "x4/color", "x4/tools", "x4/textedit", "x4/menu"], function (require, exports, component_js_17, checkbox_js_1, dialog_js_2, x4_events_js_15, layout_js_8, label_js_9, color_js_1, tools_js_18, textedit_js_2, menu_js_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColorPickerEditor = exports.ColorPickerBox = exports.ColorPicker = void 0;
    const pal_colors = {
        blue: [0x0e5a8a, 0x106ba3, 0x137cbd, 0x2b95d6, 0x48aff0,],
        green: [0x0a6640, 0x0d8050, 0x0f9960, 0x15b371, 0x3dcc91,],
        orange: [0xa66321, 0xbf7326, 0xd9822b, 0xf29d49, 0xffb366,],
        red: [0xa82a2a, 0xc23030, 0xdb3737, 0xf55656, 0xff7373,],
        vermilion: [0x9e2b0e, 0xb83211, 0xd13913, 0xeb532d, 0xff6e4a,],
        rose: [0xa82255, 0xc22762, 0xdb2c6f, 0xf5498b, 0xff66a1,],
        violet: [0x5c255c, 0x752f75, 0x8f398f, 0xa854a8, 0xc274c2,],
        indigo: [0x5642a6, 0x634dbf, 0x7157d9, 0x9179f2, 0xad99ff,],
        cobalt: [0x1f4b99, 0x2458b3, 0x2965cc, 0x4580e6, 0x669eff,],
        turquoise: [0x008075, 0x00998c, 0x00b3a4, 0x14ccbd, 0x2ee6d6,],
        forest: [0x1d7324, 0x238c2c, 0x29a634, 0x43bf4d, 0x62d96b,],
        lime: [0x728c23, 0x87a629, 0x9bbf30, 0xb6d94c, 0xd1f26d,],
        gold: [0xa67908, 0xbf8c0a, 0xd99e0b, 0xf2b824, 0xffc940,],
        sepia: [0x63411e, 0x7d5125, 0x96622d, 0xb07b46, 0xc99765,],
    };
    class ColorPicker extends component_js_17.Container {
        m_colorSel;
        m_colorHue;
        m_colorAlpha;
        m_sample;
        m_selMark;
        m_hueMark;
        m_alphaMark;
        m_baseHSV;
        m_baseColor;
        m_transpCk;
        m_colorEdit;
        m_palmode;
        static last_palmode = false;
        constructor(props) {
            super(props);
            this.m_palmode = ColorPicker.last_palmode;
            this.setDomEvent('contextmenu', (e) => this._showCtx(e));
        }
        _showCtx(e) {
            const menu = new menu_js_4.Menu({
                items: [
                    new menu_js_4.MenuItem({ text: 'Palette', checked: this.m_palmode, click: () => {
                            this.m_palmode = !this.m_palmode;
                            ColorPicker.last_palmode = this.m_palmode;
                            this.update();
                        } })
                ]
            });
            let pt = (0, tools_js_18.getMousePos)(e, true);
            menu.displayAt(pt.x, pt.y);
        }
        render(props) {
            this.m_baseColor = props.color;
            this.m_baseHSV = color_js_1.Color.toHSV(this.m_baseColor);
            if (this.m_palmode) {
                this.addClass("pal-mode");
                let cur = null;
                const buildCol = (colors) => {
                    const ccolor = this.m_baseColor.value();
                    const els = colors.map(x => {
                        const selected = x == ccolor;
                        let cls = (0, tools_js_18.classNames)('clr-box', { selected });
                        let el = new component_js_17.Component({ cls, style: { backgroundColor: new color_js_1.Color(x).toHex() }, data: { color: x } });
                        if (selected) {
                            cur = el;
                        }
                        return el;
                    });
                    return new layout_js_8.VLayout({
                        cls: 'vcol',
                        content: els
                    });
                };
                let rows = new layout_js_8.HLayout({
                    cls: 'hcol',
                    content: [
                        buildCol(pal_colors.blue),
                        buildCol(pal_colors.green),
                        buildCol(pal_colors.orange),
                        buildCol(pal_colors.red),
                        buildCol(pal_colors.vermilion),
                        buildCol(pal_colors.rose),
                        buildCol(pal_colors.violet),
                        buildCol(pal_colors.indigo),
                        buildCol(pal_colors.cobalt),
                        buildCol(pal_colors.turquoise),
                        buildCol(pal_colors.forest),
                        buildCol(pal_colors.lime),
                        buildCol(pal_colors.gold),
                        buildCol(pal_colors.sepia),
                    ]
                });
                this.m_colorEdit = new textedit_js_2.TextEdit({
                    cls: 'hexv',
                    value: '',
                    attrs: {
                        spellcheck: false,
                    },
                    change: (ev) => {
                        const clr = new color_js_1.Color(ev.value);
                        if (clr) {
                            this.m_baseColor = clr;
                            this.m_baseHSV = color_js_1.Color.toHSV(clr);
                            this._updateColor(false);
                        }
                    }
                });
                this.m_transpCk = new checkbox_js_1.CheckBox({
                    cls: 'transp',
                    text: 'transparent',
                    change: (ev) => {
                        this.m_baseHSV.a = ev.value ? 0 : 1;
                        this._updateColor();
                    }
                });
                this.setContent([rows, this.m_transpCk, this.m_colorEdit]);
                // globally handle click
                rows.setDomEvent('click', (ev) => {
                    if (cur) {
                        cur.removeClass('selected');
                        cur = null;
                    }
                    let cell = component_js_17.Component.getElement(ev.target, 'clr-box');
                    if (cell) {
                        const clr = new color_js_1.Color(cell.getData('color'));
                        this.m_baseColor = clr;
                        this.m_baseHSV = color_js_1.Color.toHSV(clr);
                        this._updateColor();
                        cur = cell;
                        cell.addClass('selected');
                    }
                });
            }
            else {
                this.removeClass("pal-mode");
                this.m_selMark = new component_js_17.Component({ cls: 'marker' });
                this.m_colorSel = new component_js_17.Component({
                    cls: 'sel',
                    content: [
                        new component_js_17.Component({ cls: '@fit light' }),
                        new component_js_17.Component({ cls: '@fit dark' }),
                        this.m_selMark,
                    ]
                });
                this.m_hueMark = new component_js_17.Component({ cls: 'marker' });
                this.m_colorHue = new component_js_17.Component({
                    cls: 'hue',
                    content: [
                        this.m_hueMark
                    ]
                });
                this.m_sample = new component_js_17.Component({ cls: 'sample' });
                if (props.hasAlpha) {
                    this.addClass('with-alpha');
                    this.m_alphaMark = new component_js_17.Component({ cls: 'marker' });
                    this.m_colorAlpha = new component_js_17.Component({
                        cls: 'alpha',
                        content: [
                            new component_js_17.Component({ cls: 'bk @fit', ref: 'color' }),
                            this.m_alphaMark
                        ]
                    });
                }
                else {
                    this.removeClass('with-alpha');
                    this.m_transpCk = new checkbox_js_1.CheckBox({
                        cls: 'transp',
                        text: 'transparent',
                        change: (ev) => {
                            this.m_baseHSV.a = ev.value ? 0 : 1;
                            this._updateColor();
                        }
                    });
                }
                this.m_colorEdit = new textedit_js_2.TextEdit({
                    cls: 'hexv',
                    value: '',
                    attrs: {
                        spellcheck: false,
                    },
                    change: (ev) => {
                        const clr = new color_js_1.Color(ev.value);
                        if (clr) {
                            this.m_baseColor = clr;
                            this.m_baseHSV = color_js_1.Color.toHSV(clr);
                            this._updateColor(false);
                        }
                    }
                });
                this.setContent([
                    this.m_colorSel,
                    this.m_colorHue,
                    this.m_colorAlpha,
                    this.m_transpCk,
                    this.m_colorEdit,
                    this.m_sample,
                ]);
                this.m_colorSel.setDomEvent('mousedown', (ev) => {
                    component_js_17.Component.setCapture(this, (e) => this._selChange(e));
                });
                this.m_colorHue.setDomEvent('mousedown', (ev) => {
                    component_js_17.Component.setCapture(this, (e) => this._hueChange(e));
                });
                if (props.hasAlpha) {
                    this.m_colorAlpha.setDomEvent('mousedown', (ev) => {
                        component_js_17.Component.setCapture(this, (e) => this._alphaChange(e));
                    });
                }
                this._updateColor();
            }
        }
        set color(clr) {
            this.m_baseColor = clr;
            this.m_baseHSV = color_js_1.Color.toHSV(this.m_baseColor);
            this._updateColor();
        }
        get color() {
            return this.m_baseColor;
        }
        _selChange(ev) {
            let pt = (0, tools_js_18.getMousePos)(ev, true);
            console.log(pt);
            let rc = this.m_colorSel.getBoundingRect();
            if (!this.m_props.hasAlpha) {
                this.m_baseHSV.a = 1;
            }
            this.m_baseHSV.s = (0, tools_js_18.clamp)((pt.x - rc.left) / rc.width, 0, 1);
            this.m_baseHSV.v = 1 - (0, tools_js_18.clamp)((pt.y - rc.top) / rc.height, 0, 1);
            this._updateColor();
            if (ev.type == 'mouseup' || ev.type == 'touchend') {
                component_js_17.Component.releaseCapture();
            }
        }
        _hueChange(ev) {
            let pt = (0, tools_js_18.getMousePos)(ev, true);
            let rc = this.m_colorHue.getBoundingRect();
            this.m_baseHSV.h = (0, tools_js_18.clamp)((pt.y - rc.top) / rc.height, 0, 1);
            this._updateColor();
            if (ev.type == 'mouseup' || ev.type == 'touchend') {
                component_js_17.Component.releaseCapture();
            }
        }
        _alphaChange(ev) {
            let pt = (0, tools_js_18.getMousePos)(ev, true);
            let rc = this.m_colorAlpha.getBoundingRect();
            this.m_baseHSV.a = (0, tools_js_18.clamp)((pt.x - rc.left) / rc.width, 0, 1);
            this._updateColor();
            if (ev.type == 'mouseup' || ev.type == 'touchend') {
                component_js_17.Component.releaseCapture();
            }
        }
        _updateColor(edit = true) {
            let color;
            if (!this.m_palmode) {
                color = color_js_1.Color.fromHSV(this.m_baseHSV.h, 1, 1, 1);
                this.m_colorSel.setStyleValue('backgroundColor', color.toString());
                color = color_js_1.Color.fromHSV(this.m_baseHSV.h, this.m_baseHSV.s, this.m_baseHSV.v, 1);
                this.m_sample.setStyleValue('backgroundColor', color.toString());
                if (this.m_props.hasAlpha) {
                    let gradient = `linear-gradient(to right, rgba(0,0,0,0) 0%, ${color.toString()} 100%)`;
                    this.m_colorAlpha.itemWithRef('color').setStyleValue('backgroundImage', gradient);
                }
                this.m_selMark.setStyle({
                    left: (this.m_baseHSV.s * 100) + '%',
                    top: (100 - this.m_baseHSV.v * 100) + '%',
                });
                this.m_hueMark.setStyle({
                    top: (this.m_baseHSV.h * 100) + '%',
                });
                if (this.m_props.hasAlpha) {
                    this.m_alphaMark.setStyle({
                        left: (this.m_baseHSV.a * 100) + '%',
                    });
                }
                else {
                    this.m_transpCk.check = this.m_baseHSV.a == 0;
                }
            }
            else {
                this.m_transpCk.check = this.m_baseHSV.a == 0;
            }
            color = color_js_1.Color.fromHSV(this.m_baseHSV.h, this.m_baseHSV.s, this.m_baseHSV.v, this.m_baseHSV.a);
            this.m_baseColor = color;
            if (edit) {
                this.m_colorEdit.value = color.alpha() == 1 ? color.toHex() : color.toString(); //color.toHex();
            }
            this._change();
        }
        _change() {
            this.emit('change', (0, x4_events_js_15.EvChange)(this.m_baseColor));
        }
    }
    exports.ColorPicker = ColorPicker;
    class ColorPickerBox extends dialog_js_2.Dialog {
        m_picker;
        constructor(props) {
            props.icon = undefined;
            props.buttons = undefined;
            super(props);
            this.mapPropEvents(props, 'change');
            this.m_picker = new ColorPicker({
                color: props.color,
                hasAlpha: props.hasAlpha,
                style: { padding: 8 },
                width: 250,
                height: 250,
            });
            let customs = this._makeCustoms(props.cust_colors);
            this.form.updateContent([
                new layout_js_8.VLayout({
                    content: [
                        this.m_picker,
                        customs
                    ]
                })
            ], ['ok', 'cancel']);
            this.on('btnClick', (ev) => {
                if (ev.button == 'ok') {
                    this.emit('change', (0, x4_events_js_15.EvChange)(this.m_picker.color));
                }
            });
        }
        _makeCustoms(cc) {
            let custom = null;
            if (cc && cc.length > 0) {
                let els = [];
                for (let i = 0; i < cc.length; i += 8) {
                    let lne = [];
                    for (let j = 0; j < 8; j++) {
                        let idx = i + j, clr = cc[idx];
                        lne.push(new label_js_9.Label({
                            cls: 'cust-cc',
                            text: '',
                            flex: 1,
                            style: {
                                backgroundColor: clr ? clr.toString() : 'transparent'
                            },
                            tooltip: clr ? clr.toString() : undefined,
                            dom_events: {
                                click: () => {
                                    if (clr) {
                                        this.m_picker.color = clr;
                                        this.emit('change', (0, x4_events_js_15.EvChange)(clr));
                                        this.close();
                                    }
                                }
                            }
                        }));
                    }
                    els.push(new layout_js_8.HLayout({ cls: 'line', content: lne }));
                }
                custom = new layout_js_8.VLayout({ cls: 'customs', content: els });
            }
            return custom;
        }
        set color(clr) {
            this.m_picker.color = clr;
        }
        get color() {
            return this.m_picker.color;
        }
        /**
         * display a messagebox
         */
        static show(props) {
            let msg;
            if ((0, tools_js_18.isString)(props)) {
                msg = new ColorPickerBox({ color: new color_js_1.Color(props) });
            }
            else {
                msg = new ColorPickerBox(props);
            }
            msg.show();
            return msg;
        }
    }
    exports.ColorPickerBox = ColorPickerBox;
    class ColorPickerEditor extends layout_js_8.HLayout {
        constructor(props) {
            super(props);
            this.mapPropEvents(props, 'change');
        }
        render(props) {
            let color = props.color;
            let tcolor;
            if (this._isTransp(color)) {
                color = color_js_1.Color.NONE;
                tcolor = 'black';
            }
            else {
                tcolor = color_js_1.Color.contrastColor(color).toString();
            }
            this.setContent([
                props.label ? new label_js_9.Label({
                    cls: 'label',
                    text: props.label,
                    flex: props.labelWidth < 0 ? -props.labelWidth : undefined,
                    width: props.labelWidth >= 0 ? props.labelWidth : undefined,
                }) : null,
                new label_js_9.Label({
                    cls: 'value',
                    flex: 1,
                    text: color.toHex(),
                    style: {
                        backgroundColor: color.toString(),
                        color: tcolor
                    },
                    dom_events: {
                        click: () => this._showPicker()
                    }
                })
            ]);
            this._setTabIndex(props.tabIndex);
        }
        set value(color) {
            this.m_props.color = color;
            this.update();
        }
        get value() {
            return this.m_props.color;
        }
        set custom_colors(v) {
            this.m_props.cust_colors = v;
        }
        _showPicker() {
            let dlg = new ColorPickerBox({
                color: this.m_props.color,
                cust_colors: this.m_props.cust_colors,
                hasAlpha: this.m_props.hasAlpha,
                events: {
                    change: (e) => {
                        this.m_props.color = e.value;
                        this._change();
                        this.update();
                    }
                }
            });
            let rc = this.getBoundingRect();
            dlg.displayAt(rc.left, rc.bottom, 'tl');
        }
        _change() {
            this.emit('change', (0, x4_events_js_15.EvChange)(this.m_props.color));
        }
        _isTransp(color) {
            return !color.alpha();
        }
    }
    exports.ColorPickerEditor = ColorPickerEditor;
});
/**
* @file formatters.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/formatters", ["require", "exports", "x4/application", "x4/tools"], function (require, exports, application_js_2, tools_js_19) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.bool_formatter = exports.money_formatter_nz = exports.money_formatter = exports.date_formatter = exports.sql_date_formatter = void 0;
    function sql_date_formatter(input) {
        if (input === null || input === undefined || input === '') {
            return '';
        }
        let dte = new Date(Date.parse(input));
        //todo: better implementation
        const options = { /*weekday: 'short',*/ month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return dte.toLocaleDateString(application_js_2.Application.instance().locale, options);
    }
    exports.sql_date_formatter = sql_date_formatter;
    function date_formatter(input) {
        if (input === null || input === undefined || input === '') {
            return '';
        }
        let dte = typeof (input) == 'string' ? new Date(Date.parse(input)) : input;
        return (0, tools_js_19.formatIntlDate)(dte);
    }
    exports.date_formatter = date_formatter;
    function money_formatter(input) {
        if (input === null || input === undefined || input === '') {
            return '';
        }
        let val = (0, tools_js_19.roundTo)(typeof (input) == 'string' ? parseFloat(input) : input, 2);
        if (val === -0.00)
            val = 0.00;
        let res = application_js_2.Application.instance().moneyFormatter.format(val);
        return res;
    }
    exports.money_formatter = money_formatter;
    function money_formatter_nz(input) {
        if (input === null || input === undefined || input === '') {
            return '';
        }
        let val = (0, tools_js_19.roundTo)(typeof (input) == 'string' ? parseFloat(input) : input, 2);
        if (!val) { // do not show zeros
            return '';
        }
        let res = application_js_2.Application.instance().moneyFormatter.format(val);
        return res;
    }
    exports.money_formatter_nz = money_formatter_nz;
    function bool_formatter(input) {
        return input ? 'oui' : '-';
    }
    exports.bool_formatter = bool_formatter;
});
/**
* @file image.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/image", ["require", "exports", "x4/component"], function (require, exports, component_js_18) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Image = void 0;
    const emptyImageSrc = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    function _isStaticImage(src) {
        return src.substr(0, 5) == 'data:';
    }
    /**
     * Standard image class
     */
    class Image extends component_js_18.Component {
        m_created;
        m_lazysrc; // expected 
        constructor(props) {
            super(props);
            this.m_created = false;
            this.m_props.lazy = props.lazy === false ? false : true;
            this.m_props.alt = props.alt;
            if (props.lazy !== false) {
                this.m_lazysrc = props.src;
                props.src = emptyImageSrc;
            }
            this.setDomEvent('create', () => {
                if (props.lazy) {
                    this.setImage(this.m_lazysrc, true);
                }
            });
        }
        /** @ignore */
        render() {
            let mp = this.m_props;
            const img = new component_js_18.Component({
                tag: 'img',
                attrs: {
                    draggable: false,
                    alt: mp.alt ?? '',
                    decoding: mp.lazy ? 'async' : undefined,
                },
                style: {
                    objectFit: mp.alignment ? mp.alignment : undefined
                }
            });
            this.setContent(img);
        }
        /**
         * change the image
         * @param src - image path
         */
        setImage(src, force) {
            if (!src) {
                src = emptyImageSrc;
            }
            if (!this.m_props.lazy) {
                this.m_props.src = src;
                this.m_lazysrc = src;
                if (this.dom) {
                    this.dom.firstChild.setAttribute('src', src);
                }
            }
            else if (force || this.m_lazysrc != src) {
                if (_isStaticImage(src)) {
                    // not to download -> direct display
                    this.m_props.src = src;
                    this.m_lazysrc = src;
                    if (this.dom) {
                        this.dom.firstChild.setAttribute('src', this.m_props.src);
                    }
                }
                else {
                    // clear current image while waiting
                    this.m_props.src = emptyImageSrc;
                    if (this.dom) {
                        this.dom.firstChild.setAttribute('src', this.m_props.src);
                    }
                    this.m_lazysrc = src;
                    if (this.dom) {
                        this._update_image();
                    }
                }
            }
        }
        _update_image() {
            console.assert(!!this.dom);
            if (this.m_lazysrc && !_isStaticImage(this.m_lazysrc)) {
                // we do not push Components in a static array...
                Image.lazy_images_waiting.push({ dom: this.dom, src: this.m_lazysrc });
                if (Image.lazy_image_timer === undefined) {
                    Image.lazy_image_timer = setInterval(Image.lazyWatch, 10);
                }
            }
        }
        static lazy_images_waiting = [];
        static lazy_image_timer = undefined;
        static lazyWatch() {
            let newList = [];
            let done = 0;
            Image.lazy_images_waiting.forEach((el) => {
                let dom = el.dom, src = el.src;
                // skip deleted elements
                if (!dom || !document.contains(dom)) {
                    // do not append to newList
                    return;
                }
                let rc = dom.getBoundingClientRect();
                // if it is visible & inserted inside the document
                if (!done && dom.offsetParent !== null &&
                    rc.bottom >= 0 && rc.right >= 0 &&
                    rc.top <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rc.left <= (window.innerWidth || document.documentElement.clientWidth)) {
                    // ok, we load the image
                    let img = dom.firstChild;
                    img.setAttribute('src', src);
                    done++;
                }
                else {
                    // still not visible: may be next time
                    newList.push(el);
                }
            });
            Image.lazy_images_waiting = newList;
            // no more elements to watch...
            if (newList.length == 0) {
                clearInterval(Image.lazy_image_timer);
                Image.lazy_image_timer = undefined;
            }
        }
    }
    exports.Image = Image;
});
/**
* @file gridview.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/gridview", ["require", "exports", "x4/layout", "x4/component", "x4/label", "x4/i18n", "x4/tools", "x4/datastore", "x4/x4_events"], function (require, exports, layout_js_9, component_js_19, label_js_10, i18n_js_6, tools_js_20, datastore_js_2, x4_events_js_16) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GridView = exports.EvGridCheck = void 0;
    const T_UPDATE = Symbol('update');
    function EvGridCheck(rec, chk) {
        return (0, x4_events_js_16.BasicEvent)({ rec, chk });
    }
    exports.EvGridCheck = EvGridCheck;
    /**
     * gridview class
     */
    class GridView extends layout_js_9.VLayout {
        m_dataview;
        m_data_cx;
        m_columns;
        m_view_el;
        m_container;
        m_header;
        m_footer;
        m_empty_msg;
        m_empty_text;
        m_selection;
        m_itemHeight;
        m_topIndex;
        m_visible_rows; // shown elements
        m_hasMarks;
        m_marks; // checked elements
        m_recycler;
        m_rowClassifier;
        constructor(props) {
            super(props);
            this.m_columns = props.columns;
            this.m_hasMarks = props.hasMarks ?? false;
            this.m_marks = new Set();
            // prepend the checkable column
            if (this.m_hasMarks) {
                this.m_columns.unshift({
                    id: 'id',
                    title: '',
                    width: 30,
                    renderer: (e) => this._renderCheck(e)
                });
            }
            this.setAttribute('tabindex', 0);
            this.m_topIndex = 0;
            this.m_itemHeight = 0;
            this.m_recycler = [];
            this.m_rowClassifier = props.calcRowClass;
            this.m_empty_text = props.empty_text ?? i18n_js_6._tr.global.empty_list;
            //this.setDomEvent('create', this._handleCreate, this);
            this.setDomEvent('click', (e) => this._itemClick(e));
            this.setDomEvent('dblclick', (e) => this._itemDblClick(e));
            this.setDomEvent('contextmenu', (e) => this._itemMenu(e));
            this.setDomEvent('keydown', (e) => this._handleKey(e));
            this.setStore(props.store);
        }
        componentCreated() {
            this._updateScroll(true);
        }
        /**
         *
         */
        _moveSel(sens, select = true) {
            let sel = this.m_selection;
            let scrolltype = null;
            if (sel === undefined) {
                sel = this.m_dataview.getByIndex(0).getID();
            }
            else {
                let index = this.m_dataview.indexOfId(this.m_selection);
                if (sens == 1) {
                    index++;
                }
                else if (sens == -1) {
                    index--;
                }
                else if (sens == 2) {
                    index += this.m_visible_rows.length - 1;
                }
                else if (sens == -2) {
                    index -= this.m_visible_rows.length - 1;
                }
                if (sens < 0) {
                    scrolltype = 'start';
                }
                else {
                    scrolltype = 'end';
                }
                if (index < 0) {
                    index = 0;
                }
                else if (index >= this.m_dataview.count) {
                    index = this.m_dataview.count - 1;
                }
                sel = this.m_dataview.getByIndex(index).getID();
            }
            if (this.m_selection != sel && select) {
                this._selectItem(sel, null, scrolltype);
            }
            return sel;
        }
        /**
         *
         */
        _handleKey(event) {
            //debugger;
            if (!this.m_dataview || this.m_dataview.count == 0) {
                return;
            }
            switch (event.key) {
                case 'ArrowDown':
                case 'Down': {
                    this._moveSel(1);
                    break;
                }
                case 'ArrowUp':
                case 'Up': {
                    this._moveSel(-1);
                    break;
                }
                case 'PageUp': {
                    this._moveSel(-2);
                    break;
                }
                case 'PageDown': {
                    this._moveSel(2);
                    break;
                }
            }
        }
        /**
         *
         */
        getNextSel(sens) {
            return this._moveSel(sens, false);
        }
        _scrollIntoView(id, sens) {
            let itm = this._findItem(id);
            if (itm) {
                itm.scrollIntoView({
                    block: 'center' //<ScrollLogicalPosition>sens ?? 'nearest'
                });
            }
            else {
                this.m_topIndex = this.m_dataview.indexOfId(id);
                this.m_view_el.dom.scrollTop = this.m_topIndex * this.m_itemHeight;
                this._buildItems();
                this._scrollIntoView(id);
            }
        }
        /**
         * change the list of item displayed
         * @param items - new array of items
         */
        setStore(store) {
            this.m_selection = undefined;
            if (store instanceof datastore_js_2.DataStore) {
                this.m_dataview = store.createView();
            }
            else {
                this.m_dataview = store;
            }
            if (this.m_hasMarks) {
                this.clearMarks();
            }
            // unlink previous observer
            if (this.m_data_cx) {
                this.m_data_cx.dispose();
            }
            if (this.m_dataview) {
                this.m_data_cx = this.m_dataview.on('view_change', (ev) => {
                    if (ev.action == 'change') {
                        this.m_selection = undefined;
                    }
                    this._updateScroll(true);
                });
                //this.update( );
                this._updateScroll(true);
            }
        }
        getView() {
            return this.m_dataview;
        }
        /**
         * return the current selection (row id) or null
         */
        getSelection() {
            return this.m_selection;
        }
        getSelRec() {
            if (this.m_selection) {
                return this.m_dataview.getById(this.m_selection);
            }
            return null;
        }
        setSelection(recId) {
            this._selectItem(recId, null, 'center');
        }
        /** @ignore */
        render() {
            this.m_recycler = [];
            this.m_container = new component_js_19.Component({
                cls: 'content',
            });
            this.m_empty_msg = new label_js_10.Label({
                cls: 'empty-msg',
                text: ''
            });
            this.m_view_el = new component_js_19.Component({
                cls: '@scroll-view',
                flex: 1,
                dom_events: {
                    sizechange: () => this._updateScroll(true),
                    scroll: () => this._updateScroll(false)
                },
                content: this.m_container
            });
            let cols = this.m_columns.map((col, index) => {
                let cls = '@cell';
                if (col.cls) {
                    cls += ' ' + col.cls;
                }
                let comp = new component_js_19.Component({
                    cls,
                    content: new component_js_19.Component({
                        tag: 'span',
                        content: col.title
                    }),
                    flex: col.flex,
                    sizable: 'right',
                    style: {
                        width: col.width
                    },
                    dom_events: {
                        click: (ev) => {
                            let t = (0, component_js_19.flyWrap)(ev.target);
                            if (!t.hasClass('@sizer-overlay')) { // avoid sizer click
                                this._sortCol(col);
                                ev.preventDefault();
                            }
                        }
                    }
                });
                const resizeCol = (ev) => {
                    this._on_col_resize(index, ev.size.width);
                    if (this.m_footer) {
                        let col = component_js_19.Component.getElement(this.m_footer.dom.childNodes[index]);
                        if (col) {
                            col.setStyleValue('width', ev.size.width);
                        }
                    }
                };
                new component_js_19.SizerOverlay({
                    target: comp,
                    sens: 'right',
                    events: { resize: (e) => resizeCol(e) }
                });
                col.$col = comp;
                return comp;
            });
            // compute full width
            let full_width = 0;
            this.m_columns.forEach((col) => {
                full_width += col.width ?? 0;
            });
            this.m_header = new layout_js_9.HLayout({
                cls: '@header',
                content: cols,
                style: {
                    minWidth: full_width
                }
            });
            if (this.m_props.hasFooter) {
                let foots = this.m_columns.map((col, index) => {
                    let cls = '@cell';
                    if (col.align) {
                        cls += ' ' + col.align;
                    }
                    if (col.cls) {
                        cls += ' ' + col.cls;
                    }
                    let comp = new component_js_19.Component({
                        cls,
                        data: { col: index },
                        flex: col.flex,
                        style: {
                            width: col.width
                        }
                    });
                    return comp;
                });
                this.m_footer = new layout_js_9.HLayout({
                    cls: '@footer',
                    content: foots,
                    style: {
                        minWidth: full_width
                    }
                });
            }
            else {
                this.m_footer = null;
            }
            this.setContent([
                this.m_header,
                this.m_view_el,
                this.m_footer,
                this.m_empty_msg,
            ]);
        }
        _on_col_resize(col, width) {
            this.m_columns[col].width = width;
            this.m_columns[col].flex = undefined;
            this._updateScroll(true);
        }
        /**
         *
         */
        _sortCol(col) {
            if (col.sortable === false) {
                return;
            }
            this.m_columns.forEach((c) => {
                if (c !== col) {
                    c.$sorted = false;
                    c.$col.removeClass('sort desc');
                }
            });
            if (col.$sorted) {
                col.$sens = col.$sens ? 0 : 1;
                col.$col.setClass('desc', col.$sens);
            }
            else {
                col.$sens = 0;
                col.$sorted = true;
                col.$col.addClass('sort');
                col.$col.removeClass('desc');
            }
            if (this.m_dataview) {
                this.m_dataview.sort([
                    { field: col.id, ascending: col.$sens ? false : true }
                ]);
            }
        }
        /**
         *
         */
        _computeItemHeight() {
            let gr = document.createElement('div');
            gr.classList.add('x-row');
            let gv = document.createElement('div');
            gv.classList.add('x-grid-view');
            gv.style.position = 'absolute';
            gv.style.top = '-1000px';
            gv.appendChild(gr);
            this.dom.appendChild(gv);
            let rc = gr.getBoundingClientRect();
            this.dom.removeChild(gv);
            this.m_itemHeight = rc.height;
        }
        _createRow(props) {
            let row;
            if (this.m_recycler.length) {
                row = this.m_recycler.pop();
                row.clearClasses();
                row.addClass(props.cls);
                row.setContent(props.content);
                row.setStyle(props.style);
                for (let n in props.data) {
                    row.setData(n, props.data[n]);
                }
            }
            else {
                row = new layout_js_9.HLayout(props);
            }
            if (!row.dom) {
                this.m_container.appendChild(row);
            }
            return row;
        }
        _buildItems(canOpt = true) {
            let rc = this.getBoundingRect();
            let rh = this.m_header.getBoundingRect();
            let height = rc.height - rh.height + this.m_itemHeight;
            if (this.m_itemHeight == 0) {
                this._computeItemHeight();
            }
            let top = this.m_topIndex * this.m_itemHeight;
            let y = 0;
            let cidx = 0;
            let index = this.m_topIndex;
            let count = this.m_dataview ? this.m_dataview.count : 0;
            let full_width = 0;
            let even = this.m_topIndex & 1 ? true : false;
            // compute full width
            this.m_columns.forEach((col) => {
                full_width += col.width ?? 0;
            });
            // if items height make scroll visible, update header width
            if (((count + 1) * this.m_itemHeight) >= height) {
                let w = component_js_19.Component.getScrollbarSize();
                this.m_header.setStyleValue("paddingRight", w);
                this.m_footer?.setStyleValue("paddingRight", w);
            }
            else {
                this.m_header.setStyleValue("paddingRight", 0);
                this.m_footer?.setStyleValue("paddingRight", 0);
            }
            // passe 0 - all created cells are moved to the recycler
            if (this.m_visible_rows) {
                this.m_visible_rows.forEach((c) => {
                    this.m_recycler.push(c);
                });
            }
            this.m_visible_rows = [];
            let limit = 100;
            while (y < height && index < count && --limit > 0) {
                let rec = this.m_dataview.getByIndex(index);
                let rowid = rec.getID();
                let crow = canOpt ? this.m_recycler.findIndex((r) => r.getData('row-id') == rowid) : -1;
                if (crow >= 0) {
                    let rrow = this.m_recycler.splice(crow, 1)[0];
                    rrow.setStyle({
                        top: y + top,
                        minWidth: full_width,
                    });
                    if (this.m_hasMarks) {
                        rrow.setClass('@marked', this.m_marks.has(rowid));
                    }
                    rrow.removeClass('@hidden');
                    rrow.setClass('@selected', this.m_selection === rowid);
                    this.m_visible_rows[cidx] = rrow;
                }
                else {
                    let cols = this.m_columns.map((col) => {
                        let cls = '@cell';
                        if (col.align) {
                            cls += ' ' + col.align;
                        }
                        if (col.cls) {
                            cls += ' ' + col.cls;
                        }
                        let cell;
                        if (col.renderer) {
                            cell = col.renderer(rec);
                            if (cell) {
                                cell.addClass(cls);
                                cell.setStyleValue('width', col.width);
                                if (col.flex !== undefined) {
                                    cell.addClass('@flex');
                                    cell.setStyleValue('flex', col.flex);
                                }
                            }
                        }
                        else {
                            let fmt = col.formatter;
                            let text;
                            if (fmt && fmt instanceof Function) {
                                text = fmt(rec.getRaw(col.id), rec);
                            }
                            else {
                                text = rec.getField(col.id);
                            }
                            cell = new component_js_19.Component({
                                cls,
                                width: col.width,
                                content: (0, component_js_19.html) `<span>${text}</span>`,
                                flex: col.flex
                            });
                        }
                        return cell;
                    });
                    let cls = '@row';
                    if (this.m_hasMarks) {
                        if (this.m_marks.has(rowid)) {
                            cls += ' @marked';
                        }
                    }
                    if (this.m_selection === rowid) {
                        cls += ' @selected';
                    }
                    let row = this.m_visible_rows[cidx] = this._createRow({
                        cls,
                        content: cols,
                        style: {
                            top: y + top,
                            minWidth: full_width,
                        },
                        data: {
                            'row-id': rowid,
                            'row-idx': index
                        }
                    });
                    row.addClass(even ? 'even' : 'odd');
                    even = !even;
                    if (this.m_rowClassifier) {
                        this.m_rowClassifier(rec, row);
                    }
                }
                y += this.m_itemHeight;
                index++;
                cidx++;
            }
            // if some cells are still in cache, hide them
            this.m_recycler.forEach((c) => {
                c.addClass('@hidden');
            });
            //this.m_container.setContent(<ComponentContent>this.m_visible_rows);
            let show = !count;
            let msg = (this.m_empty_text instanceof Function) ? this.m_empty_text() : this.m_empty_text;
            this.m_empty_msg.text = msg;
            if (show && msg.length == 0) {
                show = false;
            }
            this.m_empty_msg.show(show);
            if (full_width < rc.width) {
                this.m_header.setStyleValue('width', null);
                this.m_footer?.setStyleValue('width', null);
                this.m_container.setStyle({
                    height: count * this.m_itemHeight,
                    width: null
                });
            }
            else {
                this.m_header.setStyleValue('width', full_width);
                this.m_footer?.setStyleValue('width', full_width);
                this.m_container.setStyle({
                    height: count * this.m_itemHeight,
                    width: full_width
                });
            }
        }
        /**
         *
         */
        _updateScroll(forceUpdate) {
            if (!this.m_view_el || !this.m_view_el.dom) {
                return;
            }
            const update = () => {
                let newTop = Math.floor(this.m_view_el.dom.scrollTop / (this.m_itemHeight || 1));
                if (newTop != this.m_topIndex || forceUpdate) {
                    this.m_topIndex = newTop;
                    this._buildItems(!forceUpdate);
                }
                let newLeft = this.m_view_el.dom.scrollLeft;
                this.m_header.setStyleValue('left', -newLeft);
                this.m_footer?.setStyleValue('left', -newLeft);
            };
            if (forceUpdate) {
                this.singleShot(update, 10);
            }
            else {
                update();
            }
        }
        /** @ignore */
        _rowFromTarget(dom) {
            let self = this.dom;
            while (dom && dom != self) {
                let itm = component_js_19.Component.getElement(dom);
                if (itm) {
                    let id = itm.getData('row-id');
                    if (id !== undefined) {
                        return { id, itm };
                    }
                }
                dom = dom.parentElement;
            }
            return undefined;
        }
        _itemClick(e) {
            let hit = this._rowFromTarget(e.target);
            if (hit) {
                this._selectItem(hit.id, hit.itm);
            }
            else {
                this._selectItem(undefined, undefined);
            }
        }
        _itemDblClick(e) {
            let hit = this._rowFromTarget(e.target);
            if (hit) {
                this._selectItem(hit.id, hit.itm);
                let rec = this.m_dataview.getById(hit.id);
                this.emit('dblClick', (0, component_js_19.EvDblClick)(rec));
                if (this.m_hasMarks) {
                    this._toggleMark(rec);
                }
            }
        }
        /** @ignore */
        _itemMenu(e) {
            let dom = e.target, self = this.dom;
            while (dom && dom != self) {
                let itm = component_js_19.Component.getElement(dom), id = itm?.getData('row-id');
                if (id !== undefined) {
                    this._selectItem(id, itm);
                    let idx = itm.getData('row-idx');
                    let rec = this.m_dataview.getByIndex(idx);
                    this._showItemContextMenu(e, rec);
                    e.preventDefault();
                    return;
                }
                dom = dom.parentElement;
            }
        }
        /**
         *
         */
        _findItem(id) {
            for (let i = 0; i < this.m_visible_rows.length; i++) {
                let itm = this.m_visible_rows[i];
                if (itm.getData('row-id') === id) {
                    return itm;
                }
            }
            return null;
        }
        /**
         * @ignore
         * called when an item is selected by mouse
         */
        _selectItem(item, dom_item, scrollIntoView) {
            if (this.m_selection !== undefined) {
                let old = this._findItem(this.m_selection);
                if (old) {
                    old.removeClass('@selected');
                }
            }
            this.m_selection = item;
            if (item) {
                if (scrollIntoView) {
                    this._scrollIntoView(item, scrollIntoView);
                }
                if (!dom_item) {
                    dom_item = this._findItem(item);
                }
                if (dom_item) {
                    dom_item.addClass('@selected');
                }
                let rec = this.m_dataview.getById(item);
                this.emit('selectionChange', (0, x4_events_js_16.EvSelectionChange)(rec));
            }
            else {
                this.emit('selectionChange', (0, x4_events_js_16.EvSelectionChange)(null));
            }
        }
        /**
         *
         */
        _showItemContextMenu(event, item) {
            this.emit('contextMenu', (0, x4_events_js_16.EvContextMenu)(event, item));
        }
        /**
         *
         */
        clearSelection() {
            this._selectItem(null, null);
        }
        /**
         * todo: moveto datastore
         */
        exportData(filename) {
            let data = '';
            const fsep = '\t';
            const lsep = '\r\n';
            let rec = '';
            this.m_columns.map((col) => {
                if (rec.length) {
                    rec += fsep;
                }
                rec += col.title;
            });
            data += rec + lsep;
            let count = this.m_dataview.count;
            for (let i = 0; i < count; i++) {
                let record = this.m_dataview.getByIndex(i);
                rec = '';
                let cols = this.m_columns.map((col) => {
                    let text = record.getField(col.id);
                    let fmt = col.formatter;
                    if (fmt && fmt instanceof Function) {
                        text = fmt(text, record);
                    }
                    if (rec.length > 0) {
                        rec += fsep;
                    }
                    rec += text;
                });
                data += rec + lsep;
            }
            //todo: review that
            data = data.replace(/[àâä]/gm, 'a');
            data = data.replace(/[éèê]/gm, 'e');
            data = data.replace(/[îï]/gm, 'i');
            data = data.replace(/[ûüù]/gm, 'u');
            data = data.replace(/ /gm, ' '); // non breaking space
            (0, tools_js_20.downloadData)(data, 'text/csv', filename);
        }
        set empty_text(text) {
            this.m_empty_msg.text = text;
        }
        _renderCheck(rec) {
            let cls = '';
            if (this.m_marks.has(rec.getID())) {
                cls = ' checked';
            }
            return new component_js_19.Component({ cls: '@grid-checkbox' + cls });
        }
        _toggleMark(rec) {
            let id = rec.getID();
            let chk = false;
            if (this.m_marks.has(id)) {
                this.m_marks.delete(id);
            }
            else {
                this.m_marks.add(id);
                chk = true;
            }
            this.emit('gridCheck', EvGridCheck(rec, chk));
            this._buildItems(false);
        }
        getMarks() {
            let ids = [];
            for (const v of this.m_marks.values()) {
                ids.push(v);
            }
            return ids;
        }
        clearMarks() {
            if (this.m_marks.size) {
                this.m_marks = new Set();
                this._buildItems(false);
            }
        }
        setFooterData(rec) {
            if (!this.m_footer) {
                return;
            }
            this.m_footer.enumChilds((c) => {
                let cid = c.getData('col');
                let col = this.m_columns[cid];
                let fmt = col.formatter;
                let text;
                if (fmt && fmt instanceof Function) {
                    text = fmt(rec[col.id], rec);
                }
                else {
                    text = rec[col.id];
                }
                c.setContent(text, false);
            });
        }
    }
    exports.GridView = GridView;
});
/**
* @file link.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/link", ["require", "exports", "x4/component", "x4/x4_events"], function (require, exports, component_js_20, x4_events_js_17) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Link = void 0;
    /**
     * Standard Link
     */
    class Link extends component_js_20.Component {
        constructor(props) {
            super(props);
            this.setDomEvent('click', () => this._handleClick());
            this.mapPropEvents(props, 'click');
        }
        _handleClick() {
            this.emit('click', (0, x4_events_js_17.EvClick)());
        }
        /** @ignore */
        render(props) {
            let text = props.text ?? '';
            let href = props.href ?? '#';
            this.setAttribute('tabindex', 0);
            this.setProp('tag', 'a');
            this.setAttribute('href', href);
            this.setAttribute('target', props.target);
            if (text) {
                this.setContent((0, component_js_20.isHtmlString)(text) ? text : (0, component_js_20.html) `<span>${text}</span>`);
            }
        }
        set text(text) {
            this.m_props.text = text;
            this.update();
        }
    }
    exports.Link = Link;
});
/**
* @file messagebox.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/messagebox", ["require", "exports", "x4/dialog", "x4/tools", "x4/layout", "x4/icon", "x4/label", "x4/textedit"], function (require, exports, dialog_js_3, tools_js_21, layout_js_10, icon_js_6, label_js_11, textedit_js_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PromptDialogBox = exports.MessageBox = void 0;
    class MessageBox extends dialog_js_3.Dialog {
        m_label;
        constructor(props) {
            // remove overloaded elements from DialogBoxProps
            let icon = props.icon ?? 0xf06a; // todo: resolve that
            props.icon = undefined;
            let buttons = props.buttons === undefined ? ['ok'] : props.buttons;
            props.buttons = undefined;
            super(props);
            this.form.updateContent(new layout_js_10.HLayout({
                style: { padding: 8 },
                content: [
                    new icon_js_6.Icon({ cls: 'icon', icon }),
                    this.m_label = new label_js_11.Label({ cls: 'text', text: props.message })
                ]
            }), buttons);
            this.on('btnClick', (ev) => {
                // no prevent default -> always close the messagebox
                if (!this.m_props.click) {
                    return;
                }
                (0, tools_js_21.asap)(() => {
                    this.m_props.click(ev.button);
                });
            });
        }
        set text(txt) {
            this.m_label.text = txt;
        }
        /**
         * display a messagebox
         */
        static show(props) {
            let msg;
            if ((0, tools_js_21.isString)(props) || (0, tools_js_21.isHtmlString)(props)) {
                msg = new MessageBox({ message: props, click: () => { } });
            }
            else {
                msg = new MessageBox(props);
            }
            msg.show();
            return msg;
        }
        /**
         * display an alert message
         */
        static alert(text, title = null) {
            new MessageBox({
                cls: 'warning',
                title,
                message: text,
                buttons: ['ok'],
                click: () => { },
            }).show();
        }
    }
    exports.MessageBox = MessageBox;
    class PromptDialogBox extends dialog_js_3.Dialog {
        m_edit;
        constructor(props) {
            // remove overloaded elements from DialogBoxProps
            let icon = props.icon ?? 0xf4ac; // todo: resolve that
            props.icon = undefined;
            props.buttons = undefined;
            props.width = props.width ?? 500;
            super(props);
            this.form.updateContent(new layout_js_10.HLayout({
                cls: 'panel',
                content: [
                    new icon_js_6.Icon({
                        cls: 'icon',
                        icon: icon
                    }),
                    this.m_edit = new textedit_js_3.TextEdit({
                        flex: 1,
                        autoFocus: true,
                        label: props.message,
                        value: props.value
                    }),
                ]
            }), ['ok', 'cancel']);
            if (props.click) {
                this.on('btnClick', (ev) => {
                    if (ev.button === 'ok') {
                        // no prevent default -> always close the messagebox
                        // asap to allow
                        (0, tools_js_21.asap)(() => {
                            this.m_props.click(this.m_edit.value);
                        });
                    }
                });
            }
        }
        set text(txt) {
            this.m_edit.label = txt;
        }
        /**
         * display a messagebox
         */
        static show(props, inputCallback) {
            let msg;
            if ((0, tools_js_21.isString)(props) || (0, tools_js_21.isHtmlString)(props)) {
                msg = new PromptDialogBox({ message: props, click: inputCallback });
            }
            else {
                msg = new PromptDialogBox(props);
            }
            msg.show();
            return msg;
        }
    }
    exports.PromptDialogBox = PromptDialogBox;
});
/**
* @file spreadsheet.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/spreadsheet", ["require", "exports", "x4/component", "x4/layout", "x4/textedit", "x4/tools", "x4/tools", "x4/x4_events", "x4/combobox"], function (require, exports, component_js_21, layout_js_11, textedit_js_4, tools_js_22, tools_js_23, x4_events_js_18, combobox_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Spreadsheet = void 0;
    class CellData {
        text;
        cls;
        static empty_cell = {
            text: ''
        };
    }
    /**
     *
     */
    class Spreadsheet extends layout_js_11.VLayout {
        m_columns;
        m_row_limit;
        m_cells_data;
        m_rows_data;
        m_view;
        m_container;
        m_header;
        m_itemHeight;
        m_topIndex;
        m_visible_cells;
        m_row_count; // visible row count
        m_selection;
        m_editor;
        m_autoedit;
        m_lockupdate;
        m_auto_row_count;
        m_recycler;
        m_used_cells;
        constructor(props) {
            super(props);
            this.m_columns = props.columns;
            this.m_autoedit = props.autoedit;
            this.m_lockupdate = 0;
            this.m_cells_data = new Map();
            this.m_rows_data = new Map();
            this.m_itemHeight = 0;
            this.m_selection = { row: 0, col: 0 };
            this.m_row_count = 0;
            this.m_auto_row_count = false;
            this.m_recycler = [];
            this.m_used_cells = [];
            if (props.maxrows === undefined) {
                this.m_row_limit = 0;
                this.m_auto_row_count = true;
            }
            else if (props.maxrows < 0) {
                this.m_row_limit = 0;
                this.m_auto_row_count = true;
            }
            else {
                this.m_row_limit = props.maxrows;
            }
            this.setAttribute('tabIndex', 0);
            this.setDomEvent('click', (e) => this._itemClick(e));
            this.setDomEvent('dblclick', (e) => this._itemDblClick(e));
            this.setDomEvent('keydown', (e) => this._handleKey(e));
            this.setDomEvent('keypress', (e) => this._keyPress(e));
            this.setDomEvent('focus', () => this._focus(true));
            this.setDomEvent('focusout', () => this._focus(false));
            this.setDomEvent('contextmenu', (e) => this._ctxMenu(e));
            this.mapPropEvents(props, 'dblClick', 'selectionChange', 'contextMenu', 'change');
        }
        componentCreated() {
            super.componentCreated();
            this._updateScroll(true);
        }
        setColWidth(col, width) {
            this._on_col_resize(col, width);
            this.update(10);
        }
        getColWidth(col) {
            if (!this.m_columns[col]) {
                return;
            }
            return this.m_columns[col].width;
        }
        setColTitle(col, title) {
            console.assert(this.m_columns[col] !== undefined); // what ?
            this.m_columns[col].title = title;
            this.update(10);
        }
        reset(columns) {
            this.m_columns = columns;
            this.m_cells_data = new Map();
            this.m_rows_data = new Map();
            this.update(10);
        }
        /**
         * insert a row
         * @param before row number before wich insert the new row
         */
        insertRow(before) {
            let new_cells_data = new Map();
            this.m_cells_data.forEach((celldata, key) => {
                let { row, col } = _getid(key);
                if (row >= before) {
                    new_cells_data.set(_mkid(row + 1, col), celldata);
                }
                else {
                    new_cells_data.set(key, celldata);
                }
            });
            let new_rows_data = new Map();
            this.m_rows_data.forEach((rowdata, row) => {
                if (row >= before) {
                    new_rows_data.set(row + 1, rowdata);
                }
                else {
                    new_rows_data.set(row, rowdata);
                }
            });
            this.m_cells_data = new_cells_data;
            this.m_rows_data = new_rows_data;
            this._buildItems();
        }
        /**
         * remove a row
         * @param rowtodel row number to remove
         */
        deleteRow(rowtodel) {
            let new_cells_data = new Map();
            let new_rows_data = new Map();
            this.m_cells_data.forEach((celldata, key) => {
                let { row, col } = _getid(key);
                if (row > rowtodel) {
                    new_cells_data.set(_mkid(row - 1, col), celldata);
                }
                else if (row < rowtodel) {
                    new_cells_data.set(key, celldata);
                }
            });
            this.m_rows_data.forEach((rowdata, row) => {
                if (row > rowtodel) {
                    new_rows_data.set(row - 1, rowdata);
                }
                else if (row < rowtodel) {
                    new_rows_data.set(row, rowdata);
                }
            });
            this.m_cells_data = new_cells_data;
            this.m_rows_data = new_rows_data;
            this._buildItems();
        }
        /**
         * insert a new column
         * @param before column index before to insert the new column or <0 to append
         */
        insertCol(before, column) {
            let inspos = before;
            if (inspos < 0) {
                inspos = this.m_columns.length + 1;
            }
            // insert the col at the right place
            this.m_columns.splice(inspos, 0, column);
            if (before >= 0) {
                let new_cells_data = new Map();
                this.m_cells_data.forEach((celldata, key) => {
                    let { row, col } = _getid(key);
                    if (col >= before) {
                        new_cells_data.set(_mkid(row, col + 1), celldata);
                    }
                    else {
                        new_cells_data.set(key, celldata);
                    }
                });
                this.m_cells_data = new_cells_data;
            }
            this.update();
        }
        /**
         * remove a column
         * @param coltodel
         */
        deleteCol(coltodel) {
            // insert the col at the right place
            this.m_columns.splice(coltodel, 1);
            let new_cells_data = new Map();
            this.m_cells_data.forEach((celldata, key) => {
                let { row, col } = _getid(key);
                if (col > coltodel) {
                    new_cells_data.set(_mkid(row, col - 1), celldata);
                }
                else if (col < coltodel) {
                    new_cells_data.set(key, celldata);
                }
            });
            this.m_cells_data = new_cells_data;
            this.update();
        }
        /**
         *
         * @param row
         * @param col
         */
        _getCellData(row, col, raw = false) {
            let value = this.m_cells_data.get(_mkid(row, col));
            if (value === undefined) {
                return raw ? null : CellData.empty_cell;
            }
            return value;
        }
        _focus(focus) {
            this.setClass('@focus', focus);
        }
        _ctxMenu(e) {
            let dom = e.target, self = this.dom;
            while (dom && dom != self) {
                let itm = component_js_21.Component.getElement(dom), row = itm.getData('row-id'), col = itm.getData('col-id');
                if (row !== undefined) {
                    this._selectItem(row, col);
                    this.emit('contextMenu', (0, x4_events_js_18.EvContextMenu)(e, { row, col, item: itm }));
                    e.preventDefault();
                    return;
                }
                dom = dom.parentElement;
            }
        }
        /** @ignore */
        render() {
            this.m_recycler = [];
            this.m_container = new component_js_21.Component({
                cls: 'content',
            });
            this.m_view = new component_js_21.Component({
                cls: '@scroll-view',
                flex: 1,
                dom_events: {
                    sizechange: () => this._updateScroll(true),
                    scroll: () => this._updateScroll(false)
                },
                content: this.m_container
            });
            let cols = this.m_columns.map((col, index) => {
                let comp = new component_js_21.Component({
                    cls: '@cell c' + index,
                    content: col.title ? col.title : '&nbsp',
                    flex: col.width < 0 ? -col.width : undefined,
                    attrs: {
                        title: col.title
                    },
                    style: {
                        width: col.width >= 0 ? col.width : undefined,
                        minWidth: col.min_width
                    },
                });
                new component_js_21.SizerOverlay({
                    target: comp,
                    sens: 'right',
                    resize: (ev) => {
                        this._on_col_resize(index, ev.size.width);
                    }
                });
                col.$col = comp;
                return comp;
            });
            this.m_header = new layout_js_11.HLayout({
                cls: '@header',
                content: cols,
            });
            this.setContent([
                this.m_header,
                this.m_view
            ]);
        }
        /**
         *
         */
        _on_col_resize(col, width) {
            if (!this.m_columns[col]) {
                return;
            }
            // -> flex
            if (width <= 0) {
                this.m_columns[col].width = -1; // flex default
            }
            else {
                this.m_columns[col].width = width;
            }
            this._updateScroll(true);
        }
        /**
         * compute misc dimensions
         * - item height
         * - scroll width
         */
        _computeItemHeight() {
            let g1 = document.createElement('div');
            g1.classList.add('x-spreadsheet');
            let g2 = document.createElement('div');
            g2.classList.add('content');
            let g3 = document.createElement('div');
            g3.classList.add('x-cell');
            g3.append('&nbsp;');
            g2.appendChild(g3);
            g1.appendChild(g2);
            this.dom.appendChild(g1);
            let rc = g3.getBoundingClientRect();
            this.dom.removeChild(g1);
            this.m_itemHeight = rc.height;
        }
        /**
         * compute columns widths
         * use col.width for fixed size columns
         * if col.width < 0 that mean that this is a proportion of the remaining space
         */
        _calcColWidths(width) {
            let fullw = 0;
            let nwide = 0;
            let calcw = new Int32Array(this.m_columns.length);
            let calcz = new Int32Array(this.m_columns.length);
            let calcm = new Int32Array(this.m_columns.length);
            this.m_columns.forEach((col, colIdx) => {
                let minw = Math.max(10, col.min_width ?? 0);
                if (col.width > 0) {
                    let cw = Math.max(col.width, minw);
                    fullw += cw;
                    calcw[colIdx] = cw;
                }
                else {
                    let z = -col.width;
                    calcz[colIdx] = z;
                    nwide += z;
                }
                calcm[colIdx] = minw;
            });
            if (nwide) {
                let restw = width - fullw;
                for (let i = 0; i < this.m_columns.length && nwide; i++) {
                    if (!calcw[i]) {
                        let rest = Math.round(restw / nwide) * calcz[i];
                        if (rest < calcm[i]) {
                            rest = calcm[i];
                        }
                        calcw[i] = rest;
                        restw -= rest;
                        nwide -= calcz[i];
                    }
                }
            }
            return calcw;
        }
        /**
         * create a cell (component)
         * and append it to the parent view
         * if a cell was reviously recyled, use it
         */
        _createCell() {
            let cell;
            if (this.m_recycler.length) {
                cell = this.m_recycler.pop();
                cell.clearClasses();
            }
            else {
                cell = new component_js_21.Component({
                    cls: '@cell'
                });
            }
            if (!cell.dom) {
                this.m_container.appendChild(cell);
            }
            return cell;
        }
        /**
         * build cells of the spreadsheet
         * cells are recycled when scrolling,
         * only visibles cells exists
         */
        _buildItems() {
            let rc = this.getBoundingRect();
            let rh = this.m_header.getBoundingRect();
            let height = rc.height - rh.height;
            if (this.m_itemHeight == 0) {
                this._computeItemHeight();
            }
            let top = this.m_topIndex * this.m_itemHeight;
            let y = 0;
            let cidx = 0;
            let rowIdx = this.m_topIndex;
            let count = this.m_row_limit;
            if (this.m_auto_row_count) {
                //@review should be evaluated only when row count change
                this.m_row_limit = count = this.getMaxRowCount();
            }
            let right_pos = 0;
            if ((count * this.m_itemHeight) > height) {
                let w = component_js_21.Component.getScrollbarSize();
                rc.width -= w;
                right_pos = w;
            }
            let even = this.m_topIndex & 1 ? true : false;
            this.m_visible_cells = new Map();
            // passe 0 - all created cells are moved to the recycler
            this.m_used_cells.forEach((c) => {
                this.m_recycler.push(c);
            });
            this.m_used_cells = [];
            // pass 1 - compute column widths
            let calcw = this._calcColWidths(rc.width);
            //
            let full_width = 0;
            for (let i = 0; i < calcw.length; i++) {
                full_width += calcw[i];
            }
            if (full_width <= rc.width) {
                this.m_view.setStyleValue('overflow-x', 'hidden');
                this.m_header.setStyleValue('width', rc.width);
                this.m_container.setStyleValue('width', rc.width);
                this.m_container.setStyle({
                    height: count * this.m_itemHeight,
                });
            }
            else {
                this.m_header.setStyleValue('width', full_width);
                this.m_container.setStyleValue('width', full_width);
                this.m_view.setStyleValue('overflow-x', 'visible');
                this.m_container.setStyle({
                    height: count * this.m_itemHeight,
                    width: full_width
                });
            }
            this.m_view.addClass('@hidden');
            // pass 2 - build cells
            let limit = 100;
            while (y < height && rowIdx < count && --limit > 0) {
                let rowdata = this.m_rows_data.get(rowIdx);
                let x = 0;
                let cols = this.m_columns.map((col, colIdx) => {
                    let cls = '@cell c' + colIdx;
                    if (col.align) {
                        cls += ' ' + col.align;
                    }
                    if (col.cls) {
                        cls += ' ' + col.cls;
                    }
                    let cell;
                    let celldata = this._getCellData(rowIdx, colIdx);
                    let text = celldata.text;
                    if (col.renderer && text.length) {
                        text = col.renderer(text, { row: rowIdx, col: colIdx });
                    }
                    //if( text.length==0 ) {
                    //	text = '&nbsp;'
                    //}
                    cls += (even ? ' even' : ' odd');
                    if (rowdata) {
                        cls += ' ' + rowdata;
                    }
                    cell = this._createCell();
                    this.m_used_cells.push(cell);
                    cell.setContent(text); // always because cell reuse
                    cell.addClass(cls);
                    cell.setStyle({
                        left: x,
                        top: top + y,
                        width: calcw[colIdx]
                    });
                    if (this.m_selection.row == rowIdx && this.m_selection.col == colIdx) {
                        cell.addClass('@selected');
                    }
                    cell.setData('row-id', rowIdx);
                    cell.setData('col-id', colIdx);
                    if (celldata.cls) {
                        cell.addClass(celldata.cls);
                    }
                    this.m_visible_cells.set(_mkid(rowIdx, colIdx), cell);
                    x += calcw[colIdx];
                    return cell;
                });
                even = !even;
                y += this.m_itemHeight;
                rowIdx++;
                cidx++;
                //rows.splice( rows.length, 0, ...cols );
            }
            // if some cells are still in cache, hide them
            this.m_recycler.forEach((c) => {
                c.addClass('@hidden');
            });
            this.m_row_count = cidx;
            //this.m_container.setContent( <ComponentContent>rows);
            this.m_view.removeClass('@hidden');
            this.setClass('empty', count == 0);
        }
        /** @ignore */
        _itemClick(e) {
            let dom = e.target;
            if (this.m_editor && this.m_editor.dom.contains(dom)) {
                return;
            }
            let itm = component_js_21.Component.getElement(dom, component_js_21.Component);
            if (!itm) {
                return;
            }
            let rowIdx = itm.getData('row-id'), colIdx = itm.getData('col-id');
            if (rowIdx === undefined || colIdx === undefined) {
                return;
            }
            this._selectItem(rowIdx, colIdx);
        }
        _itemDblClick(e) {
            let dom = e.target;
            if (this.m_editor && this.m_editor.dom.contains(dom)) {
                return;
            }
            let itm = component_js_21.Component.getElement(dom), rowIdx = itm.getData('row-id'), colIdx = itm.getData('col-id');
            if (rowIdx === undefined || colIdx === undefined) {
                return;
            }
            this.emit('dblClick', (0, component_js_21.EvDblClick)({ row: rowIdx, col: colIdx }));
            this.editCell(rowIdx, colIdx);
        }
        /**
         *
         * @param rowIdx
         * @param colIdx
         * @param scrollIntoView
         */
        _selectItem(rowIdx, colIdx, scrollIntoView) {
            if (rowIdx < 0) {
                rowIdx = 0;
            }
            if (rowIdx > this.m_row_limit - 1) {
                rowIdx = this.m_row_limit - 1;
            }
            if (colIdx < 0) {
                colIdx = 0;
            }
            let lastcol = this.m_columns.length - 1;
            if (colIdx > lastcol) {
                colIdx = lastcol;
            }
            if (this.m_selection.row == rowIdx && this.m_selection.col == colIdx) {
                return;
            }
            this.select(rowIdx, colIdx, scrollIntoView);
        }
        _scrollIntoView(row, col) {
            let doscroll = (itm, mode = 'nearest') => {
                itm.scrollIntoView({
                    block: mode //<ScrollLogicalPosition>sens ?? 'nearest'
                });
            };
            let last = this.m_topIndex + this.m_row_count - 1;
            if (row < this.m_topIndex) {
                this.m_topIndex = row;
                this.m_view.dom.scrollTop = this.m_topIndex * this.m_itemHeight;
                this._buildItems();
                doscroll(this._findItem(row, col), 'start');
            }
            else if (row > last) {
                this.m_topIndex = row - this.m_row_count + 1;
                this.m_view.dom.scrollTop = this.m_topIndex * this.m_itemHeight;
                this._buildItems();
                doscroll(this._findItem(row, col), 'end');
            }
            else {
                doscroll(this._findItem(row, col));
            }
        }
        /**
         *
         * @param row
         * @param col
         */
        _findItem(row, col) {
            if (!this.m_visible_cells) {
                return null;
            }
            return this.m_visible_cells.get(_mkid(row, col));
        }
        /**
         *
         */
        _updateScroll(forceUpdate) {
            if (!this?.m_view?.dom) {
                return;
            }
            let newTop = Math.floor(this.m_view.dom.scrollTop / (this.m_itemHeight || 1));
            if (newTop != this.m_topIndex || forceUpdate) {
                this.m_topIndex = newTop;
                this._buildItems();
            }
            let newLeft = this.m_view.dom.scrollLeft;
            this.m_header.setStyleValue('left', -newLeft);
        }
        /**
         *
         * @param event
         * @param t
         */
        _moveSel(sensy, sensx) {
            let sel = this.m_selection;
            let newRow = sel.row ?? 0;
            let newCol = sel.col ?? 0;
            if (sensy == 1) {
                newRow++;
            }
            else if (sensy == -1) {
                newRow--;
            }
            else if (sensy == 2) {
                newRow += this.m_row_count - 1;
            }
            else if (sensy == -2) {
                newRow -= this.m_row_count - 1;
            }
            else if (sensy == 3) {
                newRow = this.m_row_limit - 1;
            }
            else if (sensy == -3) {
                newRow = 0;
            }
            if (sensx == 1) {
                newCol++;
            }
            else if (sensx == -1) {
                newCol--;
            }
            else if (sensx == 2) {
                newCol = this.m_columns.length - 1;
            }
            else if (sensx == -2) {
                newCol = 0;
            }
            else if (sensx == 3) { // new editable cell skip line if needed
                newCol++;
                let lastcol = this.m_columns.length - 1;
                l1: for (let trys = 0; trys < 2; trys++) {
                    while (newCol < lastcol) {
                        if (this.m_columns[newCol].createEditor !== null) {
                            break l1;
                        }
                        newCol++;
                    }
                    if (newCol > lastcol) {
                        newRow++;
                        newCol = 0;
                    }
                }
            }
            else if (sensx == -3) {
                newCol--;
                let lastcol = this.m_columns.length - 1;
                l2: for (let trys = 0; trys < 2; trys++) {
                    while (newCol >= 0) {
                        if (this.m_columns[newCol].createEditor !== null) {
                            break l2;
                        }
                        newCol--;
                    }
                    if (newCol < 0) {
                        newRow--;
                        newCol = lastcol;
                    }
                }
            }
            this._selectItem(newRow, newCol, true);
        }
        _handleKey(event) {
            let dom = event.target;
            if (this.m_editor && this.m_editor.dom.contains(dom)) {
                return;
            }
            switch (event.key) {
                case 'ArrowDown':
                case 'Down': {
                    this._moveSel(1, 0);
                    break;
                }
                case 'ArrowUp':
                case 'Up': {
                    this._moveSel(-1, 0);
                    break;
                }
                case 'PageUp': {
                    this._moveSel(-2, 0);
                    break;
                }
                case 'PageDown': {
                    this._moveSel(2, 0);
                    break;
                }
                case 'ArrowLeft':
                case 'Left': {
                    this._moveSel(0, -1);
                    break;
                }
                case 'ArrowRight':
                case 'Right': {
                    this._moveSel(0, 1);
                    break;
                }
                case 'Home': {
                    if (event.ctrlKey) {
                        this._moveSel(-3, 0);
                    }
                    else {
                        this._moveSel(0, -2);
                    }
                    break;
                }
                case 'End': {
                    if (event.ctrlKey) {
                        this._moveSel(3, 0);
                    }
                    else {
                        this._moveSel(0, 2);
                    }
                    break;
                }
                case 'Enter': {
                    this.editCurCell();
                    event.stopPropagation();
                    break;
                }
                case 'Delete': {
                    this.clearCell(this.m_selection.row, this.m_selection.col);
                    break;
                }
                default: {
                    //console.log( "unknown key: ", event.key);
                    break;
                }
            }
        }
        _keyPress(event) {
            let dom = event.target;
            if (this.m_editor && this.m_editor.dom.contains(dom)) {
                return;
            }
            if (event.ctrlKey || event.altKey) {
                return;
            }
            this.editCurCell(event.key);
        }
        /**
         * return the selection
         * { row, col }
         */
        getSelection() {
            return this.m_selection;
        }
        select(row, col, scrollIntoView = true) {
            if (this.m_selection.row == row && this.m_selection.col == col) {
                return;
            }
            let oldSel = this._findItem(this.m_selection.row, this.m_selection.col);
            if (oldSel) {
                oldSel.removeClass('@selected');
            }
            this.m_selection = { row, col };
            if (scrollIntoView) {
                this._scrollIntoView(row, col);
            }
            let newSel = this._findItem(row, col);
            if (newSel) {
                newSel.addClass('@selected');
            }
            this.emit('selectionChange', (0, x4_events_js_18.EvSelectionChange)({ row, col }));
        }
        /**
         * return the row count
         */
        rowCount() {
            return this.m_row_limit;
        }
        /**
         * return the maximum row index filled with something
         */
        getMaxRowCount() {
            let max_row = 0;
            this.m_cells_data.forEach((c, uid) => {
                let row = Math.round(uid / 1000) + 1;
                if (max_row < row) {
                    max_row = row;
                }
            });
            return max_row;
        }
        getColCount() {
            return this.m_columns.length;
        }
        setRowStyle(row, cls) {
            this.m_rows_data.set(row, cls);
            if (this.m_lockupdate == 0) {
                this._buildItems();
            }
        }
        getRowStyle(row) {
            return this.m_rows_data.get(row);
        }
        setCellStyle(row, col, cls) {
            let cell = this._getCellData(row, col, true);
            if (!cell) {
                cell = { text: '' };
                this.m_cells_data.set(_mkid(row, col), cell);
            }
            cell.cls = cls;
            if (this.m_lockupdate == 0 && this.m_visible_cells) {
                let itm = this._findItem(row, col);
                if (itm) {
                    itm.setClass(cls, true); //todo: pb when changing classes
                }
                else {
                    this._buildItems();
                }
            }
        }
        getCellText(row, col) {
            return this._getCellData(row, col).text;
        }
        getCellNumber(row, col) {
            let text = this._getCellData(row, col).text;
            return (0, tools_js_22.parseIntlFloat)(text);
        }
        clearRow(row) {
            for (let c = 0; c < this.m_columns.length; c++) {
                this.clearCell(row, c);
            }
            this.update(10);
        }
        clearCell(row, col) {
            this.setCellText(row, col, null);
        }
        editCurCell(forceText) {
            this.editCell(this.m_selection.row, this.m_selection.col, forceText);
        }
        editCell(row, col, forcedText) {
            if (!this.m_autoedit) {
                return;
            }
            // disable edition
            if (this.m_columns[col].createEditor === null) {
                return;
            }
            this._scrollIntoView(row, col);
            let item = this._findItem(row, col);
            let place = item.dom;
            let parent = place.parentElement;
            let rc = place.getBoundingClientRect();
            let prc = parent.getBoundingClientRect();
            let cell = this._getCellData(row, col, true);
            let edtBuilder = (props, col, row) => {
                return new textedit_js_4.TextEdit(props);
            };
            if (this.m_columns[col].createEditor) {
                edtBuilder = this.m_columns[col].createEditor;
            }
            let cellvalue = forcedText ? forcedText : (cell ? cell.text : '');
            this.m_editor = edtBuilder({
                cls: '@editor',
                style: {
                    left: rc.left - prc.left,
                    top: rc.top - prc.top,
                    width: rc.width,
                    height: rc.height
                },
                tabIndex: false,
                value: cellvalue,
                data: {
                    row,
                    col
                },
            }, row, col);
            if (!this.m_editor) {
                return;
            }
            parent.appendChild(this.m_editor._build());
            this._setupEditor();
            this.m_editor.setData('old-value', cellvalue);
            this.m_editor.focus();
            if (this.m_editor instanceof textedit_js_4.TextEdit) {
                this.m_editor.selectAll();
            }
        }
        _setupEditor() {
            let movesel = (sensy, sensx) => {
                (0, tools_js_23.deferCall)(() => {
                    this.killEditor(true);
                    this._moveSel(sensy, sensx);
                    this.editCurCell();
                });
            };
            // todo: better
            if (this.m_editor instanceof textedit_js_4.TextEdit) {
                let editor = this.m_editor;
                let input = editor.input;
                input.setDomEvent('blur', () => {
                    this.killEditor(true);
                });
                input.setDomEvent('keydown', (e) => {
                    switch (e.key) {
                        case 'Escape': {
                            this.killEditor(false);
                            e.stopPropagation();
                            break;
                        }
                        case 'Enter':
                        case 'Tab': {
                            let sens = 3;
                            if (e.shiftKey) {
                                sens = -3;
                            }
                            movesel(0, sens);
                            e.stopPropagation();
                            break;
                        }
                        case 'ArrowUp':
                        case 'Up': {
                            movesel(-1, 0);
                            e.stopPropagation();
                            break;
                        }
                        case 'ArrowDown':
                        case 'Down': {
                            movesel(1, 0);
                            e.stopPropagation();
                            break;
                        }
                    }
                });
            }
            else if (this.m_editor instanceof combobox_js_1.ComboBox) {
                let input = this.m_editor.input;
                input.setDomEvent('blur', () => {
                    this.killEditor(true);
                });
                input.setDomEvent('keydown', (e) => {
                    switch (e.key) {
                        case 'Escape': {
                            this.killEditor(false);
                            e.stopPropagation();
                            break;
                        }
                        case 'Enter':
                        case 'Tab': {
                            let sens = 3;
                            if (e.shiftKey) {
                                sens = -3;
                            }
                            movesel(0, sens);
                            e.stopPropagation();
                            break;
                        }
                    }
                });
                this.m_editor.showPopup();
                this.m_editor.on('change', (ev) => {
                    this.killEditor(true);
                });
                this.m_editor.on('cancel', (ev) => {
                    this.killEditor(false);
                });
            }
        }
        killEditor(save) {
            if (this.m_editor) {
                if (save) {
                    let text, id;
                    if (this.m_editor instanceof textedit_js_4.TextEdit) {
                        text = this.m_editor.value;
                    }
                    else if (this.m_editor instanceof combobox_js_1.ComboBox) {
                        id = this.m_editor.value;
                        text = this.m_editor.valueText;
                    }
                    let row = this.m_editor.getData('row');
                    let col = this.m_editor.getData('col');
                    let old = this.m_editor.getData('old-value');
                    this.setCellText(row, col, text);
                    const ev = (0, x4_events_js_18.EvChange)(text, { row, col, oldValue: old, id });
                    this.emit('change', ev);
                    if (ev.defaultPrevented) {
                        this.setCellText(row, col, old);
                    }
                }
                // cannot dipose while handling blur event, so we defer...
                let t = this.m_editor;
                (0, tools_js_22.asap)(() => {
                    t.dispose();
                });
                this.m_editor = null;
                this.focus();
            }
        }
        clearData() {
            this.m_cells_data = new Map();
            this.m_rows_data = new Map();
        }
        setCellText(row, col, value) {
            if (value == null || value.length == 0) {
                this.m_cells_data.delete(_mkid(row, col));
                value = ''; //'&nbsp';
            }
            else {
                let cell = this._getCellData(row, col, true);
                if (!cell) {
                    cell = {};
                }
                cell.text = value;
                this.m_cells_data.set(_mkid(row, col), cell);
            }
            if (this.m_lockupdate == 0 && this.m_visible_cells) {
                let itm = this._findItem(row, col);
                if (itm) {
                    if (this.m_columns[col].renderer) {
                        value = this.m_columns[col].renderer(value, { row, col });
                    }
                    itm.setContent(value);
                }
                else {
                    this._buildItems();
                }
            }
        }
        lockUpdate(start) {
            if (start) {
                this.m_lockupdate++;
            }
            else {
                if (--this.m_lockupdate == 0) {
                    this._updateScroll(true);
                }
            }
        }
    }
    exports.Spreadsheet = Spreadsheet;
    /**
     * @ignore
     */
    function _mkid(row, col) {
        return row * 1000 + col;
    }
    /**
     * @ignore
     */
    function _getid(key) {
        return {
            row: Math.floor(key / 1000) | 0,
            col: (key % 1000) | 0
        };
    }
});
/**
* @file propertyeditor.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/property_editor", ["require", "exports", "x4/component", "x4/x4_events", "x4/input", "x4/textedit", "x4/checkbox", "x4/spreadsheet", "x4/i18n"], function (require, exports, component_js_22, x4_events_js_19, input_js_4, textedit_js_5, checkbox_js_2, spreadsheet_js_1, i18n_js_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PropertyEditor = void 0;
    class PropertyEditor extends component_js_22.Component {
        m_fields;
        m_record;
        m_sheet;
        m_label_w;
        constructor(props) {
            super(props);
            this.mapPropEvents(props, 'change');
        }
        render(props) {
            this.m_record = props.record;
            this.m_fields = props.fields ?? [];
            this.m_label_w = props.labelWidth;
            this.m_sheet = new spreadsheet_js_1.Spreadsheet({
                cls: '@fit',
                columns: [
                    {
                        title: i18n_js_7._tr.global.property,
                        width: this.m_label_w > 0 ? this.m_label_w : -1,
                        cls: 'property'
                    },
                    {
                        title: i18n_js_7._tr.global.value,
                        width: -1,
                        createEditor: (...a) => this._editCell(...a),
                        renderer: (...a) => this._renderCell(...a)
                    },
                ],
                autoedit: true,
                change: (e) => this._cellChange(e)
            });
            this._updateProperties();
            this.setContent(this.m_sheet);
        }
        setFields(fields) {
            if (fields) {
                this.m_fields = fields;
                this._updateProperties();
            }
            else {
                this.m_sheet.clearData();
            }
        }
        setRecord(record) {
            this.m_record = record;
            this._updateProperties();
        }
        _updateProperties() {
            this.m_sheet.lockUpdate(true);
            this.m_sheet.clearData();
            this.m_fields.forEach((fld, lno) => {
                this.m_sheet.setCellText(lno, 0, fld.title);
                if (this.m_record) {
                    this.m_sheet.setCellText(lno, 1, this.m_record.getField(fld.id));
                }
                else {
                    this.m_sheet.setCellText(lno, 1, fld.value);
                }
            });
            this.m_sheet.lockUpdate(false);
        }
        _cellChange(ev) {
            let ctx = ev.context;
            let text = ev.value;
            if (ctx.col != 1) {
                return;
            }
            let fld = this.m_fields[ctx.row];
            switch (fld.type) {
                default:
                case 'string': {
                    break;
                }
                case 'number': {
                    break;
                }
                case 'password': {
                    break;
                }
                case 'boolean': {
                    break;
                }
                case 'choice': {
                    /*
                    let cprops = <ComboBoxProps>fprops;
                    if( cprops!==fld.props ) {
                        
                        let choices;
                        if( isArray(fld.values) ) {
                            choices = this._choicesFromArray( fld.values );
                        }
                        else if( fld.values instanceof DataStore ) {
                            choices = this._choicesFromStore( fld.values, 'name' );
                        }
                                                    
                        cprops.items = choices;
                    }
    
                    editor = new ComboBox( cprops );
                    */
                    break;
                }
            }
            if (this.m_record) {
                this.m_record.setField(fld.id, text);
            }
            else {
                fld.value = text;
            }
            this.emit('change', (0, x4_events_js_19.EvChange)(text, fld));
        }
        _renderCell(text, rec) {
            let fld = this.m_fields[rec.row];
            switch (fld.type) {
                default:
                case 'string': {
                    break;
                }
                case 'number': {
                    break;
                }
                case 'password': {
                    text = '??????';
                    break;
                }
                case 'boolean': {
                    break;
                }
                case 'choice': {
                    /*
                    let cprops = <ComboBoxProps>fprops;
                    if( cprops!==fld.props ) {
                        
                        let choices;
                        if( isArray(fld.values) ) {
                            choices = this._choicesFromArray( fld.values );
                        }
                        else if( fld.values instanceof DataStore ) {
                            choices = this._choicesFromStore( fld.values, 'name' );
                        }
                                                    
                        cprops.items = choices;
                    }
    
                    editor = new ComboBox( cprops );
                    */
                    break;
                }
            }
            return text;
        }
        _editCell(props, row, col) {
            let fld = this.m_fields[row];
            let editor;
            switch (fld.type) {
                default:
                case 'string': {
                    editor = new textedit_js_5.TextEdit(props);
                    break;
                }
                case 'number': {
                    editor = new textedit_js_5.TextEdit(props);
                    break;
                }
                case 'password': {
                    props.type = 'password';
                    props.value = this.m_record.getField(fld.id);
                    editor = new input_js_4.Input(props);
                    break;
                }
                case 'boolean': {
                    editor = new checkbox_js_2.CheckBox(props);
                    break;
                }
                case 'choice': {
                    /*let cprops = <ComboBoxProps>props;
                    if( cprops!==fld.props ) {
                        
                        let choices;
                        if( isArray(fld.values) ) {
                            choices = this._choicesFromArray( fld.values );
                        }
                        else if( fld.values instanceof DataStore ) {
                            choices = this._choicesFromStore( fld.values, 'name' );
                        }
                                                    
                        cprops.items = choices;
                    }
    
                    editor = new ComboBox( cprops );
                    */
                    break;
                }
            }
            return editor;
        }
        _choicesFromArray(values) {
            let choices = values.map((e) => {
                if (typeof (e) == 'object') {
                    return { id: e.id, text: e.value };
                }
                else {
                    return { id: e, text: '' + e };
                }
            });
            return choices;
        }
        _choicesFromStore(view, field) {
            let choices = [];
            for (let i = 0, n = view.count; i < n; i++) {
                let rec = view.getByIndex(i);
                choices.push({ id: rec.getID(), text: rec.getField(field) });
            }
            return choices;
        }
    }
    exports.PropertyEditor = PropertyEditor;
});
/**
* @file radiobtn.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/radiobtn", ["require", "exports", "x4/component", "x4/x4_events", "x4/input", "x4/label"], function (require, exports, component_js_23, x4_events_js_20, input_js_5, label_js_12) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RadioBtn = void 0;
    /**
     * Standard RadioBtn
     */
    class RadioBtn extends component_js_23.Component {
        m_ui_input; // todo: remove that / use ref
        constructor(props) {
            super(props);
            this.mapPropEvents(props, 'change');
        }
        /** @ignore */
        render(props) {
            let text = props.text ?? '';
            let name = props.name ?? props.group;
            let labelWidth = props.labelWidth ?? -1;
            let checked = props.checked ?? false;
            let align = props.align ?? 'left';
            let value = props.value;
            let icon = props.icon;
            this.addClass('@hlayout');
            this.setProp('tag', 'label');
            this.addClass(align);
            this._setTabIndex(props.tabIndex);
            if (checked) {
                this.addClass('checked');
            }
            this.setContent([
                this.m_ui_input = new input_js_5.Input({
                    type: 'radio',
                    name: name,
                    tabIndex: props.tabIndex,
                    value: value,
                    attrs: {
                        checked: checked ? '' : undefined
                    },
                    dom_events: {
                        change: () => this._change(),
                        focus: () => this.m_ui_input.focus(),
                    }
                }),
                new label_js_12.Label({
                    ref: 'label',
                    icon: icon,
                    text: text,
                    width: labelWidth === 'flex' ? undefined : labelWidth,
                    flex: labelWidth === 'flex' ? 1 : undefined,
                    style: {
                        order: align == 'right' ? -1 : undefined,
                    },
                })
            ]);
        }
        /**
         * check state changed
         */
        _change() {
            let props = this.m_props;
            let query = '.x-input[name=' + props.name + ']';
            let nlist = document.querySelectorAll(query); //todo: document ?
            nlist.forEach((dom) => {
                let radio = component_js_23.Component.getElement(dom, RadioBtn);
                radio.removeClass('checked');
            });
            let dom = this.m_ui_input.dom;
            this.setClass('checked', dom.checked);
            this.emit('change', (0, x4_events_js_20.EvChange)(true));
        }
        /**
         * @return the checked value
         */
        get check() {
            if (this.m_ui_input) {
                return this.m_ui_input.dom.checked;
            }
            return this.m_props.checked;
        }
        /**
         * change the checked value
         * @param {boolean} ck new checked value
         */
        set check(ck) {
            let dom = this.m_ui_input.dom;
            if (ck) {
                //this.addClass( 'checked' );
                if (dom) {
                    dom.checked = true;
                }
                this.m_props.checked = true;
            }
            else {
                //this.removeClass( 'checked' );
                if (dom) {
                    dom.checked = false;
                }
                this.m_props.checked = false;
            }
        }
        get text() {
            return this.itemWithRef('label').text;
        }
        set text(text) {
            this.itemWithRef('label').text = text;
        }
    }
    exports.RadioBtn = RadioBtn;
});
/**
* @file cardview.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/cardview", ["require", "exports", "x4/component", "x4/x4_events", "x4/tools"], function (require, exports, component_js_24, x4_events_js_21, tools_js_24) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CardView = void 0;
    /**
     * Standard CardView class
     * a card view is composed of multiples pages with only one visible at a time.
     * pages can be selected by a component (like tabs ou sidebar).
     * or by code.
     */
    class CardView extends component_js_24.Component {
        m_cards;
        m_ipage; // initialy selected page
        m_cpage; // currently selected page
        constructor(props) {
            super(props);
            this.m_cards = [];
            this.m_ipage = props.active;
            this.m_cpage = null;
            this.singleShot(() => {
                this.setPages(props.pages);
            });
        }
        /** @ignore */
        render() {
            let pages = [];
            this.m_cards.forEach((p) => {
                if (p.page) {
                    pages.push(p.page);
                }
            });
            this.setContent(pages);
        }
        /**
         * switch to a specific card
         * @param name - card name as define in constructor
         */
        switchTo(name) {
            if (this.m_cards.length == 0) {
                return;
            }
            if (name === undefined) {
                name = this.m_cards[0].name;
            }
            if (name === this.m_cpage?.name) {
                return;
            }
            // hide old one
            if (this.m_cpage) {
                if (this.m_cpage.selector) {
                    this.m_cpage.selector.removeClass('@active');
                }
                if (this.m_cpage.page && !(this.m_cpage.page instanceof Function)) {
                    let page = this.m_cpage.page;
                    page.removeClass('@active');
                    page.addClass('@hidden');
                }
            }
            this.m_cpage = this.m_cards.find((card) => card.name == name);
            if (this.m_cpage) {
                if (this.m_cpage.page) {
                    if ((0, tools_js_24.isFunction)(this.m_cpage.page)) {
                        this.m_cpage.page = this.m_cpage.page();
                        console.assert(this.m_cpage.page != null, 'You must return a valid component');
                    }
                    let page = this.m_cpage.page;
                    page.addClass('@active');
                    page.removeClass('@hidden');
                    if (!page.dom) {
                        this._preparePage(page);
                    }
                }
                this.emit('change', (0, x4_events_js_21.EvChange)(this.m_cpage.name));
            }
        }
        /**
         *
         */
        setPages(pages) {
            let active = this._initTabs(pages);
            if (active) {
                (0, tools_js_24.asap)(() => {
                    this.switchTo(active);
                    this.update();
                });
            }
        }
        /**
         *
         */
        _initTabs(pages) {
            if (!pages) {
                return;
            }
            let active = this.m_ipage;
            pages.forEach((p) => {
                let card = { ...p };
                card.selector = this._prepareSelector(p);
                card.active = false;
                this.m_cards.push(card);
                if (!active) {
                    active = p.name;
                }
                if (p.active) {
                    active = p.name;
                }
            });
            return active;
        }
        _updateSelector() {
        }
        /**
         * prepare the cardinfo
         * can be used by derivations to create & set selectors
         */
        _prepareSelector(card) {
            return null;
        }
        /**
         *
         */
        _preparePage(page) {
            page.setStyleValue('flex', 1);
            page.addClass('@tab-page');
        }
    }
    exports.CardView = CardView;
});
/**
* @file sidebarview.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/sidebarview", ["require", "exports", "x4/layout", "x4/button", "x4/cardview"], function (require, exports, layout_js_12, button_js_5, cardview_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SideBarView = void 0;
    /**
     *
     */
    class SideBarView extends cardview_js_1.CardView {
        m_sidebar;
        m_content;
        constructor(props) {
            super(props);
            this.addClass('@hlayout');
            this.m_sidebar = new layout_js_12.VLayout({
                cls: '@side-bar',
                sizable: props.bar_sizable ? 'right' : undefined,
            });
            this.m_content = new layout_js_12.HLayout({ flex: 1, cls: '@tab-container' });
        }
        /** @ignore */
        render() {
            let tabs = [];
            this.m_cards.forEach((p) => {
                tabs.push(p.selector);
            });
            this.m_sidebar.setContent(new layout_js_12.VLayout({
                flex: 1,
                cls: 'content',
                content: tabs
            }));
            this.setContent([
                this.m_sidebar,
                this.m_content
            ]);
        }
        _prepareSelector(card) {
            return new button_js_5.Button({
                text: card.title,
                icon: card.icon,
                tooltip: card.title,
                click: () => { this.switchTo(card.name); }
            });
        }
        _preparePage(page) {
            super._preparePage(page);
            if (!page.dom) {
                this.m_content.appendChild(page);
            }
        }
    }
    exports.SideBarView = SideBarView;
});
/**
* @file smartedit.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/smartedit", ["require", "exports", "x4/textedit", "x4/popup", "x4/component", "x4/x4_events"], function (require, exports, textedit_js_6, popup_js_5, component_js_25, x4_events_js_22) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PopupTable = exports.SmartEdit = void 0;
    class SmartEdit extends textedit_js_6.TextEdit {
        m_popup;
        m_dataview;
        m_field;
        m_minDisplay;
        m_maxCount;
        m_autoFill;
        m_renderer;
        m_tools;
        m_searchCallback;
        constructor(props) {
            super(props);
            this.m_dataview = props.store.createView();
            this.m_field = props.field;
            this.m_renderer = props.renderer;
            this.m_minDisplay = props.minDisplay ?? 0;
            this.m_maxCount = props.maxCount ?? 10;
            this.m_autoFill = props.autoFill === undefined ? true : props.autoFill;
            this.m_popup = null;
            this.m_tools = props.tools ?? [];
            this.m_searchCallback = props.searchCallback;
            this.on('change', (e) => this._onChange(e));
            this.on('focus', (e) => this._onFocus(e));
        }
        render(props) {
            super.render(props);
            this.m_ui_input.setDomEvent('keydown', (e) => this._onKey(e));
        }
        _onChange(ev) {
            this._showPopup(ev.value);
        }
        _onFocus(ev) {
            if (ev.focus) {
                this._showPopup(this.value);
            }
            else if (this.m_popup) {
                this.m_popup.close();
            }
        }
        _onKey(e) {
            console.log(e.key);
            switch (e.key) {
                case 'Backspace': {
                    // remove selection
                    let start = e.target.selectionStart;
                    let end = e.target.selectionEnd;
                    if (start > end) {
                        let t = start;
                        start = end;
                        end = t;
                    }
                    let v = this.value;
                    let a = v.substr(0, start);
                    let b = v.substr(end);
                    this.value = a + b;
                    break;
                }
                case 'ArrowUp':
                case 'Up': {
                    if (this.m_popup) {
                        this._moveNext(false);
                        e.preventDefault();
                    }
                    break;
                }
                case 'ArrowDown':
                case 'Down': {
                    if (this.m_popup) {
                        this._moveNext(true);
                        e.preventDefault();
                    }
                    break;
                }
                case 'Enter': {
                    if (this.m_popup) {
                        this._checkTool(e);
                    }
                    break;
                }
            }
        }
        _showSugg(text) {
            let sel = this.getSelection();
            this.value = text;
            this.select(sel.start, sel.length);
        }
        isOpen() {
            return this.m_popup !== null;
        }
        componentDisposed() {
            if (this.m_popup) {
                this.m_popup.close();
            }
            super.componentDisposed();
        }
        // enter pressed on an element
        _checkTool(e) {
            let sel = this.m_popup.selection;
            if (this._callTool(sel)) {
                e.preventDefault();
            }
        }
        _callTool(sel) {
            let data = this.m_popup.getRowData(sel);
            if (data) {
                if (this.m_popup) {
                    this.m_popup.close();
                }
                data.callback(this);
                return true;
            }
            else {
                return false;
            }
        }
        _moveNext(next) {
            let sel = this.m_popup.selNext(next);
            console.log('movenext: ', sel);
            let data = this.m_popup.getRowData(sel);
            if (!data) {
                let text = this.m_popup.getCell(sel, 0).text;
                this._showSugg(text);
            }
        }
        //_onKey( e: KeyboardEvent ) {
        //	if( e.key==' ' ) {
        //		this._showPopup( this.value )
        //	}
        //}
        _showPopup(v) {
            if (this.m_popup) {
                this.m_popup.close();
                this.m_popup = null;
            }
            let cnt;
            let sel = this.getSelection();
            let search = sel.length ? v.substr(0, sel.start) : v;
            if (search.length < this.m_minDisplay) {
                return;
            }
            let autoFill = this.m_autoFill;
            if (search.length == 0) {
                cnt = this.m_dataview.filter(null);
            }
            else {
                if (this.m_searchCallback) {
                    autoFill = this.m_searchCallback(search, this.m_dataview);
                    cnt = this.m_dataview.count;
                }
                else {
                    cnt = this.m_dataview.filter({
                        op: '=',
                        field: this.m_field,
                        value: new RegExp('^' + search.trim() + '.*', 'mi')
                    });
                }
            }
            if (cnt > 0) {
                let rec = this.m_dataview.getByIndex(0);
                if (autoFill) {
                    this.value = rec.getField(this.m_field);
                }
                this.select(v.length);
                let count = Math.min(this.m_dataview.count, this.m_maxCount);
                let r2 = this.m_ui_input.getBoundingRect();
                this.m_popup = new PopupTable({
                    cls: '@editor-popup',
                    minWidth: r2.width
                });
                this.m_popup.on('click', (ev) => {
                    let { row, text } = ev.context;
                    if (!this._callTool(row)) {
                        this.value = text;
                        this.emit('click', (0, x4_events_js_22.EvClick)());
                    }
                });
                let i;
                for (i = 0; i < count; i++) {
                    let rec = this.m_dataview.getByIndex(i);
                    let texts = this.m_renderer(rec);
                    this.m_popup.setCell(i, 0, texts[0].text, texts[0].cls);
                    this.m_popup.setCell(i, 1, texts[1].text, texts[1].cls);
                }
                for (let j = 0; j < this.m_tools.length; j++, i++) {
                    this.m_popup.setCell(i, 0, this.m_tools[j].text);
                    this.m_popup.setCell(i, 1, '');
                    this.m_popup.setRowData(i, this.m_tools[j]);
                    console.log('fill: ', i);
                }
                this.m_popup.displayAt(r2.left, r2.bottom);
            }
            else if (this.m_tools.length) {
                let r2 = this.m_ui_input.getBoundingRect();
                this.m_popup = new PopupTable({
                    cls: '@editor-popup',
                    minWidth: r2.width
                });
                this.m_popup.on('click', (ev) => {
                    let { row, text } = ev.context;
                    if (!this._callTool(row)) {
                        this.value = text;
                    }
                });
                for (let j = 0, i = 0; j < this.m_tools.length; j++, i++) {
                    this.m_popup.setCell(i, 0, this.m_tools[j].text);
                    this.m_popup.setCell(i, 1, '');
                    this.m_popup.setRowData(i, this.m_tools[j]);
                    console.log('fill: ', i);
                }
                this.m_popup.displayAt(r2.left, r2.bottom);
            }
        }
    }
    exports.SmartEdit = SmartEdit;
    class PopupTable extends popup_js_5.Popup {
        m_rows;
        m_cols;
        m_cells;
        m_data;
        m_minw;
        m_defcell;
        m_sel;
        constructor(props) {
            super(props);
            this.m_rows = props.rows ?? 0;
            this.m_cols = props.cols ?? 0;
            this.m_minw = props.minWidth;
            this.m_cells = new Map();
            this.m_data = new Map();
            this.m_defcell = { text: '', cls: undefined };
            this.m_sel = 0;
            this.enableMask(false);
            this.setDomEvent('create', () => {
                this.dom.cellPadding = '0px';
            });
            this.setDomEvent('mousedown', (e) => {
                e.preventDefault();
                let el = component_js_25.Component.getElement(e.target);
                let row = el.getData('row');
                this.m_sel = row;
                this.update();
                this.emit('click', (0, x4_events_js_22.EvClick)({ row, text: this.getCell(row, 0).text }));
            });
        }
        setRowData(row, data) {
            this.m_data.set(row, data);
        }
        getRowData(row) {
            return this.m_data.get(row);
        }
        setCell(row, col, text, cls) {
            this.m_cells.set(_cid(row, col), { text, cls });
            if (this.m_rows < (row + 1)) {
                this.m_rows = (row + 1);
            }
            if (this.m_cols < (col + 1)) {
                this.m_cols = (col + 1);
            }
        }
        getCell(row, col) {
            let cd = this.m_cells.get(_cid(row, col));
            if (cd == null) {
                return this.m_defcell;
            }
            return cd;
        }
        /** @ignore */
        render() {
            this.setProp('tag', 'table');
            if (this.m_minw) {
                this.setStyleValue('minWidth', this.m_minw);
            }
            let rows = [];
            for (let r = 0; r < this.m_rows; r++) {
                let cols = [];
                let data = { row: r };
                for (let c = 0; c < this.m_cols; c++) {
                    let cell = this.getCell(r, c);
                    let col = new component_js_25.Component({
                        tag: 'td',
                        content: cell.text,
                        cls: cell.cls,
                        data
                    });
                    cols.push(col);
                }
                let cls = undefined;
                if (r === this.m_sel) {
                    cls = '@selected';
                }
                let row = new component_js_25.Component({
                    tag: 'tr',
                    cls,
                    content: cols,
                    data
                });
                rows.push(row);
            }
            this.setContent(rows);
        }
        /**
        * display the popup at a specific position
        * @param x
        * @param y
        */
        displayAt(x, y, align = 'top left') {
            this.show();
            let halign = 'l', valign = 't';
            if (align.indexOf('right') >= 0) {
                halign = 'r';
            }
            if (align.indexOf('bottom') >= 0) {
                valign = 'b';
            }
            // @TODO: this is a minimal overflow problem solution
            let rc = document.body.getBoundingClientRect(), rm = this.getBoundingRect();
            if (halign == 'r') {
                x -= rm.width;
            }
            if (valign == 'b') {
                y -= rm.height;
            }
            if (x < 4) {
                x = 4;
            }
            if ((x + rm.width) > rc.right - 4) {
                x = rc.right - 4 - rm.width;
            }
            if (y < 4) {
                y = 4;
            }
            if ((y + rm.height) > rc.bottom - 4) {
                y = rc.bottom - 4 - rm.height;
            }
            this.setStyle({ left: x, top: y });
        }
        selNext(next) {
            this.m_sel += next ? 1 : -1;
            if (this.m_sel >= this.m_rows) {
                this.m_sel = 0;
            }
            else if (this.m_sel < 0) {
                this.m_sel = this.m_rows - 1;
            }
            this.update();
            return this.m_sel;
        }
        get selection() {
            return this.m_sel;
        }
    }
    exports.PopupTable = PopupTable;
    function _cid(row, col) {
        return row * 1000 + col;
    }
});
/**
* @file tabbar.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Tab
**/
define("x4/tabbar", ["require", "exports", "x4/layout", "x4/button", "x4/x4_events"], function (require, exports, layout_js_13, button_js_6, x4_events_js_23) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TabBar = void 0;
    class TabBar extends layout_js_13.HLayout {
        m_pages;
        m_curPage;
        constructor(props) {
            super(props);
            this.m_pages = [];
            this.m_curPage = null;
            this.mapPropEvents(props, 'change');
            this.m_props.pages?.forEach(p => this.addPage(p));
            if (this.m_props.default) {
                this.select(this.m_props.default);
            }
        }
        addPage(page) {
            this.m_pages.push({ ...page });
            this._updateContent();
        }
        render() {
            let buttons = [];
            this.m_pages.forEach(p => {
                p.btn = new button_js_6.Button({ cls: p === this.m_curPage ? 'selected' : '', text: p.title, click: () => this._select(p) });
                buttons.push(p.btn);
            });
            this.setContent(buttons);
        }
        select(id) {
            let page = this.m_pages.find(x => x.id === id);
            if (page) {
                this._select(page);
            }
        }
        _select(p) {
            if (this.dom && this.m_curPage) {
                this.m_curPage.btn.removeClass('selected');
                this.m_curPage.page.hide();
            }
            this.m_curPage = p;
            this.signal('change', (0, x4_events_js_23.EvChange)(p ? p.id : null));
            if (this.dom && this.m_curPage) {
                this.m_curPage.btn.addClass('selected');
                this.m_curPage.page.show();
            }
        }
    }
    exports.TabBar = TabBar;
});
/**
* @file tabview.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/tabview", ["require", "exports", "x4/layout", "x4/button", "x4/cardview"], function (require, exports, layout_js_14, button_js_7, cardview_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TabView = void 0;
    /**
     * Standard TabView class
     */
    class TabView extends cardview_js_2.CardView {
        m_tab_selector;
        m_menu;
        constructor(props) {
            super(props);
            this.m_tab_selector = props.tab_selector ? true : false;
            this.m_menu = props.menu;
            this.addClass('@vlayout');
        }
        /** @ignore */
        render() {
            let tabs = [];
            let pages = [];
            if (this.m_menu) {
                this.m_menu.addClass('@button @tab-btn');
                this.m_menu.removeClass('@menu-item');
                tabs.push(this.m_menu);
            }
            this.m_cards.forEach((p) => {
                tabs.push(p.selector);
                if (!(p.page instanceof Function)) {
                    pages.push(p.page);
                }
            });
            if (this.m_tab_selector) {
                pages.unshift(new layout_js_14.HLayout({
                    cls: '@tab-switch',
                    content: tabs
                }));
            }
            this.setContent(pages);
        }
        _updateSelector() {
        }
        _prepareSelector(card) {
            return new button_js_7.Button({
                cls: '@tab-btn',
                text: card.title,
                icon: card.icon,
                click: () => { this.switchTo(card.name); }
            });
        }
        _preparePage(page) {
            super._preparePage(page);
            if (!page.dom) {
                this.appendChild(page);
            }
        }
    }
    exports.TabView = TabView;
});
/**
* @file textarea.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/textarea", ["require", "exports", "x4/component", "x4/x4_events", "x4/tools"], function (require, exports, component_js_26, x4_events_js_24, tools_js_25) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextArea = void 0;
    class TextArea extends component_js_26.Component {
        constructor(props) {
            super(props);
            this.mapPropEvents(props, 'change');
        }
        /** @ignore */
        render(props) {
            props.text = props.text ?? '';
            this.setAttribute('tabindex', props.tabIndex ?? 0);
            if (props.readOnly !== undefined) {
                this.setAttribute('readonly', props.readOnly);
            }
            if (props.rows) {
                this.setAttribute('rows', props.rows);
            }
            if (props.placeHolder) {
                this.setAttribute('placeholder', props.placeHolder);
            }
            if (props.autoFocus) {
                this.setAttribute('autofocus', props.autoFocus);
            }
            if (props.name) {
                this.setAttribute('name', props.name);
            }
            if (props.autoGrow) {
                this.setProp('autoGrow', true);
                this.setAttribute('rows', this._calcHeight(props.text));
                this.setDomEvent('keydown', () => {
                    (0, tools_js_25.asap)(() => this._updateHeight());
                });
            }
            // avoid going to next element on enter
            this.setDomEvent('keydown', (e) => {
                e.stopPropagation();
            });
            this.setDomEvent('input', () => this._change());
            this.setProp('tag', 'textarea');
        }
        _change() {
            this.emit('change', (0, x4_events_js_24.EvChange)(this.value));
        }
        componentCreated() {
            this.value = this.m_props.text;
        }
        get value() {
            if (this.dom) {
                return this.dom.value;
            }
            return this.m_props.text;
        }
        set value(t) {
            this.m_props.text = t ?? '';
            if (this.dom) {
                this.dom.value = this.m_props.text;
                if (this.m_props.autoGrow) {
                    this.setAttribute('rows', this._calcHeight(this.m_props.text));
                }
            }
        }
        _calcHeight(text) {
            return 1 + (text.match(/\n/g) || []).length;
        }
        _updateHeight() {
            const text = this.value;
            const lines = this._calcHeight(text);
            if (this.getData('lines') != lines) {
                this.setAttribute('rows', lines);
                this.setData('lines', lines);
            }
        }
        /**
         * insert text at cursor position
         */
        insertText(text) {
            if (this.dom) {
                let dom = this.dom;
                let start = dom.selectionStart;
                dom.setRangeText(text);
                dom.selectionStart = start;
                dom.selectionEnd = start + text.length;
            }
        }
    }
    exports.TextArea = TextArea;
});
/**
* @file toaster.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/toaster", ["require", "exports", "x4/label", "x4/popup"], function (require, exports, label_js_13, popup_js_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Toaster = void 0;
    class Toaster extends popup_js_6.Popup {
        m_message;
        m_icon;
        constructor(props) {
            super(props);
            this.m_message = props.message;
            this.m_icon = props.icon;
            this.enableMask(false);
            this.addClass('@non-maskable');
        }
        /** @ignore */
        render() {
            this.addClass('@hlayout');
            this.setContent([
                new label_js_13.Label({ icon: this.m_icon, text: this.m_message })
            ]);
        }
        show() {
            this.show = super.show;
            this.displayAt(9999, 9999, 'br', { x: 0, y: -24 });
            let opacity = 1.0;
            this.startTimer('fadeout', 2000, false, () => {
                this.startTimer('opacity', 100, true, () => {
                    this.setStyleValue('opacity', opacity);
                    opacity -= 0.1;
                    if (opacity < 0) {
                        this.dispose();
                    }
                });
            });
        }
    }
    exports.Toaster = Toaster;
});
/**
* @file treeview.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/treeview", ["require", "exports", "x4/component", "x4/icon", "x4/label", "x4/layout", "x4/x4_events"], function (require, exports, component_js_27, icon_js_7, label_js_14, layout_js_15, x4_events_js_25) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TreeView = void 0;
    function EvExpand(node) {
        return (0, x4_events_js_25.BasicEvent)({ node });
    }
    /**
     *
     */
    class TreeView extends layout_js_15.VLayout {
        m_view;
        m_container;
        m_selection;
        constructor(props) {
            super(props);
            props.root = props.root;
            props.indent = props.indent ?? 8;
            props.gadgets = props.gadgets;
            props.sort = props.sort ?? true;
            this.m_selection = null;
            this.m_container = new component_js_27.Container({ cls: '@scroll-container' });
            this.m_view = new component_js_27.Container({
                cls: '@scroll-view',
                flex: 1,
                content: this.m_container
            });
            this.setContent([
                this.m_view,
                props.gadgets ? new layout_js_15.HLayout({
                    cls: 'gadgets',
                    content: props.gadgets
                }) : null,
            ]);
            this.setDomEvent('click', (e) => this._click(e));
            this.setDomEvent('dblclick', (e) => this._click(e));
            if (props.canDragItems) {
                this.setDomEvent('dragstart', (ev) => {
                    let hit = component_js_27.Component.getElement(ev.target, component_js_27.Component);
                    let node = hit?.getData("node");
                    if (node) {
                        ev.dataTransfer.effectAllowed = 'move';
                        ev.dataTransfer.items.add(JSON.stringify({
                            type: 'treeview',
                            id: node.id
                        }), 'string');
                    }
                    else {
                        ev.preventDefault();
                        ev.stopPropagation();
                    }
                });
                this.setDomEvent('dragover', ev => this._dragEnter(ev));
                this.setDomEvent('dragenter', ev => this._dragEnter(ev));
                this.setDomEvent('dragend', ev => this._dragLeave(ev));
                this.setDomEvent('dragleave', ev => this._dragLeave(ev));
                this.setDomEvent('drop', ev => this._dragLeave(ev));
                this.setDomEvent('drop', ev => this._drop(ev));
            }
            this.mapPropEvents(props, 'dblclick', 'drag', 'selectionchange');
        }
        _dragEnter(ev) {
            ev.preventDefault();
            let hit = component_js_27.Component.getElement(ev.target, component_js_27.Component);
            let node = hit?.getData("node");
            if (node) {
                hit.addClass('@drag-over');
                ev.dataTransfer.dropEffect = 'move';
            }
        }
        _dragLeave(ev) {
            let hit = component_js_27.Component.getElement(ev.target, component_js_27.Component);
            let node = hit?.getData("node");
            if (node) {
                hit.removeClass('@drag-over');
            }
        }
        _drop(ev) {
            let hit = component_js_27.Component.getElement(ev.target, component_js_27.Component);
            let node = hit?.getData("node");
            if (!node) {
                node = this.m_props.root;
            }
            if (node) {
                let parent;
                // is a folder
                if (node.children) {
                    parent = node;
                }
                // in it's parent node
                else {
                    parent = hit.getData("parent");
                }
                for (let i = 0; i < ev.dataTransfer.items.length; i++) {
                    ev.dataTransfer.items[0].getAsString((value) => {
                        let data = JSON.parse(value);
                        this.emit('drag', (0, x4_events_js_25.EvDrag)(node, data, parent));
                    });
                }
            }
        }
        render() {
            this.__update();
        }
        __update() {
            if (this.m_props.root) {
                let items = [];
                this._buildBranch(this.m_props.root, -1, items, this.m_props.root);
                this.m_container.setContent(items);
            }
        }
        updateElement(id) {
            const { node: child, item } = this._getNode(id);
            if (child) {
                const pn = child.dom.parentNode;
                const newchild = this._makeNode(item, child.dom.classList.value, child.getData('icon'), child.getData('level'));
                const dm = newchild._build();
                pn.replaceChild(dm, child.dom);
                if (this.m_selection?.el === child) {
                    this.m_selection.el = newchild;
                }
            }
        }
        set root(root) {
            this.m_props.root = root;
            this.update();
        }
        /**
         * same as root = xxx but keep elements open
         */
        refreshRoot(root) {
            let openList = [];
            this.forEach((node) => {
                if (node.open) {
                    openList.push(node.id);
                }
                return false;
            });
            let oldSel = this.selection;
            this.m_props.root = root;
            this.forEach((node) => {
                if (openList.indexOf(node.id) >= 0) {
                    node.open = true;
                }
                return false;
            });
            this.__update();
        }
        _buildBranch(node, level, items, parent) {
            let cls = '@tree-item';
            if (node.cls) {
                cls += ' ' + node.cls;
            }
            if (!node.open && node.children) {
                cls += ' collapsed';
            }
            if (node.children) {
                cls += ' folder';
                if (node.children.length == 0) {
                    cls += ' empty';
                }
            }
            let icon = node.icon;
            if (icon === undefined) {
                if (node.children) {
                    icon = 0xf078;
                }
                else {
                    icon = 0xf1c6;
                }
            }
            if (level >= 0) {
                const item = this._makeNode(node, cls, icon, level);
                if (this.m_selection?.id == node.id) {
                    this.m_selection.el = item;
                    item.addClass('selected');
                }
                items.push(item);
            }
            if (level == -1 || node.open) {
                if (node.children) {
                    if (this.m_props.sort) {
                        // sort items case insensitive:
                        //	first folders
                        //	then items 
                        node.children = node.children.sort((a, b) => {
                            let at = (a.children ? '0' + a.text : a.text).toLocaleLowerCase();
                            let bt = (b.children ? '0' + b.text : b.text).toLocaleLowerCase();
                            return at < bt ? -1 : at > bt ? 1 : 0;
                        });
                    }
                    node.children.forEach((c) => {
                        this._buildBranch(c, level + 1, items, node);
                    });
                }
            }
        }
        _renderDef(node) {
            return new label_js_14.Label({ cls: 'tree-label', flex: 1, text: node.text });
        }
        _makeNode(node, cls, icon, level) {
            return new layout_js_15.HLayout({
                cls,
                content: [
                    new icon_js_7.Icon({ cls: 'tree-icon', icon }),
                    this.m_props.renderItem ? this.m_props.renderItem(node) : this._renderDef(node),
                ],
                data: {
                    'node': node,
                    'level': level,
                    'icon': icon,
                },
                style: {
                    paddingLeft: 4 + level * this.m_props.indent
                },
                attrs: {
                    draggable: this.m_props.canDragItems ? true : undefined
                },
            });
        }
        /**
         *
         */
        forEach(cb) {
            let found = null;
            function scan(node) {
                if (cb(node) == true) {
                    return true;
                }
                if (node.children) {
                    for (let i = 0; i < node.children.length; i++) {
                        if (scan(node.children[i])) {
                            return true;
                        }
                    }
                }
            }
            if (this.m_props.root) {
                scan(this.m_props.root);
            }
            return found;
        }
        ensureVisible(id) {
            const { node } = this._getNode(id);
            if (node) {
                node.scrollIntoView();
            }
        }
        set selection(id) {
            if (this.m_selection?.el) {
                this.m_selection.el.removeClass('selected');
            }
            this.m_selection = null;
            if (id !== undefined) {
                const { node: sel } = this._getNode(id);
                if (sel) {
                    this.m_selection = {
                        id: id,
                        el: sel
                    };
                    sel.addClass('selected');
                    sel.scrollIntoView();
                }
            }
        }
        _getNode(id) {
            let found = { node: null, item: null };
            this.m_container.enumChilds((c) => {
                let node = c.getData('node');
                if (node?.id == id) {
                    found = { node: c, item: node };
                    return true;
                }
            });
            return found;
        }
        get selection() {
            return this.m_selection?.id;
        }
        getNodeWithId(id) {
            return this.forEach((node) => node.id == id);
        }
        /**
         *
         */
        _click(ev) {
            let dom = ev.target;
            let idom = dom;
            while (dom != this.dom) {
                let el = component_js_27.Component.getElement(dom);
                let nd = el?.getData('node');
                if (nd) {
                    if (nd.children) {
                        // on text or on expando ?
                        if (el.hasClass('selected') || idom.classList.contains('tree-icon')) { //expando
                            nd.open = nd.open ? false : true;
                        }
                        this.m_selection = { id: nd.id, el: null };
                        let offset = this.m_view?.dom?.scrollTop;
                        this.update();
                        if (offset) {
                            this.m_view.dom.scrollTo(0, offset);
                        }
                        this.emit('expand', EvExpand(nd));
                    }
                    else {
                        this.selection = nd.id;
                        if (ev.type == 'click') {
                            this.emit('click', (0, x4_events_js_25.EvClick)(nd));
                        }
                        else {
                            this.emit('dblclick', (0, component_js_27.EvDblClick)(nd));
                        }
                    }
                    this.emit('selectionchange', (0, x4_events_js_25.EvSelectionChange)(nd));
                    return;
                }
                dom = dom.parentElement;
            }
            if (ev.type == 'click') {
                this.emit('selectionchange', (0, x4_events_js_25.EvSelectionChange)(null));
            }
        }
        /**
         * constructs a tree node from an array of strings
         * elements are organized like folders (separator = /)
         * @example
         * let root = TreeView.buildFromString( [
         * 	'this/is/a/final/file'
         *  'this/is/another/file'
         * ] );
         */
        static buildFromStrings(paths, separator = '/') {
            let root = {
                id: 0,
                text: '<root>',
                children: []
            };
            function insert(elements, path) {
                let pos = path.indexOf(separator);
                let main = path.substr(0, pos < 0 ? undefined : pos);
                let elem;
                if (pos >= 0) {
                    elem = elements.find((el) => {
                        return el.text == main;
                    });
                }
                if (!elem) {
                    elem = {
                        id: path,
                        text: main,
                    };
                    elements.push(elem);
                }
                if (pos >= 0) {
                    if (!elem.children) {
                        elem.children = [];
                    }
                    insert(elem.children, path.substr(pos + separator.length));
                }
            }
            paths.forEach((path) => {
                insert(root.children, path);
            });
            return root;
        }
        /**
         * constructs a tree node from an array of nodes like
         * node {
         * 	id: number,
         *  parent: number,
         *  name: string
         * }
         */
        static buildFromHierarchy(nodes, cb) {
            let root = {
                id: 0,
                text: '<root>',
                children: []
            };
            let tree_nodes = [];
            function insert(node) {
                let elem;
                let pelem;
                if (node.parent > 0) {
                    pelem = tree_nodes.find((tnode) => tnode.id == node.parent);
                    if (!pelem) {
                        pelem = {
                            id: node.parent,
                            text: '',
                            children: []
                        };
                        tree_nodes.push(pelem);
                    }
                    if (!pelem.children) {
                        pelem.children = [];
                    }
                }
                else {
                    pelem = root;
                }
                elem = tree_nodes.find((tnode) => tnode.id == node.id);
                if (!elem) {
                    elem = {
                        id: node.id,
                        text: node.name,
                        parent: node.parent,
                    };
                    if (!node.leaf) {
                        elem.children = [];
                    }
                    else {
                        elem.icon = null;
                    }
                }
                else {
                    elem.text = node.name;
                    elem.parent = node.parent;
                }
                tree_nodes.push(elem);
                pelem.children.push(elem);
            }
            nodes.forEach(insert);
            if (cb) {
                tree_nodes.forEach(cb);
            }
            return root;
        }
    }
    exports.TreeView = TreeView;
});
/**
* @file panel.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/panel", ["require", "exports", "x4/component", "x4/layout", "x4/label", "x4/icon"], function (require, exports, component_js_28, layout_js_16, label_js_15, icon_js_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Panel = void 0;
    class Panel extends layout_js_16.VLayout {
        m_ui_title;
        m_ui_body;
        constructor(props) {
            super(props);
            //todo: cannot be called twice do to content overload
            this.m_ui_title = new label_js_15.Label({ cls: 'title', text: this.m_props.title });
            this.m_ui_body = new component_js_28.Component({ cls: 'body @vlayout', content: this.m_props.content });
        }
        /** @ignore */
        render() {
            const gadgets = this.m_props.gadgets ?? [];
            const icon = this.m_props.icon ? new icon_js_8.Icon({ icon: this.m_props.icon }) : null;
            super.setContent([
                new layout_js_16.HLayout({
                    cls: 'title',
                    content: [
                        icon,
                        this.m_ui_title,
                        ...gadgets
                    ]
                }),
                this.m_ui_body
            ]);
        }
        setContent(els) {
            this.m_ui_body.setContent(els);
        }
        set title(text) {
            this.m_ui_title.text = text;
        }
    }
    exports.Panel = Panel;
});
/**
* @file host/electron.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/hosts/electron", ["require", "exports", "x4/hosts/host", "x4/hosts/host"], function (require, exports, host_js_2, host_js_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElectronHost = exports.path = exports.electron = exports.process = exports.fs = void 0;
    __exportStar(host_js_3, exports);
    if (!globalThis.host_require) {
        globalThis.host_require = require;
    }
    exports.fs = host_require('fs');
    exports.process = host_require('process');
    exports.electron = host_require('electron');
    exports.path = host_require('path');
    //import * as path from 'node:path';	
    class ElectronHost extends host_js_2.Host {
        makePath(...els) {
            return exports.path.join(...els);
        }
        readBinary(path) {
            return new Promise((resolve, reject) => {
                exports.fs.readFile(path, (err, buff) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(buff);
                    }
                });
            });
        }
        writeBinary(path, data) {
            return new Promise((resolve, reject) => {
                exports.fs.writeFile(path, data, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(true);
                    }
                });
            });
        }
        readUtf8(path) {
            return new Promise((resolve, reject) => {
                exports.fs.readFile(path, { encoding: 'utf8' }, (err, buff) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(buff.toString());
                    }
                });
            });
        }
        writeUtf8(path, data) {
            return new Promise((resolve, reject) => {
                exports.fs.writeFile(path, data, { encoding: 'utf8' }, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(true);
                    }
                });
            });
        }
        compress(data) {
            return new Promise((resolve, reject) => {
                let zlib = this.require('zlib');
                zlib.gzip(data, (err, Uint8Array) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(Uint8Array);
                    }
                });
            });
        }
        decompress(data) {
            return new Promise((resolve, reject) => {
                let zlib = this.require('zlib');
                zlib.gunzip(data, (err, Uint8Array) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(Uint8Array);
                    }
                });
            });
        }
        readLocalStorage(name) {
            return localStorage.getItem(name);
        }
        writeLocalStorage(name, data) {
            localStorage.setItem(name, data);
        }
        stat(name) {
            let stat = exports.fs.statSync(name);
            if (!stat) {
                return null;
            }
            return {
                atime: stat.atimeMs,
                isDir: stat.isDirectory()
            };
        }
        readDir(path) {
            return new Promise((resolve, reject) => {
                exports.fs.readdir(path, (err, files) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(files);
                    }
                });
            });
        }
        require(name) {
            return host_require(name);
        }
        cwd() {
            return exports.process.cwd();
        }
        get ipc() {
            return exports.electron.ipcRenderer;
        }
        getPath(type) {
            return this.ipc.sendSync('getPath', type);
        }
        getPathPart(pth, type) {
            let els = exports.path.parse(pth);
            switch (type) {
                case 'dirname': return els.dir;
                case 'basename': return els.base;
                case 'filename': return els.name;
                case 'extname': return els.ext;
            }
            return '';
        }
        createCanvas = () => {
            return document.createElement('canvas');
        };
    }
    exports.ElectronHost = ElectronHost;
    new ElectronHost();
});
define("src/x4mod", ["require", "exports", "x4/application", "x4/component", "x4/button", "x4/calendar", "x4/canvas", "x4/checkbox", "x4/combobox", "x4/color", "x4/colorpicker", "x4/datastore", "x4/dialog", "x4/form", "x4/formatters", "x4/i18n", "x4/icon", "x4/input", "x4/image", "x4/formatters", "x4/gridview", "x4/label", "x4/layout", "x4/link", "x4/listview", "x4/menu", "x4/messagebox", "x4/property_editor", "x4/radiobtn", "x4/request", "x4/sidebarview", "x4/settings", "x4/smartedit", "x4/spreadsheet", "x4/tabbar", "x4/tabview", "x4/textarea", "x4/textedit", "x4/toaster", "x4/tools", "x4/tooltips", "x4/treeview", "x4/panel", "x4/x4_events", "x4/hosts/electron"], function (require, exports, application_js_3, component_js_29, button_js_8, calendar_js_2, canvas_js_1, checkbox_js_3, combobox_js_2, color_js_2, colorpicker_js_1, datastore_js_3, dialog_js_4, form_js_2, Formatters, i18n_js_8, icon_js_9, input_js_6, image_js_1, formatters_js_1, gridview_js_1, label_js_16, layout_js_17, link_js_1, listview_js_2, menu_js_5, messagebox_js_1, property_editor_js_1, radiobtn_js_1, request_js_3, sidebarview_js_1, settings_js_2, smartedit_js_1, spreadsheet_js_2, tabbar_js_1, tabview_js_1, textarea_js_1, textedit_js_7, toaster_js_1, tools_js_26, tooltips_js_2, treeview_js_1, panel_js_1, x4_events_js_26, electron_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Formatters = void 0;
    __exportStar(application_js_3, exports);
    __exportStar(component_js_29, exports);
    __exportStar(button_js_8, exports);
    __exportStar(calendar_js_2, exports);
    __exportStar(canvas_js_1, exports);
    __exportStar(checkbox_js_3, exports);
    __exportStar(combobox_js_2, exports);
    __exportStar(color_js_2, exports);
    __exportStar(colorpicker_js_1, exports);
    ;
    __exportStar(datastore_js_3, exports);
    __exportStar(dialog_js_4, exports);
    __exportStar(form_js_2, exports);
    exports.Formatters = Formatters;
    __exportStar(i18n_js_8, exports);
    __exportStar(icon_js_9, exports);
    __exportStar(input_js_6, exports);
    __exportStar(image_js_1, exports);
    __exportStar(formatters_js_1, exports);
    __exportStar(gridview_js_1, exports);
    __exportStar(label_js_16, exports);
    __exportStar(layout_js_17, exports);
    __exportStar(link_js_1, exports);
    __exportStar(listview_js_2, exports);
    __exportStar(menu_js_5, exports);
    __exportStar(messagebox_js_1, exports);
    __exportStar(property_editor_js_1, exports);
    __exportStar(radiobtn_js_1, exports);
    __exportStar(request_js_3, exports);
    __exportStar(sidebarview_js_1, exports);
    __exportStar(settings_js_2, exports);
    __exportStar(smartedit_js_1, exports);
    __exportStar(spreadsheet_js_2, exports);
    __exportStar(tabbar_js_1, exports);
    __exportStar(tabview_js_1, exports);
    __exportStar(textarea_js_1, exports);
    __exportStar(textedit_js_7, exports);
    __exportStar(toaster_js_1, exports);
    __exportStar(tools_js_26, exports);
    __exportStar(tooltips_js_2, exports);
    __exportStar(treeview_js_1, exports);
    __exportStar(panel_js_1, exports);
    __exportStar(x4_events_js_26, exports);
    __exportStar(electron_js_1, exports);
});
/**
 * @file tools.ts
 * @author: Etienne Cochard
 * @licence
 * Copyright (c) 2019-2021 R-libre ingenierie
 */
define("src/tools", ["require", "exports", "x4/component", "x4/hosts/electron", "src/x4mod"], function (require, exports, component_js_30, electron_js_2, x4mod_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.openExternal = exports.setWindowTitle = exports.isElectron = exports.saveFile = exports.openFile = void 0;
    let g_file_input = null;
    function _createFileInput() {
        if (g_file_input) {
            g_file_input.dispose();
        }
        g_file_input = new component_js_30.Component({
            tag: 'input',
            style: {
                display: 'none',
                id: 'fileDialog',
            },
            attrs: {
                type: 'file'
            }
        });
        // ajoute un input type:file caché pour pouvoir choir un fichier a ouvrir
        document.body.appendChild(g_file_input._build());
        return g_file_input;
    }
    /**
     * show openfile dialog
     * @param ext - string - ex: '.doc,.docx'
     * @param cb - callback to call when user select a file
     */
    function openFile(ext, cb, multiple = false) {
        if (isElectron()) {
            const filters = [];
            for (const n in ext) {
                let f;
                if (!(0, x4mod_js_1.isArray)(ext[n])) {
                    f = [ext[n]];
                }
                else {
                    f = ext[n];
                }
                filters.push({ name: n, extensions: f });
            }
            const { ipcRenderer } = electron_js_2.host.require('electron');
            let result = ipcRenderer.sendSync('showOpenDialog', {
                filters,
                multiple
            });
            console.log(result);
            if (result) {
                cb(result);
            }
        }
        else {
            let fi = _createFileInput();
            fi.setAttribute('accept', ext);
            // Set up the file chooser for the on change event
            fi.setDomEvent("change", (evt) => {
                // When we reach this point, it means the user has selected a file,
                const filename = fi.dom.value;
                console.log(filename);
                cb([filename]);
            });
            fi.dom.click();
        }
    }
    exports.openFile = openFile;
    /**
     * open saveas dialog
     * @param defFileName - string - proposed filename
     * @param cb - callback to call when user choose the destination
     */
    function saveFile(defFileName, ext, cb) {
        if (isElectron()) {
            const { ipcRenderer } = electron_js_2.host.require('electron');
            const filters = [];
            for (const n in ext) {
                filters.push({ name: n, extensions: [ext[n]] });
            }
            let result = ipcRenderer.sendSync('showSaveDialog', {
                defaultPath: defFileName,
                filters
            });
            console.log(result);
            if (result) {
                cb(result);
            }
        }
        else {
            let fi = _createFileInput();
            fi.setAttribute('nwsaveas', defFileName);
            fi.setAttribute('accept', ext);
            // Set up the file chooser for the on change event
            fi.setDomEvent("change", (evt) => {
                // When we reach this point, it means the user has selected a file,
                let filename = fi.dom.value;
                console.log(filename);
                cb(filename);
            });
            fi.dom.click();
        }
    }
    exports.saveFile = saveFile;
    function isElectron() {
        return process.versions['electron'] ? true : false;
    }
    exports.isElectron = isElectron;
    //export function isNWJS( ) : boolean {
    //	return window['nw'] ? true : false;
    //}
    function setWindowTitle(title) {
        //	if( isElectron() ) {
        electron_js_2.host.ipc.send('setTitle', title);
        //	}
        //	else if( isNWJS() ) {
        //		window['nw'].Window.get(undefined).title = title;
        //	}
    }
    exports.setWindowTitle = setWindowTitle;
    function openExternal(url) {
        let shell = electron_js_2.host.require('electron').shell;
        shell.openExternal(url);
    }
    exports.openExternal = openExternal;
});
/**
* @file drawtext.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/drawtext", ["require", "exports", "x4/tools"], function (require, exports, tools_js_27) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.drawText = void 0;
    // adapted & modified from Canvas-txt: 
    // https://github.com/geongeorge/Canvas-Txt/blob/master/src/index.js
    // Hair space character for precise justification
    const SPACE = '\u200a';
    const defStyle = {
        align: 'center',
        vAlign: 'middle',
        fontSize: 14,
        fontWeight: null,
        fontStyle: '',
        fontVariant: '',
        fontFamily: 'Arial',
        lineHeight: 0,
        clip: true,
        columns: 1,
        columnGap: 0,
        lineBreak: true,
    };
    function drawText(ctx, input_Text, rc, drawStyle) {
        if (rc.width <= 0 || rc.height <= 0) {
            //width or height or font size cannot be 0
            return;
        }
        //console.time( 'drawtext' );
        drawStyle = { ...defStyle, ...drawStyle };
        ctx.save();
        if (drawStyle.clip) {
            ctx.beginPath();
            ctx.rect(rc.left, rc.top, rc.width, rc.height);
            ctx.clip();
        }
        if (drawStyle.rotation) {
            const center = new tools_js_27.Point(rc.left + rc.width / 2, rc.top + rc.height / 2);
            const rad = drawStyle.rotation / 180 * Math.PI;
            ctx.translate(center.x, center.y);
            ctx.rotate(rad);
            ctx.translate(-center.x, -center.y);
            //ctx.beginPath();
            //ctx.rect( rc.left, rc.top, rc.width, rc.height );
            //ctx.stroke( );
        }
        ctx.textBaseline = 'bottom';
        // End points
        let fontSize = (0, tools_js_27.roundTo)(drawStyle.fontSize, 2) ?? 12;
        //let style = `${drawStyle.fontStyle ?? ''} ${drawStyle.fontVariant ?? ''} ${drawStyle.fontWeight ?? ''} ${fontSize}px ${drawStyle.fontFamily ?? 'arial'}`;
        let style = '';
        if (drawStyle.fontStyle) {
            style += drawStyle.fontStyle + ' ';
        }
        if (drawStyle.fontVariant) {
            style += drawStyle.fontVariant + ' ';
        }
        if (drawStyle.fontWeight) {
            style += drawStyle.fontWeight + ' ';
        }
        style += fontSize + 'px ';
        let family = drawStyle.fontFamily ?? 'sans-serif';
        if (family.indexOf('.') > 0) {
            family = '"' + family + '"';
        }
        style += family;
        ctx.font = style.trim();
        let textarray = [];
        let lines = input_Text.split('\n');
        const columns = drawStyle.columns < 1 ? 1 : drawStyle.columns;
        const gap = drawStyle.columnGap;
        let col_width = (rc.width - gap * (columns - 1)) / columns;
        let col_left = rc.left;
        let hlimit = col_width;
        if (!drawStyle.lineBreak) {
            hlimit = 99999999;
        }
        const spaceW = _measureText(ctx, ' ');
        lines.forEach((text) => {
            let line = { width: 0, words: [], space: 0 };
            // fit in width ?
            let lwidth = _measureText(ctx, text);
            if (lwidth < hlimit) {
                line.width = lwidth;
                line.words.push({ width: lwidth, text });
                textarray.push(line);
            }
            // break line to fit in width
            else {
                // make word list & measure them
                let twords = text.split(/\s/).filter(w => w !== '');
                let words = twords.map(w => {
                    const wwidth = _measureText(ctx, w);
                    const word = {
                        width: wwidth,
                        text: w
                    };
                    return word;
                });
                // then compute lines 
                let n = 0;
                let e = 0;
                while (n < words.length) {
                    const word = words[n];
                    let test = line.width;
                    if (test) {
                        test += spaceW;
                    }
                    test += word.width;
                    //console.log( word, test, col_width );
                    if (test > col_width && e > 0) {
                        textarray.push(line);
                        // restart
                        e = 0;
                        lwidth = 0;
                        line = { width: 0, words: [], space: 0 };
                    }
                    else {
                        line.words.push(word);
                        line.width = test;
                        n++;
                        e++;
                    }
                }
                if (e) {
                    textarray.push(line);
                    line.last = true;
                }
            }
        });
        const textSize = _calcTextHeight(ctx, "Ag");
        let lineHeight = (drawStyle.lineHeight ?? 1.3) * textSize; // * 1.2 = map to pdf 
        const nlines = textarray.length;
        // calc vertical Align
        let col_top = rc.top;
        if (columns == 1) {
            let fullHeight = lineHeight * nlines;
            if (nlines == 1) {
                lineHeight = textSize;
                fullHeight = textSize;
            }
            if (drawStyle.vAlign === 'middle') {
                col_top = rc.top + rc.height / 2 - fullHeight / 2;
                col_top += lineHeight / 2;
                ctx.textBaseline = 'middle';
            }
            else if (drawStyle.vAlign === 'bottom') {
                if (fullHeight < rc.height) {
                    col_top = rc.top + rc.height - fullHeight + lineHeight;
                }
            }
            else {
                col_top = rc.top;
                ctx.textBaseline = 'top';
            }
        }
        else {
            // always top, cannot justify multi-columns vertically
            // todo: for now
            col_top += textSize;
        }
        const justify = drawStyle.align == 'justify';
        let column = columns;
        let y = col_top;
        let align = 0;
        // faster test..
        switch (drawStyle.align) {
            case 'right':
                align = 1;
                break;
            case 'center':
                align = 2;
                break;
        }
        //print all lines of text
        let idx = 1, yy = 0;
        textarray.some(line => {
            console.log(idx++, yy);
            line.space = spaceW;
            if (justify && !line.last) {
                _justify(line, col_width, spaceW);
            }
            let x = col_left;
            if (align == 1) {
                x += col_width - line.width;
            }
            else if (align == 2) {
                x += col_width / 2 - line.width / 2;
            }
            // ...debug
            /*ctx.lineWidth = 1;
            ctx.beginPath( );
            ctx.moveTo( rc.left, y );
            ctx.lineTo( rc.right, y );
            ctx.strokeStyle = 'white';
            ctx.stroke( );*/
            line.words.forEach(w => {
                /*ctx.beginPath( );
                ctx.moveTo( x, y );
                ctx.lineTo( x, y-40 );
                ctx.strokeStyle = 'red';
                ctx.stroke( );*/
                /*ctx.beginPath( );
                ctx.moveTo( x+w.width, y );
                ctx.lineTo( x+w.width, y-40 );
                ctx.strokeStyle = 'green';
                ctx.stroke( );*/
                ctx.fillText(w.text, x, y);
                x += w.width + line.space;
            });
            y += lineHeight;
            yy += lineHeight;
            if (y > (rc.bottom + lineHeight)) {
                y = col_top;
                col_left += col_width + gap;
                if (--column == 0) {
                    return true;
                }
            }
        });
        ctx.restore();
        //console.timeEnd( 'drawtext' );
        // todo autogrow + multi-columns
        return { height: (textarray.length + 0.3) * lineHeight };
    }
    exports.drawText = drawText;
    // Calculate Height of the font
    function _calcTextHeight(ctx, text) {
        const size = ctx.measureText(text);
        return size.actualBoundingBoxAscent + size.actualBoundingBoxDescent;
    }
    function _measureText(ctx, text) {
        return (0, tools_js_27.roundTo)(ctx.measureText(text).width, 2);
    }
    function _justify(line, width, spaceW) {
        let delta = (width - line.width) / (line.words.length - 1) + spaceW;
        if (delta <= 0) {
            return;
        }
        line.width = width;
        line.space = delta;
    }
});
define("lib", ["require", "exports", "x4/drawtext", "src/x4mod"], function (require, exports, drawtext_js_1, x4mod_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(drawtext_js_1, exports);
    __exportStar(x4mod_js_2, exports);
});
define("src/tools/plugins", ["require", "exports", "lib"], function (require, exports, lib_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.loadPlugins = void 0;
    async function loadPlugins(root, resolve) {
        let cache = new Map();
        const fs = lib_js_1.host.require('fs');
        try {
            // scan the plugin dir...
            let plugins = fs.readdirSync(root);
            for (let path of plugins) {
                let fpath = root + '/' + path;
                let basedir = fpath;
                // try just a .js or a dir,
                // if a dir, try <dir>/<dir>.js root element
                let s = lib_js_1.host.stat(fpath);
                if (s.isDir) {
                    fpath = root + '/' + path + '/' + path + '.js';
                }
                else if (lib_js_1.host.getPathPart(fpath, 'extname') != '.js') {
                    continue;
                }
                // require is relative to current loaded path
                let pathStack = [path];
                // custom require function
                const load = (file, absolute = false) => {
                    // remove undesirable elements
                    if (absolute) {
                        file = lib_js_1.host.getPathPart(file, 'basename');
                    }
                    else {
                        if (file.substring(0, 2) != './') {
                            return lib_js_1.host.require(file);
                        }
                        file = file.replaceAll('..', '');
                        while (file[0] == '.' || file[0] == '/' || file[0] == '\\') {
                            file = file.substring(1);
                        }
                        const ext = lib_js_1.host.getPathPart(file, 'extname');
                        if (!ext) {
                            file += '.js';
                        }
                    }
                    const topStack = pathStack[pathStack.length - 1];
                    console.log({ topStack, file });
                    fpath = root + '/' + topStack + '/' + file;
                    const z = cache.get(fpath);
                    if (z) {
                        return z;
                    }
                    const tpath = lib_js_1.host.getPathPart(topStack + '/' + file, 'dirname');
                    pathStack.push(tpath);
                    const mod = { exports: {} };
                    console.log('loading module', fpath);
                    try {
                        let sub = fs.readFileSync(fpath, { encoding: 'utf-8' });
                        let plugEP = new Function('require', 'module', sub); // custom loader
                        plugEP(load, mod);
                    }
                    catch (e) {
                        console.error(`error loading plugin ${fpath}`, e);
                    }
                    pathStack.pop();
                    cache.set(file, mod.exports);
                    return mod.exports;
                };
                let xx = load(fpath, true);
                xx.basedir = basedir;
                xx.name = lib_js_1.host.getPathPart(path, 'filename');
                resolve(xx);
            }
        }
        catch (e) {
            console.log('error loading plugins:', e);
        }
    }
    exports.loadPlugins = loadPlugins;
});
/**
* @file container.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report Generator Container Element
**/
define("src/elements/container", ["require", "exports", "src/elements/element"], function (require, exports, element_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CContainer = void 0;
    class CContainer extends element_js_1.CElement {
        m_children;
        /**
         *
         */
        constructor(gr, owner) {
            super(gr, owner);
            const report = this.getReport();
            this.m_children = [];
            if (gr.children) {
                gr.children?.forEach(el => {
                    const c = report.elementFactory(el, this);
                    this.m_children.push(c);
                });
            }
        }
        /**
         *
         * @param el
         * @param sens
         * @returns
         */
        changeZOrder(el, sens) {
            let arr = this.m_children;
            let index = arr.indexOf(el);
            if (index < 0) {
                return;
            }
            let delta;
            if (sens == 'back') {
                delta = -99999999;
            }
            else if (sens == 'front') {
                delta = +99999999;
            }
            else if (sens == 'before') {
                delta = -1;
            }
            else if (sens == 'after') {
                delta = 1;
            }
            else {
                return;
            }
            let new_index = index + delta;
            if (new_index < 0) {
                new_index = 0;
            }
            else if (new_index > arr.length) {
                new_index = arr.length;
            }
            if (new_index != index) {
                // remove element
                arr.splice(index, 1);
                // set element
                arr.splice(new_index, 0, el);
            }
        }
        forEach(cb, recursive) {
            return this.m_children.some(c => {
                if (cb(c) === true) {
                    return true;
                }
                if (recursive && c instanceof CContainer) {
                    const rc = c.forEach(cb, true);
                    if (rc === true) {
                        return true;
                    }
                }
            });
        }
        /**
         *
         * @param reverse
         * @param recurse
         * @returns
         */
        getChildren(reverse, recurse = true, with_locked = false) {
            let rc;
            if (recurse) {
                rc = [];
                this.m_children.forEach(c => {
                    if (c instanceof CContainer) {
                        rc = rc.concat(c.getChildren(false, true, with_locked));
                    }
                    if (!with_locked && c.isLocked()) {
                        // skip
                    }
                    else {
                        rc.push(c);
                    }
                });
            }
            else {
                if (with_locked) {
                    rc = [...this.m_children];
                }
                else {
                    rc = this.m_children.filter(el => !el.isLocked());
                }
            }
            if (reverse) {
                return rc.reverse();
            }
            else {
                return rc;
            }
        }
        /**
         *
         */
        removeChild(el) {
            const idx = this.m_children.findIndex(e => e === el);
            if (idx >= 0) {
                this.m_children.splice(idx, 1);
            }
        }
        /**
         * add an element
         * @param el element to add
         * @param index position of insertion
         */
        addChild(el, index = null) {
            if (index === null) {
                this.m_children.push(el);
            }
            else {
                this.m_children.splice(index, 0, el);
            }
        }
        touchesPt(pt) {
            if (this.isLocked()) {
                return null;
            }
            // reverse for z-order
            for (let i = this.m_children.length - 1; i >= 0; i--) {
                const el = this.m_children[i];
                const found = el.touchesPt(pt);
                if (found)
                    return found;
            }
            const rc = this.getAbsRect(true);
            if (rc.contains(pt)) {
                return this;
            }
            return null;
        }
        save() {
            const data = super.save();
            delete data.children; // to clear old data
            if (this.m_children.length > 0) {
                let children = [];
                this.m_children.forEach(x => {
                    children.push(x.save());
                });
                data.children = children;
            }
            return data;
        }
        enumColors(to) {
            super.enumColors(to);
            this.m_children.forEach(x => {
                x.enumColors(to);
            });
        }
        renderItem(ctx, rsc) {
            let r = this.getRect();
            if (!ctx.isVisible(r)) {
                //ctx.strokeRect( r.left, r.top, r.width, r.height, 2, 'red');
                return;
            }
            ctx.save();
            ctx.translate(r.left, r.top);
            this.m_children.forEach(el => {
                el.renderItem(ctx, rsc);
            });
            ctx.restore();
        }
        fixZOrder() {
            this.m_children.sort((a, b) => {
                return a.zorder < b.zorder ? -1 : 1;
            });
            this.forEach(el => {
                if (el instanceof CContainer) {
                    el.fixZOrder();
                }
            }, false);
        }
        getChild(index) {
            return this.m_children[index];
        }
        savePos() {
            super.savePos();
            this.forEach(el => el.savePos(), false);
        }
        restorePos() {
            super.restorePos();
            this.forEach(el => el.restorePos(), false);
        }
    }
    exports.CContainer = CContainer;
});
/**
* @file region.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report Generator Region Utility
**/
define("src/tools/region", ["require", "exports", "lib"], function (require, exports, lib_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Region = void 0;
    /**
     *
     */
    class Region {
        m_rects;
        /**
         *
         */
        constructor() {
        }
        /**
         * add a rectangle
         * @param r rectangle to add to the region
         */
        add(rect, data) {
            if (this.m_rects) {
                this.m_rects.push({ rect, data });
            }
            else {
                this.m_rects = [{ rect, data }];
            }
        }
        /**
         * check if the region touches the given rect
         * @param r rectangle to test
         * @returns true/false
         */
        touches(r) {
            if (!this.m_rects) {
                return false;
            }
            return this.m_rects.some(x => x.rect.touches(r));
        }
        /**
         * clears the region
         */
        clear() {
            this.m_rects = undefined;
        }
        /**
         * @returns the overall rectangle
         */
        getRect() {
            let full = null;
            this.m_rects?.forEach(r => {
                if (!full) {
                    full = new lib_js_2.Rect(r.rect);
                }
                else {
                    full.combine(r.rect);
                }
            });
            return full;
        }
        forEach(cb) {
            this.m_rects?.forEach(cb);
        }
        getParts() {
            return this.m_rects ?? [];
        }
    }
    exports.Region = Region;
});
/**
* @file theme.ts
* @description Report Generator Theme for elements
* @author Etienne Cochard
* @copyright (c) 2020-2021 R-libre ingenierie
**/
define("src/elements/theme", ["require", "exports", "lib"], function (require, exports, lib_js_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.userColors = exports.UserColors = exports.Theme = void 0;
    exports.Theme = {
        ghost: 'rgba(0,0,0,0.2)',
        selection: {
            lines: '#18a0fb',
            back: '#18a0fb22',
            handles: 'white',
            locked: '#9aa6af',
            label: {
                back: '#18a0fb',
                text: 'white',
            },
        },
        size: {
            back: '#18a0fb',
            text: 'white'
        },
        marks: {
            horz: 'red',
            vert: 'green',
        },
        margins: lib_js_3.Color.fromCssVar('css:page-margins'),
        rulers: {
            back: '#394B59e0',
            outside: '#00000080',
            mark: '#e0e0e0',
            text: 'white',
            cursor: '#18a0fb',
        },
        page: {
            header: {
                background: '#CED9E0',
                text: 'black',
            }
        },
        markers: {
            hmark: {
                line: '#18a0fb',
                label: 'red',
                text: 'white'
            },
            vmark: {
                line: '#18a0fb',
                label: 'red',
                text: 'white'
            },
            page: {
                line: '#a018fb',
                text: 'white'
            },
            pbreak: {
                line: 'rgba(0,0,0,0.4)',
                text: 'white'
            },
        },
        sections: {
            header: {
                back: '#4fa500',
                text: 'white',
                hollow: '#4fa50020'
            },
            footer: {
                background: '#4fa500',
                text: 'white'
            },
            template: {
                background: '#404040',
                text: 'white'
            },
            guard: {
                background: '#7e5c9c',
                text: 'white'
            },
            last: {
                background: '#7e5c9c',
                text: 'white'
            },
        }
    };
    class UserColors {
        m_colors;
        constructor() {
            this.m_colors = [];
        }
        add(clr) {
            let c1;
            let c2;
            if (clr instanceof lib_js_3.Color) {
                c1 = clr;
                c2 = clr.toHex();
            }
            else {
                c1 = new lib_js_3.Color(clr);
                c2 = c1.toHex();
            }
            if (this.m_colors.findIndex(x => x.toHex() == c2) < 0) {
                this.m_colors.push(c1);
            }
        }
        values() {
            return this.m_colors;
        }
        clear() {
            this.m_colors = [];
        }
    }
    exports.UserColors = UserColors;
    exports.userColors = new UserColors();
});
/**
* @file conversion.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report Generaot Conversion tools
**/
define("src/tools/conversion", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.pt2u = exports.u2px = exports.px2u = exports.u2u = exports.deg2rad = exports.px2in = exports.in2px = exports.px2mm = exports.mm2px = exports.in2pt = exports.pt2in = exports.in2mm = exports.mm2in = exports.mm2pt = exports.pt2mm = exports.px2pt = exports.pt2px = void 0;
    function pt2px(pt) { return pt * 1.3333333333; }
    exports.pt2px = pt2px;
    function px2pt(px) { return px / 1.3333333333; }
    exports.px2pt = px2pt;
    function pt2mm(pt) { return pt / 2.8333333333; }
    exports.pt2mm = pt2mm;
    function mm2pt(mm) { return mm * 2.8333333333; }
    exports.mm2pt = mm2pt;
    function mm2in(mm) { return mm / 25.4; }
    exports.mm2in = mm2in;
    function in2mm(inch) { return inch * 25.4; }
    exports.in2mm = in2mm;
    function pt2in(pt) { return pt * 0.0138889; }
    exports.pt2in = pt2in;
    function in2pt(inch) { return inch / 0.0138889; }
    exports.in2pt = in2pt;
    function mm2px(mm) { return mm * 3.77777776; }
    exports.mm2px = mm2px;
    function px2mm(px) { return px / 3.77777776; }
    exports.px2mm = px2mm;
    function in2px(inch) { return inch * 25.4 * 3.77777776; }
    exports.in2px = in2px;
    function px2in(px) { return px / 25.4 / 3.77777776; }
    exports.px2in = px2in;
    function deg2rad(deg) { return deg / 180 * Math.PI; }
    exports.deg2rad = deg2rad;
    function u2u(x) { return x; }
    exports.u2u = u2u;
    function px2u(px, unit) {
        switch (unit) {
            case 'in': return px2in(px);
            case 'mm': return px2mm(px);
            case 'pt': return px2pt(px);
            case 'px': return px;
        }
    }
    exports.px2u = px2u;
    function u2px(u, unit) {
        switch (unit) {
            case 'in': return in2px(u);
            case 'mm': return mm2px(u);
            case 'pt': return pt2px(u);
            case 'px': return u;
        }
    }
    exports.u2px = u2px;
    function pt2u(pt, unit) {
        switch (unit) {
            case 'in': return pt2in(pt);
            case 'mm': return pt2mm(pt);
            case 'pt': return pt;
            case 'px': return pt2px(pt);
        }
    }
    exports.pt2u = pt2u;
});
/**
* @file paper.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report Generator Paper Definitions
**/
define("src/tools/paper", ["require", "exports", "lib", "src/tools/conversion"], function (require, exports, lib_js_4, conversion_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.calcPaperSize = void 0;
    const paperSizes = {
        'A3': [297, 420],
        'A4': [210, 297],
        'A5': [148, 210],
        'A6': [105, 148],
        'letter': [215.9, 279.4],
        'legal': [215.9, 355.6],
        'executif': [184.2, 266.7]
    };
    function calcPaperSize(def, units) {
        let size;
        if (def.size in paperSizes) {
            const w = paperSizes[def.size][0];
            const h = paperSizes[def.size][1];
            size = new lib_js_4.Size(w, h);
        }
        else {
            size = new lib_js_4.Size(Math.max(def.width ?? 210, 50), Math.max(def.height ?? 297, 50));
        }
        switch (units) {
            case 'mm': break;
            case 'in':
                size.width = (0, conversion_js_1.mm2in)(size.width);
                size.height = (0, conversion_js_1.mm2in)(size.height);
                break;
            case 'pt':
                size.width = (0, conversion_js_1.mm2pt)(size.width);
                size.height = (0, conversion_js_1.mm2pt)(size.height);
                break;
            case 'px':
                size.width = (0, conversion_js_1.mm2px)(size.width);
                size.height = (0, conversion_js_1.mm2px)(size.height);
                break;
        }
        return size;
    }
    exports.calcPaperSize = calcPaperSize;
});
define("src/renderers/base_canvas", ["require", "exports", "lib", "src/tools/conversion"], function (require, exports, lib_js_5, conversion_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.alignRect = exports.PaintCanvas = exports.Color = exports.Size = exports.Point = exports.Rect = void 0;
    Object.defineProperty(exports, "Color", { enumerable: true, get: function () { return lib_js_5.Color; } });
    Object.defineProperty(exports, "Rect", { enumerable: true, get: function () { return lib_js_5.Rect; } });
    Object.defineProperty(exports, "Size", { enumerable: true, get: function () { return lib_js_5.Size; } });
    Object.defineProperty(exports, "Point", { enumerable: true, get: function () { return lib_js_5.Point; } });
    class PaintCanvas {
        m_options;
        m_unitcvt; // unit converter
        m_unitcvt_r; // unit converter reverse
        constructor(options) {
            this.m_options = options;
            this.m_unitcvt = x => x;
            this.m_unitcvt_r = x => x;
        }
        convertUnits(value, from) {
            let cur = this.getUnits();
            if (cur == from) {
                return value;
            }
            let px = (0, conversion_js_2.u2px)(value, from);
            return (0, conversion_js_2.px2u)(px, cur);
        }
        beginHotSpot(name) { }
        endHotSpot() { }
    }
    exports.PaintCanvas = PaintCanvas;
    function alignRect(rect, into, fit) {
        if (!fit || fit == 'fill') {
            return new lib_js_5.Rect(into);
        }
        const rectRatio = rect.width / rect.height;
        const boundsRatio = into.width / into.height;
        let width, height;
        if (fit == 'cover') {
            // Rect is more landscape than bounds - fit to width
            if (rectRatio > boundsRatio) {
                width = into.width;
                height = rect.height * (width / rect.width);
            }
            // Rect is more portrait than bounds - fit to height
            else {
                height = into.height;
                width = rect.width * (height / rect.height);
            }
        }
        return new lib_js_5.Rect(into.left + into.width / 2 - width / 2, into.top + into.height / 2 - height / 2, width, height);
    }
    exports.alignRect = alignRect;
});
/**
* @file text.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report Generator Text Element
**/
define("src/elements/text", ["require", "exports", "src/elements/element", "src/elements/theme", "src/tools/conversion"], function (require, exports, element_js_2, theme_js_1, conversion_js_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CText = void 0;
    class CText extends element_js_2.CElement {
        /**
         *
         */
        initWithDef() {
            super.initWithDef();
            Object.assign(this.m_data, {
                font: {
                    family: '<document>',
                    size: 12,
                },
                color: '#000',
            });
        }
        /**
         *
         */
        renderItem(ctx, rsc) {
            const d = this.m_data;
            if (d.visible === false) {
                return;
            }
            let rc = this.getRect(true);
            let lw = d.border?.width;
            let clr = d.border?.color;
            if (rsc.mode == 'edit' && ((0, element_js_2.isTransp)(clr) || !lw) && (0, element_js_2.isTransp)(d.bkColor)) {
                lw = (0, conversion_js_3.px2u)(1, ctx.getUnits());
                clr = theme_js_1.Theme.ghost;
            }
            // in execution mode, we scan for ${ <code> }
            let text = d.text;
            if (rsc.mode == 'execute') {
                text = this.getReport().resolveText(d.text, rsc);
            }
            const font = this._calcFont();
            ctx.save();
            if (this.m_data.name) {
                ctx.beginHotSpot(this.m_data.name);
            }
            if (d.rotation) {
                const center = new element_js_2.Point(rc.left + rc.width / 2, rc.top + rc.height / 2);
                ctx.translate(center.x, center.y);
                ctx.rotate(d.rotation);
                ctx.translate(-center.x, -center.y);
            }
            ctx.fillRect(rc.left, rc.top, rc.width, rc.height, d.bkColor, d.radius);
            ctx.strokeRect(rc.left, rc.top, rc.width, rc.height, lw, clr, d.radius);
            const options = {
                fontSize: d.font?.size,
                fontFace: font,
                fontWeight: d.font.weight ?? 400,
                align: d.align ?? 'left',
                vAlign: d.vAlign ?? 'top',
                lineHeight: d.lineHeight ?? 1.3,
                columns: d.columns > 1 ? d.columns : undefined,
                columnGap: d.columnGap === undefined ? (0, conversion_js_3.pt2px)(8) : d.columnGap,
                padding: (d.padding ?? 0) + (d.border?.width / 2 ?? 0),
                lineBreak: d.noWordWrap === true ? false : true,
                rotation: 0,
            };
            ctx.drawText(rc.left, rc.top, rc.width, rc.height, text, d.color, options);
            if (this.m_data.name) {
                ctx.endHotSpot();
            }
            ctx.restore();
        }
        _calcFont() {
            const d = this.m_data;
            let name = d?.font?.family ?? '<page>';
            if (name == '<page>') {
                const page = this.getPage();
                name = page.getDefFont();
            }
            else if (name == '<document>') {
                const report = this.getReport();
                name = report.getDefFont();
            }
            return name;
        }
        enumColors(to) {
            if (this.m_data.color) {
                to.add(this.m_data.color);
            }
            if (this.m_data.bkColor) {
                to.add(this.m_data.bkColor);
            }
        }
        isAutoGrow() {
            return this.m_data.autoGrow;
        }
        calcHeight(ctx, rsc) {
            const d = this.m_data;
            // in execution mode, we scan for ${ <code> }
            let text = d.text;
            if (rsc.mode == 'execute') {
                text = this.getReport().resolveText(d.text, rsc);
            }
            const font = this._calcFont();
            const options = {
                fontSize: d.font?.size,
                fontFace: font,
                fontWeight: d.font.weight ?? 400,
                align: d.align ?? 'left',
                vAlign: d.vAlign ?? 'top',
                lineHeight: d.lineHeight ?? 1.3,
                columns: d.columns > 1 ? d.columns : undefined,
                columnGap: d.columnGap === undefined ? (0, conversion_js_3.pt2px)(8) : d.columnGap,
                padding: (d.padding ?? 0) + (d.border?.width ?? 0),
                lineBreak: d.noWordWrap === true ? false : true,
                rotation: 0,
            };
            let rc = this.getRect(true);
            const dims = ctx.measureText(text, rc.width, options);
            return dims.height;
        }
    }
    exports.CText = CText;
});
/**
* @file section.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report Generator Section Element
**/
define("src/elements/section", ["require", "exports", "src/elements/element", "src/elements/container", "src/elements/text"], function (require, exports, element_js_3, container_js_1, text_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CSection = void 0;
    class CSection extends container_js_1.CContainer {
        m_fixed_height;
        m_fixed_top;
        m_reppos;
        /**
         *
         */
        renderItem(ctx, rsc) {
            if (rsc.mode == 'execute') {
                this._prepareGrowableElements(ctx, rsc);
            }
            if (this.m_data.repeat > 1 && this.m_reppos !== undefined) {
                this.m_data.left = this.m_reppos * this.m_data.width;
            }
            else {
                this.m_data.left = 0;
            }
            super.renderItem(ctx, rsc);
        }
        /**
         *
         */
        getBreak() {
            return this.m_data.break;
        }
        /**
         *
         */
        getHandles(dx, dy) {
            if (this.is('doc_head') || this.is('doc_back')) {
                return [];
            }
            const rc = this.getRect();
            return [
                { code: 'bottom', x: rc.left + rc.width / 2, y: rc.bottom }
            ];
        }
        fill(root, onlyPos) {
            super.fill(root, onlyPos);
            root.itemWithRef('break')?.show(!(this.is('header') || this.is('footer') || this.is('body')));
        }
        getName() {
            let name = super.getName();
            if (!name) {
                if (this.is('header')) {
                    name = element_js_3._tr.elements.section.name_header;
                }
                else if (this.is('footer')) {
                    name = element_js_3._tr.elements.section.name_footer;
                }
                else if (this.is('body')) {
                    name = element_js_3._tr.elements.section.name_body;
                }
            }
            return name;
        }
        /**
         *
         */
        set_top(top) {
            this.m_data.top = top;
        }
        set_width(width) {
            this.m_data.width = width;
        }
        set_height(height) {
            this.m_data.height = height;
        }
        is(kind) {
            return this.m_data.kind == kind;
        }
        getKind() {
            return this.m_data.kind;
        }
        getRect() {
            let rc = super.getRect();
            if (this.m_fixed_top !== undefined) {
                rc.top = this.m_fixed_top;
            }
            if (this.m_fixed_height !== undefined) {
                rc.height = this.getHeight();
            }
            return rc;
        }
        getHeight() {
            if (this.m_fixed_height !== undefined) {
                return this.m_fixed_height;
            }
            return this.m_data.height;
        }
        fix_top(newt) {
            this.m_fixed_top = newt;
        }
        fix_height(newh) {
            this.m_fixed_height = newh;
        }
        getPageOffset(cx, cy, section) {
            return { x: this.m_data.left + cx, y: this.m_data.top + cy };
        }
        size(w, h) {
            if (this.is('header') || this.is('footer')) {
                const max = this.m_owner.getMinHeight() / 3;
                if (h > max) {
                    h = max;
                }
            }
            if (h < 1) {
                h = 1;
            }
            super.size(w, h);
        }
        getComputedName() {
            switch (this.m_data.kind) {
                case 'header': {
                    return element_js_3._tr.elements.section.name_header;
                }
                case 'footer': {
                    return element_js_3._tr.elements.section.name_footer;
                }
                case 'body': {
                    return element_js_3._tr.elements.section.name_body;
                }
                case 'doc_head': {
                    return element_js_3._tr.elements.section.name_dochead;
                }
                case 'doc_back': {
                    return element_js_3._tr.elements.section.name_docback;
                }
            }
            return this.m_data.name ?? "section";
        }
        touches(rc, inclusive) {
            return false;
        }
        enterSizeMove(owner) {
        }
        exitSizeMove(owner) {
        }
        __set(name, v) {
            super.__set(name, v);
            if (name == 'break') {
                this.notify('section.break_change', this);
            }
        }
        repCount() {
            return this.m_data.repeat ?? 1;
        }
        repDispClear() {
            this.m_reppos = 0;
        }
        repDispNext() {
            this.m_reppos++;
            if (this.m_reppos == this.m_data.repeat) {
                this.m_reppos = 0;
                return true;
            }
            return false;
        }
        repReset() {
            this.m_reppos = undefined;
            this.m_data.left = 0;
        }
        /**
         * compute section height from content:
         * text elements with autoGrow can grow the section
         * when an element grows, it moves down all elements that are below it
         */
        _prepareGrowableElements(ctx, rsc) {
            let height = this.m_data.height;
            const els = [];
            this.forEach(el => els.push(el), false);
            for (let i = 0; i < els.length; i++) {
                const el = els[i];
                if (el instanceof text_js_1.CText && el.isAutoGrow()) {
                    const rc = el.getRect();
                    const bot = rc.bottom;
                    let th = el.calcHeight(ctx, rsc);
                    if (th > rc.height) {
                        // sized hard
                        el.setData('height', th);
                        // move down all elements behind it's bottom
                        for (let j = i + 1; j < els.length; j++) {
                            const nel = els[j];
                            const nrc = nel.getRect();
                            if (nrc.top >= bot) {
                                nrc.top -= rc.height;
                                nrc.top += th;
                                // moved hard
                                nel.setData('top', nrc.top);
                            }
                        }
                        height -= rc.height;
                        height += th;
                    }
                }
            }
            this.m_data.height = height;
        }
        restorePos() {
            this.repDispClear();
            super.restorePos();
        }
    }
    exports.CSection = CSection;
});
/**
* @file page.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report Generator Page Element
**/
define("src/elements/page", ["require", "exports", "src/tools/paper", "src/elements/element", "src/elements/section", "src/elements/container"], function (require, exports, paper_js_1, element_js_4, section_js_1, container_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CPage = void 0;
    /**
     *
     */
    class CPage extends container_js_2.CContainer {
        /**
         *
         */
        constructor(pg, owner) {
            super(pg, owner);
            this.updateRect();
            this._sortSections();
            this.fixSections();
        }
        getPage() {
            return this;
        }
        /**
         * pages cannot be moved not sized
         */
        isSelectable() {
            return false;
        }
        /**
         *
         */
        renderItem(ctx, rsc) {
            let rc = this.getRect();
            const report = this.getReport();
            const header = this.getSection('header');
            const footer = this.getSection('footer');
            //const body = this.getSection('body');
            const paperSize = (0, paper_js_1.calcPaperSize)(this.m_data.size, report.getUnits());
            let top;
            let bot;
            let startPage = true;
            rsc.printInfo.rootData.document.pagenum = 1;
            rsc.printInfo.rootData.document.pagecount = 1;
            rsc.printInfo.started = false;
            rsc.printInfo.top = 0;
            rsc.printInfo.limit = 0;
            if (header) {
                header.set_width(rc.width);
            }
            if (footer) {
                footer.set_width(rc.width);
            }
            const start = (hdr_and_ftr = true) => {
                if (rsc.printInfo.started) {
                    ctx.endPage();
                }
                top = 0;
                bot = paperSize.height;
                ctx.startPage(this.m_data.size);
                if (hdr_and_ftr) {
                    if (header) {
                        header.savePos();
                        header.fix_top(top);
                        header.renderItem(ctx, rsc);
                        top += header.getHeight();
                        header.restorePos();
                    }
                    if (footer) {
                        footer.savePos();
                        const h = footer.getHeight();
                        bot -= h;
                        footer.fix_top(bot);
                        footer.renderItem(ctx, rsc);
                        footer.restorePos();
                    }
                }
                rsc.printInfo.rootData.document.pagenum++;
                rsc.printInfo.rootData.document.pagecount++;
                startPage = false;
                rsc.printInfo.started = true;
            };
            this.savePos();
            const doc_h = this.getSection('doc_head');
            const doc_b = this.getSection('doc_back');
            if (doc_h) {
                start(false);
                doc_h.set_width(rc.width);
                doc_h.fix_top(top);
                doc_h.renderItem(ctx, rsc);
            }
            start();
            rsc.printInfo.start = start;
            rsc.printInfo.top = top;
            rsc.printInfo.limit = bot;
            for (const el of this.m_children) {
                if (el === header || el === footer || el === doc_h || el === doc_b) {
                    // ignore header/footer
                    continue;
                }
                if (!(el instanceof section_js_1.CSection)) {
                    // ignore these items
                    continue;
                }
                const brk = el.getBreak();
                if (brk == 'before') {
                    start();
                }
                el.set_width(rc.width);
                el.fix_top(top);
                el.savePos();
                el.renderItem(ctx, rsc);
                top += el.getHeight();
                el.restorePos();
                if (brk == 'after') {
                    start();
                }
            }
            if (doc_b) {
                start(false);
                doc_b.set_width(rc.width);
                doc_b.fix_top(top);
                doc_b.renderItem(ctx, rsc);
            }
            this.restorePos();
            ctx.endPage();
        }
        /**
         *
         */
        computePageBreaks() {
            let pageh = this.getMinHeight();
            let top = 0;
            let pos = 0;
            let end = 0;
            let positions = [];
            const doc_h = this.getSection('doc_head');
            const doc_b = this.getSection('doc_back');
            const header = this.getSection('header');
            const footer = this.getSection('footer');
            const body = this.getSection('body');
            this.m_children.forEach(el => {
                if (el === doc_h || el === doc_b) {
                    // just skip
                    return;
                }
                if (pos >= end) {
                    end += pageh;
                }
                // children are not always a section:
                //	during size or move, elements belongs to page
                if (el instanceof section_js_1.CSection) {
                    let h = el.getHeight();
                    if (el === header) {
                        top += h;
                        pageh -= h;
                        end = top + pageh;
                    }
                    else if (el === footer) {
                        top += h;
                        pageh -= h;
                    }
                    else if (el === body) {
                        //skip it
                    }
                    else {
                        switch (el.getBreak()) {
                            case 'before': {
                                positions.push(pos);
                                end = pos + pageh;
                                break;
                            }
                            case 'after': {
                                positions.push(pos + h);
                                end = pos + h + pageh;
                                break;
                            }
                        }
                    }
                    pos += h;
                }
            });
            if (end > pos) {
                positions.push(end);
            }
            else {
                end = pos;
            }
            let cBrk = 0;
            let breaks = [];
            const fullh = this.getMinHeight();
            let realtop = 0;
            if (doc_h) {
                breaks.push(fullh);
                realtop += fullh;
            }
            if (doc_b) {
                breaks.push(fullh);
                realtop += fullh;
            }
            let nextBrk = positions[cBrk] + realtop;
            for (let y = realtop + top + pageh; y <= realtop + end; y += pageh) {
                if (nextBrk !== undefined && nextBrk <= y) {
                    y = nextBrk;
                    nextBrk = positions[++cBrk] + realtop;
                }
                breaks.push(y);
            }
            return breaks;
        }
        /**
         *
         */
        updateRect() {
            const size = (0, paper_js_1.calcPaperSize)(this.m_data.size, this.m_owner.getUnits());
            if (this.m_data.orientation == 'landscape') {
                this.m_data.width = size.height;
                this.m_data.height = Math.max(size.width, this.m_data.height);
            }
            else {
                this.m_data.width = size.width;
                this.m_data.height = Math.max(size.height, this.m_data.height);
            }
        }
        getMinHeight() {
            const size = (0, paper_js_1.calcPaperSize)(this.m_data.size, this.m_owner.getUnits());
            if (this.m_data.orientation == 'landscape') {
                return size.width;
            }
            else {
                return size.height;
            }
        }
        /**
         *
         */
        getHandles() {
            return [];
        }
        /**
         *
         */
        getDescriptor() {
            const def = super.getDescriptor(false, false, false);
            const lw = 70;
            return [
                ...def,
                {
                    type: 'panel',
                    title: element_js_4._tr.elements.properties,
                    items: [
                        {
                            type: 'choice',
                            title: element_js_4._tr.elements.page.size,
                            ref: 'size.size',
                            labelWidth: lw,
                            items: [
                                { id: 'A6', text: 'A6' },
                                { id: 'A5', text: 'A5' },
                                { id: 'A4', text: 'A4' },
                                { id: 'letter', text: 'letter' },
                                { id: 'legal', text: 'legal' },
                                { id: 'custom', text: 'custom' },
                                //{ id: 'linear', text: 'linear' },
                            ]
                        },
                        [
                            {
                                type: 'num',
                                title: element_js_4._tr.elements.page.width,
                                ref: 'size.width',
                                min: 50,
                                labelWidth: lw,
                            },
                            {
                                type: 'num',
                                title: element_js_4._tr.elements.page.height,
                                ref: 'size.height',
                                min: 50,
                                labelWidth: lw,
                            },
                        ],
                        {
                            type: 'choice',
                            title: element_js_4._tr.elements.page.orientation,
                            ref: 'orientation',
                            labelWidth: lw,
                            items: [
                                { id: 'portrait', text: element_js_4._tr.elements.page.portrait },
                                { id: 'landscape', text: element_js_4._tr.elements.page.landscape },
                            ]
                        },
                        {
                            type: 'panel',
                            title: element_js_4._tr.elements.defaults,
                            items: [
                                {
                                    type: 'choice',
                                    ref: 'font',
                                    title: element_js_4._tr.elements.page.font,
                                    items: this.getReport().enumFontNames(true, false),
                                    default: '<document>'
                                },
                            ]
                        },
                    ]
                }
            ];
        }
        /**
         *
         */
        fill(root, onlyPos) {
            super.fill(root, onlyPos);
            const custom = this.m_data.size.size == 'custom';
            root.itemWithRef('size.width')?.show(custom);
            root.itemWithRef('size.height')?.show(custom);
        }
        /**
         *
         */
        __set(name, v) {
            super.__set(name, v);
            if (name == 'orientation' || name == 'size.size') {
                if (name == 'size.size' && v == 'custom') {
                    this.m_data.size.width = this.m_data.width;
                    this.m_data.size.height = this.m_data.height;
                }
                this.updateRect();
                this.notify('page.rotate', this);
                this.notify('element.refill', { el: this, pos: true });
            }
            else if (name == 'size.width' || name == 'size.height') {
                this.updateRect();
                this.notify('page.resize', this);
            }
        }
        /**
         *
         */
        getContextMenu() {
            //return [
            //	new MenuItem({ text: 'New Page', icon: 'resources/img/page.svg', items: [
            //		new MenuItem({ text: 'Before', click: () => this._addPage('before') }),
            //		new MenuItem({ text: 'After', click: () => this._addPage('after') })
            //	]})
            //];
            return [];
        }
        /**
         *
         */
        //private _addPage(where: 'before' | 'after') {
        //	const report = this.getReport();
        //	report.addPage(this, where)
        //}
        /**
         *
         */
        getDefFont() {
            let font = this.m_data.font;
            if (!font) {
                font = this.getReport().getDefFont();
            }
            return font;
        }
        /**
         *
         */
        getAbsRect(normalized = true) {
            return this.getRect(normalized);
        }
        getPageOffset(cx, cy, section) {
            return { x: cx, y: cy };
        }
        /**
         *
         */
        addSection(section, before) {
            let index = -1;
            if (before) {
                index = this.m_children.indexOf(before);
            }
            if (index < 0) {
                this.m_children.push(section);
            }
            else {
                this.m_children.splice(index, 0, section);
            }
            this._sortSections();
            this.fixSections();
            this.dirty();
        }
        /**
         *
         */
        sectionOnPoint(pt) {
            const rect = this.getRect();
            if (!rect.contains(pt)) {
                return null;
            }
            for (const s of this.m_children) {
                if (s.getRect().contains(pt)) {
                    return s;
                }
                ;
            }
            return this.getSection('body');
        }
        /**
         *
         */
        getSection(kind) {
            return this.m_children.find(s => {
                if (!(s instanceof section_js_1.CSection)) {
                    return false;
                }
                return s.getKind() == kind;
            });
        }
        _sortSections() {
            let sec = [];
            const header = this.getSection('header');
            const footer = this.getSection('footer');
            const body = this.getSection('body');
            const doc_h = this.getSection('doc_head');
            const doc_b = this.getSection('doc_back');
            // doc header is always 1st
            if (doc_h) {
                sec.push(doc_h);
            }
            // footer is always 2nd
            if (doc_b) {
                sec.push(doc_b);
            }
            // header is next
            if (header) {
                sec.push(header);
            }
            // footer is next
            if (footer) {
                sec.push(footer);
            }
            this.m_children.forEach(s => {
                if (s !== header && s !== footer && s !== body && s !== doc_h && s != doc_b) {
                    sec.push(s);
                }
            });
            // should always be there
            if (body) {
                sec.push(body);
            }
            this.m_children = sec;
        }
        nextSection(el) {
            let idx = this.m_children.indexOf(el);
            if (idx < 0) {
                return undefined;
            }
            return this.m_children[idx + 1];
        }
        /**
         *
         */
        fixSections() {
            const header = this.getSection('header');
            const footer = this.getSection('footer');
            const doc_h = this.getSection('doc_head');
            const doc_b = this.getSection('doc_back');
            const body = this.getSection('body');
            const pgheight = this.getMinHeight();
            const rc = this.getRect();
            let top = 0;
            if (doc_h) {
                doc_h.set_top(top);
                doc_h.set_height(pgheight);
                doc_h.set_width(rc.width);
                top += doc_h.getHeight();
            }
            if (doc_b) {
                doc_b.set_top(top);
                doc_b.set_height(pgheight);
                doc_b.set_width(rc.width);
                top += doc_b.getHeight();
            }
            let top2 = 0;
            // header is always 1st
            if (header) {
                header.set_top(top);
                header.set_width(rc.width);
                top += header.getHeight();
                top2 += header.getHeight();
            }
            // footer is always 2nd
            if (footer) {
                footer.set_top(top);
                footer.set_width(rc.width);
                top += footer.getHeight();
                top2 += header.getHeight();
            }
            // min body height
            const bheight = pgheight - top2;
            this.m_children.forEach(s => {
                if (s !== header && s !== footer && s !== body && s !== doc_h && s !== doc_b) {
                    s.set_top(top);
                    s.set_width(rc.width);
                    let h = s.getHeight();
                    top += h;
                }
            });
            // should always be there
            if (body) {
                body.set_top(top);
                body.set_width(rc.width);
                const breaks = this.computePageBreaks();
                if (breaks.length) {
                    body.fix_height(breaks[breaks.length - 1] - top);
                }
                else {
                    body.fix_height(bheight);
                }
                // body bottom should be under last break 
                // aligned to a page height
                //body.align( bheight, init );
                top += body.getHeight();
            }
            this.m_data.height = top;
            this.notify('element.refill', { el: this, pos: true });
        }
        /**
         * fix zorder for all elements
         * this way we can keep it event when moving between sections
         */
        prepareZOrder() {
            let z = 1;
            this.forEach(el => {
                el.zorder = z++;
            }, true);
        }
    }
    exports.CPage = CPage;
});
define("src/tools/json", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseJSON = void 0;
    // dirty json parser (comments, missing quotes, trailing coma)
    function parseJSON(json) {
        if (!json) {
            return undefined;
        }
        try {
            return JSON.parse(json);
        }
        catch (e) {
            let f = new Function('return ' + json);
            try {
                return f();
            }
            catch (e) {
                console.log(e);
            }
        }
    }
    exports.parseJSON = parseJSON;
});
/**
* @file custom.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report Generator Custom Element
**/
define("src/elements/custom", ["require", "exports", "src/tools/conversion", "src/elements/element", "src/elements/theme"], function (require, exports, conversion_js_4, element_js_5, theme_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CCustom = void 0;
    /**
     *
     */
    class CCustom extends element_js_5.CElement {
        m_init;
        constructor(data, owner) {
            super(data, owner);
            this.m_init = this.m_data.plugin !== undefined;
        }
        _prepareDefaults() {
            const defs = {
                font: {
                    family: '<page>',
                    size: 9,
                    weight: 'normal',
                },
                color: '#000'
            };
            let result = { ...defs, ...this.m_data.defaults };
            result.font.family = this._calcFont(result.font.family);
            return result;
        }
        _preparePlugin() {
            if (!this.m_init) {
                const report = this.getReport();
                this.m_data.plugin = report.getPlugin(this.m_data.reference);
                this.m_init = true;
            }
        }
        buildEditors() {
            this._preparePlugin();
            return super.buildEditors();
        }
        /**
         *
         */
        renderItem(ctx, rsc) {
            this._preparePlugin();
            const rc = this.getRect(true);
            const p = this.m_data.plugin;
            if (p && p.renderer) {
                if (this.m_data.name) {
                    ctx.beginHotSpot(this.m_data.name);
                }
                ctx.save();
                ctx.clip(rc.left, rc.top, rc.width, rc.height);
                const defs = this._prepareDefaults();
                const solvers = {
                    solve_text: (x) => {
                        if (rsc.mode == 'execute') {
                            return this.getReport().resolveText(x, rsc);
                        }
                        else {
                            return x;
                        }
                    },
                    solve_link: (x) => {
                        return this._solver(x, rsc);
                    },
                    translate: (x) => {
                        return rsc?.printInfo?.script ? rsc.printInfo.script.translate(x) : x;
                    }
                };
                try {
                    p.renderer.call(this, ctx, this.m_data.data, defs, this.m_data.link, solvers);
                }
                catch (e) {
                    console.error(e);
                    ctx.drawText(rc.left, rc.top, rc.width, rc.height, `error: ${e.message}`, 'red', {});
                }
                if (this.m_data.name) {
                    ctx.endHotSpot();
                }
                ctx.restore();
            }
            else {
                ctx.drawText(rc.left, rc.top, rc.width, rc.height, `bad plugin: ${this.m_data.reference}`, 'black', {});
            }
            if (rsc.mode == 'edit') {
                let lw = (0, conversion_js_4.px2u)(1, ctx.getUnits());
                ctx.strokeRect(rc.left, rc.top, rc.width, rc.height, lw, theme_js_2.Theme.ghost, 0);
            }
        }
        /**
         * called when the plugin needs to solve a field
         *
         * @param fieldName
         * @param rsc
         * @returns
         */
        _solver(fieldName, rsc) {
            if (!fieldName) {
                return undefined;
            }
            const report = this.getReport();
            let errors = [];
            const result = report.findData(fieldName, rsc.printInfo.rootData, errors);
            if (errors.length) {
                console.error(errors);
            }
            return result;
        }
        _calcFont(name) {
            if (name == '<page>') {
                const page = this.getPage();
                name = page.getDefFont();
            }
            else if (name == '<document>') {
                const report = this.getReport();
                name = report.getDefFont();
            }
            return name;
        }
    }
    exports.CCustom = CCustom;
});
/**
* @file image.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report Generator Image Element
**/
define("src/elements/image", ["require", "exports", "src/tools/conversion", "src/elements/element", "src/elements/theme"], function (require, exports, conversion_js_5, element_js_6, theme_js_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CImage = void 0;
    /**
     *
     */
    class CImage extends element_js_6.CElement {
        /**
         *
         */
        renderItem(ctx, rsc) {
            const d = this.m_data;
            const r = this.getRect();
            if (d.imageid) {
                ctx.drawImage(d.imageid, r.left, r.top, r.width, r.height, d.fit);
            }
            if (rsc.mode == 'edit') {
                ctx.strokeRect(r.left, r.top, r.width, r.height, (0, conversion_js_5.px2u)(1, ctx.getUnits()), theme_js_3.Theme.ghost, 0);
            }
        }
    }
    exports.CImage = CImage;
});
/**
* @file script.ts
* @author Etienne Cochard
* @copyright (c) 2022 R-libre ingenierie, all rights reserved.
*
* @description Script executor
**/
define("src/elements/script", ["require", "exports", "src/tools/paper", "src/elements/text", "src/elements/custom", "src/elements/image"], function (require, exports, paper_js_2, text_js_2, custom_js_1, image_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ScriptReport = void 0;
    class ScriptElement {
        element;
        constructor(el) {
            this.element = el;
        }
        set bkColor(v) {
            if (this.element instanceof text_js_2.CText) {
                this.element.setData('bkColor', v);
            }
            else {
                debugger;
            }
        }
        set color(v) {
            if (this.element instanceof text_js_2.CText) {
                this.element.setData('color', v);
            }
            else {
                debugger;
            }
        }
        set text(v) {
            if (this.element instanceof text_js_2.CText) {
                this.element.setData('text', v?.toString());
            }
            else {
                debugger;
            }
        }
        get data() {
            if (this.element instanceof custom_js_1.CCustom) {
                return this.element.getData('data');
            }
            else {
                debugger;
            }
        }
        set image(v) {
            if (this.element instanceof image_js_2.CImage) {
                this.element.setData('imageid', v?.toString());
            }
            else {
                debugger;
            }
        }
        set visible(v) {
            this.element.setData('visible', !!v);
        }
    }
    class ScriptSection {
        report;
        section;
        m_items;
        constructor(report, section) {
            this.section = section;
            this.report = report;
            this.m_items = null;
        }
        print() {
            this.report.print(this);
        }
        item(name) {
            /*
            let found = null;
            this.section.forEach( el => {
                if( el.getName()==name ) {
                    found = el;
                    return true;
                }
            }, true );
    
            if( !found ) {
                console.log( 'element not found', name );
            }
    
    
            return new ScriptElement( found );
            */
            const items = this.items();
            const item = items[name];
            if (!item) {
                console.log('element not found', name);
            }
            return item;
        }
        items() {
            if (!this.m_items) {
                this.m_items = {};
                this.section.forEach(el => {
                    let name = el.getName();
                    if (name) {
                        this.m_items[name] = new ScriptElement(el);
                    }
                }, true);
            }
            return this.m_items;
        }
    }
    /**
     *
     */
    class ScriptReport {
        autoMode = true;
        ctx;
        rsc;
        m_cpage;
        m_report;
        m_sections;
        m_slast; // last printed section
        top = 0;
        bot = 0;
        constructor(report, ctx, rsc) {
            this.m_report = report;
            this.m_slast = null;
            this.m_sections = null;
            this.m_cpage = this.m_report.getChild(0);
            this.ctx = ctx;
            this.rsc = rsc;
        }
        get sections() {
            if (!this.m_sections) {
                const sections = this.m_cpage.getChildren(false, false, true);
                this.m_sections = {};
                sections.forEach(sec => {
                    this.m_sections[sec.getName()] = new ScriptSection(this, sec);
                });
            }
            return this.m_sections;
        }
        translate(x) {
            return x;
        }
        disableAutoMode() {
            this.autoMode = false;
        }
        begin() {
            const rsc = this.rsc;
            rsc.printInfo.rootData.document.pagenum = 1;
            rsc.printInfo.rootData.document.pagecount = 1;
            rsc.printInfo.started = false;
            rsc.printInfo.top = 0;
            rsc.printInfo.limit = 0;
            rsc.printInfo.script = this;
        }
        _startNewPage(hdr_and_ftr = true) {
            const rsc = this.rsc;
            const ctx = this.ctx;
            const page = this.m_cpage;
            const paperSize = (0, paper_js_2.calcPaperSize)(page.getData('size'), this.m_report.getUnits());
            const header = page.getSection('header');
            const footer = page.getSection('footer');
            this._closePage();
            this.top = 0;
            this.bot = paperSize.height;
            this.m_slast = null;
            ctx.startPage(page.getData('size'));
            if (hdr_and_ftr) {
                if (header) {
                    header.fix_top(this.top);
                    header.renderItem(ctx, rsc);
                    this.top += header.getHeight();
                }
                if (footer) {
                    const h = footer.getHeight();
                    this.bot -= h;
                    footer.fix_top(this.bot);
                    footer.renderItem(ctx, rsc);
                }
            }
            rsc.printInfo.rootData.document.pagenum++;
            rsc.printInfo.rootData.document.pagecount++;
            rsc.printInfo.started = true;
            rsc.printInfo.top = this.top;
            rsc.printInfo.limit = this.bot;
        }
        _closePage() {
            const rsc = this.rsc;
            const ctx = this.ctx;
            if (rsc.printInfo.started) {
                ctx.endPage();
                rsc.printInfo.started = false;
            }
        }
        print(section) {
            let sec;
            if (!(section instanceof ScriptSection)) {
                sec = this.m_sections[section];
                if (!sec) {
                    return;
                }
            }
            else {
                sec = section;
            }
            const ss = sec.section;
            const rsc = this.rsc;
            const page = this.m_cpage;
            const rc = page.getRect();
            if (ss.is('doc_head') || ss.is('doc_back')) {
                this._startNewPage(false);
                ss.set_width(rc.width);
                ss.fix_top(this.top);
                ss.renderItem(this.ctx, this.rsc);
                this._closePage();
            }
            else {
                const brk = ss.getBreak();
                const height = ss.getHeight();
                if (brk == 'before' || !rsc.printInfo.started) {
                    this._startNewPage(true);
                }
                else if (this.top + height > rsc.printInfo.limit) {
                    this._startNewPage(true);
                }
                const rcnt = ss.repCount() || 1;
                ss.set_width(rc.width / rcnt);
                if (rcnt > 1) {
                    if (this.m_slast !== ss) {
                        ss.repDispClear();
                    }
                    ss.fix_top(this.top);
                    ss.renderItem(this.ctx, this.rsc);
                    if (ss.repDispNext()) {
                        this.top += ss.getHeight();
                    }
                }
                else {
                    if (this.m_slast && this.m_slast.repCount() > 1) {
                        //if( !this.m_slast.repDispNext() ) {
                        this.top += this.m_slast.getHeight();
                        //}
                        if (this.top + height > rsc.printInfo.limit) {
                            this._startNewPage(true);
                        }
                    }
                    ss.set_width(rc.width);
                    ss.fix_top(this.top);
                    ss.savePos();
                    ss.renderItem(this.ctx, this.rsc);
                    this.top += ss.getHeight();
                    ss.restorePos();
                }
                this.m_slast = ss;
                if (brk == 'after') {
                    this._closePage();
                }
            }
        }
        nextPage(minSpace) {
            if (minSpace) {
                const rsc = this.rsc;
                if (this.top + minSpace > rsc.printInfo.limit) {
                    this._closePage();
                }
            }
            else {
                this._closePage();
            }
        }
        end() {
            const ctx = this.ctx;
            ctx.endPage();
            // reset all section (repeat can change left)
            const sections = this.m_cpage.getChildren(false, false, true);
            sections.forEach(sec => {
                sec.repReset();
            });
        }
    }
    exports.ScriptReport = ScriptReport;
});
/**
* @file report.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report Generator Report Element
**/
define("src/elements/report", ["require", "exports", "src/elements/element", "src/elements/container", "src/tools/json", "lib", "src/elements/script"], function (require, exports, element_js_7, container_js_3, json_js_1, lib_js_6, script_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CReport = void 0;
    class CReport extends container_js_3.CContainer {
        m_plugins;
        m_dataSources;
        m_field_cache;
        /**
         *
         */
        constructor(rp) {
            rp = {
                grid_on: true,
                grid_size: 1,
                version: '1.0.0',
                ...rp
            };
            super(rp, null);
            if (!this.m_data.version || this.m_data.version < '1.0.0') {
                throw new Error("Incorrect file version.");
            }
            this.m_plugins = [];
            this.m_dataSources = [];
        }
        getReport() {
            return this;
        }
        getPage() {
            // ...should never go there
            debugger;
            return null;
        }
        /**
         *
         */
        getResources() {
            return this.m_data.rsrc ?? [];
        }
        /**
         *
         */
        setResources(rsrcs) {
            if (!this.m_data.rsrc) {
                this.m_data.rsrc = rsrcs;
            }
            else {
                this.m_data.rsrc.splice(0, 999999999, ...rsrcs); // replace the content not the object
            }
            this.dirty();
        }
        /**
         *
         */
        renderItem(ctx, rsc) {
            this.m_field_cache = new Map();
            ctx.setUnits(this.m_data.units);
            let doDef = true;
            if (rsc.mode == 'execute') {
                doDef = !this._parseScript(ctx, rsc);
            }
            if (doDef) {
                this.m_children.forEach(pg => {
                    pg?.renderItem(ctx, rsc);
                });
            }
            this.m_field_cache = null;
        }
        // report is always locked
        isSelectable() {
            return true;
        }
        getUnits() {
            return this.m_data.units;
        }
        getHandles() {
            return [];
        }
        getImage(name) {
            const d = this.m_data;
            const img = d?.rsrc.find(rsc => rsc.name == name && rsc.type == 'image');
            return img ? Buffer.from(img.data, 'base64') : null;
        }
        getFont(name) {
            const d = this.m_data;
            const fnt = d?.rsrc.find(rsc => rsc.name == name && rsc.type == 'font');
            return fnt ? Buffer.from(fnt.data, 'base64') : null;
        }
        /**
         *
         */
        getDataSources() {
            const local = (0, json_js_1.parseJSON)(this.getDataSource());
            const documentDataSource = {
                name: 'document',
                description: element_js_7._tr.datasources.document.description,
                type: 'object',
                elements: [
                    {
                        name: 'pagenum',
                        description: element_js_7._tr.datasources.document.pagenum,
                        type: 'number',
                    },
                    {
                        name: 'pagecount',
                        description: element_js_7._tr.datasources.document.pagecount,
                        type: 'number',
                    },
                    {
                        name: 'name',
                        description: element_js_7._tr.datasources.document.name,
                        type: 'string',
                    }
                ]
            };
            const systemDataSource = {
                name: 'system',
                description: element_js_7._tr.datasources.system.description,
                type: 'object',
                elements: [
                    {
                        name: 'today',
                        description: element_js_7._tr.datasources.system.date,
                        type: 'date',
                    }
                ]
            };
            return [...this.m_dataSources, systemDataSource, documentDataSource, local].filter(x => !!x);
        }
        setDataSources(sources) {
            this.m_dataSources = sources;
        }
        setDataSource(source) {
            this.m_data.datasource = source;
            this.dirty();
        }
        getDataSource() {
            return this.m_data.datasource;
        }
        setDataSample(source) {
            this.m_data.datasample = source;
            this.dirty();
        }
        getDataSample() {
            return this.m_data.datasample;
        }
        getScript() {
            return this.m_data.script ?? '';
        }
        /**
         *
         */
        getPlugins() {
            return this.m_plugins;
        }
        setPlugins(plugins) {
            this.m_plugins = plugins;
        }
        getPlugin(name) {
            let els = name.split('.');
            let left = els.shift();
            let right = els.join('.');
            for (const p of this.m_plugins) {
                if (p.name == left) {
                    let els = p.elements;
                    for (const el of els) {
                        if (el.name == right) {
                            return el;
                        }
                    }
                    break;
                }
            }
            return null;
        }
        save() {
            const data = super.save();
            // remove unused elements
            delete data.left;
            delete data.top;
            delete data.width;
            delete data.height;
            delete data.type;
            return data;
        }
        __set(name, v) {
            const old = this.m_data.units;
            super.__set(name, v);
            if (name == 'units') {
                this.forEach(el => {
                    el.unitsChanged(old, v);
                }, true);
            }
        }
        getDefFont() {
            return this.m_data.font ?? 'arial';
        }
        enumFontNames(report = true, page = true) {
            let items = [];
            if (report) {
                items.push({ id: '<document>', text: element_js_7._tr.elements.report.font.as_doc });
            }
            if (page) {
                items.push({ id: '<page>', text: element_js_7._tr.elements.report.font.as_page });
            }
            items.push({ id: 'sans-serif', text: 'sans-serif' });
            items.push({ id: 'monospace', text: 'monospace' });
            this.m_data.rsrc?.forEach(r => {
                if (r.type == 'font') {
                    items.push({ id: r.name, text: r.name });
                }
            });
            return items;
        }
        /**
         *
         */
        resolveText(text, ctx) {
            if (!text) {
                return '';
            }
            // small accelerator
            if (text.indexOf('${') < 0) {
                return text;
            }
            /*
                \$ matches the character $ with index 3610 (2416 or 448) literally (case sensitive)
                \{ matches the character { with index 12310 (7B16 or 1738) literally (case sensitive)
                1st Capturing Group (.+?)
                    . matches any character (except for line terminators)
                    +? matches the previous token between one and unlimited times, as few times as possible, expanding as needed (lazy)
                Negative Lookbehind (?<!\\) -- (Assert that the Regex below does not match)
                    \\ matches the character \ with index 9210 (5C16 or 1348) literally (case sensitive)
                \} matches the character } with index 12510 (7D16 or 1758) literally (case sensitive)
             */
            const re = /\$\{(.+?)(?<!\\)\}/g;
            return text.replace(re, (_, name) => {
                return this.findData(name, ctx.printInfo.rootData, ctx.printInfo.errors);
            });
        }
        /**
         *
         */
        findData(name, root, errors) {
            try {
                //console.log( 'find data:', name );
                let fn = this.m_field_cache.get(name);
                if (!fn) {
                    fn = new Function(...Object.keys(root), 'format', 'return ' + name);
                    this.m_field_cache.set(name, fn);
                }
                else {
                    //console.log( 'cache hit' );
                }
                const formatter = (value, args) => {
                    if (value instanceof Date) {
                        return (0, lib_js_6.formatIntlDate)(value, args);
                    }
                    return value.toString();
                };
                return fn.call(null, ...Object.values(root), formatter);
            }
            catch (e) {
                errors.push(e.message + ' in: ' + name);
                debugger;
                return '@ERR';
            }
            //let questions = {"20": { a: null} };
            //let y = questions["20"].a?.[0] ?? '';
        }
        // :: SCRIPTING ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
        _parseScript(ctx, rsc) {
            const script = this.getScript();
            if (!script) {
                return false;
            }
            script.trim();
            if (script.length == 0) {
                return false;
            }
            const script_rep = new script_js_1.ScriptReport(this, ctx, rsc);
            let func = new Function('report', 'data', 'log', script);
            //try {
            func.call(null /*this*/, script_rep, rsc.printInfo.rootData, console.log);
            //}
            //catch( e ) {
            //	console.error( e );
            //}
            return !script_rep.autoMode;
        }
    }
    exports.CReport = CReport;
});
/**
* @file element.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report generator Element
**/
define("src/elements/element", ["require", "exports", "lib", "src/tools/region", "src/elements/theme", "src/renderers/base_canvas", "src/tools/conversion"], function (require, exports, lib_js_7, region_js_1, theme_js_4, base_canvas_js_1, conversion_js_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.rotateAroundPoint = exports.cleanupData = exports.CElement = exports.isTransp = exports._tr = exports.sprintf = exports.userColors = exports.Theme = exports.Color = exports.Region = exports.PaintCanvas = exports.Point = exports.Size = exports.Rect = void 0;
    Object.defineProperty(exports, "Point", { enumerable: true, get: function () { return lib_js_7.Point; } });
    Object.defineProperty(exports, "Size", { enumerable: true, get: function () { return lib_js_7.Size; } });
    Object.defineProperty(exports, "Rect", { enumerable: true, get: function () { return lib_js_7.Rect; } });
    Object.defineProperty(exports, "Color", { enumerable: true, get: function () { return lib_js_7.Color; } });
    Object.defineProperty(exports, "sprintf", { enumerable: true, get: function () { return lib_js_7.sprintf; } });
    Object.defineProperty(exports, "_tr", { enumerable: true, get: function () { return lib_js_7._tr; } });
    Object.defineProperty(exports, "Region", { enumerable: true, get: function () { return region_js_1.Region; } });
    Object.defineProperty(exports, "Theme", { enumerable: true, get: function () { return theme_js_4.Theme; } });
    Object.defineProperty(exports, "userColors", { enumerable: true, get: function () { return theme_js_4.userColors; } });
    Object.defineProperty(exports, "PaintCanvas", { enumerable: true, get: function () { return base_canvas_js_1.PaintCanvas; } });
    function isTransp(clr) {
        if (!clr)
            return true;
        return !(new lib_js_7.Color(clr).alpha());
    }
    exports.isTransp = isTransp;
    let __guid = Date.now() % 1000000;
    /**
     *
     */
    class CElement {
        extraData;
        zorder;
        m_data;
        m_owner;
        m_report;
        m_page;
        m_selected;
        m_elname;
        m_saveStack;
        /**
         *
         */
        constructor(el, owner) {
            this.m_owner = owner;
            this.extraData = {};
            this.m_selected = false;
            this.m_elname = this.constructor.name.toLocaleLowerCase().substr(1);
            this.m_data = { left: 0, top: 0, width: 0, height: 0, type: this.m_elname, uid: ++__guid, ...el };
        }
        initWithDef() {
        }
        savePos() {
            if (!this.m_saveStack) {
                this.m_saveStack = [];
            }
            ;
            const { left, top, width, height, visible } = this.m_data;
            this.m_saveStack.push({ left, top, width, height, visible });
        }
        restorePos() {
            const r = this.m_saveStack.pop();
            this.m_data.left = r.left;
            this.m_data.top = r.top;
            this.m_data.width = r.width;
            this.m_data.height = r.height;
            this.m_data.visible = r.visible;
        }
        setOwner(owner) {
            if (this.m_owner == owner) {
                return;
            }
            if (this.m_owner) {
                this.m_owner.removeChild(this);
            }
            this.m_owner = owner;
            if (this.m_owner) {
                this.m_owner.addChild(this);
            }
        }
        getReport() {
            if (!this.m_report) {
                let p = this.m_owner;
                while (p && p.getElementName() != 'report') {
                    p = p.m_owner;
                }
                this.m_report = p;
            }
            return this.m_report;
        }
        getPage() {
            if (!this.m_page) {
                let p = this.m_owner;
                while (p && p.getElementName() != 'page') {
                    p = p.m_owner;
                }
                this.m_page = p;
            }
            return this.m_page;
        }
        getName() {
            return this.m_data.name;
        }
        getUID() {
            return this.m_data.uid;
        }
        regenUID() {
            this.m_data.uid = ++__guid;
        }
        /**
         *
         */
        getElementName() {
            return this.m_elname;
        }
        getComputedName() {
            return this.m_elname;
        }
        /**
         * return rect inside parent element
         */
        getRect(normalized = true) {
            const d = this.m_data;
            const r = new lib_js_7.Rect(d.left, d.top, d.width, d.height);
            if (normalized) {
                r.normalize();
            }
            return r;
        }
        /**
         * return rect in page
         */
        getAbsRect(normalized = true) {
            const rc = this.getRect(normalized);
            const off = this.getPageOffset(0, 0, false);
            return rc.moveTo(off.x, off.y);
        }
        getPageOffset(cx, cy, section) {
            return this.m_owner ? this.m_owner.getPageOffset(this.m_data.left + cx, this.m_data.top + cy, section) : { x: cx, y: cy };
        }
        /**
         * locked elements cannot be moved nor sized
         */
        isLocked() {
            return this.m_data.locked;
        }
        /**
         * selectable element are selectable by a click
         */
        isSelectable() {
            return true;
        }
        /**
         *
         */
        isVisible() {
            return this.m_data.visible ?? true;
        }
        /**
         *
         * @param rect
         */
        size(w, h) {
            const d = this.m_data;
            if (d.width == w && d.height == h) {
                return;
            }
            d.width = w;
            d.height = h;
            this.notify('element.refill', { el: this, pos: true });
        }
        notify(msg, params, source) {
            const report = this.getReport();
            report.sendNotification(msg, params, source);
        }
        /**
         * normalize rectangle
         * at the end of a sizing, the rect needs to be normalize
         */
        exitSizeMove(owner) {
            const r = this.getRect(true); // in abs coordinates
            this.setOwner(owner);
            const rp = owner.getRect();
            const d = this.m_data;
            d.left = r.left - rp.left;
            d.top = r.top - rp.top;
            d.width = r.width;
            d.height = r.height;
            this.dirty();
            this.notify('element.refill', { el: this, pos: true });
        }
        enterSizeMove(owner) {
            const r = this.getAbsRect();
            const d = this.m_data;
            d.left = r.left;
            d.top = r.top;
            d.width = r.width;
            d.height = r.height;
            this.setOwner(owner);
        }
        /**
         *
         * @param x
         * @param y
         */
        move(x, y) {
            const d = this.m_data;
            if (x === undefined) {
                x = d.left;
            }
            if (y === undefined) {
                y = d.top;
            }
            if (d.left == x && d.top == y) {
                return;
            }
            d.left = x;
            d.top = y;
            this.notify('element.refill', { el: this, pos: true });
        }
        /**
         *
         * @param name
         * @param factory
         */
        removeFromParent() {
            this.m_owner.removeChild(this);
            this.notify('element.delete', this);
        }
        /**
         *
         */
        unitsChanged(oldUnits, newUnits) {
            const d = this.m_data;
            d.left = (0, conversion_js_6.px2u)((0, conversion_js_6.u2px)(d.left, oldUnits), newUnits);
            d.top = (0, conversion_js_6.px2u)((0, conversion_js_6.u2px)(d.top, oldUnits), newUnits);
            d.width = (0, conversion_js_6.px2u)((0, conversion_js_6.u2px)(d.width, oldUnits), newUnits);
            d.height = (0, conversion_js_6.px2u)((0, conversion_js_6.u2px)(d.height, oldUnits), newUnits);
        }
        /**
         *
         */
        save() {
            this.m_data.type = this.m_elname;
            const data = cleanupData(this.m_data);
            return data;
        }
        /**
         *
         */
        dirty() {
            this.notify('element.dirty', null, this);
        }
        update(params = null) {
            this.notify('element.update', params, this);
        }
        getData(name) {
            //console.assert(name in this.m_data);
            return this.m_data[name];
        }
        setData(name, value) {
            //console.assert(name in this.m_data);
            this.m_data[name] = value;
        }
        renderItem(ctx, rsc) {
        }
        /**
         *
         */
        getHandles(dx, dy) {
            const r = this.getRect(false).moveTo(0, 0).moveBy(dx, dy);
            return CElement.makeHandles(r);
        }
        static makeHandles(r) {
            const handles = [];
            const mx = r.left + r.width / 2;
            const my = r.top + r.height / 2;
            // sorted by order of importance
            handles.push({ code: 'bottom-right', x: r.right, y: r.bottom });
            handles.push({ code: 'top-left', x: r.left, y: r.top });
            handles.push({ code: 'top-right', x: r.right, y: r.top });
            handles.push({ code: 'bottom-left', x: r.left, y: r.bottom });
            handles.push({ code: 'top', x: mx, y: r.top });
            handles.push({ code: 'bottom', x: mx, y: r.bottom });
            handles.push({ code: 'left', x: r.left, y: my });
            handles.push({ code: 'right', x: r.right, y: my });
            return handles;
        }
        /**
         *
         * @param rc
         * @param inclusive
         * @returns
         */
        touches(rc, inclusive) {
            // is this element is locked, it cannot be touches by a dragging selection
            if (this.isLocked()) {
                return false;
            }
            const r = this.getAbsRect();
            if (inclusive) {
                return rc.touches(r);
            }
            else {
                return rc.contains(r);
            }
        }
        /**
         * point is relative to the page
         */
        touchesPt(pt) {
            const rc = this.getAbsRect();
            if (rc.contains(pt)) {
                return this;
            }
            else {
                return null;
            }
        }
        /**
         *
         * @param fill
         * @param size
         * @returns
         */
        getDescriptor(fill = true, size = true, name = true, link = true) {
            return [
                {
                    type: 'title',
                    text: this.getElementName(),
                },
                //{
                //	type: 'panel',
                //	title: 'Script',
                //	style: { height: '6em' },
                //	items: [
                //		{
                //			type: 'text',
                //			title: 'name',
                //			ref: 'name',
                //			style: { width: '100%' }
                //		}
                //	]
                //},
                size ? {
                    type: 'panel',
                    title: lib_js_7._tr.elements.position,
                    columns: 2,
                    style: { height: '8em' },
                    absPos: true,
                    items: [
                        {
                            type: 'num',
                            title: 'X',
                            ref: 'left',
                            labelWidth: 20,
                            style: { position: 'absolute', left: 20, top: 10, width: 90 },
                        },
                        {
                            type: 'num',
                            title: 'Y',
                            ref: 'top',
                            labelWidth: 20,
                            style: { position: 'absolute', left: 120, top: 10, width: 90 }
                        },
                        {
                            type: 'num',
                            title: 'W',
                            ref: 'width',
                            labelWidth: 20,
                            style: { position: 'absolute', left: 20, top: 'calc( 2em + 14px )', width: 90 },
                        },
                        {
                            type: 'num',
                            title: 'H',
                            ref: 'height',
                            labelWidth: 20,
                            style: { position: 'absolute', left: 120, top: 'calc( 2em + 14px )', width: 90 }
                        },
                    ]
                } : null,
                (name || link) ? {
                    type: 'panel',
                    title: lib_js_7._tr.elements.links,
                    items: [
                        name ? {
                            type: 'text',
                            ref: 'name',
                            title: lib_js_7._tr.elements.name,
                            labelWidth: 50,
                            validator: (value) => {
                                value = value.trim();
                                if (value == '') {
                                    return '';
                                }
                                let ok = /^[a-zA-Z_][a-zA-Z0-9_]+$/.test(value);
                                if (!ok) {
                                    throw lib_js_7._tr.elements.bad_name;
                                }
                                return value;
                            }
                        } : null,
                        link ? {
                            type: 'link',
                            ref: 'link',
                            title: lib_js_7._tr.elements.link,
                            labelWidth: 50,
                        } : null
                    ]
                } : null,
                fill ? {
                    type: 'panel',
                    title: lib_js_7._tr.elements.fill,
                    items: [
                        {
                            type: 'color',
                            ref: 'bkColor',
                        }
                    ]
                } : null
            ];
        }
        /**
         *
         * @param sens
         */
        sendBack(sens) {
            this.m_owner.changeZOrder(this, sens);
        }
        /**
         *
         */
        edit() {
        }
        /**
         *
         */
        getContextMenu() {
            return [
                { text: lib_js_7._tr.elements.lock, checked: this.m_data.locked, click: () => this.toggleLock() }
            ];
        }
        /**
         *
         */
        toggleLock() {
            this.m_data.locked = this.m_data.locked !== true;
            this.notify('element.update', null, this);
        }
        toggleVisible() {
            this.m_data.visible = (this.m_data.visible ?? true) !== true;
            this.notify('element.update', null, this);
        }
        /**
         *
         */
        enumColors(to) {
        }
        /**
         *
         */
        selectElement(sel) {
            this.m_selected = sel;
        }
        // :: PROPERTIES ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
        /**
         *
         */
        buildEditors() {
            const els = this.getDescriptor();
            const rep = this.getReport();
            return rep.createEditor(els, this);
        }
        /**
         *
         * @param root
         * @param onlyPos
         * @returns
         */
        fill(root, onlyPos) {
            const rep = this.getReport();
            rep.fillProps(root, this.m_data, onlyPos);
        }
        /**
         * called when editor value change
         */
        _set(editor, inputValue) {
            const rep = this.getReport();
            const { name, value } = rep.parseProp(editor, inputValue);
            this.__set(name, value);
        }
        /**
         *
         * @param name
         * @param v
         * @param undoable
         */
        __set(name, v) {
            // composite names
            let data = this.m_data;
            const path = name.split('.');
            const nseg = path.length;
            if (nseg > 1) {
                for (let i = 0; i < nseg - 1; i++) {
                    const nm = path[i];
                    if (!(nm in data)) {
                        data[nm] = {};
                    }
                    data = data[nm];
                }
                data[path[nseg - 1]] = v;
            }
            else {
                data[name] = v;
            }
            if (nseg == 1 && name) {
                this.notify('element.prop_changed', name, this);
            }
            this.dirty();
            this.update();
        }
    }
    exports.CElement = CElement;
    /**
     * cleanup object data:
     * 	- remove undefined/null members
     *  - round numbers to 3 dec
     *  - remove empty strings
     *  - recurse cleanup array members or objects
     */
    function cleanupData(in_data) {
        const data = {};
        for (let n in in_data) {
            const t = in_data[n];
            if (t === undefined || t === null) {
                continue;
            }
            if ((0, lib_js_7.isNumber)(t)) {
                const v = (0, lib_js_7.roundTo)(t, 3);
                if (v != 0) {
                    data[n] = v;
                }
            }
            else if ((0, lib_js_7.isString)(t)) {
                if (t != '') {
                    data[n] = t;
                }
            }
            else if ((0, lib_js_7.isArray)(t)) {
                if (t.length != 0) {
                    let array = [];
                    t.forEach(x => {
                        array.push(cleanupData(x));
                    });
                    data[n] = array;
                }
            }
            else if ((0, lib_js_7.isLiteralObject)(t)) {
                data[n] = cleanupData(t);
            }
            else {
                data[n] = t;
            }
        }
        return data;
    }
    exports.cleanupData = cleanupData;
    /**
     *
     * @param point
     * @param angleRad
     * @param around
     * @returns
     */
    function rotateAroundPoint(point, angleRad, around) {
        const x = around.x + (point.x - around.x) * Math.cos(angleRad) - (point.y - around.y) * Math.sin(angleRad);
        const y = around.y + (point.x - around.x) * Math.sin(angleRad) + (point.y - around.y) * Math.cos(angleRad);
        return { x, y };
    }
    exports.rotateAroundPoint = rotateAroundPoint;
});
/**
* @file line.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report Generator Line Element
**/
define("src/elements/line", ["require", "exports", "src/tools/conversion", "src/elements/theme", "src/elements/element"], function (require, exports, conversion_js_7, theme_js_5, element_js_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.lineTouchesRect = exports.pointOnLine = exports.CLine = void 0;
    /**
     *
     */
    class CLine extends element_js_8.CElement {
        initWithDef() {
            super.initWithDef();
            Object.assign(this.m_data, {
                line: {
                    width: 1,
                    color: '#000'
                },
            });
        }
        /**
         *
         */
        renderItem(ctx, rsc) {
            const d = this.m_data;
            const r = this.getRect(false);
            let lw = d.line?.width;
            let clr = d.line?.color;
            if (rsc.mode == 'edit' && ((0, element_js_8.isTransp)(clr) || !lw)) {
                lw = (0, conversion_js_7.px2u)(1, ctx.getUnits());
                clr = theme_js_5.Theme.ghost;
            }
            ctx.line(r.left, r.top, r.right, r.bottom, lw, clr);
        }
        touchesPt(pt) {
            const r = this.getAbsRect(false);
            let p = this.m_data;
            let p1 = { x: r.left, y: r.top };
            let p2 = { x: r.left + r.width, y: r.top + r.height };
            let lw = (0, conversion_js_7.pt2u)(p.line?.width ?? 0, this.getReport().getUnits()) / 2;
            return pointOnLine(p1, p2, pt, lw < 1 ? 1 : lw) ? this : null;
        }
        touches(rc, inclusive) {
            if (inclusive) {
                // not normalized
                return lineTouchesRect(this.getAbsRect(false), rc);
            }
            else {
                return rc.contains(this.getAbsRect());
            }
        }
        /**
         * line is never normalized
         */
        getRect(normalized) {
            const d = this.m_data;
            return new element_js_8.Rect(d.left, d.top, d.width, d.height);
        }
        /*_normalize() {
            let p = this.m_data;
    
            if (p.width < 0 && p.height < 0) {
    
                p.left += p.width;
                p.width = -p.width;
    
                p.top += p.height;
                p.height = -p.height;
            }
        }*/
        getHandles(dx, dy) {
            const r = this.getRect(false).moveTo(0, 0).moveBy(dx, dy);
            const handles = [];
            handles.push({ code: 'top-left', x: r.left, y: r.top });
            handles.push({ code: 'bottom-right', x: r.right, y: r.bottom });
            return handles;
        }
        enumColors(to) {
            if (this.m_data.line?.color) {
                to.add(this.m_data.line.color);
            }
        }
    }
    exports.CLine = CLine;
    /**
     *
     * @param start
     * @param end
     * @param pt
     * @param lineWidth
     * @returns
     * taken from
     * https://stackoverflow.com/questions/17692922/check-is-a-point-x-y-is-between-two-points-drawn-on-a-straight-line
     **/
    function pointOnLine(start, end, pt, lineWidth) {
        let minX = Math.min(start.x, end.x) - lineWidth;
        let maxX = Math.max(start.x, end.x) + lineWidth;
        let minY = Math.min(start.y, end.y) - lineWidth;
        let maxY = Math.max(start.y, end.y) + lineWidth;
        //Check C is within the bounds of the line
        if (pt.x >= maxX || pt.x <= minX || pt.y <= minY || pt.y >= maxY) {
            return false;
        }
        // Check for when AB is vertical
        if (start.x == end.x) {
            if (Math.abs(start.x - pt.x) >= lineWidth) {
                return false;
            }
            return true;
        }
        // Check for when AB is horizontal
        if (start.y == end.y) {
            if (Math.abs(start.y - pt.y) >= lineWidth) {
                return false;
            }
            return true;
        }
        // Check istance of the point form the line
        let distFromLine = Math.abs(((end.x - start.x) * (start.y - pt.y)) - ((start.x - pt.x) * (end.y - start.y))) / Math.sqrt((end.x - start.x) * (end.x - start.x) + (end.y - start.y) * (end.y - start.y));
        return distFromLine < lineWidth;
    }
    exports.pointOnLine = pointOnLine;
    /**
     *
     * @param line
     * @param rect
     * @returns
     */
    function lineTouchesRect(line, rect) {
        let x1 = line.left, y1 = line.top, x2 = line.right, y2 = line.bottom;
        rect = rect.normalized();
        let minX = rect.left, minY = rect.top, maxX = rect.right, maxY = rect.bottom;
        // Completely outside.
        if ((x1 <= minX && x2 <= minX) || (y1 <= minY && y2 <= minY) || (x1 >= maxX && x2 >= maxX) || (y1 >= maxY && y2 >= maxY))
            return false;
        var m = (y2 - y1) / (x2 - x1);
        var y = m * (minX - x1) + y1;
        if (y > minY && y < maxY)
            return true;
        y = m * (maxX - x1) + y1;
        if (y > minY && y < maxY)
            return true;
        var x = (minY - y1) / m + x1;
        if (x > minX && x < maxX)
            return true;
        x = (maxY - y1) / m + x1;
        if (x > minX && x < maxX)
            return true;
        return false;
    }
    exports.lineTouchesRect = lineTouchesRect;
});
/**
* @file shape.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report Generator Shape Element
**/
define("src/elements/shape", ["require", "exports", "src/elements/element", "src/elements/theme", "src/tools/conversion"], function (require, exports, element_js_9, theme_js_6, conversion_js_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CEllipse = exports.CRectangle = exports.CShape = void 0;
    class CShape extends element_js_9.CElement {
        constructor(props, owner) {
            super(props, owner);
            this.m_data.line;
        }
        get shape() {
            return this.m_data.shape;
        }
        /**
         *
         */
        getDescriptor() {
            let def = super.getDescriptor();
            return [
                ...def,
                {
                    type: 'panel',
                    title: element_js_9._tr.elements.shape.border,
                    items: [
                        [
                            {
                                type: 'color',
                                ref: 'line.color',
                            },
                            {
                                type: 'num',
                                ref: 'line.width',
                                step: 0.1,
                                width: 90,
                                min: 0,
                                max: 100,
                                default: 0,
                            }
                        ]
                    ]
                },
                {
                    type: 'panel',
                    title: element_js_9._tr.elements.shape.extra,
                    items: [
                        {
                            type: 'num',
                            ref: 'percent',
                            width: 120,
                            title: element_js_9._tr.elements.shape.percent,
                            min: 0,
                            max: 100,
                            default: 0
                        },
                    ]
                },
            ];
        }
        enumColors(to) {
            if (this.m_data.bkColor) {
                to.add(this.m_data.bkColor);
            }
            if (this.m_data.line?.color) {
                to.add(this.m_data.line.color);
            }
        }
    }
    exports.CShape = CShape;
    class CRectangle extends CShape {
        constructor(ps, owner) {
            super(ps, owner);
        }
        initWithDef() {
            super.initWithDef();
            Object.assign(this.m_data, {
                shape: 'rectangle',
                line: {
                    color: '#000',
                    width: 1
                }
            });
        }
        /**
         *
         */
        renderItem(ctx, rsc) {
            const d = this.m_data;
            const r = this.getRect(true);
            const perc = d.percent ?? 100;
            let lw = d.line?.width;
            let clr = d.line?.color;
            if (rsc.mode == 'edit' && ((0, element_js_9.isTransp)(clr) || !lw) && (0, element_js_9.isTransp)(d.bkColor)) {
                lw = (0, conversion_js_8.px2u)(1, ctx.getUnits());
                clr = theme_js_6.Theme.ghost;
            }
            if (this.m_data.name) {
                ctx.beginHotSpot(this.m_data.name);
            }
            ctx.fillRect(r.left, r.top, r.width, r.height, d.bkColor, d.radius);
            ctx.strokeRect(r.left, r.top, r.width, r.height, lw, clr, d.radius);
            if (this.m_data.name) {
                ctx.endHotSpot();
            }
        }
    }
    exports.CRectangle = CRectangle;
    class CEllipse extends CShape {
        constructor(ps, owner) {
            super(ps, owner);
        }
        initWithDef() {
            super.initWithDef();
            Object.assign(this.m_data, {
                shape: 'ellipse',
                line: {
                    color: '#000',
                    width: 1
                }
            });
        }
        renderItem(ctx, rsc) {
            const d = this.m_data;
            const r = this.getRect(true);
            const perc = d.percent ?? 100;
            let lw = d.line?.width;
            let clr = d.line?.color;
            if (rsc.mode == 'edit' && ((0, element_js_9.isTransp)(clr) || !lw) && (0, element_js_9.isTransp)(d.bkColor)) {
                lw = (0, conversion_js_8.px2u)(1, ctx.getUnits());
                clr = theme_js_6.Theme.ghost;
            }
            if (this.m_data.name) {
                ctx.beginHotSpot(this.m_data.name);
            }
            ctx.fillEllipse(r.left, r.top, r.width, r.height, d.bkColor, 0, 360);
            ctx.strokeEllipse(r.left, r.top, r.width, r.height, lw, clr, -90, -90 + (360 * perc / 100));
            if (this.m_data.name) {
                ctx.endHotSpot();
            }
        }
    }
    exports.CEllipse = CEllipse;
});
/**
* @file group.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report generator Group Element
**/
define("src/elements/group", ["require", "exports", "src/elements/container"], function (require, exports, container_js_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CGroup = void 0;
    /**
     *
     */
    class CGroup extends container_js_4.CContainer {
        /**
         *
         */
        renderItem(ctx, rsc) {
            const d = this.m_data;
            const r = this.getRect(true);
            ctx.save();
            ctx.clip(r.left, r.top, r.width, r.height);
            ctx.translate(r.left, r.top);
            this.m_children.forEach(el => {
                el?.renderItem(ctx, rsc);
            });
            ctx.restore();
        }
    }
    exports.CGroup = CGroup;
});
define("src/elements/_mod", ["require", "exports", "src/elements/element", "src/elements/custom", "src/elements/image", "src/elements/line", "src/elements/shape", "src/elements/text", "src/elements/container", "src/elements/group", "src/elements/section", "src/elements/page", "src/elements/theme"], function (require, exports, element_js_10, custom_js_2, image_js_3, line_js_1, shape_js_1, text_js_3, container_js_5, group_js_1, section_js_2, page_js_1, theme_js_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(element_js_10, exports);
    __exportStar(custom_js_2, exports);
    __exportStar(image_js_3, exports);
    __exportStar(line_js_1, exports);
    __exportStar(shape_js_1, exports);
    __exportStar(text_js_3, exports);
    __exportStar(container_js_5, exports);
    __exportStar(group_js_1, exports);
    __exportStar(section_js_2, exports);
    __exportStar(page_js_1, exports);
    __exportStar(theme_js_7, exports);
});
/**
* @file marks.ts
* @description Report Generator Markers
* @author Etienne Cochard
* @copyright (c) 2020-2021 R-libre ingenierie
**/
define("src/elements/mark", ["require", "exports", "src/elements/element", "src/elements/theme"], function (require, exports, element_js_11, theme_js_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.showLabel = exports.paintMarker = exports.getMarkOffset = void 0;
    /**
     *
     * @param type
     * @param pt
     * @returns
     */
    function getMarkOffset(type, pt) {
        if (type == 'hmark') {
            return pt.x;
        }
        else {
            return pt.y;
        }
    }
    exports.getMarkOffset = getMarkOffset;
    /**
     *
     * @param ctx
     * @param type
     * @param pos
     * @param rv
     */
    function paintMarker(ctx, type, pos, rv) {
        let colors = theme_js_8.Theme.markers[type];
        if (!colors) {
            return;
        }
        ctx.save();
        if (type == 'hmark') {
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, 20);
            ctx.strokeStyle = colors.label;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(pos, 20);
            ctx.lineTo(pos, rv.height);
            ctx.setLineDash([2, 2]);
            ctx.lineWidth = 1;
            ctx.strokeStyle = colors.line;
            ctx.stroke();
        }
        else {
            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(20, pos);
            ctx.strokeStyle = colors.label;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(20, pos);
            ctx.lineTo(rv.width, pos);
            ctx.setLineDash([2, 2]);
            ctx.lineWidth = 1;
            ctx.strokeStyle = colors.line;
            ctx.stroke();
        }
        ctx.restore();
    }
    exports.paintMarker = paintMarker;
    function paintLabel(ctx, x, y, horz, color, type) {
        const rw = 6;
        let tw = 6;
        let text = null;
        if (type == 'pbreak') {
            text = 'Page break';
            tw = ctx.calcTextSize(text, true).width;
        }
        ctx.beginPath();
        if (horz) {
            ctx.moveTo(x, y - rw);
            ctx.lineTo(x + tw + 4, y - rw);
            ctx.lineTo(x + tw + 4 + rw, y);
            ctx.lineTo(x + tw + 4, y + rw);
            ctx.lineTo(x, y + rw);
            ctx.closePath();
        }
        else {
            ctx.moveTo(x - rw, y);
            ctx.lineTo(x + rw, y);
            ctx.lineTo(x + rw, y + tw + 4);
            ctx.lineTo(x, y + tw + 4 + rw);
            ctx.lineTo(x - rw, y + tw + 4);
            ctx.closePath();
        }
        ctx.fillStyle = color.line;
        ctx.fill();
        if (text) {
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = color.text;
            ctx.fillText(text, x + 2, y);
        }
        return tw + 6;
    }
    function showLabel(ctx, text, x, y, bkColor, txColor, align = 'tl') {
        let ts = ctx.calcTextSize(text, true);
        let rc = new element_js_11.Rect(0, 0, ts.width, ts.height);
        rc.inflate(4, 4);
        rc.left = x;
        rc.top = y;
        if (align.indexOf('r') >= 0) {
            rc.left -= rc.width;
        }
        else if (align.indexOf('c') >= 0) {
            rc.left -= rc.width / 2;
        }
        if (align.indexOf('b') >= 0) {
            rc.top -= rc.height;
        }
        else if (align.indexOf('m') >= 0) {
            rc.top -= rc.height / 2;
        }
        ctx.save();
        ctx.beginPath();
        ctx.rect(rc.left, rc.top, rc.width, rc.height);
        ctx.fillStyle = bkColor;
        ctx.fill();
        ctx.fillStyle = txColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, rc.left + rc.width / 2, rc.top + rc.height / 2);
        ctx.restore();
    }
    exports.showLabel = showLabel;
});
define("src/tools/make_sample", ["require", "exports", "src/x4mod"], function (require, exports, x4mod_js_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.makeSample = void 0;
    function rand(min, max) {
        return Math.round(Math.random() * (max - min)) + min;
    }
    function randStr(length) {
        let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars[rand(0, chars.length - 1)];
        }
        return result;
    }
    function indent(n) {
        return '\t'.repeat(n);
    }
    function calcSample(type) {
        let sample = '???';
        switch (type) {
            case 'string': {
                sample = '"' + randStr(10) + '"';
                break;
            }
            case 'number': {
                sample = '' + rand(0, 100);
                break;
            }
            case 'date': {
                sample = '"' + (0, x4mod_js_3.formatIntlDate)(new Date(rand(1970, 2021), rand(1, 12), rand(1, 28)), 'Y/M/D') + '"';
                break;
            }
            case 'boolean': {
                sample = Math.random() >= 0.5 ? 'true' : 'false';
                break;
            }
            case 'any': {
                sample = '"any"';
                break;
            }
        }
        return sample;
    }
    function buildTree(source, level, result) {
        if (source.type == 'object') {
            result.push(indent(level) + '"' + source.name + '"' + ': {');
            let members = source.elements;
            members.forEach(itm => {
                buildTree(itm, level + 1, result);
            });
            result.push(indent(level) + '},');
        }
        else if (source.type == 'array') {
            result.push(indent(level) + '"' + source.name + '"' + ': [');
            // simple type
            if ((0, x4mod_js_3.isString)(source.elements)) {
                for (let i = 0; i < 10; i++) {
                    result.push(indent(level + 1) + calcSample(source.elements) + ',');
                }
            }
            else {
                let sub = source.elements;
                if (sub.type == 'object') {
                    let subel = sub.elements;
                    for (let i = 0; i < 10; i++) {
                        result.push(indent(level + 1) + '{');
                        subel?.forEach(itm => {
                            buildTree(itm, level + 2, result);
                        });
                        result.push(indent(level + 1) + '},');
                    }
                }
            }
            result.push(indent(level) + '],');
        }
        else {
            const sample = calcSample(source.type);
            result.push(indent(level) + '"' + source.name + '"' + ': ' + sample + ',');
        }
    }
    function makeSample(data) {
        const lines = [];
        lines.push('{');
        data.forEach(d => {
            buildTree(d, 1, lines);
        });
        lines.push('}');
        return lines.join('\n');
    }
    exports.makeSample = makeSample;
});
/**
* @file display_canvas.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report Generator Display Renderer
**/
define("src/renderers/disp_canvas", ["require", "exports", "src/renderers/base_canvas", "src/tools/conversion", "x4/drawtext", "src/x4mod", "src/x4mod", "src/elements/theme"], function (require, exports, base_canvas_js_2, conversion_js_9, drawtext_js_2, x4mod_js_4, x4mod_js_5, theme_js_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DisplayCanvas = exports.PaintCanvas = void 0;
    Object.defineProperty(exports, "PaintCanvas", { enumerable: true, get: function () { return base_canvas_js_2.PaintCanvas; } });
    class DisplayCanvas extends base_canvas_js_2.PaintCanvas {
        m_source;
        m_ctx;
        m_units;
        m_view;
        m_org;
        m_ostack;
        m_images;
        m_rsrc;
        m_waiting;
        constructor(options) {
            super(options);
            this.m_images = new Map();
            this.m_rsrc = [];
            this.m_units = 'px';
            this.m_ostack = [];
            this.m_view = new base_canvas_js_2.Rect();
            this.m_org = new base_canvas_js_2.Point();
            this.m_source = new x4mod_js_5.EventSource();
            x4mod_js_4.Application.instance().on('message', (e) => {
                if (e.msg == 'rsrc-changed') {
                    if (this.m_images.size) {
                        this.m_images.clear();
                        this._changed();
                    }
                }
            });
        }
        onChange(cb) {
            this.m_source.on('change', cb);
        }
        setResources(rsrc) {
            this.m_rsrc = rsrc;
            this._loadFonts();
        }
        _loadFonts() {
            this.m_rsrc.forEach(r => {
                if (r.type == 'font') {
                    let f = r;
                    let font = new FontFace(f.name, 'url(' + f.data + ')');
                    font.load().then((ss) => {
                        console.log(`font ${r.name} loaded`);
                        let fonts = document.fonts;
                        fonts.add(ss);
                        this._changed();
                    }).catch(e => {
                        console.error(e);
                    });
                }
            });
            /*
            var junction_font = new FontFace('Junction Regular', 'url(fonts/junction-regular.woff)');
            junction_font.load().then(function(loaded_face) {
                document.fonts.add(loaded_face);
                document.body.style.fontFamily = '"Junction Regular", Arial';
            }).catch(function(error) {
                // error occurred
            });
            */
        }
        setUnits(units) {
            switch (units) {
                case 'mm':
                    this.m_unitcvt = conversion_js_9.mm2px;
                    this.m_unitcvt_r = conversion_js_9.px2mm;
                    break;
                case 'in':
                    this.m_unitcvt = conversion_js_9.in2px;
                    this.m_unitcvt_r = conversion_js_9.px2in;
                    break;
                case 'pt':
                    this.m_unitcvt = conversion_js_9.pt2px;
                    this.m_unitcvt_r = conversion_js_9.px2pt;
                    break;
                case 'px':
                    this.m_unitcvt = conversion_js_9.u2u;
                    this.m_unitcvt_r = conversion_js_9.u2u;
                    break;
            }
            this.m_units = units;
        }
        getUnits() {
            return this.m_units;
        }
        startDoc(params) {
            this.m_ctx = params.ctx;
            this.m_view = params.view;
            this.m_org = new base_canvas_js_2.Point(0, 0);
            this.m_ostack = [];
            this.m_waiting = null;
        }
        async endDoc(callback) {
            if (this.m_waiting) {
                Promise.all(this.m_waiting);
            }
            if (callback) {
                callback(null);
            }
        }
        startPage(pageSize) {
        }
        endPage() {
        }
        fillRect(left, top, width, height, color, radius) {
            if (!color || width == 0 || height == 0) {
                return;
            }
            const clr = new base_canvas_js_2.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const cvt = this.m_unitcvt;
            const ctx = this.m_ctx;
            ctx.fillStyle = clr.toHex();
            left = cvt(left);
            top = cvt(top);
            width = cvt(width);
            height = cvt(height);
            if (!radius) {
                ctx.fillRect(left, top, width, height);
            }
            else {
                radius = (0, x4mod_js_4.clamp)(cvt(radius), 0, width / 2);
                radius = (0, x4mod_js_4.clamp)(radius, 0, height / 2);
                ctx.beginPath();
                ctx.roundRect(left, top, width, height, radius);
                ctx.fill();
            }
        }
        strokeRect(left, top, width, height, lwidth, color, radius) {
            if (!color || width == 0 || height == 0 || !lwidth) {
                return;
            }
            const clr = new base_canvas_js_2.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const cvt = this.m_unitcvt;
            const ctx = this.m_ctx;
            ctx.strokeStyle = clr.toHex();
            ctx.lineWidth = (0, conversion_js_9.pt2px)(lwidth);
            left = cvt(left);
            top = cvt(top);
            width = cvt(width);
            height = cvt(height);
            if (!radius) {
                ctx.strokeRect(left, top, width, height);
            }
            else {
                radius = (0, x4mod_js_4.clamp)(cvt(radius), 0, width / 2);
                radius = (0, x4mod_js_4.clamp)(radius, 0, height / 2);
                ctx.beginPath();
                ctx.roundRect(left, top, width, height, radius);
                ctx.stroke();
            }
        }
        drawText(left, top, width, height, text, color, options) {
            if (!color || width == 0 || height == 0 || !text) {
                return;
            }
            const clr = new base_canvas_js_2.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const cvt = this.m_unitcvt;
            const ctx = this.m_ctx;
            let rc = new base_canvas_js_2.Rect(cvt(left), cvt(top), cvt(width), cvt(height));
            if (options.padding) {
                rc.inflate(-(0, conversion_js_9.pt2px)(options.padding)); // in pts
            }
            ctx.fillStyle = clr.toHex();
            (0, drawtext_js_2.drawText)(ctx, text, rc, {
                align: options.align,
                vAlign: options.vAlign,
                fontSize: (0, conversion_js_9.pt2px)(options.fontSize),
                fontWeight: options.fontWeight,
                //fontStyle?: string,
                columns: options.columns ?? 1,
                columnGap: options.columnGap ? (0, conversion_js_9.pt2px)(options.columnGap) : 0,
                fontFamily: options.fontFace,
                lineHeight: options.lineHeight,
                lineBreak: options.lineBreak,
                clip: true,
                rotation: options.rotation,
            });
        }
        measureText(text, width, options) {
            return new base_canvas_js_2.Size(width, 0);
        }
        _loadImage(name, data_url) {
            return new Promise((ok, fail) => {
                let image = new Image();
                image.src = data_url;
                image.onload = () => {
                    this.m_images.set(name, image);
                    ok();
                };
                image.onerror = fail;
            });
        }
        line(x1, y1, x2, y2, lwidth, color) {
            if ((x1 == x2 && y1 == y2) || !lwidth || !color) {
                return;
            }
            const clr = new base_canvas_js_2.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const cvt = this.m_unitcvt;
            const ctx = this.m_ctx;
            ctx.beginPath();
            ctx.moveTo(cvt(x1), cvt(y1));
            ctx.lineTo(cvt(x2), cvt(y2));
            ctx.strokeStyle = clr.toHex();
            ctx.lineWidth = (0, conversion_js_9.pt2px)(lwidth ?? 1);
            ctx.stroke();
        }
        drawImage(name, left, top, width, height, fit) {
            if (!name || !width || !height) {
                return;
            }
            const image = this.m_images.get(name);
            // unknown image ?
            if (!image) {
                // first time
                if (image === undefined) {
                    const img = this.m_rsrc.find(x => x.type == 'image' && x.name == name);
                    if (!img) {
                        // mark it as unknown
                        this.m_images.set(name, null);
                        return;
                    }
                    this._loadImage(name, img.data)
                        .then(() => {
                        this._changed();
                    })
                        .catch(e => {
                        // mark it as error
                        this.m_images.set(name, null);
                        return;
                    });
                    return;
                }
                if (!image) {
                    return;
                }
            }
            const cvt = this.m_unitcvt;
            const ctx = this.m_ctx;
            left = cvt(left);
            top = cvt(top);
            width = cvt(width);
            height = cvt(height);
            const r = (0, base_canvas_js_2.alignRect)(new base_canvas_js_2.Rect(0, 0, image.width, image.height), new base_canvas_js_2.Rect(left, top, width, height), fit);
            ctx.drawImage(image, r.left, r.top, r.width, r.height);
            if (r.width != width || r.height != height) {
                ctx.save();
                ctx.strokeStyle = theme_js_9.Theme.ghost;
                ctx.lineWidth = 1;
                ctx.strokeRect(r.left, r.top, r.width, r.height);
                ctx.restore();
            }
        }
        save() {
            this.m_ctx.save();
            this.m_ostack.push(this.m_org);
        }
        restore() {
            this.m_ctx.restore();
            this.m_org = this.m_ostack.pop();
        }
        rotate(deg) {
            const ctx = this.m_ctx;
            ctx.rotate(deg / 180 * Math.PI);
        }
        translate(dx, dy) {
            const cvt = this.m_unitcvt;
            const ctx = this.m_ctx;
            ctx.translate(cvt(dx), cvt(dy));
            this.m_org.x += dx;
            this.m_org.y += dy;
        }
        /**
         * push() / pop() to clip / unclip
         */
        clip(left, top, width, height) {
            const cvt = this.m_unitcvt;
            const ctx = this.m_ctx;
            ctx.rect(cvt(left), cvt(top), cvt(width), cvt(height));
            ctx.clip();
        }
        fillEllipse(left, top, width, height, color, start, end) {
            if (!color || width == 0 || height == 0) {
                return;
            }
            const clr = new base_canvas_js_2.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const cvt = this.m_unitcvt;
            const ctx = this.m_ctx;
            const r = new base_canvas_js_2.Rect(cvt(left), cvt(top), cvt(width), cvt(height));
            const sa = (0, conversion_js_9.deg2rad)(start) - Math.PI / 2;
            const ea = (0, conversion_js_9.deg2rad)(end) - Math.PI / 2;
            ctx.beginPath();
            ctx.ellipse(r.left + r.width / 2, r.top + r.height / 2, r.width / 2, r.height / 2, 0, sa, ea);
            ctx.fillStyle = clr.toHex();
            ctx.fill();
        }
        strokeEllipse(left, top, width, height, lwidth, color, start, end) {
            if (!color || width == 0 || height == 0 || !lwidth) {
                return;
            }
            const clr = new base_canvas_js_2.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const cvt = this.m_unitcvt;
            const ctx = this.m_ctx;
            const r = new base_canvas_js_2.Rect(cvt(left), cvt(top), cvt(width), cvt(height));
            const sa = (0, conversion_js_9.deg2rad)(start) - Math.PI / 2;
            const ea = (0, conversion_js_9.deg2rad)(end) - Math.PI / 2;
            ctx.beginPath();
            ctx.ellipse(r.left + r.width / 2, r.top + r.height / 2, r.width / 2, r.height / 2, 0, sa, ea);
            ctx.lineWidth = (0, conversion_js_9.pt2px)(lwidth);
            ctx.strokeStyle = clr.toHex();
            ctx.stroke();
        }
        fillArc(cx, cy, radius, color, start, end) {
            if (!color || radius <= 0) {
                return;
            }
            const clr = new base_canvas_js_2.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const cvt = this.m_unitcvt;
            const ctx = this.m_ctx;
            const rad = cvt(radius);
            const sa = (0, conversion_js_9.deg2rad)(start) - Math.PI / 2;
            const ea = (0, conversion_js_9.deg2rad)(end) - Math.PI / 2;
            ctx.beginPath();
            ctx.arc(cvt(cx), cvt(cy), rad, sa, ea);
            ctx.fillStyle = clr.toHex();
            ctx.fill();
        }
        strokeArc(cx, cy, radius, lwidth, color, start, end) {
            if (!color || !lwidth || lwidth < 0 || !radius || radius < 0) {
                return;
            }
            const clr = new base_canvas_js_2.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const cvt = this.m_unitcvt;
            const ctx = this.m_ctx;
            const rad = cvt(radius);
            const sa = (0, conversion_js_9.deg2rad)(start ?? 0) - Math.PI / 2;
            const ea = (0, conversion_js_9.deg2rad)(end ?? 360) - Math.PI / 2;
            ctx.beginPath();
            ctx.arc(cvt(cx), cvt(cy), rad, sa, ea);
            ctx.lineWidth = (0, conversion_js_9.pt2px)(lwidth);
            ctx.strokeStyle = clr.toHex();
            ctx.stroke();
        }
        /**
         *
         */
        getContext() {
            return this.m_ctx;
        }
        /**
         * signal that it should be repainted
         */
        _changed() {
            this.m_source.signal('change', (0, x4mod_js_5.EvChange)(null));
        }
        /**
         *
         */
        isVisible(rc) {
            const rt = rc; //rc.movedBy( this.m_org.x, this.m_org.y );
            if (!rt.touches(this.m_view)) {
                //console.log( 'skip', 'pt:'+Math.round(rt.top), 'pb:'+Math.round(rt.bottom), 'vt:'+Math.round(this.m_view.top),'vb:'+Math.round(this.m_view.bottom) );
                return false;
            }
            return true;
        }
        addFont(name, data) {
            throw 'not imp';
        }
        addImage(name, data) {
            throw 'not imp';
        }
        drawSVG(svg, left, top, width, height, fit) {
            const key = 'svg:' + (0, x4mod_js_4.crc32)(svg).toString(16);
            const img = this.m_images?.get(key);
            if (img === null) {
                // error
            }
            else if (img !== undefined) {
                // cached
                this.drawImage(key, left, top, width, height, fit);
            }
            else {
                const txform = this.m_ctx.getTransform();
                if (!this.m_waiting) {
                    this.m_waiting = [];
                }
                if (!this.m_images) {
                    this.m_images = new Map();
                }
                const prom = new Promise((ok, fail) => {
                    const img = new Image();
                    img.onload = () => {
                        this.m_images.set(key, img);
                        this.m_ctx.save();
                        this.m_ctx.setTransform(txform);
                        this.drawImage(key, left, top, width, height, fit);
                        this.m_ctx.restore();
                        ok();
                    };
                    img.onerror = (e) => {
                        console.log(e);
                        this.m_images.set(key, null);
                        ok();
                    };
                    img.src = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
                });
                this.m_waiting.push(prom);
            }
        }
        binFonts() {
            return true;
        }
    }
    exports.DisplayCanvas = DisplayCanvas;
});
/**
* @file explorer.ts
* @author Etienne Cochard
* @copyright (c) 2020-2021 R-libre ingenierie
* @licence
**/
define("src/tools/explorer", ["require", "exports", "x4/hosts/electron", "src/x4mod", "src/tools"], function (require, exports, electron_js_3, x4mod_js_6, tools_js_28) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExplorerBox = void 0;
    class ExplorerBox extends x4mod_js_6.Dialog {
        static show(xprops) {
            let list;
            let im_preview;
            let fn_preview;
            let btdel;
            // ask the currently edited report from it's resources
            const rsrc = [...xprops.report.getResources()]; // make a copy
            // only use requested type
            const fill = () => {
                const elements = rsrc.filter(x => x.type == xprops.type);
                return elements.map(x => { return { id: x.name, text: x.name }; });
            };
            const preview = (name) => {
                if (xprops.type == 'image') {
                    const img = rsrc.find(x => x.type == 'image' && x.name == name);
                    if (img) {
                        im_preview.setImage(img?.data);
                    }
                }
                else {
                }
            };
            const addImage = () => {
                (0, tools_js_28.openFile)({ "images": ['gif', 'jpg', 'png', 'svg'] }, (filenames) => {
                    // add it to the resulting image list
                    for (let fname of filenames) {
                        const name = electron_js_3.path.basename(fname);
                        const ext = electron_js_3.path.extname(fname).substr(1);
                        electron_js_3.fs.readFile(fname, (err, data) => {
                            if (err) {
                                x4mod_js_6.MessageBox.show(err);
                                return;
                            }
                            else {
                                let img_data;
                                if (ext == 'svg') {
                                    img_data = 'data:image/svg+xml;base64,' + data.toString('base64');
                                }
                                else {
                                    img_data = 'data:image/' + ext + ';base64,' + data.toString('base64');
                                }
                                let img = {
                                    type: 'image',
                                    name,
                                    data: img_data
                                };
                                rsrc.push(img);
                                list.append({ id: name, text: name });
                                list.selection = name;
                                preview(name);
                            }
                        });
                    }
                }, true);
            };
            const addFont = () => {
                (0, tools_js_28.openFile)({ "fonts": ['ttf', 'otf'] }, (filenames) => {
                    // add it to the resulting image list
                    const name = electron_js_3.path.basename(filenames[0]);
                    const ext = electron_js_3.path.extname(filenames[0]).substr(1);
                    electron_js_3.fs.readFile(filenames[0], (err, data) => {
                        if (err) {
                            x4mod_js_6.MessageBox.show(err);
                            return;
                        }
                        else {
                            let fontName = electron_js_3.path.parse(name).name;
                            const fnt = {
                                type: 'font',
                                name: fontName,
                                data: 'data:font/' + ext + ';base64,' + data.toString('base64'),
                                path: null,
                            };
                            rsrc.push(fnt);
                            list.append({ id: name, text: name });
                            list.selection = name;
                            fn_preview.setStyleValue('font-family', name);
                        }
                    });
                });
            };
            const delResource = (name) => {
                const index = rsrc.findIndex(x => x.type == xprops.type && x.name == name);
                if (index >= 0) {
                    rsrc.splice(index, 1);
                    list.items = fill();
                }
            };
            if (xprops.type == 'image') {
                im_preview = new x4mod_js_6.Image({
                    flex: 1,
                    cls: 'preview',
                    src: null,
                    alignment: 'contain',
                    style: { padding: 16 }
                });
            }
            else {
                fn_preview = new x4mod_js_6.Label({
                    flex: 1,
                    cls: 'preview',
                    text: 'the brown fox jumps over the lazy dog',
                });
            }
            let dialog = new x4mod_js_6.Dialog({
                title: xprops.type == 'image' ? 'Images' : 'Fonts',
                icon: 0xf03e,
                height: '50%',
                width: '50%',
                movable: true,
                sizable: true,
                closable: true,
                content: [
                    new x4mod_js_6.HLayout({
                        flex: 1,
                        content: [
                            list = new x4mod_js_6.ListView({
                                width: 200,
                                populate: fill,
                                selectionChange: (ev) => {
                                    if (ev.selection) {
                                        const sel = ev.selection;
                                        preview(sel.id);
                                        btdel.enable(true);
                                        dialog.form.getButton('ok').enable(true);
                                    }
                                    else {
                                        btdel.enable(false);
                                        dialog.form.getButton('ok').enable(false);
                                    }
                                }
                            }),
                            new x4mod_js_6.Separator({ orientation: 'horizontal', sizing: 'before' }),
                            im_preview,
                            fn_preview
                        ]
                    }),
                    //new Label( { text: 'Taille de l\'image: 0' }),
                ],
                buttons: [
                    new x4mod_js_6.Button({ text: x4mod_js_6._tr.explorer.add, click: xprops.type == 'image' ? addImage : addFont }),
                    btdel = new x4mod_js_6.Button({ enabled: false, text: x4mod_js_6._tr.explorer.del, click: () => delResource(list.selection.id) }),
                    new x4mod_js_6.Flex({}),
                    'ok',
                    'cancel'
                ],
            });
            if (xprops.callback) {
                dialog.on('btnClick', (btn) => {
                    if (btn.button == 'ok') {
                        xprops.report.setResources(rsrc);
                        xprops.callback(list.selection?.id);
                    }
                });
            }
            dialog.form.getButton('ok').enable(false); // need a selection
            dialog.show(true);
        }
    }
    exports.ExplorerBox = ExplorerBox;
});
/**
* @file esection.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
**/
define("src/editor/esection", ["require", "exports", "src/elements/element", "src/elements/section", "src/elements/theme", "src/tools/conversion", "src/elements/mark"], function (require, exports, element_js_12, section_js_3, theme_js_10, conversion_js_10, mark_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ESection = void 0;
    class ESection extends section_js_3.CSection {
        renderItem(ctx, rsc) {
            const units = this.getReport().getUnits();
            const rc = this.getRect();
            const t = (0, conversion_js_10.u2px)(rc.top, units);
            const b = (0, conversion_js_10.u2px)(rc.bottom, units);
            const l = (0, conversion_js_10.u2px)(rc.left, units) - 7;
            const r = (0, conversion_js_10.u2px)(rc.right, units);
            if (rsc.mode == 'edit') {
                const rep = this.m_data.repeat ?? 1;
                if (rep > 1) {
                    const dc = ctx.getContext();
                    dc.save();
                    if (ESection.hatch == null) {
                        const pcanvas = document.createElement('canvas');
                        const pctx = pcanvas.getContext('2d');
                        // Give the pattern a width and height of 50
                        pcanvas.width = 20;
                        pcanvas.height = 20;
                        // Give the pattern a background color and draw an arc
                        pctx.fillStyle = theme_js_10.Theme.sections.header.hollow;
                        pctx.fillRect(0, 0, 20, 20);
                        pctx.strokeStyle = theme_js_10.Theme.ghost;
                        pctx.beginPath();
                        pctx.moveTo(0, pcanvas.height);
                        pctx.lineTo(pcanvas.width, 0);
                        pctx.lineWidth = 1;
                        pctx.stroke();
                        ESection.hatch = dc.createPattern(pcanvas, 'repeat');
                    }
                    dc.fillStyle = ESection.hatch;
                    const rw = (r - l) / rep;
                    dc.beginPath();
                    for (let x = l, n = 0; x < r; x += rw, n++) {
                        dc.moveTo(x, t);
                        dc.lineTo(x, b);
                        if (n > 0) {
                            dc.fillRect(x + 2, t + 2, rw - 4, b - t - 4);
                        }
                    }
                    dc.strokeStyle = theme_js_10.Theme.ghost;
                    dc.setLineDash([2, 2]);
                    dc.stroke();
                    dc.restore();
                }
            }
            super.renderItem(ctx, rsc);
            if (rsc.mode == 'edit') {
                const dc = ctx.getContext();
                dc.save();
                let color = this.m_selected ? theme_js_10.Theme.selection.label.back : theme_js_10.Theme.sections.header.back;
                let tcolor = this.m_selected ? theme_js_10.Theme.selection.label.text : theme_js_10.Theme.sections.header.text;
                let name = this.m_data.name ?? this.getComputedName();
                (0, mark_js_1.showLabel)(dc, name, l, t, color, tcolor, 'tr');
                dc.strokeStyle = color;
                dc.beginPath();
                dc.moveTo(l, t);
                dc.lineTo(l, b - 4);
                dc.stroke();
                dc.strokeStyle = theme_js_10.Theme.ghost;
                dc.setLineDash([2, 2]);
                dc.beginPath();
                dc.moveTo(l + 8, b);
                dc.lineTo(r - 4, b);
                dc.stroke();
                dc.restore();
            }
        }
        /**
         *
         */
        getDescriptor() {
            const def = super.getDescriptor(false, false, true);
            return [
                ...def,
                {
                    type: 'panel',
                    title: element_js_12._tr.elements.properties,
                    flex: 1,
                    items: [
                        {
                            type: 'num',
                            ref: 'repeat',
                            labelWidth: 80,
                            title: element_js_12._tr.elements.section.repeat,
                            min: 1,
                            max: 12
                        },
                        {
                            type: 'choice',
                            ref: 'break',
                            min: 0,
                            max: 20,
                            title: element_js_12._tr.elements.section.break,
                            labelWidth: 80,
                            items: [
                                { id: '', text: element_js_12._tr.elements.section.break_none },
                                { id: 'before', text: element_js_12._tr.elements.section.break_before },
                                { id: 'after', text: element_js_12._tr.elements.section.break_after },
                            ],
                            default: ''
                        },
                        {
                            type: 'bool',
                            ref: 'splittable',
                            text: element_js_12._tr.elements.section.split,
                        },
                    ]
                },
            ];
        }
        static hatch;
    }
    exports.ESection = ESection;
});
/**
* @file epage.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
**/
define("src/editor/epage", ["require", "exports", "src/elements/element", "src/elements/_mod", "src/tools/conversion", "src/elements/mark"], function (require, exports, element_js_13, _mod_js_1, conversion_js_11, mark_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EPage = void 0;
    class EPage extends _mod_js_1.CPage {
        /**
         * specific version for display
         */
        renderItem(ctx, rsc) {
            let rc = this.getRect();
            if (!ctx.isVisible(rc)) {
                return;
            }
            ctx.startPage(rc.size);
            ctx.fillRect(rc.left, rc.top, rc.width, rc.height, 'white', 0);
            let pageh = this.getMinHeight();
            let top = 0;
            let bot = rc.bottom;
            ctx.save();
            ctx.translate(rc.left, rc.top);
            this.m_children.forEach(el => {
                el.renderItem(ctx, rsc);
                // not always a section:
                //	during size or move, elements belongs to page
                if (el instanceof _mod_js_1.CSection) {
                    const h = el.getHeight();
                    if (el.is('header') || el.is('footer')) {
                        top += h;
                        pageh -= h;
                    }
                }
            });
            ctx.restore();
            const dc = ctx.getContext();
            dc.save();
            const units = this.getReport().getUnits();
            const l = (0, conversion_js_11.u2px)(rc.left, units);
            const r = (0, conversion_js_11.u2px)(rc.right, units);
            const breaks = this.computePageBreaks().map(x => (0, conversion_js_11.u2px)(x, units));
            dc.strokeStyle = element_js_13.Theme.ghost;
            breaks.forEach((y, pno) => {
                dc.beginPath();
                dc.moveTo(l, y);
                dc.lineTo(r, y);
                dc.stroke();
                (0, mark_js_2.showLabel)(dc, (0, element_js_13.sprintf)(element_js_13._tr.elements.page.pageno, pno + 1), r + 4, y, element_js_13.Theme.page.header.background, element_js_13.Theme.page.header.text, 'bl');
            });
            dc.restore();
            ctx.endPage();
        }
    }
    exports.EPage = EPage;
});
/**
* @file eimage.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report Generator Image Element
**/
define("src/editor/eimage", ["require", "exports", "src/tools/conversion", "src/elements/element", "src/elements/image", "src/elements/theme", "src/tools/explorer", "src/renderers/disp_canvas"], function (require, exports, conversion_js_12, element_js_14, image_js_4, theme_js_11, explorer_js_1, disp_canvas_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EImage = void 0;
    /**
     *
     */
    class EImage extends image_js_4.CImage {
        /**
         *
         */
        renderItem(ctx) {
            const d = this.m_data;
            const r = this.getRect();
            if (d.imageid) {
                ctx.drawImage(d.imageid, r.left, r.top, r.width, r.height, d.fit);
            }
            if (ctx instanceof disp_canvas_js_1.DisplayCanvas) {
                ctx.strokeRect(r.left, r.top, r.width, r.height, (0, conversion_js_12.px2u)(1, ctx.getUnits()), theme_js_11.Theme.ghost, 0);
            }
        }
        edit() {
            this._selectImage();
        }
        /**
         *
         */
        getDescriptor() {
            let def = super.getDescriptor(false, true);
            return [
                ...def,
                {
                    type: 'panel',
                    title: 'Image',
                    items: [
                        {
                            type: 'button',
                            text: element_js_14._tr.elements.image.click_to_choose,
                            click: () => {
                                this._selectImage();
                            }
                        },
                        [{
                                type: 'choice',
                                title: element_js_14._tr.elements.image.fit,
                                ref: 'fit',
                                labelWidth: 80,
                                items: [
                                    { id: 'fill', text: element_js_14._tr.elements.image.fill },
                                    { id: 'cover', text: element_js_14._tr.elements.image.cover },
                                ],
                                default: 'fill'
                            }]
                    ]
                },
            ];
        }
        _selectImage() {
            explorer_js_1.ExplorerBox.show({
                type: 'image',
                report: this.getReport(),
                readOnly: false,
                callback: (name) => {
                    this.__set('imageid', name);
                }
            });
        }
    }
    exports.EImage = EImage;
});
define("src/tools/monaco_editor", ["require", "exports", "src/elements/section", "src/x4mod", "src/elements/text"], function (require, exports, section_js_4, x4mod_js_7, text_js_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ScriptReportEditor = exports.MonacoEditor = void 0;
    class MonacoEditor extends x4mod_js_7.Component {
        m_editor;
        m_lkChange;
        constructor(props) {
            super(props);
            this.m_lkChange = false;
            this.setAttributes({
                'wants-tab': true,
                'wants-enter': true
            });
        }
        componentCreated() {
            this._checkMonaco();
        }
        _checkMonaco() {
            if (!('monaco' in window)) {
                //todo: limit in time
                setTimeout(() => this._checkMonaco(), 100);
            }
            else {
                this._monacoReady();
            }
        }
        _monacoReady() {
            monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                validate: false,
                allowComments: true,
                schemaValidation: 'ignore',
                noSemanticValidation: true,
                noSyntaxValidation: false
            });
            monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                target: monaco.languages.typescript.ScriptTarget.ES6,
                noLib: true,
                allowNonTsExtensions: true,
                allowJs: true,
                checkJs: true
            });
            let editor = monaco.editor.create(this.dom, {
                value: this.m_props.source ?? '',
                language: this.m_props.language ?? 'javascript',
                automaticLayout: true, // the important part
            });
            editor.getModel().onDidChangeContent((ev) => {
                if (!this.m_lkChange) {
                    this._changed();
                }
            });
            this.m_editor = editor;
        }
        _changed() {
            this.emit('change', (0, x4mod_js_7.EvChange)(this.source));
        }
        get source() {
            return this.m_editor.getValue();
        }
        set source(script) {
            this.m_lkChange = true;
            this.m_editor.setValue(script ?? '');
            this.m_lkChange = false;
        }
        insertText(text) {
            if (this.m_editor) {
                this.m_editor.executeEdits("", [{ range: this.m_editor.getSelection(), text }]);
            }
        }
        focus() {
            this.m_editor?.focus();
        }
    }
    exports.MonacoEditor = MonacoEditor;
    class ScriptReportEditor extends MonacoEditor {
        _monacoReady() {
            super._monacoReady();
            this.source = this.m_props.report.getScript();
            this.updateCompletions();
        }
        set report(report) {
            this.m_props.report = report;
            this.updateCompletions();
            this.source = report.getScript();
        }
        _changed() {
            this.m_props.report.setScript(this.source);
            super._changed();
        }
        /**
         *
         */
        _genIndent(level) {
            return '\t\t\t\t\t\t\t\t\t'.substr(0, level);
        }
        _genElement(element, level) {
            let indent = this._genIndent(level);
            let names = [];
            let classes = [];
            element.forEach(el => {
                const name = el.getName();
                if (name) {
                    let type;
                    if (el instanceof section_js_4.CSection) {
                        type = 'Section';
                        let [childs] = this._genElement(el, level);
                        if (childs != '') {
                            type = 'Section_' + name;
                            let cl = `
${indent}class ${type} extends Section {
${childs}
${indent}}`;
                            classes.push(cl);
                        }
                    }
                    else {
                        type = 'Element';
                        if (el instanceof text_js_4.CText) {
                            type = 'TextElement';
                        }
                    }
                    let source = `${this._genIndent(level + 2)}${name}: ${type};`;
                    names.push(source);
                }
            }, false);
            return [names.join('\n'), classes.join('\n')];
        }
        /**
         *
         */
        _genInterface(els, level) {
            let code = '';
            els.forEach(e => {
                code += this._genDataSource(e, level + 1) + '\n';
            });
            return code;
        }
        /**
         *
         */
        _genDataSource(data, level, prepend) {
            let indent = this._genIndent(level);
            let els = indent + (prepend ?? '') + data.name;
            if (!prepend) {
                els += ": ";
            }
            if (data.type == 'object') {
                els += `{\n`;
                if (data.elements) {
                    els += this._genInterface(data.elements, level + 1);
                }
                els += `${indent}}\n`;
            }
            else if (data.type == 'array') {
                if (!data.elements) {
                    els = indent + `type __${data.name} = any`;
                }
                else if ((0, x4mod_js_7.isString)(data.elements)) {
                    els += data.elements;
                }
                else {
                    let sub = data.elements;
                    els += ' {\n';
                    if (sub && sub.elements) {
                        els += this._genInterface(sub.elements, level + 1);
                    }
                    els += indent + '}';
                }
                els += '[];';
            }
            else {
                switch (data.type) {
                    case 'string':
                    case 'number':
                    case 'boolean': {
                        els += data.type;
                        break;
                    }
                    case 'date': {
                        els += 'Date';
                        break;
                    }
                    default: {
                        els += 'any';
                    }
                }
            }
            return els;
        }
        updateCompletions() {
            let report = this.m_props.report;
            let page = report.getCurPage();
            let [sections, classes] = this._genElement(page, 2);
            let sources = report.getDataSources();
            let dsources = sources.map(s => {
                return this._genDataSource(s, 1, 'interface __');
            }).join('\n');
            let dnames = sources.map(s => `			${s.name}: _.__${s.name};`).join('\n');
            const source = `
	declare class Element {
	}

	declare class TextElement extends Element {
		/**
		 * text color.
		 * @example 'green'
		 */
		bkColor: string;

		/**
		 * text color.
		 * @example 'rgba(125,16,18,0.6)'
		 */
		color: string;

		/**
		 * text to display
		 */

		text: string;
	}

	declare class Section extends Element {
		/**
		 * return the item with given name or null
		 */

		item( name: string ): Element;

		/**
		 * print the section
		 */

		print( ): void;

		/**
		 *
		 */

		items: Record<string,Element>;
	}

${classes}

	declare class Report {
		sections: { 
${sections}
		}

		/**
		 * disable automatic mode
		 * 
		 * call this prior to handle by hand section printing
		 */

		disableAutoMode( );

		/**
		 * start printing
		 */

		begin( ): void;

		/**
		 * print the given section
		 * 
		 * you can also use Section.print
		 */

		print( section: string | Section ): void;

		/**
		 * close the current page and start a new one if the requiredSpace 
		 * set requiredSpace to 0 to force next page
		 */

		nextPage( requiredSpace: number  ): void;

		/**
		 * stop printing.
		 * elements with retro actions (like pagecount) are updated
		 */

		end( ): void;

		/**
		 * custom translation function
		 * @example
		 * // you can change the behavour by setting a new function
		 * report.translate = ( x ) => {
		 * 	return "my_transalted_text:"+x;
		 * }
		 */

		translate( x: string ): string;
	}

${dsources}

	interface Data {
${dnames}
	}

	declare function log( ...args );
	declare const data: Data;
	declare const report: Report;		
`;
            const libUri = 'ts:filename/report.d.ts';
            monaco.languages.typescript.javascriptDefaults.addExtraLib(source, libUri);
            //monaco.languages.typescript.javascriptDefaults.setExtraLibs( [ { content: source, filePath: libUri }] );
            //monaco.editor.createModel( source, 'typescript', monaco.Uri.parse(libUri));
            //console.log( source )	
        }
    }
    exports.ScriptReportEditor = ScriptReportEditor;
});
define("src/tools/text_edit", ["require", "exports", "src/x4mod", "src/tools/monaco_editor"], function (require, exports, x4mod_js_8, monaco_editor_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.selectField = exports.showTextEditor = exports.showScriptEditor = void 0;
    /**
     *
     */
    function showScriptEditor(script, callback, report) {
        let edit;
        let dataSource = report.getDataSources();
        let fld = dataSource ? new x4mod_js_8.Button({ text: x4mod_js_8._tr.textedit.field, tooltip: x4mod_js_8._tr.textedit.field_tip, click: () => {
                selectField(dataSource, (value) => {
                    edit.insertText(value);
                    edit.focus();
                });
            } }) : undefined;
        let dlg = new x4mod_js_8.Dialog({
            title: x4mod_js_8._tr.textedit.script,
            sizable: true,
            movable: true,
            closable: true,
            width: '75%',
            height: '75%',
            content: [
                edit = new monaco_editor_js_1.MonacoEditor({
                    ref: 'scriptVal',
                    flex: 1,
                    cls: 'line',
                    language: 'javascript',
                    report
                }),
            ],
            buttons: [fld, new x4mod_js_8.Flex(), 'ok', 'cancel'],
            btnClick: (ev) => {
                if (ev.button == 'ok') {
                    callback(edit.source);
                }
            }
        });
        dlg.show();
    }
    exports.showScriptEditor = showScriptEditor;
    /**
     *
     */
    function showTextEditor(text, callback, dataSource) {
        let edit;
        let ico = new x4mod_js_8.Button({ text: x4mod_js_8._tr.textedit.icon, tooltip: x4mod_js_8._tr.textedit.icon_tip, click: () => {
                x4mod_js_8.PromptDialogBox.show(x4mod_js_8._tr.textedit.prompt, (v) => {
                    let vv = parseInt(v, 16);
                    if (!isNaN(vv)) {
                        edit.insertText(String.fromCharCode(vv));
                    }
                });
            } });
        let fld = dataSource ? new x4mod_js_8.Button({ text: x4mod_js_8._tr.textedit.field, tooltip: x4mod_js_8._tr.textedit.field_tip, click: () => {
                selectField(dataSource, (value) => {
                    edit.insertText('${' + value + '}');
                });
            } }) : undefined;
        let dlg = new x4mod_js_8.Dialog({
            title: x4mod_js_8._tr.textedit.title,
            sizable: true,
            movable: true,
            closable: true,
            icon: 'resources/img/btn-text.svg',
            width: '50%',
            height: '75%',
            content: [
                edit = new x4mod_js_8.TextArea({
                    text,
                    flex: 1,
                })
            ],
            buttons: [ico, fld, new x4mod_js_8.Flex(), 'ok', 'cancel'],
            btnClick: (ev) => {
                if (ev.button == 'ok') {
                    callback(edit.value);
                }
            }
        });
        dlg.show();
    }
    exports.showTextEditor = showTextEditor;
    /**
     *
     */
    function selectField(data, callback) {
        let tree;
        let desc;
        let showSel = (ev) => {
            const node = ev.selection;
            desc.text = (0, x4mod_js_8.html) `<b>${node.data}</b>: ${node.id}`;
        };
        let dlg = new x4mod_js_8.Dialog({
            title: x4mod_js_8._tr.textedit.field_sel,
            cls: 'field-chooser',
            sizable: true,
            movable: true,
            closable: true,
            icon: 'resources/img/edit.svg',
            width: '500',
            height: '520',
            content: [
                tree = new x4mod_js_8.TreeView({
                    root: null,
                    flex: 1,
                    sort: false,
                    selectionchange: showSel,
                    dblclick: (ev) => {
                        callback(tree.selection);
                        dlg.close();
                    }
                }),
                desc = new x4mod_js_8.Label({
                    text: '',
                })
            ],
            buttons: ['ok', 'cancel'],
            btnClick: (ev) => {
                if (ev.button == 'ok') {
                    callback(tree.selection);
                }
            }
        });
        let calcIcon = (type) => {
            switch (type) {
                case 'string': return 'resources/img/input-text.svg';
                case 'number': return 'resources/img/input-numeric.svg';
                case 'date': return 'resources/img/calendar.svg';
                case 'any': return 'resources/img/object.svg';
                case 'object': return 'resources/img/object.svg';
                case 'array': return 'resources/img/array.svg';
            }
            return undefined;
        };
        let buildTree = (source, path) => {
            let cpath = path;
            if (cpath.length) {
                cpath += '.';
            }
            cpath += source.name;
            if (source.type == 'array') {
                cpath += '[x]';
            }
            let desc = source.description ?? ' ';
            let type = '';
            let items;
            if (source.type == 'object') {
                items = [];
                if (source.elements) {
                    let members = source.elements;
                    members.forEach(itm => {
                        items.push(buildTree(itm, cpath));
                    });
                }
                type = 'object';
            }
            else if (source.type == 'array') {
                type = 'array';
                // simple type
                if ((0, x4mod_js_8.isString)(source.elements)) {
                    type = source.elements + '[]';
                }
                else {
                    let sub = source.elements;
                    if (sub && sub.type == 'object') {
                        type = sub.name + '[]';
                        let subel = sub.elements;
                        items = [];
                        subel?.forEach(itm => {
                            items.push(buildTree(itm, cpath));
                        });
                    }
                }
            }
            else {
                type = source.type;
            }
            let root = {
                id: cpath,
                text: (0, x4mod_js_8.html) `<b>${source.name}</b> ${desc}`,
                icon: calcIcon(source.type),
                data: type,
                children: items,
                open: items ? true : false,
                cls: path == '' ? 'main' : undefined
            };
            return root;
        };
        let items = [];
        for (const d of data) {
            items.push(buildTree(d, ''));
        }
        tree.root = {
            id: 1,
            text: '',
            children: items,
        };
        dlg.show();
    }
    exports.selectField = selectField;
});
/**
* @file text.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report Generator Text Element
**/
define("src/editor/etext", ["require", "exports", "src/elements/element", "src/elements/text", "src/tools/text_edit"], function (require, exports, element_js_15, text_js_5, text_edit_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EText = void 0;
    /**
     * !remember to update this.m_propsnames
     */
    class EText extends text_js_5.CText {
        /**
         *
         */
        getDescriptor() {
            let def = super.getDescriptor();
            const report = this.getReport();
            return [
                ...def,
                {
                    type: 'panel',
                    title: element_js_15._tr.elements.text.border,
                    items: [
                        [
                            {
                                type: 'color',
                                ref: 'border.color',
                            },
                            {
                                type: 'num',
                                ref: 'border.width',
                                width: 90,
                                default: 1,
                                min: 0,
                                max: 100,
                                step: 0.1,
                            }
                        ],
                        {
                            type: 'num',
                            ref: 'radius',
                            title: element_js_15._tr.elements.text.radius,
                            labelWidth: 74,
                            width: 90,
                            min: 0,
                            max: 10,
                            step: 0.1,
                        }
                    ]
                },
                {
                    type: 'panel',
                    title: element_js_15._tr.elements.text.font,
                    items: [
                        {
                            type: 'choice',
                            ref: 'font.family',
                            items: report.enumFontNames(),
                            default: '<page>'
                        },
                        [
                            {
                                type: 'choice',
                                ref: 'font.weight',
                                items: [
                                    { id: 'light', text: 'light' },
                                    { id: 'normal', text: 'normal' },
                                    { id: 'bold', text: 'bold' },
                                ],
                                default: 'normal'
                            },
                            {
                                type: 'num',
                                ref: 'font.size',
                                width: 90,
                                min: 6,
                                max: 100,
                                default: '12'
                            }
                        ],
                        {
                            type: 'color',
                            ref: 'color',
                        },
                    ]
                },
                {
                    type: 'panel',
                    title: element_js_15._tr.elements.text.alignment,
                    items: [
                        [
                            {
                                type: 'choice',
                                ref: 'align',
                                cls: 'col',
                                items: [
                                    { id: 'left', text: 'left' },
                                    { id: 'center', text: 'center' },
                                    { id: 'right', text: 'right' },
                                    { id: 'justify', text: 'justify' },
                                ],
                                default: 'left',
                            },
                            {
                                type: 'choice',
                                ref: 'vAlign',
                                items: [
                                    { id: 'top', text: 'top' },
                                    { id: 'middle', text: 'middle' },
                                    { id: 'bottom', text: 'bottom' },
                                ],
                                default: 'top',
                            },
                        ],
                    ]
                },
                {
                    type: 'panel',
                    title: element_js_15._tr.elements.text.spacing,
                    items: [
                        [
                            {
                                type: 'num',
                                ref: 'lineHeight',
                                title: element_js_15._tr.elements.text.lineheight,
                                min: 0,
                                max: 3,
                                step: 0.1,
                                default: 1.3
                            },
                            {
                                type: 'num',
                                ref: 'padding',
                                min: 0,
                                max: 20,
                                title: element_js_15._tr.elements.text.padding,
                                step: 0.1,
                                default: 0
                            }
                        ]
                    ]
                },
                {
                    type: 'panel',
                    title: element_js_15._tr.elements.text.rotation,
                    items: [
                        [
                            {
                                type: 'num',
                                ref: 'rotation',
                                title: element_js_15._tr.elements.text.rotation2,
                                min: -360,
                                max: 360,
                                step: 10,
                                default: 0
                            },
                        ]
                    ]
                },
                {
                    type: 'panel',
                    title: element_js_15._tr.elements.text.text,
                    flex: 1,
                    items: [
                        {
                            type: 'textarea',
                            ref: 'text',
                            flex: 1,
                        },
                        {
                            type: 'bool',
                            ref: 'autoGrow',
                            cls: 'slider',
                            text: element_js_15._tr.elements.text.autogrow,
                        },
                        {
                            type: 'bool',
                            ref: 'noWordWrap',
                            cls: 'slider',
                            text: element_js_15._tr.elements.text.nowwrap,
                        }
                    ]
                },
            ];
        }
        /**
         *
         */
        edit() {
            const report = this.getReport();
            const sources = report.getDataSources();
            (0, text_edit_js_1.showTextEditor)(this.m_data.text, txt => {
                this.__set('text', txt);
                this.notify('element.refill', { el: this, pos: false });
            }, sources);
        }
        /**
         *
         */
        enumColors(to) {
            if (this.m_data.bkColor) {
                to.add(this.m_data.bkColor);
            }
            if (this.m_data.color) {
                to.add(this.m_data.color);
            }
        }
    }
    exports.EText = EText;
});
/**
* @file ecustom.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report Generator Custom Element
**/
define("src/editor/ecustom", ["require", "exports", "src/elements/element", "src/elements/custom"], function (require, exports, element_js_16, custom_js_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ECustom = void 0;
    class ECustom extends custom_js_3.CCustom {
        save() {
            let data = super.save();
            delete data.plugin; // do not save this data
            return data;
        }
        _solver(fieldName, rsc) {
            return undefined;
        }
        getDescriptor(fill, size, name) {
            let def = super.getDescriptor(false, true, true);
            let props = this.m_data.plugin?.properties;
            let custom = [];
            props.forEach(p => {
                switch (p.type) {
                    case 'text': {
                        custom.push([{
                                type: 'text',
                                title: p.title ?? p.name,
                                ref: 'data.' + p.name,
                                labelWidth: p.labelWidth ?? 70,
                            }]);
                        break;
                    }
                    case 'num': {
                        custom.push([{
                                type: 'num',
                                title: p.title ?? p.name,
                                ref: 'data.' + p.name,
                                labelWidth: p.labelWidth ?? 70,
                            }]);
                        break;
                    }
                    case 'bool': {
                        custom.push([{
                                type: 'bool',
                                title: p.title ?? p.name,
                                ref: 'data.' + p.name,
                                labelWidth: p.labelWidth ?? 70,
                            }]);
                        break;
                    }
                    case 'link': {
                        custom.push([{
                                type: 'link',
                                title: p.title ?? p.name,
                                ref: 'data.' + p.name,
                                labelWidth: p.labelWidth ?? 70,
                            }]);
                        break;
                    }
                    case 'color': {
                        custom.push([{
                                type: 'color',
                                title: p.title ?? p.name,
                                ref: 'data.' + p.name,
                                default: p.default ? new element_js_16.Color(p.default) : element_js_16.Color.NONE,
                                labelWidth: p.labelWidth ?? 70,
                            }]);
                        break;
                    }
                    case 'choice': {
                        custom.push([{
                                type: 'choice',
                                title: p.title ?? p.name,
                                ref: 'data.' + p.name,
                                default: p.default,
                                labelWidth: p.labelWidth ?? 70,
                                items: p.items,
                            }]);
                        break;
                    }
                }
            });
            const report = this.getReport();
            const def2 = [
                {
                    type: 'panel',
                    title: element_js_16._tr.elements.text.font,
                    items: [
                        {
                            type: 'choice',
                            ref: 'defaults.font.family',
                            items: report.enumFontNames(),
                            default: '<page>'
                        },
                        [
                            {
                                type: 'choice',
                                ref: 'defaults.font.weight',
                                items: [
                                    { id: 'light', text: 'light' },
                                    { id: 'normal', text: 'normal' },
                                    { id: 'bold', text: 'bold' },
                                ],
                                default: 'normal'
                            },
                            {
                                type: 'num',
                                ref: 'defaults.font.size',
                                width: 90,
                                min: 6,
                                max: 100,
                                default: '12'
                            }
                        ],
                        {
                            type: 'color',
                            ref: 'defaults.color',
                        },
                    ]
                },
            ];
            return [
                ...def,
                {
                    type: 'panel',
                    title: element_js_16._tr.elements.properties,
                    items: custom
                },
                ...def2
            ];
        }
    }
    exports.ECustom = ECustom;
});
/**
* @file eline.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report Generator Line Element
**/
define("src/editor/eline", ["require", "exports", "src/elements/element", "src/elements/line"], function (require, exports, element_js_17, line_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ELine = void 0;
    class ELine extends line_js_2.CLine {
        /**
         *
         */
        getDescriptor() {
            let def = super.getDescriptor(false, true, false, false);
            return [
                ...def,
                {
                    type: 'panel',
                    title: element_js_17._tr.elements.line.title,
                    items: [
                        [
                            {
                                type: 'color',
                                ref: 'line.color'
                            },
                            {
                                type: 'num',
                                ref: 'line.width',
                                width: 50,
                                min: 0,
                                max: 100,
                                step: 0.1,
                            },
                        ],
                        {
                            type: 'choice',
                            title: element_js_17._tr.elements.line.caps,
                            ref: 'cap',
                            items: [
                                { id: 'round', text: element_js_17._tr.elements.line.round },
                                { id: 'square', text: element_js_17._tr.elements.line.square },
                                { id: 'butt', text: element_js_17._tr.elements.line.butt }
                            ]
                        }
                    ]
                }
            ];
        }
    }
    exports.ELine = ELine;
});
/**
* @file report.ts
* @description Report Generator Report Editor
* @author Etienne Cochard
* @copyright (c) 2020-2021 R-libre ingenierie
**/
define("src/editor/ereport", ["require", "exports", "src/elements/_mod", "src/elements/report", "src/elements/mark", "src/tools/explorer", "src/editor/esection", "src/editor/epage", "src/editor/eimage", "src/editor/etext", "src/editor/ecustom", "src/editor/eline", "src/x4mod", "src/tools/text_edit"], function (require, exports, _mod_js_2, report_js_1, mark_js_3, explorer_js_2, esection_js_1, epage_js_1, eimage_js_1, etext_js_1, ecustom_js_1, eline_js_1, x4mod_js_9, text_edit_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EReport = void 0;
    /**
     * {{cm:Report}}
     */
    class EReport extends report_js_1.CReport {
        m_org;
        m_scale;
        m_curPage;
        /**
         *
         */
        constructor(props) {
            props = {
                version: '1.0.0',
                grid_on: true,
                grid_size: 1,
                units: 'mm',
                paging_type: 'page',
                script: null,
                rsrc: [],
                children: [
                    // pages
                    {
                        type: 'page',
                        size: {
                            size: 'A4',
                        },
                        orientation: 'portrait',
                        children: [
                            // sections
                            {
                                type: 'section',
                                kind: 'body'
                            }
                        ]
                    },
                ],
                ...props
            };
            super(props);
            this.m_org = new _mod_js_2.Point(10, 10);
            this.m_scale = 100;
            this.m_curPage = this.m_children[0];
        }
        /**
         *
         */
        addMark(type, pos) {
            let p = this.m_data;
            let off = (0, mark_js_3.getMarkOffset)(type, pos);
            if (p.markers) {
                let m = p.markers.find((mm) => mm.type == type && mm.pos == off);
                if (m) {
                    return;
                }
            }
            else {
                p.markers = [];
            }
            p.markers.push({
                type,
                pos: off
            });
        }
        /**
         *
         */
        delMark(mark) {
            let p = this.m_data;
            if (!p.markers) {
                return;
            }
            let idx = p.markers.findIndex(m => m === mark);
            if (idx >= 0) {
                p.markers.splice(idx, 1);
            }
            if (p.markers.length == 0) {
                delete p.markers;
            }
        }
        /**
         *
         */
        getMarks() {
            let p = this.m_data;
            return p.markers;
        }
        /**
         *
         */
        renderItem(canvas, rc) {
            const painter = canvas;
            const ctx = painter.getContext();
            const rsrc = {
                mode: 'edit',
                getFont: x => this.getFont(x),
                getImage: x => this.getImage(x),
            };
            ctx.save();
            ctx.translate(this.m_org.x, this.m_org.y);
            ctx.scale(this.m_scale / 100, this.m_scale / 100);
            super.renderItem(painter, rsrc);
            ctx.restore();
        }
        /**
         *
         */
        save() {
            let data = super.save();
            return data;
        }
        /**
         *
         */
        incScale(delta_percent) {
            this.setScale(this.m_scale + delta_percent);
        }
        /**
         *
         */
        setOrg(x, y) {
            this.m_org = { x, y };
        }
        getOrg() {
            return this.m_org;
        }
        /**
         *
         */
        scroll(dx, dy) {
            this.m_org.x += dx;
            this.m_org.y += dy;
        }
        /**
         *
         */
        setScale(new_zoom) {
            if (new_zoom < 10) {
                new_zoom = 10;
            }
            else if (new_zoom > 400) {
                new_zoom = 400;
            }
            this.m_scale = new_zoom;
        }
        getScale() {
            return this.m_scale;
        }
        /**
         *
         */
        select(rc, inclusive = false) {
            let sel = [];
            const cp = this.m_curPage;
            const els = cp.getChildren(false, true, false);
            const p = cp.getRect(true);
            const rs = rc.movedBy(-p.left, -p.top);
            els.forEach((e) => {
                if (e.touches(rs, inclusive)) {
                    sel.push(e);
                }
            });
            return sel;
        }
        /**
         *
         */
        touchesPt(pt) {
            return this.m_curPage.touchesPt(pt) ?? this;
        }
        /**
         *
         */
        getFullRect() {
            return this.m_curPage.getRect();
        }
        /**
         *
         */
        //addPage( anchor, where ) {
        //	super.addPage( anchor, where );
        //	this.update( 'hierarchy' );
        //}
        getScript() {
            return this.m_data.script;
        }
        setScript(script) {
            this.m_data.script = script;
            this.dirty();
        }
        getCurPage() {
            return this.m_curPage;
        }
        getSections() {
            return this.m_curPage.getChildren(false, false);
        }
        getDescriptor() {
            return [
                ...super.getDescriptor(false, false, false, false),
                {
                    type: 'panel',
                    title: _mod_js_2._tr.elements.report.grid,
                    items: [
                        [
                            {
                                type: 'bool',
                                ref: 'grid_on',
                                //label: _tr.elements.report.grid_mode,
                                width: 110,
                                text: 'on/off',
                            },
                            {
                                type: 'num',
                                ref: 'grid_size',
                                label: _mod_js_2._tr.elements.report.grid_size,
                                text: 'size',
                            },
                        ]
                    ]
                },
                {
                    type: 'panel',
                    title: _mod_js_2._tr.elements.defaults,
                    items: [
                        [{
                                type: 'choice',
                                title: _mod_js_2._tr.elements.report.units,
                                ref: 'units',
                                labelWidth: 80,
                                items: [
                                    { id: 'mm', text: 'millimeters' },
                                    { id: 'in', text: 'inches' },
                                    { id: 'px', text: 'pixels' },
                                ]
                            }],
                        [{
                                type: 'choice',
                                ref: 'font',
                                title: _mod_js_2._tr.elements.report.font_name,
                                labelWidth: 80,
                                items: this.enumFontNames(false, false),
                                default: 'arial'
                            }],
                    ]
                },
                {
                    type: 'panel',
                    title: _mod_js_2._tr.elements.report.resources,
                    items: [
                        {
                            type: 'button',
                            text: _mod_js_2._tr.elements.report.images,
                            click: () => {
                                this._manageImages();
                            }
                        },
                        {
                            type: 'button',
                            text: _mod_js_2._tr.elements.report.fonts,
                            click: () => {
                                this._manageFonts();
                            }
                        }
                    ]
                },
            ];
        }
        _manageImages() {
            explorer_js_2.ExplorerBox.show({
                type: 'image',
                report: this,
                readOnly: false,
                callback: () => {
                    this.dirty();
                }
            });
        }
        _manageFonts() {
            explorer_js_2.ExplorerBox.show({
                type: 'font',
                report: this,
                readOnly: false,
                callback: () => {
                    this.dirty();
                }
            });
        }
        /**
         *
         * @param el
         * @param owner
         * @returns
         */
        elementFactory(el, owner) {
            let rc;
            switch (el.type) {
                case 'custom': {
                    rc = new ecustom_js_1.ECustom(el, owner);
                    break;
                }
                case 'group': {
                    rc = new _mod_js_2.CGroup(el, owner);
                    break;
                }
                case 'image': {
                    rc = new eimage_js_1.EImage(el, owner);
                    break;
                }
                case 'line': {
                    rc = new eline_js_1.ELine(el, owner);
                    break;
                }
                case 'page': {
                    rc = new epage_js_1.EPage(el, owner);
                    break;
                }
                case 'rectangle': {
                    rc = new _mod_js_2.CRectangle(el, owner);
                    break;
                }
                case 'ellipse': {
                    rc = new _mod_js_2.CEllipse(el, owner);
                    break;
                }
                case 'text': {
                    rc = new etext_js_1.EText(el, owner);
                    break;
                }
                case 'section': {
                    rc = new esection_js_1.ESection(el, owner);
                    break;
                }
                default: {
                    console.error(`Unknown element type: ${name}`);
                    return null;
                }
            }
            rc.notify('element.created', rc);
            return rc;
        }
        sendNotification(msg, params, source) {
            x4mod_js_9.Application.instance().signal('message', (0, x4mod_js_9.EvMessage)(msg, params, source), 0);
        }
        fillProps(root, data, onlyPos) {
            const posProperties = {
                left: 'element.move',
                top: 'element.move',
                width: 'element.size',
                height: 'element.size'
            };
            const fill = ((x, base) => {
                for (let name in x) {
                    const bname = base ? base + '.' + name : name;
                    if (typeof x[name] === 'object') {
                        fill(x[name], bname);
                    }
                    else {
                        let el = root.itemWithRef(bname);
                        if (el) {
                            // only change position properties if needed
                            if (onlyPos && !base && !(name in posProperties)) {
                                return;
                            }
                            let value = x[name];
                            if (el instanceof x4mod_js_9.ColorPickerEditor) {
                                el.value = value ? new x4mod_js_9.Color(value) : x4mod_js_9.Color.NONE;
                            }
                            else if (el instanceof x4mod_js_9.CheckBox) {
                                el.check = value;
                            }
                            else if (el instanceof x4mod_js_9.TextEdit && el.type == 'number') {
                                el.value = '' + (0, x4mod_js_9.roundTo)(value, 2);
                            }
                            else {
                                if (value === null) {
                                    value = '';
                                }
                                el.value = '' + value;
                            }
                        }
                    }
                }
            });
            fill(data, null);
        }
        createEditor(els, target) {
            let root = [];
            els.forEach(el => {
                if (el) {
                    root.push(this._createSingleEditor(el, target));
                }
            });
            return root;
        }
        parseProp(editor, value) {
            if (editor instanceof x4mod_js_9.ColorPickerEditor) {
                let clr = value.toString();
                _mod_js_2.userColors.add(clr);
                value = clr;
            }
            else if (editor instanceof x4mod_js_9.TextEdit && editor.type == 'number') {
                value = parseFloat(value);
                if (isNaN(value)) {
                    value = undefined;
                }
            }
            else if (editor instanceof x4mod_js_9.CheckBox) {
                value = !!value;
            }
            return { name: editor.ref, value };
        }
        _createSingleEditor(el, target) {
            const width = el.width > 0 ? el.width : undefined;
            if ((0, x4mod_js_9.isArray)(el)) {
                const hasFlex = el.some(e => e.flex);
                const nel = new x4mod_js_9.HLayout({
                    cls: '@hflex',
                    flex: hasFlex ? 1 : undefined,
                    content: this.createEditor(el, target)
                });
                return nel;
            }
            else {
                switch (el.type) {
                    case 'title': {
                        return new x4mod_js_9.Label({ cls: 'title', text: el.text });
                    }
                    case 'link': {
                        const edit = new x4mod_js_9.TextEdit({
                            cls: '@hflex',
                            label: el.title,
                            ref: el.ref,
                            width,
                            labelWidth: el.labelWidth,
                            style: el.style,
                            data: { target, el },
                            validator: el.validator,
                            readOnly: true,
                            gadgets: [
                                new x4mod_js_9.Button({
                                    icon: 'resources/img/scroll-light.svg',
                                    click: () => {
                                        (0, text_edit_js_2.selectField)(this.getDataSources(), (value) => {
                                            _set_v(edit, value);
                                            edit.value = value;
                                        });
                                    }
                                })
                            ]
                            //change: _set,
                        });
                        return edit;
                    }
                    case 'panel': {
                        let content = [];
                        el.items.forEach(sel => {
                            if (sel === null) {
                                return;
                            }
                            if ((0, x4mod_js_9.isArray)(sel)) {
                                const hasFlex = sel.some(e => e.flex);
                                const nel = new x4mod_js_9.HLayout({
                                    cls: '@hflex',
                                    flex: hasFlex ? 1 : undefined,
                                    content: this.createEditor(sel, target)
                                });
                                content.push(nel);
                            }
                            else {
                                if (!el.absPos) {
                                    const nel = new x4mod_js_9.HLayout({
                                        cls: '@hflex',
                                        flex: sel.flex ? 1 : undefined,
                                        content: this._createSingleEditor(sel, target)
                                    });
                                    content.push(nel);
                                }
                                else {
                                    content.push(this._createSingleEditor(sel, target));
                                }
                            }
                        });
                        return new x4mod_js_9.Panel({
                            title: el.title,
                            style: el.style,
                            data: el.data,
                            cls: el.cls,
                            flex: el.flex,
                            content
                        });
                    }
                    case 'num': {
                        const attrs = {};
                        if (el.step) {
                            attrs.step = el.step;
                        }
                        return new x4mod_js_9.TextEdit({
                            cls: el.width === undefined ? '@hflex' : '',
                            label: el.title,
                            ref: el.ref,
                            labelWidth: el.labelWidth,
                            value: el.default,
                            min: el.min,
                            max: el.max,
                            type: 'number',
                            data: { target, el },
                            attrs,
                            style: el.style,
                            focus: (ev) => {
                                if (ev.focus) {
                                    ev.source.selectAll();
                                }
                            },
                            change: _set,
                        });
                    }
                    case 'text': {
                        return new x4mod_js_9.TextEdit({
                            cls: '@hflex',
                            label: el.title,
                            ref: el.ref,
                            width,
                            labelWidth: el.labelWidth,
                            style: el.style,
                            data: { target, el },
                            validator: el.validator,
                            change: _set,
                        });
                    }
                    case 'textarea': {
                        return new x4mod_js_9.TextArea({
                            cls: '@hflex',
                            ref: el.ref,
                            style: el.style,
                            data: { target, el },
                            change: _set,
                        });
                    }
                    case 'color': {
                        return new x4mod_js_9.ColorPickerEditor({
                            ref: el.ref,
                            cls: '@hflex',
                            hasAlpha: true,
                            color: el.default ?? x4mod_js_9.Color.NONE,
                            cust_colors: _mod_js_2.userColors.values(),
                            label: el.title,
                            labelWidth: el.labelWidth,
                            width,
                            data: { target, el },
                            change: _set,
                        });
                    }
                    case 'bool': {
                        return new x4mod_js_9.CheckBox({
                            text: el.text,
                            ref: el.ref,
                            width,
                            cls: el.width === undefined ? '@hflex slider' : 'slider',
                            data: { target, el },
                            change: _set,
                        });
                    }
                    case 'choice': {
                        return new x4mod_js_9.ComboBox({
                            ref: el.ref,
                            cls: '@hflex',
                            label: el.title,
                            value: el.default,
                            labelWidth: el.labelWidth,
                            items: el.items,
                            data: { target, el },
                            selectionChange: (ev) => {
                                const cmb = ev.source;
                                _set_v(cmb, cmb.value);
                            },
                        });
                    }
                    case 'button': {
                        return new x4mod_js_9.Button({
                            ref: el.ref,
                            cls: '@hflex',
                            text: el.text,
                            click: el.click,
                            data: { target, el }
                        });
                    }
                }
            }
            console.error("error");
            return null;
        }
    }
    exports.EReport = EReport;
    function _set_v(ed, value) {
        let target = ed.getData('xtarget') ?? ed.getData('target');
        console.assert(!!target);
        target._set(ed, value);
    }
    function _set(ev) {
        _set_v(ev.source, ev.value);
    }
});
/**
* @file report.ts
* @description Report Generator Report Renderer
* @author Etienne Cochard
* @copyright (c) 2020-2021 R-libre ingenierie
**/
define("src/renderer/rreport", ["require", "exports", "src/elements/report", "src/elements/_mod"], function (require, exports, report_js_2, _mod_js_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RReport = void 0;
    class RReport extends report_js_2.CReport {
        async renderItem(ctx, rsc) {
            let proms = [];
            this.m_data.rsrc?.forEach((rsc) => {
                if (rsc.type == 'font') {
                    const fnt = rsc;
                    if (ctx.binFonts()) {
                        let fdata = fnt.data;
                        let b64 = fnt.data.indexOf('base64,');
                        if (b64 >= 0) {
                            fdata = fnt.data.substr(b64 + 7);
                        }
                        const buffer = Buffer.from(fdata, 'base64');
                        proms.push(ctx.addFont(fnt.name, buffer));
                    }
                    else {
                        proms.push(ctx.addFont(fnt.name, fnt.data));
                    }
                }
                else if (rsc.type == 'image') {
                    const img = rsc;
                    //const buffer = Buffer.from( img.data, 'base64' );
                    //imgs.set( img.name, img.data );
                    proms.push(ctx.addImage(img.name, img.data));
                }
            });
            await Promise.all(proms);
            const rscs = {
                mode: 'execute',
                getImage: (name) => {
                    return this.getImage(name);
                },
                getFont: (name) => {
                    return this.getFont(name);
                },
                printInfo: {
                    rootData: { ...rsc.printInfo?.rootData /* demo sample */, ...this.prepareRootData() },
                    errors: []
                }
            };
            super.renderItem(ctx, rscs);
            if (rscs.printInfo.errors && rscs.printInfo.errors.length) {
                console.log(rscs.printInfo.errors);
            }
        }
        prepareRootData() {
            return {
                document: {
                    pagenum: 0,
                    pagecount: 0,
                    name: '<name>'
                },
                system: {
                    today: new Date(),
                }
            };
        }
        elementFactory(el, owner) {
            let rc;
            switch (el.type) {
                case 'custom': {
                    rc = new _mod_js_3.CCustom(el, owner);
                    break;
                }
                case 'group': {
                    rc = new _mod_js_3.CGroup(el, owner);
                    break;
                }
                case 'image': {
                    rc = new _mod_js_3.CImage(el, owner);
                    break;
                }
                case 'line': {
                    rc = new _mod_js_3.CLine(el, owner);
                    break;
                }
                case 'page': {
                    rc = new _mod_js_3.CPage(el, owner);
                    break;
                }
                case 'rectangle': {
                    rc = new _mod_js_3.CRectangle(el, owner);
                    break;
                }
                case 'ellipse': {
                    rc = new _mod_js_3.CEllipse(el, owner);
                    break;
                }
                case 'text': {
                    rc = new _mod_js_3.CText(el, owner);
                    break;
                }
                case 'section': {
                    rc = new _mod_js_3.CSection(el, owner);
                    break;
                }
                default: {
                    console.error(`Unknown element type: ${el.type}`);
                    return null;
                }
            }
            return rc;
        }
        sendNotification(msg, params, source) {
        }
        parseProp(editor, inputValue) {
            debugger;
            return null;
        }
        fillProps(root, data, onlyPos) {
            debugger;
        }
        createEditor(els, el) {
            debugger;
        }
    }
    exports.RReport = RReport;
});
define("src/tools/xml", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseXML = void 0;
    const Entities = {
        quot: 34, amp: 38, lt: 60, gt: 62, apos: 39, OElig: 338, oelig: 339, Scaron: 352, scaron: 353, Yuml: 376, circ: 710, tilde: 732, ensp: 8194, emsp: 8195, thinsp: 8201, zwnj: 8204, zwj: 8205, lrm: 8206, rlm: 8207, ndash: 8211, mdash: 8212, lsquo: 8216, rsquo: 8217, sbquo: 8218, ldquo: 8220, rdquo: 8221, bdquo: 8222, dagger: 8224, Dagger: 8225, permil: 8240, lsaquo: 8249,
        rsaquo: 8250, euro: 8364, nbsp: 160, iexcl: 161, cent: 162, pound: 163, curren: 164, yen: 165, brvbar: 166, sect: 167, uml: 168, copy: 169, ordf: 170, laquo: 171, not: 172, shy: 173, reg: 174, macr: 175, deg: 176, plusmn: 177, sup2: 178, sup3: 179, acute: 180, micro: 181, para: 182, middot: 183, cedil: 184, sup1: 185, ordm: 186, raquo: 187, frac14: 188, frac12: 189, frac34: 190,
        iquest: 191, Agrave: 192, Aacute: 193, Acirc: 194, Atilde: 195, Auml: 196, Aring: 197, AElig: 198, Ccedil: 199, Egrave: 200, Eacute: 201, Ecirc: 202, Euml: 203, Igrave: 204, Iacute: 205, Icirc: 206, Iuml: 207, ETH: 208, Ntilde: 209, Ograve: 210, Oacute: 211, Ocirc: 212, Otilde: 213, Ouml: 214, times: 215, Oslash: 216, Ugrave: 217, Uacute: 218, Ucirc: 219, Uuml: 220, Yacute: 221,
        THORN: 222, szlig: 223, agrave: 224, aacute: 225, acirc: 226, atilde: 227, auml: 228, aring: 229, aelig: 230, ccedil: 231, egrave: 232, eacute: 233, ecirc: 234, euml: 235, igrave: 236, iacute: 237, icirc: 238, iuml: 239, eth: 240, ntilde: 241, ograve: 242, oacute: 243, ocirc: 244, otilde: 245, ouml: 246, divide: 247, oslash: 248, ugrave: 249, uacute: 250, ucirc: 251, uuml: 252,
        yacute: 253, thorn: 254, yuml: 255, fnof: 402, Alpha: 913, Beta: 914, Gamma: 915, Delta: 916, Epsilon: 917, Zeta: 918, Eta: 919, Theta: 920, Iota: 921, Kappa: 922, Lambda: 923, Mu: 924, Nu: 925, Xi: 926, Omicron: 927, Pi: 928, Rho: 929, Sigma: 931, Tau: 932, Upsilon: 933, Phi: 934, Chi: 935, Psi: 936, Omega: 937, alpha: 945, beta: 946, gamma: 947, delta: 948, epsilon: 949,
        zeta: 950, eta: 951, theta: 952, iota: 953, kappa: 954, lambda: 955, mu: 956, nu: 957, xi: 958, omicron: 959, pi: 960, rho: 961, sigmaf: 962, sigma: 963, tau: 964, upsilon: 965, phi: 966, chi: 967, psi: 968, omega: 969, thetasym: 977, upsih: 978, piv: 982, bull: 8226, hellip: 8230, prime: 8242, Prime: 8243, oline: 8254, frasl: 8260, weierp: 8472, image: 8465, real: 8476,
        trade: 8482, alefsym: 8501, larr: 8592, uarr: 8593, rarr: 8594, darr: 8595, harr: 8596, crarr: 8629, lArr: 8656, uArr: 8657, rArr: 8658, dArr: 8659, hArr: 8660, forall: 8704, part: 8706, exist: 8707, empty: 8709, nabla: 8711, isin: 8712, notin: 8713, ni: 8715, prod: 8719, sum: 8721, minus: 8722, lowast: 8727, radic: 8730, prop: 8733, infin: 8734, ang: 8736, and: 8743, or: 8744,
        cap: 8745, cup: 8746, int: 8747, there4: 8756, sim: 8764, cong: 8773, asymp: 8776, ne: 8800, equiv: 8801, le: 8804, ge: 8805, sub: 8834, sup: 8835, nsub: 8836, sube: 8838, supe: 8839, oplus: 8853, otimes: 8855, perp: 8869, sdot: 8901, lceil: 8968, rceil: 8969, lfloor: 8970, rfloor: 8971, lang: 9001, rang: 9002, loz: 9674, spades: 9824, clubs: 9827, hearts: 9829, diams: 9830
    };
    class XmlNode {
        error;
        nodeValue;
        nodeType;
        nodeName;
        attributes;
        childNodes;
        parentNode;
        id;
        textContent;
        classList;
        constructor(tag, type, value, error) {
            this.error = error;
            this.nodeName = tag;
            this.nodeValue = value;
            this.nodeType = type;
            this.attributes = {};
            this.childNodes = [];
            this.parentNode = null;
            this.id = '';
            this.textContent = '';
            this.classList = [];
        }
        getAttribute(attr) {
            return this.attributes[attr] ?? null;
        }
        getElementById(id) {
            return this.forEach(node => {
                if (node.id === id) {
                    return node;
                }
            });
        }
        getElementsByTagName(tag) {
            let result = [];
            this.forEach(node => {
                if (node.nodeName === tag) {
                    result.push(node);
                }
            });
            return result;
        }
        forEach(cb) {
            const recursive = (node) => {
                if (node.nodeType === 1) {
                    let rc = cb(node);
                    if (rc)
                        return rc;
                    for (let i = 0; i < node.childNodes.length; i++) {
                        rc = recursive(node.childNodes[i]);
                        if (rc) {
                            return rc;
                        }
                    }
                }
            };
            recursive(this);
        }
    }
    /**
     *
     * @param xml
     */
    function parseXML(xml, warningCallback) {
        let parser = new StringParser(xml.trim());
        let result, child, error = false;
        if (!warningCallback) {
            warningCallback = console.log;
        }
        let recursive = () => {
            let temp, child;
            // Opening tag
            if (temp = parser.match(/^<([\w:.-]+)\s*/, true)) {
                let node = new XmlNode(temp[1], 1, null, error);
                // Attribute
                while (temp = parser.match(/^([\w:.-]+)(?:\s*=\s*"([^"]*)"|\s*=\s*'([^']*)')?\s*/, true)) {
                    let attr = temp[1], value = decodeEntities(temp[2] || temp[3] || '');
                    if (!node.attributes[attr]) {
                        node.attributes[attr] = value;
                        if (attr === 'id') {
                            node.id = value;
                        }
                        if (attr === 'class') {
                            node.classList = value.split(' ');
                        }
                    }
                    else {
                        warningCallback('parseXml: duplicate attribute "' + attr + '"');
                        error = true;
                    }
                }
                // End of opening tag
                if (parser.match(/^>/)) {
                    while (child = recursive()) {
                        node.childNodes.push(child);
                        child.parentNode = node;
                        node.textContent += (child.nodeType === 3 || child.nodeType === 4 ? child.nodeValue : child.textContent);
                    }
                    // Closing tag
                    if (temp = parser.match(/^<\/([\w:.-]+)\s*>/, true)) {
                        if (temp[1] === node.nodeName) {
                            return node;
                        }
                        else {
                            warningCallback('parseXml: tag not matching, opening "' + node.nodeName + '" & closing "' + temp[1] + '"');
                            error = true;
                            return node;
                        }
                    }
                    else {
                        warningCallback('parseXml: tag not matching, opening "' + node.nodeName + '" & not closing');
                        error = true;
                        return node;
                    }
                }
                // Self-closing tag
                else if (parser.match(/^\/>/)) {
                    return node;
                }
                else {
                    warningCallback('parseXml: tag could not be parsed "' + node.nodeName + '"');
                    error = true;
                }
            }
            // Comment
            else if (temp = parser.match(/^<!--[\s\S]*?-->/)) {
                return new XmlNode(null, 8, temp, error);
            }
            // Processing instructions
            else if (temp = parser.match(/^<\?[\s\S]*?\?>/)) {
                return new XmlNode(null, 7, temp, error);
            }
            // Doctype
            else if (temp = parser.match(/^<!DOCTYPE\s*([\s\S]*?)>/)) {
                return new XmlNode(null, 10, temp, error);
            }
            // Cdata node
            else if (temp = parser.match(/^<!\[CDATA\[([\s\S]*?)\]\]>/, true)) {
                return new XmlNode('#cdata-section', 4, temp[1], error);
            }
            // Text node
            else if (temp = parser.match(/^([^<]+)/, true)) {
                return new XmlNode('#text', 3, decodeEntities(temp[1]), error);
            }
        };
        while (child = recursive()) {
            if (child.nodeType === 1 && !result) {
                result = child;
            }
            else if (child.nodeType === 1 || (child.nodeType === 3 && child.nodeValue.trim() !== '')) {
                warningCallback('parseXml: data after document end has been discarded');
            }
        }
        if (parser.matchAll()) {
            warningCallback('parseXml: parsing error');
        }
        return result;
    }
    exports.parseXML = parseXML;
    class StringParser {
        str;
        constructor(str) {
            this.str = str;
        }
        match(exp, all = false) {
            let temp = this.str.match(exp);
            if (!temp || temp.index !== 0) {
                return;
            }
            this.str = this.str.substring(temp[0].length);
            return (all ? temp : temp[0]);
        }
        matchSeparator() {
            return this.match(/^(?:\s*,\s*|\s*|)/);
        }
        matchSpace() {
            return this.match(/^(?:\s*)/);
        }
        matchLengthUnit() {
            return this.match(/^(?:px|pt|cm|mm|in|pc|em|ex|%|)/);
        }
        matchNumber() {
            return this.match(/^(?:[-+]?(?:[0-9]+[.][0-9]+|[0-9]+[.]|[.][0-9]+|[0-9]+)(?:[eE][-+]?[0-9]+)?)/);
        }
        matchAll() {
            return this.match(/^[\s\S]+/);
        }
    }
    function decodeEntities(str) {
        return (str.replace(/&(?:#([0-9]+)|#[xX]([0-9A-Fa-f]+)|([0-9A-Za-z]+));/g, function (mt, m0, m1, m2) {
            if (m0) {
                return String.fromCharCode(parseInt(m0, 10));
            }
            else if (m1) {
                return String.fromCharCode(parseInt(m1, 16));
            }
            else if (m2 && Entities[m2]) {
                return String.fromCharCode(Entities[m2]);
            }
            else {
                return mt;
            }
        }));
    }
});
/**
* @file pdf_canvas.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report Generator PDF Renderer
**/
define("src/renderers/pdf_canvas", ["require", "exports", "src/renderers/base_canvas", "src/tools/conversion", "lib", "src/tools/xml"], function (require, exports, base_canvas_js_3, conversion_js_13, lib_js_8, xml_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.drawText = exports.PDFCanvas = void 0;
    const SVGtoPDF = lib_js_8.host.require('svg-to-pdfkit');
    const { Writable } = lib_js_8.host.require('stream');
    class PDFCanvas extends base_canvas_js_3.PaintCanvas {
        m_doc;
        m_stream;
        m_images;
        m_units;
        constructor(options) {
            super(options);
            this.m_images = new Map();
            this.m_units = 'pt';
        }
        setUnits(units) {
            switch (units) {
                case 'mm':
                    this.m_unitcvt = conversion_js_13.mm2pt;
                    this.m_unitcvt_r = conversion_js_13.pt2mm;
                    break;
                case 'in':
                    this.m_unitcvt = conversion_js_13.in2pt;
                    this.m_unitcvt_r = conversion_js_13.pt2in;
                    break;
                case 'px':
                    this.m_unitcvt = conversion_js_13.px2pt;
                    this.m_unitcvt_r = conversion_js_13.pt2px;
                    break;
                case 'pt':
                    this.m_unitcvt = conversion_js_13.u2u;
                    this.m_unitcvt_r = conversion_js_13.u2u;
                    break;
            }
            this.m_units = units;
        }
        getUnits() {
            return this.m_units;
        }
        startDoc() {
            const fs = lib_js_8.host.require('fs');
            const PDFDocument = lib_js_8.host.require('pdfkit');
            let output = this.m_options.output; // ?? "toto.pdf";
            this.m_doc = new PDFDocument({ autoFirstPage: false });
            this.m_stream = output ? fs.createWriteStream(output, { encoding: "binary" }) : new BlobStream();
            this.m_doc.pipe(this.m_stream);
        }
        endDoc(callback) {
            if (this.m_doc) {
                this.m_stream.on('finish', () => {
                    let data = this.m_options.output;
                    // blob ?
                    if (!data) {
                        data = this.m_stream.buffer();
                    }
                    if (callback) {
                        callback(data);
                    }
                    this.m_stream = null;
                });
                this.m_doc.end();
                this.m_doc = null;
            }
        }
        startPage(pageSize) {
            let options;
            if (pageSize.size == 'custom') {
                options = { size: [(0, conversion_js_13.mm2pt)(pageSize.width), (0, conversion_js_13.mm2pt)(pageSize.height)] };
            }
            else {
                options = { size: pageSize.size };
            }
            options.margins = {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0
            };
            this.m_doc.addPage(options);
        }
        endPage() {
        }
        fillRect(left, top, width, height, color, radius) {
            if (!color || width == 0 || height == 0) {
                return;
            }
            const clr = new base_canvas_js_3.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const cvt = this.m_unitcvt;
            if (!radius) {
                this.m_doc.rect(cvt(left), cvt(top), cvt(width), cvt(height));
            }
            else {
                this.m_doc.roundedRect(cvt(left), cvt(top), cvt(width), cvt(height), cvt(radius));
            }
            this.m_doc
                .fillOpacity(clr.alpha())
                .fillColor(clr.toHex(false))
                .fill('non-zero');
        }
        strokeRect(left, top, width, height, lwidth, color, radius) {
            if (!color || width == 0 || height == 0 || !lwidth) {
                return;
            }
            const clr = new base_canvas_js_3.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const cvt = this.m_unitcvt;
            if (!radius) {
                this.m_doc.rect(cvt(left), cvt(top), cvt(width), cvt(height));
            }
            else {
                this.m_doc.roundedRect(cvt(left), cvt(top), cvt(width), cvt(height), cvt(radius));
            }
            this.m_doc
                .strokeOpacity(clr.alpha())
                .strokeColor(clr.toHex(false))
                .lineWidth(lwidth)
                .stroke();
        }
        drawText(left, top, width, height, text, color, options) {
            if (!color || width == 0 || height == 0 || !text) {
                return;
            }
            const clr = new base_canvas_js_3.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const cvt = this.m_unitcvt;
            let rc = new base_canvas_js_3.Rect(cvt(left), cvt(top), cvt(width), cvt(height));
            /*
            if (options.fontFace) {
                if( options.fontFace=='sans-serif' ) {
                    this.m_doc.font('Helvetica');
                }
                else if( options.fontFace=='monospace' ) {
                    this.m_doc.font('Courier');
                }
                else {
                    try {
                        this.m_doc.font(options.fontFace);
                    }
                    catch (e) {
                        console.warn( 'font not found: '+options.fontFace );
                    }
                }
            }
    
            let fsze = options.fontSize;
            this.m_doc.fontSize(fsze);
    
            // linegap computation
            let font = (this.m_doc as any)._font;
            let gap = (fsze*(options.lineHeight??1)) - ( (font.ascender-font.descender)/1000 * fsze );
    
            const opt: PDFKit.Mixins.TextOptions = {
                indent: 0,
                lineGap: gap,
                paragraphGap: 0,
                align: options.align,
                baseline: 'top',
                lineBreak: false,
                columns: options.columns,
                columnGap: options.columnGap,
            }
    
    
            if (options.padding) {
                rc.inflate(-options.padding); // in pts
            }
    
            if (options.vAlign != 'top' && (options.columns??0) <= 1) {
                
                this.m_doc.save();
    
                //const sze = this.measureText(text, rc.width, options);
                const cheight = this.m_doc.heightOfString(text, {
                    width: rc.width,
                    align: 'left',
                    paragraphGap: 0,
                    baseline: 'top',
                    lineGap: 0.00001,	//gap,
                });
    
                if (cheight < rc.height) {
                    if (options.vAlign == 'bottom') {
                        rc.top = rc.top + rc.height - cheight;
                    }
                    else {
                        rc.top = rc.top + rc.height / 2 - cheight / 2;
                    }
                }
    
                this.m_doc.restore();
            }
    
            if( options.rotation ) {
                this.rotate( options.rotation );
            }
    
            this.m_doc
                .fillOpacity( clr.alpha() )
                .fillColor(clr.toHex(false))
                .text(text, rc.left, rc.top, {
                    width: rc.width,
                    height: rc.height,
                    ...opt
                });
    
            */
            if (options.fontFace == 'sans-serif') {
                this.m_doc.font('Helvetica');
            }
            else if (options.fontFace == 'monospace') {
                this.m_doc.font('Courier');
            }
            else {
                try {
                    this.m_doc.font(options.fontFace);
                }
                catch (e) {
                    console.warn('font not found: ' + options.fontFace);
                }
            }
            this.m_doc.fontSize(options.fontSize);
            this.m_doc.fillColor(clr.toHex(false));
            drawText(this.m_doc, text, rc, {
                align: options.align,
                vAlign: options.vAlign,
                fontSize: options.fontSize,
                fontWeight: options.fontWeight,
                //fontStyle?: string,
                columns: options.columns ?? 1,
                columnGap: options.columnGap ? options.columnGap : 0,
                fontFamily: options.fontFace,
                lineHeight: options.lineHeight,
                lineBreak: options.lineBreak,
                clip: true,
                rotation: options.rotation,
            });
        }
        measureText(text, width, options) {
            const padding = (0, conversion_js_13.pt2px)(options.padding);
            if (options.fontFace == 'sans-serif') {
                this.m_doc.font('Helvetica');
            }
            else if (options.fontFace == 'monospace') {
                this.m_doc.font('Courier');
            }
            else {
                try {
                    this.m_doc.font(options.fontFace);
                }
                catch (e) {
                    console.warn('font not found: ' + options.fontFace);
                }
            }
            const cvt = this.m_unitcvt;
            const rcvt = this.m_unitcvt_r;
            this.m_doc.fontSize(options.fontSize);
            const dim = drawText(this.m_doc, text, new base_canvas_js_3.Rect(0, 0, cvt(width) - padding * 2, 99999), {
                align: options.align,
                vAlign: options.vAlign,
                fontSize: options.fontSize,
                fontWeight: options.fontWeight,
                //fontStyle?: string,
                columns: options.columns ?? 1,
                columnGap: options.columnGap ? (0, conversion_js_13.pt2px)(options.columnGap) : 0,
                fontFamily: options.fontFace,
                lineHeight: options.lineHeight,
                clip: false,
            }, false);
            return { width, height: rcvt(dim.height + padding * 2) };
        }
        addFont(name, path) {
            this.m_doc.registerFont(name, path);
            return Promise.resolve();
        }
        addImage(name, data) {
            this.m_images.set(name, data);
            return Promise.resolve();
        }
        line(x1, y1, x2, y2, lwidth, color) {
            if ((x1 == x2 && y1 == y2) || !lwidth || !color) {
                return;
            }
            const clr = new base_canvas_js_3.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const cvt = this.m_unitcvt;
            this.m_doc.moveTo(cvt(x1), cvt(y1))
                .lineTo(cvt(x2), cvt(y2))
                .strokeOpacity(clr.alpha())
                .strokeColor(clr.toHex(false))
                .lineWidth(lwidth)
                .stroke();
        }
        /**
         *
         * @param name
         * @param left
         * @param top
         * @param width
         * @param height
         * @param fit
         * @returns
         */
        drawImage(name, left, top, width, height, fit) {
            if (!name || !width || !height) {
                return;
            }
            const img = this.m_images.get(name);
            if (!img) {
                return;
            }
            // care SVG images
            const xx = img.toString();
            if (xx.substr(0, 26) == 'data:image/svg+xml;base64,') {
                this.drawSVG(Buffer.from(xx.substr(26), 'base64').toString(), left, top, width, height, fit);
            }
            else {
                const cvt = this.m_unitcvt;
                left = cvt(left);
                top = cvt(top);
                width = cvt(width);
                height = cvt(height);
                if (fit == 'cover') {
                    const im = this.m_doc.openImage(img);
                    if (im) {
                        const r = (0, base_canvas_js_3.alignRect)(new base_canvas_js_3.Rect(0, 0, im.width, im.height), new base_canvas_js_3.Rect(left, top, width, height), fit);
                        this.m_doc.image(img, r.left, r.top, { align: 'center', valign: 'center', width: r.width, height: r.height });
                        return;
                    }
                }
                this.m_doc.image(img, left, top, { align: 'center', valign: 'center', width, height });
            }
        }
        /**
         *
         * @param svg
         * @param left
         * @param top
         * @param width
         * @param height
         * @param fit
         * @returns
         */
        drawSVG(svg, left, top, width, height, fit) {
            if (!width || !height) {
                return;
            }
            const cvt = this.m_unitcvt;
            left = cvt(left);
            top = cvt(top);
            width = cvt(width);
            height = cvt(height);
            if (fit == 'fill') {
                SVGtoPDF(this.m_doc, svg, left, top, { width, height, assumePt: true, preserveAspectRatio: 'none' });
            }
            else {
                // compute image size
                const node = (0, xml_js_1.parseXML)(svg);
                let iw = width;
                let ih = height;
                let a;
                if ((a = node.getAttribute('width')) !== null) {
                    iw = (0, conversion_js_13.px2pt)(parseInt(a));
                }
                if ((a = node.getAttribute('height')) !== null) {
                    ih = (0, conversion_js_13.px2pt)(parseInt(a));
                }
                if ((a = node.getAttribute('viewBox')) !== null) {
                    const re = /\s*(\d+)\s*(\d+)\s*(\d+)\s*(\d+)\s*/;
                    const m = a.match(re);
                    if (m) {
                        iw = (0, conversion_js_13.px2pt)(parseInt(m[3]));
                        ih = (0, conversion_js_13.px2pt)(parseInt(m[4]));
                    }
                }
                const r = (0, base_canvas_js_3.alignRect)(new base_canvas_js_3.Rect(0, 0, iw, ih), new base_canvas_js_3.Rect(left, top, width, height), fit);
                SVGtoPDF(this.m_doc, svg, r.left, r.top, { width: r.width, height: r.height, assumePt: true, preserveAspectRatio: 'none' });
            }
        }
        save() {
            this.m_doc.save();
        }
        restore() {
            this.m_doc.restore();
        }
        translate(dx, dy) {
            const cvt = this.m_unitcvt;
            this.m_doc.translate(cvt(dx), cvt(dy));
        }
        rotate(deg) {
            this.m_doc.rotate(deg);
        }
        /**
         * push() / pop() to clip / unclip
         */
        clip(left, top, width, height) {
            const cvt = this.m_unitcvt;
            this.m_doc.rect(cvt(left), cvt(top), cvt(width), cvt(height)).clip();
        }
        fillEllipse(left, top, width, height, color, start, end) {
            if (!color || width == 0 || height == 0) {
                return;
            }
            const clr = new base_canvas_js_3.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const cvt = this.m_unitcvt;
            const ctx = this.m_doc;
            const r = new base_canvas_js_3.Rect(cvt(left), cvt(top), cvt(width), cvt(height));
            const sa = (0, conversion_js_13.deg2rad)(start ?? 0) - Math.PI / 2;
            const ea = (0, conversion_js_13.deg2rad)(end ?? 360) - Math.PI / 2;
            ctx.ellipse(r.left + r.width / 2, r.top + r.height / 2, r.width / 2, r.height / 2)
                .fillOpacity(clr.alpha())
                .fill(clr.toHex(false));
        }
        strokeEllipse(left, top, width, height, lwidth, color, start, end) {
            if (!color || width == 0 || height == 0 || !lwidth) {
                return;
            }
            const clr = new base_canvas_js_3.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const cvt = this.m_unitcvt;
            const r = new base_canvas_js_3.Rect(cvt(left), cvt(top), cvt(width), cvt(height));
            const sa = (0, conversion_js_13.deg2rad)(start ?? 0) - Math.PI / 2;
            const ea = (0, conversion_js_13.deg2rad)(end ?? 360) - Math.PI / 2;
            this._arc(r.left + r.width / 2, r.top + r.height / 2, r.width / 2, r.height / 2, sa, ea, false)
                .strokeOpacity(clr.alpha())
                .strokeColor(clr.toHex(false))
                .lineWidth(lwidth)
                .stroke();
        }
        fillArc(cx, cy, radius, color, start, end) {
            if (!color || radius <= 0) {
                return;
            }
            const clr = new base_canvas_js_3.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const cvt = this.m_unitcvt;
            const ctx = this.m_doc;
            const rad = cvt(radius);
            const sa = (0, conversion_js_13.deg2rad)(start ?? 0) - Math.PI / 2;
            const ea = (0, conversion_js_13.deg2rad)(end ?? 360) - Math.PI / 2;
            this._arc(cvt(cx), cvt(cy), rad, rad, 0, ea, sa)
                .fillOpacity(clr.alpha())
                .fill(clr.toHex(false));
        }
        strokeArc(cx, cy, radius, lwidth, color, start, end) {
            if (!color || radius <= 0 || !lwidth) {
                return;
            }
            const clr = new base_canvas_js_3.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const cvt = this.m_unitcvt;
            const ctx = this.m_doc;
            const rad = cvt(radius);
            const sa = (0, conversion_js_13.deg2rad)(start ?? 0) - Math.PI / 2;
            const ea = (0, conversion_js_13.deg2rad)(end ?? 360) - Math.PI / 2;
            this._arc(cvt(cx), cvt(cy), rad, rad, sa, ea, false)
                .strokeOpacity(clr.alpha())
                .strokeColor(clr.toHex(false))
                .lineWidth(lwidth)
                .stroke();
        }
        _arc(x, y, radius1, radius2, startAngle, endAngle, anticlockwise) {
            if (anticlockwise == null) {
                anticlockwise = false;
            }
            const TWO_PI = 2.0 * Math.PI;
            const HALF_PI = 0.5 * Math.PI;
            const KAPPA = 4.0 * ((Math.sqrt(2) - 1.0) / 3.0);
            let deltaAng = endAngle - startAngle;
            if (Math.abs(deltaAng) > TWO_PI) {
                // draw only full circle if more than that is specified
                deltaAng = TWO_PI;
            }
            else if (deltaAng !== 0 && anticlockwise !== deltaAng < 0) {
                // necessary to flip direction of rendering
                const dir = anticlockwise ? -1 : 1;
                deltaAng = dir * TWO_PI + deltaAng;
            }
            const numSegs = Math.ceil(Math.abs(deltaAng) / HALF_PI);
            const segAng = deltaAng / numSegs;
            const handleLen = segAng / HALF_PI * KAPPA * radius1;
            let curAng = startAngle; // component distances between anchor point and control point
            let deltaCx = -Math.sin(curAng) * handleLen;
            let deltaCy = Math.cos(curAng) * handleLen; // anchor point
            let ax = x + Math.cos(curAng) * radius1;
            let ay = y + Math.sin(curAng) * radius2; // calculate and render segments
            this.m_doc.moveTo(ax, ay);
            for (let segIdx = 0; segIdx < numSegs; segIdx++) {
                // starting control point
                const cp1x = ax + deltaCx;
                const cp1y = ay + deltaCy; // step angle
                curAng += segAng; // next anchor point
                ax = x + Math.cos(curAng) * radius1;
                ay = y + Math.sin(curAng) * radius2; // next control point delta
                deltaCx = -Math.sin(curAng) * handleLen;
                deltaCy = Math.cos(curAng) * handleLen; // ending control point
                const cp2x = ax - deltaCx;
                const cp2y = ay - deltaCy; // render segment
                this.m_doc.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ax, ay);
            }
            return this.m_doc;
        }
        isVisible(rc) {
            return true;
        }
        binFonts() {
            return true;
        }
    }
    exports.PDFCanvas = PDFCanvas;
    class BlobStream extends Writable {
        _buffer;
        _chunks;
        constructor() {
            super();
            this._buffer = null;
            this._chunks = [];
        }
        _write(chunk, encoding, callback) {
            this._chunks.push(chunk);
            if (this._chunks.length > 64) {
                this._chunks = [Buffer.concat(this._chunks)];
            }
            if (callback)
                callback();
        }
        buffer() {
            if (!this._buffer) {
                this._buffer = Buffer.concat(this._chunks);
            }
            return this._buffer;
        }
    }
    const defStyle = {
        align: 'center',
        vAlign: 'middle',
        fontSize: 14,
        fontWeight: null,
        fontStyle: '',
        fontVariant: '',
        fontFamily: 'Arial',
        lineHeight: 0,
        clip: true,
        columns: 1,
        columnGap: 0,
        lineBreak: true,
    };
    function drawText(ctx, inputText, rc, drawStyle, render = true) {
        if (rc.width <= 0 || rc.height <= 0) {
            //width or height or font size cannot be 0
            return;
        }
        //console.time( 'drawtext' );
        drawStyle = { ...defStyle, ...drawStyle };
        ctx.save();
        if (drawStyle.clip) {
            ctx.rect(rc.left, rc.top, rc.width, rc.height).clip();
        }
        if (drawStyle.rotation) {
            const center = new base_canvas_js_3.Point(rc.left + rc.width / 2, rc.top + rc.height / 2);
            const rad = drawStyle.rotation / 180 * Math.PI;
            ctx.translate(center.x, center.y);
            ctx.rotate(rad);
            ctx.translate(-center.x, -center.y);
            //ctx.beginPath();
            //ctx.rect( rc.left, rc.top, rc.width, rc.height );
            //ctx.stroke( );
        }
        //ctx.textBaseline = 'bottom';
        // End points
        let fontSize = drawStyle.fontSize ?? 12;
        let textarray = [];
        let lines = inputText.split('\n');
        const columns = drawStyle.columns < 1 ? 1 : drawStyle.columns;
        const gap = drawStyle.columnGap;
        let col_width = (rc.width - gap * (columns - 1)) / columns;
        let col_left = rc.left;
        let hlimit = col_width;
        if (!drawStyle.lineBreak) {
            hlimit = 99999999;
        }
        const spaceW = _measureText(ctx, ' ');
        lines.forEach((text) => {
            let line = { width: 0, words: [], space: 0 };
            // fit in width ?
            let lwidth = _measureText(ctx, text);
            if (lwidth < hlimit) {
                line.width = lwidth;
                line.words.push({ width: lwidth, text });
                textarray.push(line);
            }
            // break line to fit in width
            else {
                // make word list & measure them
                const twords = text.split(/\s/).filter(w => w !== '');
                let words = twords.map(w => {
                    const wwidth = _measureText(ctx, w);
                    const word = {
                        width: wwidth,
                        text: w
                    };
                    return word;
                });
                // then compute lines 
                let n = 0;
                let e = 0;
                while (n < words.length) {
                    const word = words[n];
                    let test = line.width;
                    if (test) {
                        test += spaceW;
                    }
                    test += word.width;
                    if (test > col_width && e > 0) {
                        textarray.push(line);
                        // restart
                        e = 0;
                        lwidth = 0;
                        line = { width: 0, words: [], space: 0 };
                    }
                    else {
                        line.words.push(word);
                        line.width = test;
                        n++;
                        e++;
                    }
                }
                if (e) {
                    textarray.push(line);
                    line.last = true;
                }
            }
        });
        const textSize = _calcTextHeight(ctx, "A@g", fontSize);
        let lineHeight = (drawStyle.lineHeight ?? 1.3) * textSize; // * 1.2 = map to pdf 
        const nlines = textarray.length;
        if (!render) {
            return { height: nlines * lineHeight };
        }
        // calc vertical Align
        let col_top = rc.top;
        let anchor = 'bottom';
        if (columns == 1) {
            let fullHeight = lineHeight * nlines;
            if (nlines == 1) {
                lineHeight = textSize;
                fullHeight = textSize;
            }
            if (drawStyle.vAlign === 'middle') {
                col_top = rc.top + rc.height / 2 - fullHeight / 2;
                col_top += lineHeight / 2;
                anchor = 'middle';
            }
            else if (drawStyle.vAlign === 'bottom') {
                if (fullHeight < rc.height) {
                    col_top = rc.top + rc.height - fullHeight + lineHeight;
                }
                //anchor = 'top';
            }
            else {
                col_top = rc.top;
                anchor = 'top';
            }
        }
        else {
            // always top, cannot justify multi-columns vertically
            // todo: for now
            col_top += textSize;
        }
        const justify = drawStyle.align == 'justify';
        let column = columns;
        let y = col_top;
        let align = 0;
        // faster test..
        switch (drawStyle.align) {
            case 'right':
                align = 1;
                break;
            case 'center':
                align = 2;
                break;
        }
        //ctx.rect( rc.left, y, 20, lineHeight ).fill('#ff0000');
        //print all lines of text
        let idx = 1, yy = 0;
        textarray.some(line => {
            console.log(idx++, yy);
            line.space = spaceW;
            if (justify && !line.last) {
                _justify(line, col_width, spaceW);
            }
            let x = col_left;
            if (align == 1) {
                x += col_width - line.width;
            }
            else if (align == 2) {
                x += col_width / 2 - line.width / 2;
            }
            line.words.forEach(w => {
                ctx.text(w.text, x, y, {
                    baseline: anchor,
                    width: 9999999999
                });
                x += w.width + line.space;
            });
            y += lineHeight;
            yy += lineHeight;
            if (y > (rc.bottom + lineHeight)) {
                y = col_top;
                col_left += col_width + gap;
                if (--column == 0) {
                    return true;
                }
            }
        });
        ctx.restore();
        return { height: (textarray.length + 0.3) * lineHeight };
    }
    exports.drawText = drawText;
    // Calculate Height of the font
    function _calcTextHeight(ctx, text, fontSize) {
        let font = ctx._font;
        return font.ascender / 1000 * fontSize;
    }
    function _measureText(ctx, text) {
        return ctx.widthOfString(text);
    }
    function _justify(line, width, spaceW) {
        let delta = (width - line.width) / (line.words.length - 1) + spaceW;
        if (delta <= 0) {
            return;
        }
        line.width = width;
        line.space = delta;
    }
});
/**
* @file html_canvas.ts
* @author Etienne Cochard
* @copyright (c) 2021 R-libre ingenierie, all rights reserved.
*
* @description Report Generator Html Renderer
**/
define("src/renderers/html_canvas", ["require", "exports", "src/renderers/base_canvas", "src/tools/conversion", "src/tools/paper", "lib"], function (require, exports, base_canvas_js_4, conversion_js_14, paper_js_3, lib_js_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HtmlCanvas = exports.PaintCanvas = void 0;
    Object.defineProperty(exports, "PaintCanvas", { enumerable: true, get: function () { return base_canvas_js_4.PaintCanvas; } });
    function polarToCartesian(cx, cy, radius, angle) {
        const rad = (0, conversion_js_14.deg2rad)(angle);
        return {
            x: cx + (radius * Math.cos(rad)),
            y: cy + (radius * Math.sin(rad)),
        };
    }
    function gen(a, ...b) {
        // just round number values to 3 digits
        b = b.map(v => {
            if (typeof v === 'number' && isFinite(v)) {
                return Math.round(v * 10) / 10;
            }
            return v;
        });
        return String.raw(a, ...b);
    }
    function cleanText(unsafe) {
        if (!unsafe) {
            return '';
        }
        unsafe = unsafe.replaceAll('&', '&amp;');
        unsafe = unsafe.replaceAll('<', '&lt;');
        unsafe = unsafe.replaceAll('>', '&gt;');
        unsafe = unsafe.replaceAll('\n', '<br/>');
        return unsafe;
    }
    class HtmlCanvas extends base_canvas_js_4.PaintCanvas {
        m_styles;
        m_content;
        m_fonts;
        m_images;
        m_rotation;
        m_colors;
        m_stack;
        m_cpos;
        m_units;
        m_hotspots;
        m_measurer;
        constructor(options) {
            super(options);
            this.m_units = 'px';
            this.m_hotspots = null;
        }
        setResources(rsrc) {
        }
        setUnits(units) {
            switch (units) {
                case 'mm':
                    this.m_unitcvt = conversion_js_14.mm2px;
                    this.m_unitcvt_r = conversion_js_14.px2mm;
                    break;
                case 'in':
                    this.m_unitcvt = conversion_js_14.in2px;
                    this.m_unitcvt_r = conversion_js_14.px2in;
                    break;
                case 'pt':
                    this.m_unitcvt = conversion_js_14.pt2px;
                    this.m_unitcvt_r = conversion_js_14.px2pt;
                    break;
                case 'px':
                    this.m_unitcvt = conversion_js_14.u2u;
                    this.m_unitcvt_r = conversion_js_14.u2u;
                    break;
            }
            this.m_units = units;
        }
        getUnits() {
            return this.m_units;
        }
        startDoc(params) {
            this.m_cpos = { x: 0, y: 0 };
            this.m_stack = [];
            this.m_colors = [];
            this.m_content = [];
            this.m_styles = [];
            this.m_fonts = [];
            this.m_images = new Map();
            this.m_styles.push(`			body {
				position: absolute;
				left: 0;
				top: 0;
				right: 0;
				bottom: 0;
				overflow: auto;
				padding: 0;
				margin: 0;
			}

			.content {
				display: flex;
				flex-wrap: wrap;
				justify-content: center;
				background-color: #525659;
				/*min-height: 100%;*/
				min-width: min-content;
			}

			.page {
				position: relative;
				background-color: white;
				margin: 24px;
				overflow: hidden;
			}

			.f, .s, .t, .i {
				position: absolute;
			}

			.i svg, .i img {
				width: 100%;
				height: 100%;
			}

			.t {
				display: flex;
				line-height: 1em;
			}

			.zoomer {
				position: fixed;
				background-color: rgba(0,0,0,0.5);
				left: 10px;
				top: 10px;
				width: 100px;
				height: 24px;
				display: flex;
				color: white;
				align-items: center;
				font-family: sans-serif;
				font-size: 12px;
				z-index: 100;
				padding: 4px 4px 4px 8px;
				border-radius: 16px;
			}

			.btn {
				width: 20px;
				height: 20px;
				background-color: rgba(255,255,255,0.1);
				margin: 4px;
				color: white;
				border-radius: 50%;
				padding: 4px;
			}			

			.btn:hover {
				background-color: rgba(255,255,255,0.5);
			}

`);
        }
        async endDoc(callback) {
            const html_header = `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
	</head>
	<body>
`;
            const html_footer = `	</body>
</html>
`;
            const content = `		
${this.m_options.full !== false ? html_header : ''}
		<style>
${this.m_styles.join('\n')}
${this.m_fonts.join('\n')}
			* { box-sizing: border-box; user-select: none; }
			.s {border-width: 1px; border-style: solid; background-color: transparent;}
			.t {background-color: transparent;}
			.ta-l { text-align: left; justify-content: left }
			.ta-r { text-align: right; justify-content: right }
			.ta-c { text-align: center; justify-content: center }
			.ta-j { text-align: left; justify-content: left; text-align: justify; }

			.tv-t { align-items: start }
			.tv-m { align-items: center }
			.tv-b { align-items: end }

			.hotspot { position: absolute; z-index: 1; cursor: pointer; }
			.hotspot:hover { background-color: rgb(95, 167, 197, 0.20); }

		</style>
		<script>
			let czoom = 100;

			function zoom( n ) {
				let nzoom = czoom + n;
				if( nzoom>=10 && nzoom<400 ) {
					czoom = nzoom;
					let el = document.getElementById( 'content' );
					el.style.zoom = czoom+"%";
				}
			}

			// default hotspot handler
			if( !('hotspot' in window) ) {
				hotspot = ( name ) => {
					debugger;
				}
			}

		</script>
		<div class="zoomer"><span style="flex:1">Zoom:</span>
			<div class="btn" onclick="zoom(-10)" >
				<svg aria-hidden="true" focusable="false" data-prefix="fal" data-icon="minus-circle" class="svg-inline--fa fa-minus-circle fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M140 274c-6.6 0-12-5.4-12-12v-12c0-6.6 5.4-12 12-12h232c6.6 0 12 5.4 12 12v12c0 6.6-5.4 12-12 12H140zm364-18c0 137-111 248-248 248S8 393 8 256 119 8 256 8s248 111 248 248zm-32 0c0-119.9-97.3-216-216-216-119.9 0-216 97.3-216 216 0 119.9 97.3 216 216 216 119.9 0 216-97.3 216-216z"></path></svg>
			</div>
			<div class="btn" onclick="zoom(10)" >
				<svg aria-hidden="true" focusable="false" data-prefix="fal" data-icon="plus-circle" class="svg-inline--fa fa-plus-circle fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M384 250v12c0 6.6-5.4 12-12 12h-98v98c0 6.6-5.4 12-12 12h-12c-6.6 0-12-5.4-12-12v-98h-98c-6.6 0-12-5.4-12-12v-12c0-6.6 5.4-12 12-12h98v-98c0-6.6 5.4-12 12-12h12c6.6 0 12 5.4 12 12v98h98c6.6 0 12 5.4 12 12zm120 6c0 137-111 248-248 248S8 393 8 256 119 8 256 8s248 111 248 248zm-32 0c0-119.9-97.3-216-216-216-119.9 0-216 97.3-216 216 0 119.9 97.3 216 216 216 119.9 0 216-97.3 216-216z"></path></svg>
			</div>
		</div>
		<div class='content' id='content'>
${this.m_content.join('\n')}
		</div>
${this.m_options.full !== false ? html_footer : ''}		
`;
            if (this.m_options.output) {
                await lib_js_9.host.writeUtf8(this.m_options.output, content);
            }
            if (callback) {
                callback(content);
            }
        }
        startPage(pageSize) {
            const psz = (0, paper_js_3.calcPaperSize)(pageSize, 'px');
            this.m_content.push(gen `<div class="page" style="width:${psz.width}px;height:${psz.height}px">`);
        }
        endPage() {
            this.m_content.push('</div>');
        }
        _calcColorClass(color, prefix) {
            let idx = this.m_colors.indexOf(prefix + "-" + color);
            if (idx < 0) {
                idx = this.m_colors.push(color) - 1;
                let name;
                switch (prefix) {
                    case 'bk':
                        name = 'background-color';
                        break;
                    case 'brd':
                        name = 'border-color';
                        break;
                    case 'tx':
                        name = 'color';
                        break;
                }
                this.m_styles.push(`			.cx-${idx} { ${name}: ${color}; }`);
            }
            return `cx-${idx}`;
        }
        _calcRect(left, top, width, height) {
            const cvt = this.m_unitcvt;
            left = cvt(left + this.m_cpos.x);
            top = cvt(top + this.m_cpos.y);
            width = cvt(width);
            height = cvt(height);
            this._updateHotspot(left, top, width, height);
            return gen `${this.m_rotation ?? ''}left:${left}px;top:${top}px;width:${width}px;height:${height}px;`;
        }
        fillRect(left, top, width, height, color, radius) {
            if (!color || width == 0 || height == 0) {
                return;
            }
            const clr = new base_canvas_js_4.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const bkclr = clr.toHex();
            const pos = this._calcRect(left, top, width, height);
            const cclr = this._calcColorClass(bkclr, 'bk');
            let style = gen `${pos}`;
            if (radius) {
                style += `border-radius:${radius}pt`;
            }
            this.m_content.push(`			<div class="f ${cclr}" style="${style}"></div>`);
        }
        strokeRect(left, top, width, height, lwidth, color, radius) {
            if (!color || width == 0 || height == 0 || !lwidth) {
                return;
            }
            const clr = new base_canvas_js_4.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const pos = this._calcRect(left, top, width, height);
            const cclr = this._calcColorClass(clr.toHex(), 'brd');
            let style = gen `${pos}border-width:${(0, conversion_js_14.pt2px)(lwidth)}pt;`;
            if (radius) {
                style += `border-radius:${radius}pt`;
            }
            this.m_content.push(`			<div class="s ${cclr}" style="${style}"></div>`);
        }
        drawSVG(svg, left, top, width, height, fit) {
            const pos = this._calcRect(left, top, width, height);
            this.m_content.push(`			<div class="i" style="${pos}">${svg}</div>`);
        }
        drawText(left, top, width, height, text, color, options) {
            if (!color || width == 0 || height == 0 || !text) {
                return;
            }
            const clr = new base_canvas_js_4.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const pos = this._calcRect(left, top, width, height);
            let cls = this._calcColorClass(clr.toHex(), 'tx');
            let style = gen `${pos}`;
            switch (options.align) {
                case 'left':
                    cls += ' ta-l';
                    break;
                case 'center':
                    cls += ' ta-c';
                    break;
                case 'right':
                    cls += ' ta-r';
                    break;
                case 'justify':
                    cls += ' ta-j';
                    break;
            }
            switch (options.vAlign) {
                case 'top':
                    cls += ' tv-t';
                    break;
                case 'middle':
                    cls += ' tv-m';
                    break;
                case 'bottom':
                    cls += ' tv-b';
                    break;
            }
            if (options.padding) {
                style += `padding: ${options.padding}pt;`;
            }
            if (options.lineHeight != 1) {
                style += `line-height: ${options.lineHeight}em;`;
            }
            style += gen `font-size: ${options.fontSize}pt;`;
            let family = options.fontFace ?? 'sans-serif';
            if (family.indexOf('.') >= 0) {
                family = "'" + family + "'";
            }
            style += `font-family: ${family};`;
            style += `font-weight: ${options.fontWeight};`;
            this.m_content.push(`			<div class="t ${cls}" style="${style}"><span>${cleanText(text)}</span></div>`);
        }
        /**
         * measure text is really problematic because we need to compute real html rendering
         * --without renderer--
         * we use 'canvas' module
         */
        measureText(text, width, options) {
            if (!this.m_measurer) {
                const canvas = lib_js_9.host.createCanvas();
                this.m_measurer = canvas.getContext('2d');
            }
            const cvt = this.m_unitcvt;
            const rcvt = this.m_unitcvt_r;
            const padding = (0, conversion_js_14.pt2px)(options.padding);
            const dim = (0, lib_js_9.drawText)(this.m_measurer, text, new base_canvas_js_4.Rect(0, 0, cvt(width) - padding * 2, 99999), {
                align: options.align,
                vAlign: options.vAlign,
                fontSize: (0, conversion_js_14.pt2px)(options.fontSize),
                fontWeight: options.fontWeight,
                //fontStyle?: string,
                columns: options.columns ?? 1,
                columnGap: options.columnGap ? (0, conversion_js_14.pt2px)(options.columnGap) : 0,
                fontFamily: options.fontFace,
                lineHeight: options.lineHeight,
                clip: false,
            });
            return { width, height: rcvt(dim.height + padding * 2) };
        }
        line(x1, y1, x2, y2, lwidth, color) {
            if ((x1 == x2 && y1 == y2) || !lwidth || !color) {
                return;
            }
            const clr = new base_canvas_js_4.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const cclr = this._calcColorClass(clr.toHex(), 'bk');
            if (x1 == x2) {
                const pos = this._calcRect(x1, y1, (0, conversion_js_14.pt2u)(lwidth, this.m_units), y2 - y1);
                let style = gen `${pos}`;
                this.m_content.push(`			<div class="f ${cclr}" style="${style}"></div>`);
            }
            else if (y1 == y2) {
                const pos = this._calcRect(x1, y1, x2 - x1, (0, conversion_js_14.pt2u)(lwidth, this.m_units));
                let style = gen `${pos}`;
                this.m_content.push(`			<div class="f ${cclr}" style="${style}"></div>`);
            }
            else {
                debugger;
            }
        }
        drawImage(name, left, top, width, height, fit) {
            if (!name || !width || !height) {
                return;
            }
            const pos = this._calcRect(left, top, width, height);
            const img = this.m_images.get(name);
            let style = '';
            if (fit == 'cover') {
                style += 'object-fit: contain;';
            }
            this.m_content.push(`			<div class="i" style="${pos}"><img src="${img}" style="${style}"/></div>`);
        }
        fillEllipse(left, top, width, height, color, start, end) {
            if (!color || width == 0 || height == 0) {
                return;
            }
            const clr = new base_canvas_js_4.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            const cvt = this.m_unitcvt;
            let style = this._calcRect(left, top, width, height);
            let x = cvt(left);
            let y = cvt(top);
            let xr = cvt(width / 2);
            let yr = cvt(height / 2);
            const cclr = this._calcColorClass(clr.toHex(), 'bk');
            if (width == height && start == 0 && end >= 360) {
                style += 'border-radius:50%;';
                this.m_content.push(`			<div class="f ${cclr}" style="${style}"></div>`);
            }
            else {
                let sa = polarToCartesian(x, y, xr, end);
                let ea = polarToCartesian(x, y, xr, start);
                let laFlag = Math.abs(end - start) <= 180 ? "0" : "1";
                const path = gen `M ${sa.x} ${sa.y} A ${xr} ${xr} 0 ${laFlag} 0 ${ea.x} ${ea.y} L ${x} ${y} Z`;
                this.m_content.push(`<div class="i" style="${style}"><svg viewbox="0 0 ${xr * 2} ${yr * 2}" xmlns="http://www.w3.org/2000/svg"><path d="${path}"></path></svg></div>`);
            }
        }
        strokeEllipse(left, top, width, height, lwidth, color, start, end) {
            if (!color || width == 0 || height == 0 || !lwidth) {
                return;
            }
            const clr = new base_canvas_js_4.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            debugger;
        }
        fillArc(cx, cy, radius, color, start, end) {
            if (!color || radius <= 0) {
                return;
            }
            const clr = new base_canvas_js_4.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            debugger;
        }
        strokeArc(cx, cy, radius, lwidth, color, start, end) {
            if (!color || lwidth <= 0 || radius <= 0) {
                return;
            }
            const clr = new base_canvas_js_4.Color(color);
            if (clr.alpha() == 0) {
                return;
            }
            debugger;
        }
        save() {
            this.m_stack.push({ ...this.m_cpos });
        }
        restore() {
            if (this.m_stack.length == 0) {
                debugger;
            }
            this.m_cpos = this.m_stack.pop();
            this.m_rotation = null;
        }
        rotate(deg) {
            this.m_rotation = `transform: rotate( ${deg}deg );`;
        }
        translate(dx, dy) {
            if (!dx && !dy) {
                return;
            }
            this.m_cpos.x += dx;
            this.m_cpos.y += dy;
        }
        /**
         * push() / pop() to clip / unclip
         */
        clip(left, top, width, height) {
        }
        /**
         *
         */
        isVisible(rc) {
            return true;
        }
        addFont(name, data) {
            this.m_fonts.push(`			@font-face {
				font-family: "${name}";
				src: url("${data}");
			}
`);
            return Promise.resolve();
        }
        addImage(name, data) {
            this.m_images.set(name, data);
            return Promise.resolve();
        }
        binFonts() {
            return false;
        }
        beginHotSpot(name) {
            //this.m_content.push(  );			
            if (!this.m_hotspots) {
                this.m_hotspots = [];
            }
            this.m_hotspots.push({ name });
        }
        _updateHotspot(l, t, w, h) {
            if (!this.m_hotspots || this.m_hotspots.length == 0) {
                return;
            }
            let spot = this.m_hotspots[this.m_hotspots.length - 1];
            let r = l + w;
            let b = t + h;
            if (spot.left === undefined) {
                spot.left = l;
                spot.top = t;
                spot.right = r;
                spot.bottom = b;
            }
            else {
                if (spot.left < l)
                    spot.left = l;
                if (spot.top < t)
                    spot.top = t;
                if (spot.right > r)
                    spot.right = r;
                if (spot.bottom > b)
                    spot.bottom = b;
            }
        }
        endHotSpot() {
            let spot = this.m_hotspots.pop();
            this.m_content.push(gen `<div class="hotspot" style="left:${spot.left}px;top:${spot.top}px;width:${spot.right - spot.left}px;height:${spot.bottom - spot.top}px;" onclick="hotspot('${spot.name}')"></div>`);
        }
    }
    exports.HtmlCanvas = HtmlCanvas;
});
define("src/renderer", ["require", "exports", "src/renderer/rreport", "src/renderers/pdf_canvas", "src/renderers/html_canvas"], function (require, exports, rreport_js_1, pdf_canvas_js_1, html_canvas_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PDFRenderer = void 0;
    //import { ImageCanvas} from './renderers/img_canvas.js';
    class PDFRenderer {
        m_report;
        m_plugins;
        m_datasources;
        /**
         *
         */
        constructor(report) {
            this.m_plugins = [];
            if (report) {
                let data = report.save();
                this.m_report = new rreport_js_1.RReport(data);
                this.m_report.setPlugins(report.getPlugins());
            }
            else {
                this.m_report = new rreport_js_1.RReport(null);
            }
        }
        /**
         *
         */
        load_data(data) {
            const report = data;
            this.m_report = new rreport_js_1.RReport(report);
        }
        /**
         *
         */
        async render(where, options) {
            if (this.m_report) {
                let canvas;
                if (where == 'pdf') {
                    canvas = new pdf_canvas_js_1.PDFCanvas({ output: options.output });
                }
                else if (where == 'img') {
                    //canvas = new renderers.ImageCanvas( { output: options.output } );
                }
                else if (where == 'html') {
                    canvas = new html_canvas_js_1.HtmlCanvas(options);
                }
                canvas.startDoc(options);
                await this.m_report.renderItem(canvas, options.paintCtx);
                canvas.endDoc(options.callback);
            }
        }
        /**
         *
         */
        registerPlugin(plugin) {
            this.m_report.setPlugins([plugin]);
        }
        registerDataSource(datasource) {
            this.m_datasources.push(datasource);
        }
    }
    exports.PDFRenderer = PDFRenderer;
});
/**
* @file report_builder.ts
* @author Etienne Cochard
* @copyright (c) 2020-2021 R-libre ingenierie
* @licence
**/
define("src/builder", ["require", "exports", "src/x4mod", "src/elements/_mod", "src/elements/mark", "src/tools/conversion", "src/tools/make_sample", "src/editor/ereport", "src/renderers/disp_canvas", "x4/hosts/electron", "src/tools/monaco_editor", "src/renderer", "src/tools/json"], function (require, exports, x4mod_js_10, _mod_js_4, mark_js_4, conversion_js_15, make_sample_js_1, ereport_js_1, disp_canvas_js_2, electron_js_4, monaco_editor_js_2, renderer_js_1, json_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReportBuilder = exports.Selection = void 0;
    const HANDLE_SIZE = 4;
    const RULER_SIZE = 20;
    class Selection extends x4mod_js_10.EventSource {
        dpRect;
        lpRect;
        handles;
        section;
        m_locked;
        m_type;
        m_elements;
        constructor() {
            super();
            this.m_elements = [];
            this.lpRect = null;
            this.dpRect = null;
            this.handles = null;
            this.section = null;
        }
        clear(notify = true) {
            this.m_elements.forEach(el => el.selectElement(false));
            this.m_elements = [];
            this._changed(notify);
        }
        get count() {
            return this.m_elements.length;
        }
        get first() {
            return this.m_elements[0];
        }
        get empty() {
            return this.m_elements.length == 0;
        }
        get locked() {
            return this.m_locked;
        }
        forEach(cb) {
            this.m_elements.forEach(cb);
        }
        find(el) {
            return this.m_elements.findIndex((e) => e === el);
        }
        toggle(el) {
            // no sel
            if (this.empty || this.m_locked) {
                el.selectElement(true);
                this.m_elements = [el];
            }
            else {
                let index = this.find(el);
                // absent->add
                if (index < 0) {
                    this.m_elements.push(el);
                    el.selectElement(true);
                }
                // present->del
                else {
                    this.m_elements.splice(index, 1);
                    el.selectElement(false);
                }
            }
            this._changed();
        }
        set(el) {
            let oldids = [];
            this.m_elements.forEach(el => { el.selectElement(false); oldids.push(el.getUID()); });
            oldids.sort();
            if ((0, x4mod_js_10.isArray)(el)) {
                this.m_elements = el;
            }
            else {
                this.m_elements = [el];
            }
            let newids = [];
            this.m_elements.forEach(el => { el.selectElement(true); newids.push(el.getUID()); });
            newids.sort();
            let chg = false;
            if (newids.length != oldids.length) {
                chg = true;
            }
            else {
                for (let i = 0, n = oldids.length; i < n; i++) {
                    if (newids[i] != oldids[i]) {
                        chg = true;
                        break;
                    }
                }
            }
            if (chg) {
                this._changed();
            }
        }
        _changed(notify = true) {
            const n = this.count;
            if (n == 0) {
                this.m_type = null;
            }
            else if (n == 1) {
                this.m_type = this.first.getElementName();
            }
            else {
                this.m_type = 'multiple';
            }
            this.m_locked = n == 1 && (this.first.isLocked() || !this.first.isSelectable());
            this.lpRect = null;
            this.dpRect = null;
            this.handles = null;
            this.section = null;
            if (notify) {
                this.signal('change', (0, x4mod_js_10.EvChange)(this.count));
            }
        }
        is(type) {
            return this.m_type == type;
        }
    }
    exports.Selection = Selection;
    // #region Builder
    /**
     *
     */
    class ReportBuilder extends x4mod_js_10.VLayout {
        m_container;
        m_report;
        m_cpage; // page the mouse is over
        m_csection;
        m_painter;
        m_headerbar;
        m_statusbar;
        m_edScript;
        m_edDSource;
        m_edDSample;
        m_props_cont;
        m_toolbar;
        m_hierarchy;
        m_canvas;
        m_ovr_canvas;
        m_curObject; // object shown in properties
        m_uid_cache;
        m_rc_marquee; // running selection marquee
        m_marks;
        m_cursor;
        m_hit;
        m_selection;
        m_alt_on;
        m_ctrl_on;
        m_shift_on;
        m_mouse_dp;
        m_dirty;
        m_state;
        m_state_param;
        m_scroll_hz;
        m_scroll_vt;
        m_undoStack;
        m_undoSize;
        m_plugins;
        m_datasources;
        /**
         *
         */
        constructor(props) {
            super(props);
            this.m_container = new x4mod_js_10.Container({});
            this.setContent(this.m_container);
            this.setDomEvent('create', () => this._onCreate());
            this.setDomEvent('contextmenu', (e) => this._showCtxMenu(e));
            this.m_state = null;
            this.m_state_param = undefined;
            window.addEventListener('mousewheel', _lockWheelZoom, { passive: false, capture: true });
            this.m_rc_marquee = null;
            this.m_selection = new Selection();
            this.m_scroll_hz = null;
            this.m_scroll_vt = null;
            this.m_dirty = false;
            this.m_alt_on = false;
            this.m_ctrl_on = false;
            this.m_shift_on = false;
            this.m_cursor = null;
            this.m_marks = null;
            this.m_undoSize = 0;
            this.m_undoStack = [];
            this.m_hit = null;
            this._updateCursor(null, null);
            this.m_painter = new disp_canvas_js_2.DisplayCanvas({});
            this.m_plugins = [];
            this.m_datasources = [];
            // painter ask a repaint
            this.m_painter.onChange(() => {
                this._updateSelRect();
                this._update();
                this._update_ovr();
            });
            this.addShortcut('F5', 'try', () => {
                this._tryReportHtml();
            });
            x4mod_js_10.Application.instance().on('message', (ev) => {
                if (ev.msg == 'element.update') {
                    if (ev.params) {
                        const params = ev.params.split(',');
                        if (params.findIndex(x => x == 'hierarchy') >= 0) {
                            this._fillHierarchy();
                        }
                    }
                    this.startTimer('update', 30, false, () => {
                        this._updateSelRect();
                        this._update();
                        this._update_ovr();
                    });
                }
                else if (ev.msg == 'element.prop_changed') {
                    const what = ev.params;
                    if (what == 'left' || what == 'top' || what == 'width' || what == 'height') {
                        if (ev.source instanceof _mod_js_4.CSection) {
                            this._fixSections();
                        }
                    }
                }
                else if (ev.msg == 'element.refill') {
                    const { el, pos } = ev.params;
                    if (el == this.m_curObject) {
                        el.fill(this.m_props_cont, pos);
                    }
                    this._fillHierarchy();
                    this._update();
                    this._update_ovr();
                }
                else if (ev.msg == 'element.dirty') {
                    this._setDirty();
                }
                else if (ev.msg == 'report.reset') {
                    this._centerView();
                    this._updateSelRect();
                    this._update();
                    this._update_ovr();
                }
                else if (ev.msg == 'element.delete') {
                    if (ev.params.getElementName() == 'page') {
                    }
                    this._fillHierarchy();
                }
                else if (ev.msg == 'section.break_change') {
                    this._fixSections();
                }
                else if (ev.msg == 'element.created' || ev.msg == 'page.rotate' || ev.msg == 'page.resize') {
                    const el = ev.params;
                    if (el instanceof _mod_js_4.CPage) {
                        this._fixSections();
                    }
                }
            });
            this.m_selection.on('change', (ev) => {
                if (!this.dom) {
                    return;
                }
                if (ev.value) {
                    this._calcSelRect();
                }
                else {
                    this.m_hit = null;
                    this._updateCursor(null, null);
                }
                this._update();
                this._update_ovr();
                this._updateCursor(null, null);
                this._fillProperties();
                const f = this.m_selection.first;
                if (f) {
                    this.m_hierarchy.selection = f.getUID();
                }
            });
            this._createReport(null);
        }
        /**
         *
         */
        registerPlugin(plugin) {
            this.m_plugins.push(plugin);
            this.update(1000);
        }
        registerDataSource(datasource) {
            this.m_datasources.push(datasource);
        }
        /**
         *
         */
        exec(action) {
            switch (action) {
                case 'undo': {
                    this._undo();
                    break;
                }
                case 'cut': {
                    this._delSelection();
                    break;
                }
                case 'copy': {
                    this._copy();
                    break;
                }
                case 'paste': {
                    this._paste();
                    break;
                }
                case 'zoomin': {
                    this._zoom('in');
                    this._updateSelRect();
                    this._update();
                    this._update_ovr();
                    break;
                }
                case 'zoomout': {
                    this._zoom('out');
                    this._updateSelRect();
                    this._update();
                    this._update_ovr();
                    break;
                }
            }
        }
        /**
         *
         */
        render() {
            let designer;
            let editor;
            let datasource;
            this.m_statusbar = new x4mod_js_10.HLayout({
                cls: 'statusbar',
                content: [
                    new x4mod_js_10.Label({ text: '' })
                ]
            });
            this.m_headerbar = new x4mod_js_10.TabBar({
                change: (ev) => {
                    if (ev.value == 'editor') {
                        this.m_edScript.updateCompletions();
                    }
                }
            });
            this.m_canvas = new x4mod_js_10.Canvas({
                cls: 'page @fit',
                tabIndex: 0,
                paint: (ev) => { this._onPaint(ev.ctx); },
                dom_events: {
                    wheel: ev => this._onMouseWheel(ev),
                    keydown: ev => this._onKeyDown(ev),
                    keyup: ev => this._onKeyUp(ev),
                    dblclick: ev => this._onDblClick(ev),
                    pointerdown: ev => this._onMouseDown(ev),
                    pointermove: ev => this._onMouseMove(ev),
                    pointerup: ev => this._onMouseUp(ev),
                    sizechange: () => this._centerView(),
                },
            });
            this.m_ovr_canvas = new x4mod_js_10.Canvas({
                cls: 'ovr @fit',
                paint: (ev) => { this._paint_ovr(ev.ctx); },
            });
            this.m_props_cont = new x4mod_js_10.VLayout({ cls: 'properties', width: 250 });
            this.m_hierarchy = new x4mod_js_10.TreeView({
                flex: 1,
                cls: 'hierarchy',
                root: null,
                sort: false,
                selectionchange: (e) => {
                    if (e.selection) {
                        this._selectItem(e.selection.id);
                    }
                },
                renderItem: (node) => {
                    const el = this.getNodeByUID(node.id);
                    const page = el instanceof _mod_js_4.CPage;
                    const locked = el.isLocked();
                    const visible = el.isVisible();
                    return new x4mod_js_10.HLayout({
                        flex: 1,
                        cls: 'center',
                        content: [
                            new x4mod_js_10.Label({ cls: 'tree-label', flex: 1, text: node.text }),
                            page ? null : new x4mod_js_10.Icon({
                                cls: locked ? 'tree-btn bold' : 'tree-btn',
                                icon: locked ? 'resources/img/lock.svg' : 'resources/img/lock-open.svg',
                                dom_events: {
                                    click: () => { el.toggleLock(); this.m_hierarchy.updateElement(node.id); }
                                }
                            }),
                            page ? null : new x4mod_js_10.Icon({
                                cls: visible ? 'tree-btn bold' : 'tree-btn',
                                icon: visible ? 'resources/img/eye.svg' : 'resources/img/eye-slash.svg',
                                dom_events: {
                                    click: () => { el.toggleVisible(); this.m_hierarchy.updateElement(node.id); }
                                }
                            }),
                            //new Button( { icon: } ),
                        ]
                    });
                }
            });
            this.m_edScript = new monaco_editor_js_2.ScriptReportEditor({
                cls: 'x-flex',
                language: 'javascript',
                report: this.m_report,
            });
            this.m_edDSource = new monaco_editor_js_2.MonacoEditor({
                cls: 'x-flex',
                language: 'json',
                source: this.m_report.getDataSource(),
                events: {
                    change: (v) => {
                        this.m_report.setDataSource(v.value);
                    }
                }
            });
            this.m_edDSample = new monaco_editor_js_2.MonacoEditor({
                cls: 'x-flex',
                language: 'json',
                source: this.m_report.getDataSample(),
                events: {
                    change: (v) => {
                        this.m_report.setDataSample(v.value);
                    }
                }
            });
            const makeMenu = () => {
                return [
                    new x4mod_js_10.MenuItem({ text: x4mod_js_10._tr.builder.section_normal, click: () => this._createSection('generic') }),
                    new x4mod_js_10.MenuSeparator(),
                    new x4mod_js_10.MenuItem({ text: x4mod_js_10._tr.builder.section_header, click: () => this._createSection('header') }),
                    new x4mod_js_10.MenuItem({ text: x4mod_js_10._tr.builder.section_footer, click: () => this._createSection('footer') }),
                    new x4mod_js_10.MenuItem({ text: x4mod_js_10._tr.builder.section_dochead, click: () => this._createSection('doc_head') }),
                    new x4mod_js_10.MenuItem({ text: x4mod_js_10._tr.builder.section_docback, click: () => this._createSection('doc_back') }),
                ];
            };
            let plugins = [];
            this.m_report.getPlugins().forEach(p => {
                const els = p.elements;
                els?.forEach(el => {
                    let icon = el.icon;
                    if (!icon) {
                        icon = 'resources/img/btn-special.svg';
                    }
                    else if ((0, x4mod_js_10.isString)(icon)) {
                        icon = p.basedir + '/' + icon;
                    }
                    let btn = new x4mod_js_10.Button({ cls: 'tool w20', tabIndex: false, icon, tooltip: p.name + ': ' + el.name, click: () => {
                            this.createElement({ type: 'custom', reference: p.name + '.' + el.name, plugin: el, data: {} });
                        } });
                    plugins.push(btn);
                });
            });
            this.m_toolbar = new x4mod_js_10.VLayout({
                flex: 1,
                cls: 'toolsbar',
                content: [
                    new x4mod_js_10.Panel({
                        icon: 'resources/img/cube.svg',
                        title: x4mod_js_10._tr.builder.tools.objects, content: [
                            new x4mod_js_10.Button({ cls: 'tool', tabIndex: false, icon: 'resources/img/btn-text.svg', tooltip: x4mod_js_10._tr.builder.tools.text, click: () => this.createElement({ type: 'text' }) }),
                            new x4mod_js_10.Button({ cls: 'tool', tabIndex: false, icon: 'resources/img/btn-line.svg', tooltip: x4mod_js_10._tr.builder.tools.line, click: () => this.createElement({ type: 'line' }) }),
                            new x4mod_js_10.Button({ cls: 'tool', tabIndex: false, icon: 'resources/img/btn-rect.svg', tooltip: x4mod_js_10._tr.builder.tools.rect, click: () => this.createElement({ type: 'rectangle' }) }),
                            new x4mod_js_10.Button({ cls: 'tool', tabIndex: false, icon: 'resources/img/btn-circle.svg', tooltip: x4mod_js_10._tr.builder.tools.ellipse, click: () => this.createElement({ type: 'ellipse' }) }),
                            new x4mod_js_10.Button({ cls: 'tool', tabIndex: false, icon: 'resources/img/btn-image.svg', tooltip: x4mod_js_10._tr.builder.tools.image, click: () => this.createElement({ type: 'image' }) }),
                            new x4mod_js_10.Button({ cls: 'tool', tabIndex: false, icon: 'resources/img/btn-section.svg', tooltip: x4mod_js_10._tr.builder.section_sections, menu: makeMenu }),
                            new x4mod_js_10.Flex({ cls: 'wrap-break' }),
                            ...plugins,
                        ]
                    }),
                    new x4mod_js_10.Panel({
                        icon: 'resources/img/crosshairs.svg',
                        title: x4mod_js_10._tr.builder.tools.alignment, content: [
                            new x4mod_js_10.Button({ cls: 'tool w20', tabIndex: false, icon: 'resources/img/align-left.svg', tooltip: x4mod_js_10._tr.builder.tools.left, click: () => { this._align('left'); } }),
                            new x4mod_js_10.Button({ cls: 'tool w20', tabIndex: false, icon: 'resources/img/align-center.svg', tooltip: x4mod_js_10._tr.builder.tools.center, click: () => { this._align('center'); } }),
                            new x4mod_js_10.Button({ cls: 'tool w20', tabIndex: false, icon: 'resources/img/align-right.svg', tooltip: x4mod_js_10._tr.builder.tools.right, click: () => { this._align('right'); } }),
                            new x4mod_js_10.Button({ cls: 'tool w20', tabIndex: false, icon: 'resources/img/align-top.svg', tooltip: x4mod_js_10._tr.builder.tools.top, click: () => { this._align('top'); } }),
                            new x4mod_js_10.Button({ cls: 'tool w20', tabIndex: false, icon: 'resources/img/align-middle.svg', tooltip: x4mod_js_10._tr.builder.tools.middle, click: () => { this._align('middle'); } }),
                            new x4mod_js_10.Button({ cls: 'tool w20', tabIndex: false, icon: 'resources/img/align-bottom.svg', tooltip: x4mod_js_10._tr.builder.tools.bottom, click: () => { this._align('bottom'); } }),
                            new x4mod_js_10.Button({ cls: 'tool w20', tabIndex: false, icon: 'resources/img/distribute-hz.svg', tooltip: x4mod_js_10._tr.builder.tools.dist_hz, click: () => { } }),
                            new x4mod_js_10.Button({ cls: 'tool w20', tabIndex: false, icon: 'resources/img/distribute-vt.svg', tooltip: x4mod_js_10._tr.builder.tools.dist_vt, click: () => { } }),
                        ]
                    }),
                    new x4mod_js_10.Panel({
                        icon: 'resources/img/layer-group-regular.svg',
                        title: x4mod_js_10._tr.builder.tools.arrange, content: [
                            new x4mod_js_10.Button({ cls: 'tool w20', tabIndex: false, icon: 'resources/img/bring-front-solid.svg', tooltip: x4mod_js_10._tr.builder.tools.bring_front, click: () => { this._sendBack('front'); } }),
                            new x4mod_js_10.Button({ cls: 'tool w20', tabIndex: false, icon: 'resources/img/bring-forward-solid.svg', tooltip: x4mod_js_10._tr.builder.tools.bring_forward, click: () => { this._sendBack('after'); } }),
                            new x4mod_js_10.Button({ cls: 'tool w20', tabIndex: false, icon: 'resources/img/send-backward-solid.svg', tooltip: x4mod_js_10._tr.builder.tools.send_backward, click: () => { this._sendBack('before'); } }),
                            new x4mod_js_10.Button({ cls: 'tool w20', tabIndex: false, icon: 'resources/img/send-back-solid.svg', tooltip: x4mod_js_10._tr.builder.tools.send_back, click: () => { this._sendBack('back'); } }),
                        ]
                    }),
                ]
            });
            this.setContent([
                this.m_headerbar,
                designer = new x4mod_js_10.HLayout({
                    flex: 1,
                    style: { overflow: 'hidden' },
                    content: [
                        new x4mod_js_10.VLayout({
                            width: 250,
                            content: [
                                this.m_toolbar,
                                new x4mod_js_10.Separator({ sizing: 'before', orientation: 'vertical' }),
                                this.m_hierarchy
                            ]
                        }),
                        new x4mod_js_10.Separator({ sizing: 'before', orientation: 'horizontal' }),
                        new x4mod_js_10.Component({
                            flex: 1,
                            content: [this.m_canvas, this.m_ovr_canvas]
                        }),
                        new x4mod_js_10.Separator({ sizing: 'after', orientation: 'horizontal' }),
                        this.m_props_cont
                    ]
                }),
                editor = new x4mod_js_10.VLayout({
                    flex: 1,
                    cls: '@hidden',
                    content: [
                        new x4mod_js_10.HLayout({
                            flex: 1,
                            content: this.m_edScript,
                        }),
                        new x4mod_js_10.HLayout({
                            content: [
                                new x4mod_js_10.Flex(),
                                new x4mod_js_10.Button({ text: 'try HTML', click: () => this._tryReportHtml() }),
                                new x4mod_js_10.Button({ text: 'try PDF', click: () => this._tryReport() }),
                            ]
                        })
                    ]
                }),
                datasource = new x4mod_js_10.VLayout({
                    flex: 1,
                    cls: '@hidden',
                    content: [
                        new x4mod_js_10.HLayout({
                            cls: 'source-tb',
                            content: [
                                new x4mod_js_10.Button({ text: 'check', icon: 'resources/img/spell-check-regular.svg', click: () => this._checkSources() }),
                                new x4mod_js_10.Button({ text: 'generate', icon: 'resources/img/digging-light.svg', click: () => this._makeSample() }),
                            ]
                        }),
                        new x4mod_js_10.HLayout({
                            flex: 1,
                            content: [
                                this.m_edDSource,
                                new x4mod_js_10.Separator({ sizing: 'before', orientation: 'horizontal', }),
                                this.m_edDSample
                            ],
                        })
                    ]
                }),
                this.m_statusbar
            ]);
            this.m_headerbar.addPage({ id: 'designer', title: x4mod_js_10._tr.builder.tabs.designer, page: designer });
            this.m_headerbar.addPage({ id: 'editor', title: x4mod_js_10._tr.builder.tabs.script, page: editor });
            this.m_headerbar.addPage({ id: 'datasource', title: x4mod_js_10._tr.builder.tabs.datasource, page: datasource });
            this.m_headerbar.select('designer');
            this._fillHierarchy();
            this._fillProperties();
        }
        _checkSources() {
        }
        _makeSample() {
            const sources = this.m_report.getDataSources();
            const sample = (0, make_sample_js_1.makeSample)(sources);
            this.m_edDSample.source = sample;
            this.m_report.setDataSample(sample);
        }
        /**
         *
         */
        _selectItem(uid) {
            let el = null;
            this.m_report.forEach((e) => {
                if (e.getUID() == uid) {
                    el = e;
                    return true;
                }
            }, true);
            if (el) {
                this.m_selection.set([el]);
            }
        }
        /**
         *
         */
        _align(sens) {
            if (this.m_selection.count < 2) {
                return;
            }
            const lp = this.m_selection.lpRect;
            this.m_selection.forEach(e => {
                const r = e.getRect();
                switch (sens) {
                    case 'left': {
                        e.move(lp.left, r.top);
                        break;
                    }
                    case 'top': {
                        e.move(r.left, lp.top);
                        break;
                    }
                    case 'right': {
                        e.move(lp.right - r.width, r.top);
                        break;
                    }
                    case 'bottom': {
                        e.move(r.left, lp.bottom - r.height);
                        break;
                    }
                    case 'center': {
                        e.move(lp.left + lp.width / 2 - r.width / 2, r.top);
                        break;
                    }
                    case 'middle': {
                        e.move(r.left, lp.top + lp.height / 2 - r.height / 2);
                        break;
                    }
                }
            });
            this._updateSelRect();
            this._update();
            this._update_ovr();
        }
        /**
         *
         */
        _createSection(type) {
            this.m_state = null;
            const section = this.m_report.elementFactory({ type: 'section', kind: type, height: 10 }, this.m_cpage);
            this.m_cpage.addSection(section, this.m_csection);
            this.m_selection.set(section);
            this._fillHierarchy();
            this._update();
            this._update_ovr();
        }
        /**
         *
         */
        _sendBack(n) {
            if (this.m_selection.count != 1) {
                return;
            }
            let el = this.m_selection.first;
            el.sendBack(n);
            this.m_cpage.prepareZOrder();
            this._fillHierarchy();
            if (el instanceof _mod_js_4.CSection) {
                this._fixSections();
            }
            else {
                this._update();
            }
        }
        _clearState() {
            this.m_state = null;
            this.m_state_param = null;
            this._update_ovr();
        }
        /**
         *
         */
        _onKeyDown(ev) {
            let refresh = false;
            let unit = 1;
            if (this.m_report.getData('grid_on')) {
                unit = this.m_report.getData('grid_size');
                if (!unit) {
                    unit = 1;
                }
                if (this.m_ctrl_on) {
                    unit *= 10;
                }
            }
            switch (ev.key) {
                case 'Escape': {
                    this._clearState();
                    this.m_selection.clear();
                    refresh = true;
                    break;
                }
                case 'c': {
                    if (ev.ctrlKey) {
                        this._copy();
                    }
                    break;
                }
                case 'v': {
                    if (ev.ctrlKey) {
                        this._paste();
                    }
                    break;
                }
                case 'z': {
                    if (ev.ctrlKey) {
                        this._undo();
                    }
                    break;
                }
                case 'Control': {
                    this.m_ctrl_on = true;
                    break;
                }
                case 'Alt': {
                    this.m_alt_on = true;
                    break;
                }
                case 'Shift': {
                    this.m_shift_on = true;
                    break;
                }
                case 'Delete': {
                    if (this.m_state == 'moving-marker') {
                        this.m_report.delMark(this.m_state_param.marker);
                        this._clearState();
                        this._setDirty();
                    }
                    else {
                        this._delSelection();
                    }
                    break;
                }
                case 'Home': {
                    let org = this.m_report.getOrg();
                    this.m_report.setOrg(org.x, 0);
                    refresh = true;
                    break;
                }
                case 'PageUp': {
                    let org = this.m_report.getOrg();
                    let vheight = this.m_canvas.getBoundingRect().height;
                    this.m_report.setOrg(org.x, org.y + 2 * vheight / 3);
                    refresh = true;
                    break;
                }
                case 'PageDown': {
                    let org = this.m_report.getOrg();
                    let vheight = this.m_canvas.getBoundingRect().height;
                    this.m_report.setOrg(org.x, org.y - 2 * vheight / 3);
                    refresh = true;
                    break;
                }
                case 'End': {
                    let org = this.m_report.getOrg();
                    let height = this.m_report.getFullRect().height;
                    let vheight = this.m_canvas.getBoundingRect().height;
                    this.m_report.setOrg(org.x, -height + vheight);
                    refresh = true;
                    break;
                }
                case 'ArrowUp': {
                    if (this.m_shift_on) {
                        this._expandSel(0, -unit);
                    }
                    else {
                        this._offsetSel(0, -unit);
                    }
                    break;
                }
                case 'ArrowDown': {
                    if (this.m_shift_on) {
                        this._expandSel(0, unit);
                    }
                    else {
                        this._offsetSel(0, unit);
                    }
                    break;
                }
                case 'ArrowLeft': {
                    if (this.m_shift_on) {
                        this._expandSel(-unit, 0);
                    }
                    else {
                        this._offsetSel(-unit, 0);
                    }
                    break;
                }
                case 'ArrowRight': {
                    if (this.m_shift_on) {
                        this._expandSel(unit, 0);
                    }
                    else {
                        this._offsetSel(unit, 0);
                    }
                    break;
                }
            }
            if (refresh) {
                this._updateSelRect();
                this._update_ovr();
                this._update();
            }
        }
        _onKeyUp(ev) {
            switch (ev.key) {
                case 'Shift': {
                    this.m_shift_on = false;
                    break;
                }
                case 'Control': {
                    this.m_ctrl_on = false;
                    break;
                }
                case 'Alt': {
                    this.m_alt_on = false;
                    break;
                }
            }
        }
        _copy(toClipboard = true) {
            if (this.m_selection.empty) {
                return null;
            }
            let data = [];
            this.m_selection.forEach((el) => {
                data.push(el.save());
            });
            let result = JSON.stringify(data);
            if (toClipboard) {
                if (!navigator.clipboard) {
                    return null;
                }
                navigator.clipboard.writeText(result);
            }
            return data;
        }
        async _paste(data = null) {
            if (!data && navigator.clipboard) {
                const text = await navigator.clipboard.readText();
                data = JSON.parse(text);
            }
            if (data && (0, x4mod_js_10.isArray)(data)) {
                this._addUndo();
                let els = [];
                for (const el_data of data) {
                    if (!el_data.type) {
                        continue;
                    }
                    delete el_data.uid;
                    let el = this._createElement(el_data, this.m_csection ?? this.m_cpage);
                    // special case of section pasting
                    if (el_data.type == 'section') {
                        // clear all guids
                        let sec = el;
                        sec.forEach((el) => {
                            el.regenUID();
                        }, true);
                        this.m_cpage.addSection(el, this.m_csection);
                        this._fillHierarchy();
                        this._update();
                        this._update_ovr();
                        this.m_selection.set(el);
                        return;
                    }
                    else {
                        if (el) {
                            els.push(el);
                        }
                    }
                }
                this.m_selection.set(els);
                if (els.length) {
                    this.m_cpage.fixZOrder();
                    this.m_state = 'moving';
                    this._prepareSizeMove();
                }
            }
        }
        /**
         *
         */
        _delSelection() {
            if (this.m_selection.empty) {
                return;
            }
            this._addUndo();
            const del = () => {
                if (this.m_selection.is('section')) {
                    this.m_selection.first.removeFromParent();
                    this._fixSections();
                }
                else {
                    this.m_selection.forEach((e) => {
                        e.removeFromParent();
                    });
                }
                this.m_selection.clear();
                this.m_hit = null;
                this._updateCursor(null, null);
                this._update();
                this._update_ovr();
                this._fillProperties();
                this._setDirty();
            };
            // avoid killing a whole page without any question
            if (this.m_selection.is('page')) {
                x4mod_js_10.MessageBox.show({
                    message: x4mod_js_10._tr.builder.confirm_del_page,
                    buttons: ['ok', 'cancel'],
                    click: (b) => {
                        if (b == 'ok') {
                            del();
                        }
                    }
                });
            }
            else if (this.m_selection.is('section')) {
                x4mod_js_10.MessageBox.show({
                    message: x4mod_js_10._tr.builder.confirm_del_section,
                    buttons: ['ok', 'cancel'],
                    click: (b) => {
                        if (b == 'ok') {
                            del();
                        }
                    }
                });
            }
            else {
                del();
            }
        }
        /**
         *
         */
        _createMark(type) {
            this.m_canvas.focus();
            this.m_state = 'marking';
            this.m_state_param = {
                type,
                pos: 0,
            };
        }
        /**
         *
         */
        createElement(data) {
            this.m_state = 'create';
            this.m_state_param = data;
            this.m_selection.clear();
            this._update();
            this._update_ovr();
            this._setDirty();
        }
        _createElement(data, owner) {
            return this.m_report.elementFactory(data, owner);
        }
        _rectToLP(e) {
            let org = this.m_report.getOrg();
            let scale = this.m_report.getScale() / 100;
            const units = this.m_report.getUnits();
            const left = (0, conversion_js_15.px2u)((e.left - org.x) / scale, units);
            const top = (0, conversion_js_15.px2u)((e.top - org.y) / scale, units);
            const width = (0, conversion_js_15.px2u)(e.width / scale, units);
            const height = (0, conversion_js_15.px2u)(e.height / scale, units);
            return new x4mod_js_10.Rect(left, top, width, height);
        }
        _pointToLP(e) {
            let org = this.m_report.getOrg();
            let scale = this.m_report.getScale() / 100;
            const units = this.m_report.getUnits();
            const x = (0, conversion_js_15.px2u)((e.x - org.x) / scale, units);
            const y = (0, conversion_js_15.px2u)((e.y - org.y) / scale, units);
            return new x4mod_js_10.Point(x, y);
        }
        _rectToDP(e) {
            let org = this.m_report.getOrg();
            let scale = this.m_report.getScale() / 100;
            const units = this.m_report.getUnits();
            const left = (0, conversion_js_15.u2px)(e.left, units);
            const top = (0, conversion_js_15.u2px)(e.top, units);
            const width = (0, conversion_js_15.u2px)(e.width, units);
            const height = (0, conversion_js_15.u2px)(e.height, units);
            return new x4mod_js_10.Rect((left * scale) + org.x, (top * scale) + org.y, width * scale, height * scale);
        }
        _pointToDP(e) {
            let org = this.m_report.getOrg();
            let scale = this.m_report.getScale() / 100;
            const units = this.m_report.getUnits();
            const x = (0, conversion_js_15.u2px)(e.x, units);
            const y = (0, conversion_js_15.u2px)(e.y, units);
            return new x4mod_js_10.Point((x * scale) + org.x, (y * scale) + org.y);
        }
        /**
         *
         */
        _onMouseDown(ev) {
            ev.target.setPointerCapture(ev.pointerId);
            let pt = (0, x4mod_js_10.getMousePos)(ev, false);
            if (this.m_hit && this.m_hit.type == 'scroll') {
                this.m_state = 'scrolling';
            }
            else if (this.m_hit && this.m_hit.type == 'marker') {
                pt.x = this._snapGrid(pt.x, true);
                pt.y = this._snapGrid(pt.y, true);
                this.m_state = 'moving-marker';
                this.m_state_param = {
                    marker: this.m_hit.data,
                    pos: pt,
                    dpos: pt,
                };
            }
            else if (this.m_hit && this.m_hit.type == 'selection') {
                if (this.m_selection.is('section')) {
                }
                else {
                    // fast clone
                    if (this.m_ctrl_on) {
                        //this._cloneSelection();
                        //this.m_state = 'moving';
                        //this._prepareSizeMove();
                        const data = this._copy(false);
                        if (data) {
                            this._paste(data);
                        }
                    }
                    // toogle selection
                    else if (this.m_shift_on) {
                        let p = this._pointToLP(pt);
                        let hit = this.m_report.touchesPt(p);
                        if (hit) {
                            this.m_selection.toggle(hit);
                        }
                        return;
                    }
                }
                // just move/size
                if (this.m_selection.locked) {
                    return;
                }
                if (this.m_hit.subtype == 'in') {
                    this.m_state = 'moving';
                }
                else {
                    this.m_state = 'sizing';
                }
                this._prepareSizeMove();
            }
            else if (this.m_state == 'create') {
                pt.x = this._snapGrid(pt.x, true);
                pt.y = this._snapGrid(pt.y, false);
                this.m_rc_marquee = new x4mod_js_10.Rect(pt.x, pt.y, 0, 0);
                let rc = this._calcRel(this._rectToLP(this.m_rc_marquee), this.m_csection);
                this._addUndo();
                let obj = this._createElement(this.m_state_param, this.m_cpage);
                obj.initWithDef();
                obj.move(rc.left, rc.top);
                obj.size(rc.width, rc.height);
                obj.setOwner(this.m_csection);
                this.m_cpage.fixZOrder();
                obj.extraData.irect_lp = obj.getRect();
                this.m_selection.set(obj);
                this.m_selection.section = this.m_csection;
                this.m_state = 'sizing';
                this.m_hit = {
                    type: 'selection',
                    subtype: 'bottom-right',
                    delta: new x4mod_js_10.Point(0, 0),
                    data: null
                };
                this._prepareSizeMove();
            }
            else if (!this.m_state) {
                // create a ruler ?
                const vr = this.getBoundingRect();
                const tr = new x4mod_js_10.Rect(0, 0, vr.width, RULER_SIZE);
                const lr = new x4mod_js_10.Rect(0, 0, RULER_SIZE, vr.height);
                if (tr.contains(pt)) {
                    this._createMark('vmark');
                }
                else if (lr.contains(pt)) {
                    this._createMark('hmark');
                }
                else {
                    this.m_state = 'selecting';
                    this.m_rc_marquee = new x4mod_js_10.Rect(pt.x, pt.y, 0, 0);
                }
            }
            this._update_ovr();
        }
        /**
         *
         */
        _prepareSizeMove() {
            this._addUndo();
            this.m_cpage.prepareZOrder();
            // during size/move, elements are placed in the page
            // at the end they will go to the desired section.
            if (!this.m_selection.is('section')) {
                // calcul de l'offset de l'element / selection ( pour déplacement )
                this.m_selection.forEach((e) => {
                    e.enterSizeMove(this.m_cpage);
                    e.extraData.irect_lp = e.getRect();
                });
                this._calcSelRect();
            }
            // save initial params
            this.m_state_param = {
                delta: this.m_hit?.delta ?? new x4mod_js_10.Point(0, 0),
                irect_dp: new x4mod_js_10.Rect(this.m_selection.dpRect),
                irect_lp: new x4mod_js_10.Rect(this.m_selection.lpRect)
            };
        }
        _doneSizeMove() {
            this.m_selection.forEach((el) => {
                el.exitSizeMove(this.m_csection);
            });
            this.m_cpage.fixZOrder();
            this._fixSections();
            this._updateSelRect();
        }
        $_fix_rep = 0;
        _fixSections() {
            let fix = () => {
                this.m_cpage.fixSections();
                this._centerView();
                this._updateSelRect();
                this._update();
                this._update_ovr();
                this.$_fix_rep = 0;
            };
            this.$_fix_rep++;
            if (this.$_fix_rep > 20) {
                fix();
            }
            this.startTimer('sections', 0, false, fix);
        }
        /**
         *
         */
        _onMouseMove(ev) {
            // update because when using atl+tab, we never get the keyup alt because we switched to another app
            this.m_alt_on = ev.altKey;
            this.m_ctrl_on = ev.ctrlKey;
            this.m_shift_on = ev.shiftKey;
            let pt = (0, x4mod_js_10.getMousePos)(ev, false);
            this.m_mouse_dp = pt;
            this._update_ovr();
            if (this.m_state != 'sizing') {
                const sec = this.m_cpage.sectionOnPoint(this._pointToLP(pt));
                if (sec) {
                    this.m_csection = sec;
                }
            }
            if (this.m_state == 'scrolling') {
                const org = this.m_report.getOrg();
                const scale = this.m_scroll_vt.min / this.m_scroll_vt.max;
                if (this.m_hit.subtype == 'vert') {
                    let pos = pt.y - this.m_hit.delta.y;
                    this.m_report.setOrg(org.x, -pos / scale);
                }
                else {
                    let pos = pt.x - this.m_hit.delta.x;
                    this.m_report.setOrg(-pos / scale, org.y);
                }
                this._updateSelRect();
                this._update_ovr();
                this._update();
            }
            else if (this.m_state == 'moving-marker') {
                pt.x = this._snapGrid(pt.x, true);
                pt.y = this._snapGrid(pt.y, false);
                let marker = this.m_state_param.marker;
                let pdp = this._pointToLP(pt);
                marker.pos = (0, mark_js_4.getMarkOffset)(marker.type, pdp);
                this.m_state_param.dpos = pt;
                this._update_ovr();
            }
            else if (this.m_state == 'marking') {
                pt.x = this._snapGrid(pt.x, true);
                pt.y = this._snapGrid(pt.y, false);
                this.m_state_param.pos = pt;
                this._update_ovr();
            }
            else if (this.m_state == 'selecting') {
                if (this.m_rc_marquee) {
                    this.m_rc_marquee.width = pt.x - this.m_rc_marquee.left;
                    this.m_rc_marquee.height = pt.y - this.m_rc_marquee.top;
                    this._update_ovr();
                }
            }
            else if (this.m_state == 'moving') {
                pt.x -= this.m_state_param.delta.x;
                pt.y -= this.m_state_param.delta.y;
                pt.x = this._snapGrid(pt.x, true);
                pt.y = this._snapGrid(pt.y, false);
                if (this.m_shift_on) {
                    let ir = this.m_state_param.irect_dp;
                    let dx = Math.abs(ir.left - pt.x), dy = Math.abs(ir.top - pt.y);
                    if (dx > dy) {
                        pt.y = ir.top;
                    }
                    else {
                        pt.x = ir.left;
                    }
                }
                this._moveSel(pt.x, pt.y);
            }
            else if (this.m_state == 'sizing') {
                pt.x -= this.m_state_param.delta.x;
                pt.y -= this.m_state_param.delta.y;
                pt.x = this._snapGrid(pt.x, true);
                pt.y = this._snapGrid(pt.y, false);
                let ext_size = false;
                let cur_size = 0;
                if (this.m_shift_on) {
                    if (this.m_selection.is('section')) {
                        ext_size = true;
                        cur_size = this.m_selection.first.getRect().height;
                    }
                    else if (this.m_selection.is('line')) {
                        let ir = this.m_state_param.irect_dp;
                        let dx = pt.x - ir.left;
                        let dy = pt.y - ir.top;
                        let angle;
                        if (dx < 0) {
                            angle = 270 - (Math.atan(dy / -dx) * 180 / Math.PI);
                        }
                        else {
                            angle = 90 + (Math.atan(dy / dx) * 180 / Math.PI);
                        }
                        let dist = Math.round(Math.sqrt(dx * dx + dy * dy));
                        function _cos(v) {
                            return Math.round(Math.cos(v / 180 * Math.PI) * dist);
                        }
                        function _sin(v) {
                            return Math.round(Math.sin(v / 180 * Math.PI) * dist);
                        }
                        if (angle > 330 || angle < 30) { // -30 / + 30 -> 60
                            pt.x = ir.left;
                            pt.y = ir.top - dist;
                        }
                        else if (angle < 60) { // +30 / +60   -> 30
                            pt.x = ir.left + _cos(45);
                            pt.y = ir.top - _sin(45);
                        }
                        else if (angle < 120) { // +60 / +120	-> 60
                            pt.x = ir.left + dist;
                            pt.y = ir.top;
                        }
                        else if (angle < 150) { // +120 / +150	-> 30
                            pt.x = ir.left + _cos(135 - 90);
                            pt.y = ir.top + _sin(135);
                        }
                        else if (angle < 210) { // +150 / +210 -> 60
                            pt.x = ir.left;
                            pt.y = ir.top + dist;
                        }
                        else if (angle < 240) { // +210 / +240 -> 30
                            pt.x = ir.left + _cos(135);
                            pt.y = ir.top + _sin(135);
                        }
                        else if (angle < 300) { // +240 / +300 -> 60
                            pt.x = ir.left - dist;
                            pt.y = ir.top;
                        }
                        else {
                            pt.x = ir.left + _cos(225);
                            pt.y = ir.top + _sin(225);
                        }
                    }
                    else {
                        let ir = this.m_state_param.irect_dp;
                        if (ir.height == 0) {
                            pt.y = ir.top + Math.round(pt.x - ir.left);
                        }
                        else {
                            pt.y = Math.round(ir.top + (ir.width / ir.height) * (pt.x - ir.left));
                        }
                    }
                }
                this._sizeSel(pt.x, pt.y, this.m_hit.subtype);
                if (ext_size) {
                    let section = this.m_selection.first;
                    let next = this.m_cpage.nextSection(section);
                    if (next) {
                        let rn = next.getRect();
                        let delta = section.getRect().height - cur_size;
                        next.size(rn.width, rn.height - delta);
                        this._fixSections();
                    }
                }
            }
            else if (this.m_scroll_vt && this.m_scroll_vt.rc.contains(pt)) {
                this.m_hit = {
                    type: 'scroll',
                    subtype: 'vert',
                    delta: new x4mod_js_10.Point(0, pt.y - this.m_scroll_vt.rc.top),
                    data: null
                };
                this._update_ovr();
                this._updateCursor(this.m_hit.type, this.m_hit.subtype);
            }
            else if (this.m_scroll_hz && this.m_scroll_hz.rc.contains(pt)) {
                this.m_hit = {
                    type: 'scroll',
                    subtype: 'horz',
                    delta: new x4mod_js_10.Point(pt.x - this.m_scroll_hz.rc.left, 0),
                    data: null
                };
                this._update_ovr();
                this._updateCursor(this.m_hit.type, this.m_hit.subtype);
            }
            else {
                this.m_hit = null;
                if (!this.m_selection.empty && !this.m_selection.locked) {
                    this.m_hit = this._checkSelHitTest(pt);
                }
                if (!this.m_state) {
                    if (this.m_hit == null) {
                        this.m_hit = this._checkMarkers(pt);
                    }
                }
                this._updateCursor(this.m_hit?.type, this.m_hit?.subtype);
            }
        }
        /**
         *
         */
        //private _checkSections(pt: Point): CElement {
        //	const plp = this._pointToLP( pt );
        //	this.m_hitSection = this.m_report.getCurPage().sectionOnPoint( plp );
        //	return this.m_hitSection;
        //}
        _checkMarkers(pt) {
            let markers = this.m_report.getMarks();
            if (markers) {
                for (const m of markers) {
                    let pm = this._pointToDP({ x: m.pos, y: m.pos });
                    let mp = (0, mark_js_4.getMarkOffset)(m.type, pm);
                    let mt = (0, mark_js_4.getMarkOffset)(m.type, pt);
                    if (Math.abs(mp - mt) < 4) {
                        return {
                            type: 'marker',
                            subtype: m.type,
                            delta: { x: mp - mt, y: mp - mt },
                            data: m
                        };
                    }
                }
            }
            return null;
        }
        /**
         *
         */
        _onMouseUp(ev) {
            this.dom.releasePointerCapture(ev.pointerId);
            if (this.m_state == 'marking') {
                this.m_report.addMark(this.m_state_param.type, this._pointToLP(this.m_state_param.pos));
                this._setDirty();
                this._update_ovr();
            }
            else if (this.m_state == 'moving-marker') {
                this._setDirty();
            }
            else if (this.m_state == 'selecting') {
                let rsel = this._rectToLP(this.m_rc_marquee);
                // single point ---> click
                if (Math.abs(rsel.width) < 2 && Math.abs(rsel.height) < 2) {
                    let hit = this.m_report.touchesPt({ x: rsel.left, y: rsel.top });
                    if (hit && !(hit instanceof _mod_js_4.CSection)) {
                        if (this.m_shift_on) {
                            this.m_selection.toggle(hit);
                        }
                        else {
                            this.m_selection.set(hit);
                        }
                    }
                    else {
                        //const hitSec = this._checkSections( {x:rsel.left, y:rsel.top} );
                        if (this.m_csection) {
                            this.m_selection.set(this.m_csection);
                        }
                        else if (!this.m_shift_on) {
                            this.m_selection.clear();
                        }
                    }
                }
                else {
                    // full selection
                    let inc = rsel.right < rsel.left || rsel.bottom < rsel.top;
                    rsel = rsel.normalized();
                    let els = this.m_report.select(rsel, inc);
                    this.m_selection.set(els);
                }
            }
            else if (this.m_state == 'moving') {
                this._doneSizeMove();
            }
            else if (this.m_state == 'sizing') {
                this._doneSizeMove();
            }
            this.m_state = null;
            this.m_state_param = undefined;
            this.m_marks = null;
            this.m_rc_marquee = null;
            this._update_ovr();
        }
        _onDblClick(ev) {
            if (this.m_selection.count == 1) {
                this.m_selection.first.edit();
            }
        }
        /**
         *
         */
        _checkSelHitTest(pt) {
            const rc = this.m_selection.dpRect;
            if (!rc) {
                return null;
            }
            // find witch handle
            const hit = this.m_selection.handles.getParts().find(h => h.rect.contains(pt));
            if (hit) {
                const pto = this._pointToDP({ x: hit.data.x, y: hit.data.y });
                return {
                    type: 'selection',
                    subtype: hit.data.code,
                    delta: new x4mod_js_10.Point(pt.x - pto.x, pt.y - pto.y),
                    data: null
                };
            }
            // special case line selection
            if (this.m_selection.is('line')) {
                let line = this.m_selection.first;
                let plp = this._pointToLP(pt);
                const rp = this.m_cpage.getRect();
                plp.x -= rp.left;
                plp.y -= rp.top;
                if (line.touchesPt(plp)) {
                    return {
                        type: 'selection',
                        subtype: 'in',
                        delta: new x4mod_js_10.Point(pt.x - rc.left, pt.y - rc.top),
                        data: null
                    };
                }
            }
            else {
                // rect inflated by handle size
                let ir = rc.normalized();
                // inside
                if (ir.width == 0) {
                    ir.left -= 1;
                    ir.width += 1;
                }
                if (ir.height == 0) {
                    ir.top -= 1;
                    ir.height += 1;
                }
                if (!this.m_selection.is('section')) {
                    if (ir.contains(pt)) {
                        const delta = new x4mod_js_10.Point(pt.x - rc.left, pt.y - rc.top);
                        return {
                            type: 'selection',
                            subtype: 'in',
                            delta,
                            data: null
                        };
                    }
                }
            }
            return null;
        }
        _expandSel(dx, dy) {
            if (this.m_selection.empty) {
                return;
            }
            this.m_selection.forEach(el => {
                const r = el.getRect();
                el.size(r.width + dx, r.height + dy);
            });
            this._updateSelRect(); // because some element refused the new position & can may been moved to another page
            this.m_marks = this._calcMarkers();
            if (this.m_selection.is('section')) {
                this._fixSections();
            }
            this._update();
            this._update_ovr();
            this._setDirty();
        }
        _offsetSel(dx, dy) {
            if (this.m_selection.empty || this.m_selection.is('section')) {
                return;
            }
            this.m_selection.forEach(el => {
                const r = el.getRect();
                el.move(r.left + dx, r.top + dy);
            });
            this._updateSelRect(); // because some element refused the new position & can may been moved to another page
            this.m_marks = this._calcMarkers();
            this._update();
            this._update_ovr();
            this._setDirty();
        }
        _moveSel(x, y) {
            this.m_selection.dpRect.left = x;
            this.m_selection.dpRect.top = y;
            this.m_selection.lpRect = this._rectToLP(this.m_selection.dpRect);
            let lp = this.m_selection.lpRect;
            let ip = this.m_state_param.irect_lp;
            // faster
            if (this.m_selection.count == 1) {
                const el = this.m_selection.first;
                el.move(lp.left, lp.top);
            }
            else {
                this.m_selection.forEach(e => {
                    const old_rc = e.extraData.irect_lp;
                    const ix = old_rc.left - ip.left;
                    const iy = old_rc.top - ip.top;
                    e.move(lp.left + ix, lp.top + iy);
                });
            }
            this._updateSelRect(); // because some element refused the new position & can may been moved to another page
            this.m_marks = this._calcMarkers();
            this._update();
            this._update_ovr();
            this._setDirty();
        }
        _sizeSel(x, y, type) {
            let idp = this.m_selection.dpRect;
            let l = idp.left, r = idp.right, w = idp.width;
            let t = idp.top, b = idp.bottom, h = idp.height;
            // horz size
            switch (type) {
                case 'top-left':
                case 'left':
                case 'bottom-left': {
                    l = x,
                        w = r - l;
                    break;
                }
                case 'top-right':
                case 'right':
                case 'bottom-right': {
                    w = x - l;
                    break;
                }
                case 'abs': {
                    w = x;
                    break;
                }
            }
            // vert size
            switch (type) {
                case 'top-left':
                case 'top':
                case 'top-right': {
                    t = y,
                        h = b - t;
                    break;
                }
                case 'bottom-left':
                case 'bottom':
                case 'bottom-right': {
                    h = y - t;
                    break;
                }
                case 'abs': {
                    h = y;
                    break;
                }
            }
            let dp = new x4mod_js_10.Rect(l, t, w, h);
            let lp = this._rectToLP(dp);
            this.m_selection.dpRect = dp;
            this.m_selection.lpRect = lp;
            let ip = this.m_state_param.irect_lp;
            let gx = lp.width / ip.width;
            let gy = lp.height / ip.height;
            // faster
            if (this.m_selection.count == 1) {
                const obj = this.m_selection.first;
                obj.move(lp.left, lp.top);
                obj.size(lp.width, lp.height);
            }
            else {
                this.m_selection.forEach((e) => {
                    let re = e.getRect(), or = e.extraData.irect_lp;
                    let ix = or.left - ip.left, iy = or.top - ip.top;
                    re.left = lp.left + ix * gx;
                    re.top = lp.top + iy * gy;
                    re.width = or.width * gx;
                    re.height = or.height * gy;
                    e.move(re.left, re.top);
                    e.size(re.width, re.height);
                });
            }
            if (this.m_selection.is('section')) {
                this._fixSections();
            }
            this.m_marks = this._calcMarkers();
            this._updateSelRect(); // because some element refused the new position
            this._update();
            this._update_ovr();
            this._setDirty();
        }
        _calcRel(rc, relTo) {
            const sr = relTo.getRect();
            return new x4mod_js_10.Rect(rc).moveBy(-sr.left, -sr.top);
        }
        /**
         *
         */
        _onCreate() {
            this._centerView();
        }
        _centerView() {
            let rc = this.m_canvas.getBoundingRect();
            let rr = this._rectToDP(this.m_report.getFullRect());
            rc.left += RULER_SIZE;
            rc.width -= RULER_SIZE;
            rc.top += RULER_SIZE;
            rc.height -= RULER_SIZE;
            let { x, y } = this.m_report.getOrg();
            if (rc.width > rr.width) {
                x = RULER_SIZE + (rc.width - rr.width) / 2;
            }
            if (rc.height > rr.height) {
                y = RULER_SIZE + (rc.height - rr.height) / 2;
            }
            this.m_report.setOrg(x, y);
        }
        /**
         *
         */
        _zoom(mode) {
            if (mode == 'reset') {
                this.m_report.setScale(100);
            }
            else {
                this.m_report.incScale(mode == 'in' ? 10 : -10);
            }
            this._centerView();
            new x4mod_js_10.Toaster({
                message: `Zoom: ${this.m_report.getScale()}%`
            }).show();
        }
        _onMouseWheel(ev) {
            if (ev.ctrlKey) {
                this._zoom(ev.deltaY < 0 ? 'in' : 'out');
            }
            else {
                let d = ev.deltaY < 0 ? 50 : -50;
                if (ev.shiftKey) {
                    this.m_report.scroll(d, 0);
                }
                else {
                    this.m_report.scroll(0, d);
                }
            }
            ev.stopPropagation();
            this._updateSelRect();
            this._update();
            this._update_ovr();
        }
        /**
         * render the report into the canvas
         */
        async _onPaint(ctx) {
            ctx.fillStyle = _mod_js_4.Theme.margins;
            ctx.fillRect(0, 0, ctx.width + 1, ctx.height + 1);
            ctx.save();
            let rv = this.m_canvas.getBoundingRect().moveTo(0, 0);
            const rrv = this._rectToLP(rv);
            const pc = {
                mode: 'edit',
                getFont: null,
                getImage: null,
            };
            this.m_painter.startDoc({
                ctx,
                view: rrv
            });
            this.m_report.renderItem(this.m_painter, pc);
            await this.m_painter.endDoc();
            ctx.restore();
        }
        /**
         * paint the overlay elements
         * ie: selection marquee, selection rect, indicators...
         */
        _paint_marquee(ctx) {
            let rs = this.m_rc_marquee.normalized();
            // special selection rendering for lines
            if (this.m_selection.is('line')) {
            }
            else {
                rs = rs.normalized();
                ctx.beginPath();
                ctx.strokeStyle = _mod_js_4.Theme.selection.lines;
                ctx.fillStyle = _mod_js_4.Theme.selection.back;
                ctx.rect(rs.left, rs.top, rs.width, rs.height);
                ctx.fill();
                ctx.stroke();
            }
        }
        /**
         *
         */
        _paint_selection(ctx) {
            const sel = this.m_selection;
            let rs = sel.dpRect;
            if (!rs) {
                return;
            }
            ctx.save();
            if (this.m_state == 'moving' || this.m_state == 'sizing') {
                ctx.globalAlpha = 0.3;
            }
            let isSection = false;
            const color = sel.locked ? _mod_js_4.Theme.selection.locked : _mod_js_4.Theme.selection.lines;
            ctx.strokeStyle = color;
            ctx.beginPath();
            // special selection rendering for lines
            if (sel.is('line')) {
                ctx.moveTo(rs.left, rs.top);
                ctx.lineTo(rs.right, rs.bottom);
                ctx.stroke();
            }
            else if (sel.is('section')) {
                isSection = true;
                ctx.moveTo(rs.left, rs.bottom);
                ctx.lineTo(rs.right, rs.bottom);
            }
            else {
                rs = rs.normalized();
                ctx.rect(rs.left, rs.top, rs.width, rs.height);
            }
            ctx.stroke();
            ctx.beginPath();
            // render them
            sel.handles.forEach((r) => {
                ctx.rect(r.rect.left, r.rect.top, r.rect.width, r.rect.height);
            });
            ctx.fillStyle = _mod_js_4.Theme.selection.handles;
            ctx.stroke();
            ctx.fill();
            ctx.restore();
            let rx = sel.lpRect;
            if (!rx.isEmpty()) {
                // taille
                const units = this.m_report.getUnits();
                const iw = (0, x4mod_js_10.roundTo)(rx.width, 1);
                const ih = (0, x4mod_js_10.roundTo)(rx.height, 1);
                let text = isSection ? `${Math.abs(ih)} ${units}` : `${Math.abs(iw)} x ${Math.abs(ih)} ${units}`;
                let type = isSection ? '' : (sel.count == 1 ? `${sel.first.getComputedName()} : ` : (0, x4mod_js_10.sprintf)(x4mod_js_10._tr.builder.multi_sel, sel.count));
                (0, mark_js_4.showLabel)(ctx, type + text, rs.left, rs.bottom + 4, _mod_js_4.Theme.selection.label.back, _mod_js_4.Theme.selection.label.text);
            }
        }
        /**
         *
         */
        _paint_construction_marks(ctx) {
            ctx.save();
            ctx.beginPath();
            ctx.lineWidth = 1.5;
            const rw = 2;
            this.m_marks.hmarks.forEach((m) => {
                let pts = [];
                for (let i = 0; i < m.dpos.length; i++) {
                    pts.push(this._pointToDP({ x: m.pos, y: m.dpos[i] }));
                }
                // line
                let l = pts.length - 1;
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                ctx.lineTo(pts[l].x, pts[l].y);
                // crosses
                pts.forEach((p) => {
                    ctx.moveTo(p.x - rw, p.y + rw);
                    ctx.lineTo(p.x + rw, p.y - rw);
                    ctx.moveTo(p.x + rw, p.y + rw);
                    ctx.lineTo(p.x - rw, p.y - rw);
                });
                ctx.strokeStyle = _mod_js_4.Theme.marks.vert;
                ctx.stroke();
                //
            });
            this.m_marks.vmarks.forEach((m) => {
                let pts = [];
                for (let i = 0; i < m.dpos.length; i++) {
                    pts.push(this._pointToDP({ y: m.pos, x: m.dpos[i] }));
                }
                // line
                let l = pts.length - 1;
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                ctx.lineTo(pts[l].x, pts[l].y);
                // crosses
                pts.forEach((p) => {
                    ctx.moveTo(p.x - rw, p.y + rw);
                    ctx.lineTo(p.x + rw, p.y - rw);
                    ctx.moveTo(p.x + rw, p.y + rw);
                    ctx.lineTo(p.x - rw, p.y - rw);
                });
                ctx.strokeStyle = _mod_js_4.Theme.marks.horz;
                ctx.stroke();
                //
            });
            ctx.restore();
        }
        /**
         *
         */
        _paint_scrollbars(ctx) {
            // fake scroll bars
            const rv = this.m_canvas.getBoundingRect(); // view
            rv.top += RULER_SIZE;
            rv.height -= RULER_SIZE;
            const scrolling = this.m_state == 'scrolling';
            let rp = this._rectToDP(this.m_report.getFullRect()); // page
            let scale = this.m_report.getScale();
            let org = { ...this.m_report.getOrg() };
            org.x *= scale / 100;
            org.y *= scale / 100;
            // vt
            let miny = Math.min(rp.top, rv.top);
            let maxy = Math.max(rp.bottom, rv.bottom);
            let rngy = Math.max(maxy - miny, rv.height);
            if (rngy > rv.height || (scrolling && this.m_scroll_vt)) {
                // we do not change range while scrolling
                let barw = 8;
                let hit = scrolling;
                let offy = -rp.top / rngy * rv.height;
                let barh = scrolling ? this.m_scroll_vt.rc.height : rv.height / rngy * rv.height;
                //calc all
                if (this.m_hit?.type == 'scroll' && this.m_hit.subtype == 'vert') {
                    hit = true;
                    barw = 10;
                }
                const rc = new x4mod_js_10.Rect(rv.width - 4 - barw / 2, RULER_SIZE + offy, barw, barh);
                this.m_scroll_vt = {
                    rc,
                    min: rv.height,
                    max: rngy,
                    pos: org.y,
                };
                ctx.beginPath();
                ctx.rect(rc.left, rc.top, rc.width, rc.height);
                ctx.fillStyle = hit ? 'black' : 'rgba(0,0,0,0.5)';
                ctx.fill();
            }
            else {
                this.m_scroll_vt = null;
            }
            // hz
            let minx = Math.min(rp.left, rv.left);
            let maxx = Math.max(rp.right, rv.width);
            let rngx = Math.max(maxx - minx, rv.width);
            if (rngx > rv.width || (scrolling && this.m_scroll_hz)) {
                // we do not change range while scrolling
                let barh = 8;
                let hit = scrolling;
                let offx = -rp.left / rngx * rv.width;
                let barw = scrolling ? this.m_scroll_hz.rc.width : rv.width / rngx * rv.width;
                //calc all
                if (this.m_hit?.type == 'scroll' && this.m_hit.subtype == 'horz') {
                    hit = true;
                    barh = 10;
                }
                const rc = new x4mod_js_10.Rect(RULER_SIZE + offx, rv.height - 4 - barh / 2, barw, barh);
                this.m_scroll_hz = {
                    rc,
                    min: rv.width,
                    max: rngx,
                    pos: org.y,
                };
                ctx.beginPath();
                ctx.rect(rc.left, rc.top, rc.width, rc.height);
                ctx.fillStyle = hit ? 'black' : 'rgba(0,0,0,0.5)';
                ctx.fill();
            }
            else {
                this.m_scroll_hz = null;
            }
        }
        /**
         * paint the overlay
         * overlay in in pixel units & not subject to scaling
         * so handles are always 8x8 pixels on screen
         */
        _paint_ovr(ctx) {
            ctx.clearRect(0, 0, ctx.width + 1, ctx.height);
            if (this.m_rc_marquee) {
                this._paint_marquee(ctx);
            }
            if (!this.m_selection.empty) {
                this._paint_selection(ctx);
            }
            if (this.m_marks) {
                this._paint_construction_marks(ctx);
            }
            let rv = this.m_canvas.getBoundingRect(); // view
            rv.moveTo(0, 0);
            if (this.m_state == 'marking' || this.m_state == 'moving-marker') {
                const marking = this.m_state == 'marking';
                // during positionning, pos is in dp
                const type = marking ? this.m_state_param.type : this.m_state_param.marker.type;
                const dpt = marking ? this.m_state_param.pos : this.m_state_param.dpos;
                const lpt = marking ? this._pointToLP(dpt) : { x: this.m_state_param.marker.pos, y: this.m_state_param.marker.pos };
                let dpos = (0, mark_js_4.getMarkOffset)(type, dpt);
                let lpos = (0, mark_js_4.getMarkOffset)(type, lpt);
                const units = this.m_report.getUnits();
                const lab = (0, x4mod_js_10.roundTo)(lpos, 2) + units;
                if (marking) {
                    (0, mark_js_4.paintMarker)(ctx, type, dpos, rv);
                }
                if (type == 'hmark') {
                    (0, mark_js_4.showLabel)(ctx, lab, dpos + 20, this.m_state_param.pos.y + 20, _mod_js_4.Theme.selection.lines, _mod_js_4.Theme.size.text);
                }
                else {
                    (0, mark_js_4.showLabel)(ctx, lab, this.m_state_param.pos.x + 20, dpos + 20, _mod_js_4.Theme.selection.lines, _mod_js_4.Theme.size.text);
                }
            }
            this._paintRulers(ctx);
            let markers = this.m_report.getMarks();
            if (markers) {
                markers.forEach((m) => {
                    let pt = this._pointToDP({ x: m.pos, y: m.pos });
                    (0, mark_js_4.paintMarker)(ctx, m.type, (0, mark_js_4.getMarkOffset)(m.type, pt), rv);
                });
            }
            this._paint_scrollbars(ctx);
        }
        _paintRulers(ctx) {
            if (!this.m_cpage) {
                return;
            }
            let rlp = this.m_cpage.getRect();
            if (this.m_csection) {
                rlp = this.m_csection.getRect();
            }
            const rdp = this._rectToDP(rlp);
            const rv = this.m_canvas.getBoundingRect().moveTo(0, 0);
            const ru = this.m_report.getUnits();
            const unit = (0, conversion_js_15.u2px)(1, ru) * this.m_report.getScale() / 100;
            let mul = 1;
            // in inches, we use 1/10 display
            if (ru == 'in') {
                mul = 1 / 10;
            }
            //in pixels, we use *10 unit display
            else if (ru == 'px') {
                mul = 10;
            }
            const tkunit = unit * mul;
            const mouse = this.m_mouse_dp ? this._pointToLP(this.m_mouse_dp) : undefined;
            // inside background
            ctx.beginPath();
            ctx.rect(0, 0, rv.width, RULER_SIZE);
            ctx.rect(0, RULER_SIZE, RULER_SIZE, rv.height - RULER_SIZE);
            ctx.fillStyle = _mod_js_4.Theme.rulers.back;
            ctx.fill();
            // outside background
            ctx.beginPath();
            ctx.rect(0, 0, rdp.left, RULER_SIZE);
            ctx.rect(rdp.right, 0, rv.width - rdp.right + RULER_SIZE, RULER_SIZE);
            ctx.rect(0, RULER_SIZE, RULER_SIZE, rdp.top - RULER_SIZE);
            ctx.rect(0, rdp.bottom, RULER_SIZE, rv.height - rdp.top);
            ctx.fillStyle = _mod_js_4.Theme.rulers.outside;
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = _mod_js_4.Theme.rulers.text;
            //	hz
            ctx.textBaseline = 'bottom';
            ctx.textAlign = 'center';
            for (let x = 0, v = 0; x < rdp.width + tkunit; x += tkunit, v++) {
                if ((v % 10) == 0) {
                    ctx.moveTo(x + rdp.left, RULER_SIZE);
                    ctx.lineTo(x + rdp.left, RULER_SIZE - 6);
                    ctx.fillText((v * mul) + '', x + rdp.left, 13);
                }
                else if (tkunit > 3) {
                    ctx.moveTo(x + rdp.left, RULER_SIZE);
                    ctx.lineTo(x + rdp.left, RULER_SIZE - 2);
                }
            }
            //	vt
            ctx.textBaseline = 'bottom';
            ctx.textAlign = 'center';
            for (let y = 0, v = 0; y < rdp.height + tkunit; y += tkunit, v++) {
                if ((v % 10) == 0) {
                    ctx.moveTo(RULER_SIZE, y + rdp.top);
                    ctx.lineTo(RULER_SIZE - 6, y + rdp.top);
                    ctx.save();
                    ctx.translate(RULER_SIZE - 7, y + rdp.top);
                    ctx.rotate((0, conversion_js_15.deg2rad)(-90));
                    ctx.fillText(v + '', 0, 0);
                    ctx.restore();
                }
                else if (tkunit > 3) {
                    ctx.moveTo(RULER_SIZE, y + rdp.top);
                    ctx.lineTo(RULER_SIZE - 2, y + rdp.top);
                }
            }
            ctx.strokeStyle = _mod_js_4.Theme.rulers.mark;
            ctx.stroke();
            if (mouse) {
                ctx.beginPath();
                const x = this._snapGrid(rdp.left + mouse.x * unit, true);
                ctx.moveTo(x, 0);
                ctx.lineTo(x, RULER_SIZE);
                const y = this._snapGrid(rdp.top + mouse.y * unit, false);
                ctx.moveTo(0, y);
                ctx.lineTo(RULER_SIZE, y);
                ctx.strokeStyle = _mod_js_4.Theme.rulers.cursor;
                ctx.stroke();
            }
        }
        /**
         * compute selection rectangles (device point & logical points)
         */
        _calcSelRect() {
            if (this.m_selection.empty) {
                return;
            }
            let rect = null;
            let pts;
            if (this.m_selection.count == 1) {
                const el = this.m_selection.first;
                rect = el.getAbsRect(false);
                pts = el.getHandles(rect.left, rect.top);
            }
            else {
                this.m_selection.forEach((e) => {
                    let rc = e.getAbsRect();
                    if (!rect) {
                        rect = rc;
                    }
                    else {
                        rect.combine(rc);
                    }
                });
                pts = _mod_js_4.CElement.makeHandles(rect);
            }
            // simplify handles
            const rw = HANDLE_SIZE;
            const rgn = new _mod_js_4.Region();
            pts.forEach(p => {
                const r1 = this._rectToDP(new x4mod_js_10.Rect(p.x, p.y, 0, 0)).inflatedBy(rw);
                if (!rgn.touches(r1)) {
                    rgn.add(r1, p);
                }
            });
            this.m_selection.lpRect = rect;
            this.m_selection.dpRect = this._rectToDP(rect);
            this.m_selection.handles = rgn;
        }
        /**
         *
         */
        _updateSelRect() {
            this._calcSelRect();
            this._update_ovr();
        }
        /**
         *
         */
        _showCtxMenu(ev) {
            let t = ev.target;
            if (t.nodeName == 'TEXTAREA' || t.nodeName == 'INPUT') {
                return;
            }
            let sel_menu;
            if (!this.m_selection.empty) {
                let elMenu = [];
                if (this.m_selection.count == 1) {
                    elMenu = this.m_selection.first.getContextMenu().map(x => {
                        return new x4mod_js_10.MenuItem(x);
                    });
                    if (elMenu.length) {
                        elMenu.push(new x4mod_js_10.MenuSeparator());
                    }
                }
                sel_menu = [
                    ...elMenu,
                    new x4mod_js_10.MenuItem({
                        icon: 'resources/img/layer-group-regular.svg',
                        text: x4mod_js_10._tr.builder.tools.arrange,
                        items: [
                            new x4mod_js_10.MenuItem({ icon: 'resources/img/bring-front-solid.svg', text: x4mod_js_10._tr.builder.tools.bring_front, click: () => this._sendBack('front') }),
                            new x4mod_js_10.MenuItem({ icon: 'resources/img/bring-forward-solid.svg', text: x4mod_js_10._tr.builder.tools.bring_forward, click: () => this._sendBack('after') }),
                            new x4mod_js_10.MenuItem({ icon: 'resources/img/send-backward-solid.svg', text: x4mod_js_10._tr.builder.tools.send_backward, click: () => this._sendBack('before') }),
                            new x4mod_js_10.MenuItem({ icon: 'resources/img/send-back-solid.svg', text: x4mod_js_10._tr.builder.tools.send_back, click: () => this._sendBack('back') }),
                        ]
                    }),
                    new x4mod_js_10.MenuSeparator(),
                    new x4mod_js_10.MenuItem({ icon: 'resources/img/cut.svg', text: x4mod_js_10._tr.global.cut, click: () => this._delSelection() }),
                    new x4mod_js_10.MenuItem({ icon: 'resources/img/copy.svg', text: x4mod_js_10._tr.global.copy, click: () => this._copy() }),
                    new x4mod_js_10.MenuItem({ icon: 'resources/img/paste.svg', text: x4mod_js_10._tr.global.paste, click: () => this._paste() }),
                    new x4mod_js_10.MenuSeparator(),
                ];
            }
            else {
                sel_menu = [
                    new x4mod_js_10.MenuItem({ text: x4mod_js_10._tr.global.paste, click: () => this._paste() }),
                    new x4mod_js_10.MenuSeparator(),
                ];
            }
            let menu = new x4mod_js_10.Menu({
                items: [
                    ...sel_menu,
                    new x4mod_js_10.MenuItem({ text: x4mod_js_10._tr.builder.try_report + ' (html)', click: () => this._tryReportHtml() }),
                    new x4mod_js_10.MenuItem({ text: x4mod_js_10._tr.builder.try_report + ' (pdf)', click: () => this._tryReport() }),
                ]
            });
            menu.displayAt(ev.clientX, ev.clientY, 'top left');
        }
        async _tryReport() {
            let tfname = electron_js_4.host.getPath('temp') + '/test.pdf';
            let renderer = new renderer_js_1.PDFRenderer(this.m_report);
            const displayPDF = () => {
                let dlg = new x4mod_js_10.Dialog({
                    width: '75%',
                    height: '75%',
                    title: 'PDF Viewer',
                    closable: true,
                    movable: true,
                    sizable: true,
                    maximizable: true,
                    content: [
                        new x4mod_js_10.Component({
                            tag: 'embed',
                            cls: '@pdfobject',
                            attrs: {
                                width: '100%',
                                height: '100%',
                                type: 'application/pdf',
                                src: 'file:///' + tfname
                            }
                        })
                    ]
                });
                dlg.show();
            };
            renderer.render('pdf', {
                output: tfname,
                paintCtx: {
                    printInfo: {
                        rootData: (0, json_js_2.parseJSON)(this.m_report.getDataSample())
                    }
                },
                callback: displayPDF
            });
        }
        async _tryReportHtml() {
            let tfname = electron_js_4.host.getPath('temp') + '/test.html';
            let renderer = new renderer_js_1.PDFRenderer(this.m_report);
            const displayHtml = () => {
                let dlg = new x4mod_js_10.Dialog({
                    width: '75%',
                    height: '75%',
                    title: 'HTML Viewer',
                    closable: true,
                    movable: true,
                    sizable: true,
                    maximizable: true,
                    content: [
                        new x4mod_js_10.Component({
                            tag: 'iframe',
                            attrs: {
                                width: '100%',
                                height: '100%',
                                src: 'file:///' + tfname
                            }
                        })
                    ]
                });
                dlg.show();
            };
            renderer.render('html', {
                output: tfname,
                paintCtx: {
                    printInfo: {
                        rootData: (0, json_js_2.parseJSON)(this.m_report.getDataSample())
                    }
                },
                callback: displayHtml
            });
        }
        /**
         * refresh report view
         */
        _update() {
            this.m_canvas.redraw(1);
        }
        /**
         * refresh overlay view
         */
        _update_ovr() {
            this.m_ovr_canvas.redraw(0);
        }
        /**
         * update cursor according to the current mouseHit element
         */
        _updateCursor(type, subtype) {
            let crs = 'url(resources/img/pointer.png) 4 4, crosshair';
            switch (type) {
                case 'scroll': {
                    crs = 'pointer';
                    break;
                }
                case 'marker': {
                    switch (subtype) {
                        case 'hmark':
                            crs = 'col-resize';
                            break;
                        //					case 'page-brk': 
                        case 'vmark':
                            crs = 'row-resize';
                            break;
                    }
                    break;
                }
                case 'selection': {
                    switch (subtype) {
                        default:
                        case 'in':
                            crs = 'move';
                            break;
                        case 'top-left':
                        case 'bottom-right':
                            crs = 'se-resize';
                            break;
                        case 'top-right':
                        case 'bottom-left':
                            crs = 'ne-resize';
                            break;
                        case 'top':
                        case 'bottom':
                            crs = 'ns-resize';
                            break;
                        case 'left':
                        case 'right':
                            crs = 'ew-resize';
                            break;
                    }
                    break;
                }
                //case 'none': crs = 'arrow'; break;
                //case 'create': crs = 'crosshair'; break;
                //case 'scroll': break;
            }
            if (crs !== this.m_cursor) {
                this.m_cursor = crs;
                this.setStyleValue('cursor', this.m_cursor);
            }
        }
        /**
         * move an offset to the grid
         * if grid>0 && not alt pressed
         */
        _snapGrid(iv, horz) {
            let v = iv;
            if (this.m_report.getData('grid_on') && this.m_report.getData('grid_size') > 0 && !this.m_alt_on) {
                const r_scale = this.m_report.getScale() / 100;
                let g_scale = this.m_report.getData('grid_size') * r_scale;
                const org = this.m_report.getOrg();
                if (horz)
                    iv -= org.x;
                else
                    iv -= org.y;
                v = (0, conversion_js_15.px2u)(iv, this.m_report.getUnits());
                v = Math.round(v / g_scale) * g_scale;
                v = (0, conversion_js_15.u2px)(v, this.m_report.getUnits());
                if (horz)
                    v += org.x;
                else
                    v += org.y;
            }
            return v;
        }
        /**
         * compute markers
         */
        _calcMarkers() {
            if (this.m_selection.empty) {
                return null;
            }
            let hmarks = [];
            let vmarks = [];
            let found = false;
            function addMark(ar, pos, ...dots) {
                found = true;
                let m = ar.find((v) => v.pos == pos);
                if (!m) {
                    ar.push({
                        pos,
                        dots: new Set(dots),
                        dpos: null
                    });
                }
                else {
                    dots.forEach(d => m.dots.add(d));
                }
            }
            function eq(a, b) {
                return Math.abs(a - b) < 0.0001;
            }
            let rref = this.m_selection.lpRect;
            let hmref = rref.left + rref.width / 2;
            let vmref = rref.top + rref.height / 2;
            const children = this.m_report.getChildren(true, true);
            children.forEach((e) => {
                // don't align on sections
                if (e instanceof _mod_js_4.CSection) {
                    return;
                }
                // don't align on ourself
                if (this.m_selection.find(e) >= 0) {
                    return;
                }
                let re = e.getAbsRect();
                //	horizontal
                let mid = re.left + re.width / 2;
                if (eq(rref.left, re.left) || eq(rref.left, re.right) || eq(rref.left, mid)) {
                    addMark(hmarks, rref.left, re.top, re.bottom, rref.top, rref.bottom);
                }
                if (eq(rref.right, re.left) || eq(rref.right, re.right) || eq(rref.right, mid)) {
                    addMark(hmarks, rref.right, re.top, re.bottom, rref.top, rref.bottom);
                }
                if (eq(mid, hmref)) {
                    addMark(hmarks, mid, re.top, re.bottom, vmref);
                }
                // vertical, we only check elements on the same page
                const ep = e.getPage();
                mid = re.top + re.height / 2;
                if (eq(rref.top, re.top) || eq(rref.top, re.bottom) || eq(rref.top, mid)) {
                    addMark(vmarks, rref.top, re.left, re.right, rref.left, rref.right);
                }
                if (eq(rref.bottom, re.top) || eq(rref.bottom, re.bottom) || eq(rref.bottom, mid)) {
                    addMark(vmarks, rref.bottom, re.left, re.right, rref.left, rref.right);
                }
                if (eq(mid, vmref)) {
                    addMark(vmarks, mid, re.left, re.right, hmref);
                }
            });
            let markers = this.m_report.getMarks();
            let rv = this._rectToLP(this.getBoundingRect().moveTo(0, 0));
            if (markers) {
                markers.forEach((m) => {
                    if (m.type == 'hmark') {
                        if (eq(rref.left, m.pos) || eq(rref.right, m.pos) || eq(hmref, m.pos)) {
                            addMark(hmarks, m.pos, rv.top, rv.bottom);
                        }
                    }
                    else if (m.type == 'vmark') {
                        if (eq(rref.top, m.pos) || eq(rref.bottom, m.pos) || eq(vmref, m.pos)) {
                            addMark(vmarks, m.pos, rv.left, rv.right);
                        }
                    }
                });
            }
            if (!found) {
                return null;
            }
            hmarks.forEach((m) => {
                m.dpos = [...m.dots.values()].sort((a, b) => a - b);
                m.dots = null;
            });
            vmarks.forEach((m) => {
                m.dpos = [...m.dots.values()].sort((a, b) => a - b);
                m.dots = null;
            });
            return {
                hmarks,
                vmarks
            };
        }
        /**
         *
         */
        _fillProperties() {
            let el;
            if (this.m_selection.empty) {
                el = this.m_report;
            }
            else if (this.m_selection.count == 1) {
                el = this.m_selection.first;
            }
            if (el) {
                let edit = el.buildEditors();
                this.m_props_cont.setContent(edit, false);
                el.fill(this.m_props_cont, false);
            }
            else {
                this.m_props_cont.setContent([], false);
            }
            this.m_curObject = el;
        }
        _createReport(data) {
            this.m_hit = null;
            this.m_report = new ereport_js_1.EReport(data);
            this.m_report.setPlugins(this.m_plugins);
            this.m_report.setDataSources(this.m_datasources);
            this.m_painter.setResources(this.m_report.getResources());
            this.m_cpage = this.m_report.getCurPage();
            this.m_cpage.fixZOrder();
            this.m_csection = null;
            this.m_selection.clear(false);
            this._updateCursor(null, null);
        }
        /**
         *
         */
        getNodeByUID(uid) {
            if (!this.m_uid_cache || !this.m_uid_cache.has(uid)) {
                this.m_uid_cache = new Map();
                this.m_report.forEach(e => this.m_uid_cache.set(e.getUID(), e), true);
            }
            return this.m_uid_cache.get(uid);
        }
        /**
         *
         */
        _fillHierarchy() {
            if (this.m_state == 'moving' || this.m_state == 'sizing') {
                return;
            }
            function fillNode(el) {
                let icon = undefined;
                let name = el.getElementName();
                let ename = el.getData('name');
                let uid = el.getUID();
                if (!uid) {
                    debugger;
                }
                let cls = name;
                switch (name) {
                    case 'page': break;
                    case 'text': {
                        icon = 'resources/img/btn-text.svg';
                        break;
                    }
                    case 'line': {
                        icon = 'resources/img/btn-line.svg';
                        break;
                    }
                    case 'image': {
                        icon = 'resources/img/btn-image.svg';
                        break;
                    }
                    case 'section': {
                        icon = 'resources/img/btn-section.svg';
                        ename = el.getComputedName();
                        break;
                    }
                    case 'custom': {
                        icon = 'resources/img/btn-special.svg';
                        break;
                    }
                    case 'rectangle': {
                        icon = 'resources/img/btn-rect.svg';
                        break;
                    }
                    case 'ellipse': {
                        icon = 'resources/img/btn-circle.svg';
                        break;
                    }
                    case 'report': {
                        break;
                    }
                    default: {
                        console.error('unknown type', name);
                        break;
                    }
                }
                const node = {
                    id: uid,
                    text: ename ?? name,
                    icon: icon,
                    cls: name,
                };
                if (el instanceof _mod_js_4.CContainer) {
                    const children = [];
                    el.forEach(sub => {
                        children.push(fillNode(sub));
                    }, false);
                    node.children = children;
                    node.open = true;
                }
                return node;
            }
            const root = fillNode(this.m_report);
            this.m_hierarchy.refreshRoot(root);
        }
        /**
         * clear all elements
         */
        clear() {
            this._clear(false);
        }
        _clear(beforeLoad) {
            //CBaseElement.clearCache( );
            this.m_selection.clear();
            this.m_hit = null;
            this.m_state = null;
            this.m_state_param = null;
            this.m_dirty = false;
            if (!beforeLoad) {
                this._createReport(null);
                this._centerView();
                this._update();
                this._update_ovr();
                this._fillProperties();
                this._fillHierarchy();
            }
        }
        isDirty() {
            return this.m_dirty;
        }
        /**
         *
         */
        _setDirty() {
            this.m_dirty = true;
        }
        /**
         * load the report
         */
        load(data) {
            this._clear(true);
            this._createReport(data);
            this._centerView();
            this._fillProperties();
            this._update();
            this._update_ovr();
            _mod_js_4.userColors.clear();
            this.m_report.enumColors(_mod_js_4.userColors);
            this.m_edScript.report = this.m_report;
            this.m_edDSource.source = this.m_report.getDataSource();
            this.m_edDSample.source = this.m_report.getDataSample();
            this._fillHierarchy();
            if (data.builder_options) {
                this.m_report.setOrg(data.builder_options.org.x, data.builder_options.org.y);
                this.m_report.setScale(data.builder_options.scale);
            }
        }
        /**
         * save the report
         */
        save() {
            this.m_dirty = false;
            let data = this.m_report.save();
            let bo = {
                org: this.m_report.getOrg(),
                scale: this.m_report.getScale(),
            };
            // add this to keep current zoom & display offset
            data.builder_options = bo;
            return data;
        }
        /**
         * really quick & dirty undo
         */
        async _addUndo() {
            // save selection
            let selection = [];
            this.m_selection.forEach(e => {
                selection.push(e.getUID());
            });
            let data = {
                org: this.m_report.getOrg(),
                scale: this.m_report.getScale(),
                data: this.m_report.save(),
                selection,
            };
            let json = JSON.stringify(data);
            let buffer = await electron_js_4.host.compress(Buffer.from(json));
            this.m_undoStack.push(buffer);
            this.m_undoSize += buffer.length;
            if (this.m_undoSize > 10_000_000 || this.m_undoStack.length > 100) {
                this.m_undoStack.shift();
            }
        }
        async _undo() {
            let top = this.m_undoStack.pop();
            if (top) {
                this.m_undoSize -= top.length;
                this.m_selection.clear();
                const buffer = await electron_js_4.host.decompress(top);
                const json = JSON.parse(buffer.toString());
                this._createReport(json.data);
                this.m_report.setOrg(json.org.x, json.org.y);
                this.m_report.setScale(json.scale);
                let map = new Map();
                this.m_report.forEach(e => map.set(e.getUID(), e), true);
                // reconstruct selection
                let els = [];
                json.selection.forEach(uid => {
                    let el = map.get(uid);
                    if (el) {
                        els.push(el);
                    }
                });
                this.m_selection.set(els);
                this._fillHierarchy();
            }
        }
    }
    exports.ReportBuilder = ReportBuilder;
    function _lockWheelZoom(ev) {
        if (ev.ctrlKey) {
            ev.preventDefault();
            //ev.stopPropagation( );
        }
    }
});
define("src/i18n", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EN = exports.FR = void 0;
    exports.FR = {
        menus: {},
        main: {
            recent_files: "Fichiers récents",
            start: "Démarrer",
            open: "Ouvrir...",
            new: "Nouveau",
            file_saved: "Modifications enregistrées",
            invalid_format: "Format de fichier invalide",
            ask_save: "Voulez-vous enregistrer les modifications ?",
            about: "A propos",
            copyright: "<p>Copyright © 2021 R-Libre. Tous droits réservés</p><p><i style='font-size:80%'>Avertissement : Ce programme est protégé par la loi sur le droit d'auteur et les conventions internationales. Toute reproduction ou distribution partielle ou totale du logiciel, par quelque moyen que ce soit, est strictement interdite. Toute personne ne respectant pas ces dispositions se rendra coupable du délit de contrefaçon et sera passible des sanctions pénales prévues par la loi.</i></p>",
        },
        builder: {
            section_sections: "Sections...",
            section_header: "Entête",
            section_footer: "Pied_de_page",
            section_normal: "Standard",
            section_dochead: "Page_de_garde",
            section_docback: "Dernière_de_couverture",
            tools: {
                objects: "Objets",
                text: "Texte",
                line: "Ligne",
                rect: "Rectangle",
                ellipse: "Cercle",
                image: "Image",
                alignment: "Alignements",
                left: "Gauche",
                center: "Centre",
                right: "Droite",
                top: "Haut",
                middle: "Milieu",
                bottom: "Bas",
                dist_hz: "Distribution Hz",
                dist_vt: "Distribution Vt",
                arrange: "Ordre",
                bring_front: "Amener devant",
                bring_forward: "Monter",
                send_backward: "Descendre",
                send_back: "Envoyer derrière",
            },
            tabs: {
                designer: "Designer",
                script: "Script",
                datasource: "Data Source",
            },
            confirm_del_page: "Voulez-vous réellement supprimer la page et tous ce qu'elle contient ?",
            confirm_del_section: "Voulez-vous réellement supprimer la section et tout ce qu'elle contient ?",
            multi_sel: "multiple( {0} ): ",
            try_report: "Essayer le rapport",
        },
        elements: {
            properties: "Propriétés",
            position: "Position",
            defaults: "Défauts",
            links: "Liens",
            name: "nom",
            bad_name: "le nom ne peut comporter que des lettres ou '_'.",
            link: "lien",
            fill: "Remplissage",
            lock: "Vérouillé",
            image: {
                click_to_choose: "cliquez pour choisir l'image...",
                fit: "Alignement",
                cover: "Recouvrement",
                contain: "Contenu",
                fill: "Remplissage"
            },
            line: {
                title: "Ligne",
                caps: "terminaison",
                round: "round",
                square: "square",
                butt: "butt",
            },
            page: {
                pageno: "Page {0}",
                size: "Taille",
                width: "largeur",
                height: "hauteur",
                orientation: "Orientation",
                portrait: "portrait",
                landscape: "paysage",
                font: "police",
            },
            report: {
                font: {
                    as_doc: "<idem document>",
                    as_page: "<idem page>",
                },
                grid: "Grille",
                grid_mode: "Mode",
                grid_size: "taille",
                units: "Unités",
                font_name: "Police",
                resources: "Ressources",
                images: "Images...",
                fonts: "Polices..."
            },
            section: {
                break: "Rupture",
                break_none: "aucune",
                break_before: "avant",
                break_after: "après",
                name_header: "Entête",
                name_footer: "Pied_de_page",
                name_body: "Contenu",
                name_dochead: "Page_de_garde",
                name_docback: "Dernière_de_couverture",
                split: "Séccable",
                repeat: "Répétitions",
            },
            shape: {
                extra: "Extra",
                percent: "pourcentage",
                border: "Bordure",
            },
            text: {
                border: "Bordure",
                font: "Police",
                alignment: "Alignement",
                spacing: "Espacement",
                lineheight: "haut. ligne",
                padding: "padding",
                rotation: "Rotation",
                rotation2: "rotation",
                text: "Texte",
                autogrow: "grossissement auto",
                nowwrap: "sans retour auto",
                radius: "rayon"
            }
        },
        datasources: {
            document: {
                description: "Document",
                pagenum: "Numéro de page",
                pagecount: "Nombre de pages",
                name: "Nom du document",
            },
            system: {
                description: "Système",
                date: "Date courante",
            }
        },
        explorer: {
            add: "Ajouter",
            del: "Supprimer",
        },
        textedit: {
            field: "Champ",
            field_tip: "Insère un champd e données",
            icon: "Icone",
            icon_tip: "Insère une icone ou une emoji (windows + ';')",
            prompt: "Saisissez le codepoint de l'icone (ex: f012)",
            title: "Saisie de texte",
            script: "Script",
            field_sel: 'Sélection de champ',
        }
    };
    exports.EN = {
        main: {
            recent_files: "Recent files",
            start: "Start",
            open: "Open...",
            new: "New",
            file_saved: "Modifications saved",
            invalid_format: "Invalid file formar",
            ask_save: "Do you wan't to save modifications ?",
            about: "About",
            copyright: "<p>Copyright © 2021 R-Libre. Tous droits réservés</p><p><i style='font-size:80%'>Disclaimer: This program is protected by copyright law and international conventions.Any reproduction or partial or total distribution of the software, by any means whatsoever, is strictly prohibited.Anyone not respecting these provisions will be guilty of the offense for counterfeit and will be liable to the criminal penalties provided for by law.</i></p>",
        },
        builder: {
            section_sections: "Sections...",
            section_header: "Header",
            section_footer: "Footer",
            section_normal: "Standard",
            section_dochead: "Cover page",
            section_docback: "Back cover",
            tools: {
                objects: "Objects",
                text: "Text",
                line: "Line",
                rect: "Rectangle",
                ellipse: "Circle",
                image: "Image",
                alignment: "Alignments",
                left: "Left",
                center: "Center",
                right: "Right",
                top: "Top",
                middle: "Middle",
                bottom: "Bottom",
                dist_hz: "Distribute Hz",
                dist_vt: "Distribute Vt",
                arrange: "Arrange",
                bring_front: "Bring to front",
                bring_forward: "Bring forward",
                send_backward: "Send backward",
                send_back: "Send to back",
            },
            tabs: {
                designer: "Designer",
                script: "Script",
                datasource: "Data Source",
            },
            confirm_del_page: "Do you really wan't to delete the page and all of it\s elements ?",
            confirm_del_section: "Do you really wan't to delete the section and all of it\s elements ?",
            multi_sel: "multiple( {0} ): ",
            try_report: "Try...",
        },
        elements: {
            properties: "Properties",
            position: "Position",
            defaults: "Defaults",
            links: "Links",
            name: "name",
            bad_name: "name must be letters or '_'.",
            link: "link",
            fill: "Fill",
            lock: "Lock",
            image: {
                click_to_choose: "click to choose the image...",
                fit: "Alignment",
                cover: "Cover",
                contain: "Contain",
                fill: "Fill"
            },
            line: {
                title: "Line",
                caps: "line end",
                round: "round",
                square: "square",
                butt: "butt",
            },
            page: {
                pageno: "Page {0}",
                size: "Page size",
                width: "width",
                height: "height",
                orientation: "Orientation",
                portrait: "portrait",
                landscape: "landscape",
                font: "font",
            },
            report: {
                font: {
                    as_doc: "<as document>",
                    as_page: "<as page>",
                },
                grid: "Grid",
                grid_mode: "Grid mode",
                grid_size: "size",
                units: "Units",
                font_name: "Font",
                resources: "Resources",
                images: "Images...",
                fonts: "Fonts..."
            },
            section: {
                break: "break",
                break_none: "none",
                break_before: "before",
                break_after: "after",
                name_header: "Header",
                name_footer: "Footer",
                name_body: "Body",
                name_dochead: "Cover page",
                name_docback: "Back cover",
                split: "Splittable",
                repeat: "Repeat count",
            },
            shape: {
                extra: "Extra",
                percent: "percent",
                border: "Bordure",
            },
            text: {
                border: "Border",
                font: "Font",
                alignment: "Alignment",
                spacing: "Spacing",
                lineheight: "line height",
                padding: "padding",
                rotation: "Rotation",
                rotation2: "rotation",
                text: "Text",
                autogrow: "auto grow",
                nowwrap: "no word wrap",
                radius: 'radius',
            }
        },
        datasources: {
            document: {
                description: "Document object",
                pagenum: "Page number",
                pagecount: "Page count",
                name: "Document name",
            },
            system: {
                description: "System Object",
                date: "Current date",
            }
        },
        explorer: {
            add: "Ajouter",
            del: "Supprimer",
        },
        textedit: {
            field: "Field",
            field_tip: "Insert a data field",
            icon: "Icon",
            icon_tip: "Insert icon or emoji (windows + ';')",
            prompt: "Enter the icon code point (ex: f012)",
            title: "Text input",
            script: "Script",
            field_sel: 'Field selection',
        }
    };
});
/**
 * @file main.ts
 * @description: application entry point
 * @author: Etienne Cochard
 * @licence
 * Copyright (c) 2019-2021 R-libre ingenierie
 */
define("src/main_designer", ["require", "exports", "src/x4mod", "src/tools", "src/tools/plugins", "x4/hosts/electron", "src/builder", "src/i18n"], function (require, exports, x4mod_js_11, tools_js_29, plugins_js_1, electron_js_5, builder_js_1, i18n_js_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.editor = exports.Editor = void 0;
    (0, x4mod_js_11.extendTranslation)('fr', i18n_js_9.FR);
    (0, x4mod_js_11.selectLanguage)('fr');
    electron_js_5.host.ipc.send('setLang', 'fr');
    globalThis._tr = x4mod_js_11._tr;
    let debug_mode = 0;
    let WINDOW_TITLE = '';
    // :: SETUP APP ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    if ((0, tools_js_29.isElectron)() || 1) {
        const { ipcRenderer } = electron_js_5.host.require('electron');
        ipcRenderer.on('openFile', () => exports.editor.openFile());
        ipcRenderer.on('createFile', () => exports.editor.createFile());
        ipcRenderer.on('save', () => exports.editor.save());
        ipcRenderer.on('saveAs', () => exports.editor.saveAs());
        ipcRenderer.on('undo', () => exports.editor.exec('undo'));
        ipcRenderer.on('cut', () => exports.editor.exec('cut'));
        ipcRenderer.on('copy', () => exports.editor.exec('copy'));
        ipcRenderer.on('paste', () => exports.editor.exec('paste'));
        ipcRenderer.on('zoomin', () => exports.editor.exec('zoomin'));
        ipcRenderer.on('zoomout', () => exports.editor.exec('zoomout'));
        ipcRenderer.on('about', () => exports.editor.showAbout());
        ipcRenderer.on('quit', () => exports.editor.askQuit());
        const pkg = electron_js_5.host.require('./package.json');
        WINDOW_TITLE = pkg.title;
        (0, tools_js_29.setWindowTitle)(WINDOW_TITLE);
    }
    /**
     * Boite d'ouverture de dossier
     * affichée uniquement au démarrage de l'appli
     */
    class OpenBox extends x4mod_js_11.Dialog {
        constructor() {
            super({
                width: 800,
                height: 450,
                title: '',
                movable: true,
                closable: true,
            });
            let list;
            this.form.updateContent([
                new x4mod_js_11.HLayout({
                    cls: 'main',
                    content: [
                        new x4mod_js_11.Image({ src: './resources/img/logo-red.svg' }),
                        new x4mod_js_11.Label({ text: WINDOW_TITLE }),
                    ]
                }),
                new x4mod_js_11.HLayout({
                    flex: 1,
                    content: [
                        new x4mod_js_11.Panel({
                            flex: 1,
                            title: x4mod_js_11._tr.main.recent_files,
                            content: [
                                list = new x4mod_js_11.ListView({
                                    flex: 1,
                                    items: [],
                                    renderItem: (itm) => {
                                        return new x4mod_js_11.HLayout({
                                            tooltip: itm.id,
                                            content: [
                                                new x4mod_js_11.Label({ flex: 1, text: itm.text }),
                                                new x4mod_js_11.Label({ text: itm.data.date }),
                                            ]
                                        });
                                    },
                                    click: (ev) => {
                                        let item = ev.context;
                                        exports.editor.load(item.id);
                                        this.close();
                                    }
                                }),
                            ]
                        }),
                        new x4mod_js_11.Panel({
                            flex: 1,
                            title: x4mod_js_11._tr.main.start,
                            content: [
                                new x4mod_js_11.ListView({
                                    flex: 1,
                                    items: [
                                        { id: 1, icon: 0xf802, text: x4mod_js_11._tr.main.open },
                                        { id: 2, icon: 0xf65e, text: x4mod_js_11._tr.main.new },
                                    ],
                                    renderItem: (itm) => {
                                        return new x4mod_js_11.HLayout({
                                            content: [
                                                new x4mod_js_11.Icon({ icon: itm.icon }),
                                                new x4mod_js_11.Label({ text: itm.text })
                                            ]
                                        });
                                    },
                                    click: (ev) => {
                                        let item = ev.context;
                                        this.close();
                                        switch (item.id) {
                                            case 1: {
                                                exports.editor.openFile();
                                                break;
                                            }
                                            case 2: {
                                                exports.editor.createFile();
                                                break;
                                            }
                                        }
                                    }
                                }),
                            ]
                        }),
                    ]
                }),
            ], [
                new x4mod_js_11.Button({ text: x4mod_js_11._tr.global.cancel, click: () => this.close() })
            ]);
            this._fillItems(list);
        }
        async _fillItems(list) {
            let path = electron_js_5.host.require('path');
            let filenames = exports.editor.local_storage.get('last_open', []);
            let items = [];
            for (let fn of filenames) {
                try {
                    let stat = electron_js_5.host.stat(fn);
                    if (stat) {
                        items.push({
                            id: fn,
                            text: path.basename(fn),
                            data: { date: (0, x4mod_js_11.formatIntlDate)(new Date(stat.atime)) }
                        });
                    }
                }
                catch (e) {
                    // ignored
                }
            }
            list.items = items;
        }
    }
    /**
     *
     */
    class MainPage extends x4mod_js_11.VLayout {
        m_editor;
        constructor(props) {
            super(props);
        }
        /**
         * construct the page
         */
        render() {
            this.setContent([
                this.m_editor = new builder_js_1.ReportBuilder({
                    flex: 1,
                }),
            ]);
        }
        save() {
            return this.m_editor.save();
        }
        load(data) {
            this.m_editor.load(data);
        }
        new() {
            this.m_editor.clear();
        }
        isDirty() {
            return this.m_editor.isDirty();
        }
        componentCreated() {
            new OpenBox().show(true);
            const exePath = process.cwd();
            console.log(`looking into '${exePath}' for plugins & datasources`);
            (0, plugins_js_1.loadPlugins)(exePath + '/plugins', (xx) => {
                this.m_editor.registerPlugin(xx);
            });
            this.loadDataSources(exePath + '/datasources');
        }
        async loadDataSources(root) {
            try {
                let sources = await electron_js_5.host.readDir(root);
                for (let path of sources) {
                    let fpath = root + '/' + path;
                    let basedir = fpath;
                    let s = electron_js_5.host.stat(fpath);
                    if (s.isDir) {
                        fpath = root + '/' + path + '/' + path + '.js';
                    }
                    try {
                        let module = await electron_js_5.host.readUtf8(fpath);
                        let plugEP = new Function(module);
                        let xx = plugEP();
                        if (xx && ('elements' in xx)) {
                            xx.name = electron_js_5.host.getPathPart(path, 'filename');
                            xx.basedir = basedir;
                            this.m_editor.registerDataSource(xx);
                        }
                    }
                    catch (e) {
                        console.error(`error loading datasource ${path}`, e);
                    }
                }
            }
            catch (e) {
            }
        }
        exec(action) {
            this.m_editor.exec(action);
        }
    }
    /**
     *
     */
    class Editor extends x4mod_js_11.Application {
        debugMode;
        m_file_name; // file name
        m_editor;
        constructor() {
            // read the package infos
            const pkg = electron_js_5.host.require('./package.json');
            super({
                app_name: pkg.title,
                app_version: pkg.version,
                app_uid: pkg.name + '-' + pkg.version,
                locale: 'fr-FR'
            });
            this.debugMode = debug_mode;
            if (debug_mode) {
                this.user_data.app_path = process.cwd() + '/../data/';
            }
            else {
                this.user_data.app_path = process.cwd() + '/data/';
            }
            this.m_editor = new MainPage({
                cls: 'x-fit',
                id: 'root',
            });
            this.mainView = this.m_editor;
        }
        /**
         * demande de choisir un fichier .report / .report.json a ouvrir
         */
        openFile() {
            (0, tools_js_29.openFile)({ 'packed file': 'report', 'json file': 'report.json' }, (filenames) => {
                this.load(filenames[0]);
            });
        }
        /**
         * crée un nouveau fichier
         */
        createFile() {
            this.new();
        }
        /**
         * enregistre le fichier
         * demande le chemin si nouveau fichier
         */
        save() {
            if (!this.m_file_name) {
                this.saveAs();
            }
            else {
                this._save(this.m_file_name);
            }
        }
        /**
         * enregistre le fichier sous un nouveau nom
         */
        saveAs() {
            (0, tools_js_29.saveFile)('no-name', { 'packed file': 'report', 'json file': 'report.json' }, (filename) => {
                if (filename) {
                    this._save(filename);
                    this.m_file_name = filename;
                    this._addLastOpen(filename);
                    (0, tools_js_29.setWindowTitle)(WINDOW_TITLE + ' - ' + filename);
                }
            });
        }
        /**
         *
         */
        exec(action) {
            this.m_editor.exec(action);
        }
        /**
         * ajoute le nom de fichier a liste liste des derniers fichiers ouverts
         */
        _addLastOpen(filename) {
            // remove & place at top
            let last = this.local_storage.get('last_open', []);
            let idx = last.indexOf(filename);
            if (idx >= 0) {
                last.splice(idx, 1);
            }
            last.unshift(filename);
            this.local_storage.set('last_open', last);
        }
        /**
         * enregistre le fichier
         * @param filename
         */
        async _save(filename) {
            const data = this.m_editor.save();
            let json = JSON.stringify(data /*later, this._replacer*/);
            try {
                if (filename.match(/.*\.json$/gi)) {
                    await electron_js_5.host.writeUtf8(filename, json);
                }
                else {
                    let buffer = await electron_js_5.host.compress(Buffer.from(json));
                    await electron_js_5.host.writeBinary(filename, buffer);
                }
                new x4mod_js_11.Toaster({
                    message: x4mod_js_11._tr.main.file_saved
                }).show();
            }
            catch (err) {
                console.log(err);
                x4mod_js_11.MessageBox.show(err);
            }
        }
        /**
         * charge le fichier de data json
         */
        async load(filename, quiet = false) {
            this._askSave(async () => {
                try {
                    let json;
                    if (filename.match(/.*\.json$/gi)) {
                        const buffer = await electron_js_5.host.readUtf8(filename);
                        // remove comments
                        try {
                            json = JSON.parse(buffer);
                        }
                        catch (x) {
                            const cleaned = buffer.replace(/\/\/[^"]*$/gm, ''); //slow
                            json = JSON.parse(cleaned);
                        }
                    }
                    else {
                        let data = await electron_js_5.host.readBinary(filename);
                        const buffer = await electron_js_5.host.decompress(data);
                        json = JSON.parse(buffer.toString());
                    }
                    if (!json) {
                        throw new Error(x4mod_js_11._tr.main.invalid_format);
                    }
                    this.m_file_name = filename;
                    this._addLastOpen(filename);
                    this.m_editor.load(json);
                    (0, tools_js_29.setWindowTitle)(WINDOW_TITLE + ' - ' + filename);
                }
                catch (e) {
                    console.error(e);
                    if (!quiet) {
                        x4mod_js_11.MessageBox.alert(e.message);
                    }
                }
            });
        }
        new() {
            this._askSave(() => {
                this.m_file_name = undefined;
                this.m_editor.new();
                (0, tools_js_29.setWindowTitle)(WINDOW_TITLE);
            });
        }
        askQuit() {
            this._askSave(() => {
                const ipc = electron_js_5.host.ipc;
                ipc.sendSync('quit');
            });
        }
        _askSave(cb) {
            if (this.m_editor.isDirty()) {
                x4mod_js_11.MessageBox.show({
                    message: x4mod_js_11._tr.main.ask_save,
                    buttons: ['yes', 'no', 'cancel'],
                    click: (button) => {
                        if (button == 'yes') {
                            this.save();
                            cb();
                        }
                        else if (button == 'no') {
                            cb();
                        }
                    }
                });
            }
            else {
                cb();
            }
        }
        showAbout() {
            const pkg = electron_js_5.host.require('./package.json');
            let dlg = new x4mod_js_11.Dialog({
                title: x4mod_js_11._tr.main.about,
                cls: '@about-box',
                width: 600,
                content: [
                    new x4mod_js_11.HLayout({
                        cls: 'main',
                        content: [
                            new x4mod_js_11.Image({ src: './resources/img/logo-red.svg' }),
                            new x4mod_js_11.Label({ text: WINDOW_TITLE }),
                        ]
                    }),
                    new x4mod_js_11.Label({
                        text: new x4mod_js_11.HtmlString(`<p>Version: ${pkg.version}</p><p>Electron: ${process.versions.electron}</p>` + x4mod_js_11._tr.main.copyright)
                    })
                ],
                buttons: [new x4mod_js_11.Link({ text: 'site web', href: '#', click: () => {
                            (0, tools_js_29.openExternal)('https://r-libre.fr');
                        } }), new x4mod_js_11.Flex(), 'ok']
            });
            dlg.show();
        }
        enterModal(enter) {
            const ipc = electron_js_5.host.ipc;
            ipc.send('enableMenubar', !enter);
        }
    }
    exports.Editor = Editor;
    /**
     *
     */
    exports.editor = new Editor();
    (0, x4mod_js_11.initTooltips)();
});
/**
* @file base64.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/base64", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Base64 = void 0;
    const _alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let _lookup = null;
    class Base64 {
        lookup = null;
        static encode(s) {
            let buffer;
            if (s instanceof Uint8Array) {
                buffer = [];
                s.forEach((v) => {
                    buffer.push(v);
                });
            }
            else {
                buffer = Base64._toUtf8(s);
            }
            let position = -1;
            let len = buffer.length;
            let nan1, nan2;
            let enc = [, , ,];
            let result = '';
            while (++position < len) {
                nan1 = buffer[position + 1], nan2 = buffer[position + 2];
                enc[0] = buffer[position] >> 2;
                enc[1] = ((buffer[position] & 3) << 4) | (buffer[++position] >> 4);
                if (isNaN(nan1)) {
                    enc[2] = enc[3] = 64;
                }
                else {
                    enc[2] = ((buffer[position] & 15) << 2) | (buffer[++position] >> 6);
                    enc[3] = (isNaN(nan2)) ? 64 : buffer[position] & 63;
                }
                result += _alphabet[enc[0]] + _alphabet[enc[1]] + _alphabet[enc[2]] + _alphabet[enc[3]];
            }
            return result;
        }
        static decode(s) {
            let buffer = Base64._fromUtf8(s);
            let position = 0;
            let len = buffer.length;
            let result = '';
            while (position < len) {
                if (buffer[position] < 128) {
                    result += String.fromCharCode(buffer[position++]);
                }
                else if (buffer[position] > 191 && buffer[position] < 224) {
                    result += String.fromCharCode(((buffer[position++] & 31) << 6) | (buffer[position++] & 63));
                }
                else {
                    result += String.fromCharCode(((buffer[position++] & 15) << 12) | ((buffer[position++] & 63) << 6) | (buffer[position++] & 63));
                }
            }
            return result;
        }
        static _toUtf8(s) {
            let position = -1;
            let len = s.length;
            let chr;
            let buffer = [];
            if (/^[\x00-\x7f]*$/.test(s)) {
                while (++position < len) {
                    buffer.push(s.charCodeAt(position));
                }
            }
            else {
                while (++position < len) {
                    chr = s.charCodeAt(position);
                    if (chr < 128) {
                        buffer.push(chr);
                    }
                    else if (chr < 2048) {
                        buffer.push((chr >> 6) | 192, (chr & 63) | 128);
                    }
                    else {
                        buffer.push((chr >> 12) | 224, ((chr >> 6) & 63) | 128, (chr & 63) | 128);
                    }
                }
            }
            return buffer;
        }
        static _fromUtf8(s) {
            let position = -1;
            let len;
            let buffer = [];
            let enc = [, , ,];
            if (!_lookup) {
                len = _alphabet.length;
                _lookup = {};
                while (++position < len) {
                    _lookup[_alphabet[position]] = position;
                }
                position = -1;
            }
            len = s.length;
            while (position < len) {
                enc[0] = _lookup[s.charAt(++position)];
                enc[1] = _lookup[s.charAt(++position)];
                buffer.push((enc[0] << 2) | (enc[1] >> 4));
                enc[2] = _lookup[s.charAt(++position)];
                if (enc[2] == 64) {
                    break;
                }
                buffer.push(((enc[1] & 15) << 4) | (enc[2] >> 2));
                enc[3] = _lookup[s.charAt(++position)];
                if (enc[3] == 64) {
                    break;
                }
                buffer.push(((enc[2] & 3) << 6) | enc[3]);
            }
            return buffer;
        }
    }
    exports.Base64 = Base64;
});
/**
* @file fileupload.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/fileupload", ["require", "exports", "x4/component", "x4/layout", "x4/input", "x4/image"], function (require, exports, component_js_31, layout_js_18, input_js_7, image_js_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.saveFile = exports.openFile = exports.ImageUpload = exports.FileUpload = void 0;
    class FileUpload extends layout_js_18.HLayout {
        constructor(props) {
            super(props);
        }
        clear() {
            this.m_props.value = '';
        }
    }
    exports.FileUpload = FileUpload;
    /**
     *
     */
    class ImageUpload extends FileUpload {
        m_path;
        m_ui_img;
        m_ui_input;
        /** @ignore */
        render(props) {
            let ename = "up" + this.uid;
            this.setContent([
                new component_js_31.Component({
                    tag: 'label', attrs: { for: ename }, content: [
                        this.m_ui_img = new image_js_5.Image({ src: this.m_props.value }),
                    ]
                }),
                this.m_ui_input = new input_js_7.Input({
                    cls: '@hidden',
                    id: ename,
                    type: 'file',
                    name: this.m_props.name,
                    value_hook: {
                        get: () => { return this._get_value(); },
                        set: (v) => { this._set_value(v); }
                    },
                    attrs: {
                        accept: 'image/*'
                    },
                    dom_events: {
                        change: (e) => { this._handleChange(e); }
                    }
                }),
            ]);
        }
        clear() {
            super.clear();
            this.m_ui_input.dom.value = '';
            this.m_ui_img.setImage(null, false);
        }
        _get_value() {
            return this.m_path;
        }
        _set_value(v) {
            debugger;
        }
        _handleChange(e) {
            let self = this;
            function createThumbnail(file) {
                let reader = new FileReader();
                reader.addEventListener('load', (e) => {
                    self.m_ui_img.setImage(reader.result.toString());
                });
                reader.readAsDataURL(file);
            }
            const allowedTypes = ['png', 'jpg', 'jpeg', 'gif'];
            let files = e.target.files, filesLen = files.length;
            for (let i = 0; i < filesLen; i++) {
                let imgType = files[i].name.split('.');
                imgType = imgType[imgType.length - 1];
                imgType = imgType.toLowerCase();
                if (allowedTypes.indexOf(imgType) != -1) {
                    createThumbnail(files[i]);
                    this.m_path = files[i];
                    break;
                }
            }
        }
    }
    exports.ImageUpload = ImageUpload;
    let g_file_input = null;
    function _createFileInput() {
        if (!g_file_input) {
            g_file_input = new component_js_31.Component({
                tag: 'input',
                style: {
                    display: 'none',
                    id: 'fileDialog',
                },
                attrs: {
                    type: 'file'
                }
            });
            // ajoute un input type:file caché pour pouvoir choir un fichier a ouvrir
            document.body.appendChild(g_file_input._build());
        }
        g_file_input.clearDomEvent('change');
        return g_file_input;
    }
    /**
     * show openfile dialog
     * @param extensions - string - ex: '.doc,.docx'
     * @param cb - callback to call when user select a file
     */
    function openFile(extensions, cb, multiple = false) {
        let fi = _createFileInput();
        fi.removeAttribute('nwsaveas');
        fi.setAttribute('accept', extensions);
        fi.setAttribute('multiple', multiple);
        // Set up the file chooser for the on change event
        fi.setDomEvent("change", (evt) => {
            // When we reach this point, it means the user has selected a file,
            let files = fi.dom.files;
            cb(files);
        });
        fi.dom.click();
    }
    exports.openFile = openFile;
    /**
     * open saveas dialog
     * @param defFileName - string - proposed filename
     * @param cb - callback to call when user choose the destination
     */
    function saveFile(defFileName, extensions, cb) {
        let fi = _createFileInput();
        fi.setAttribute('nwsaveas', defFileName);
        fi.setAttribute('accept', extensions);
        // Set up the file chooser for the on change event
        fi.setDomEvent("change", (evt) => {
            // When we reach this point, it means the user has selected a file,
            let files = fi.dom.files;
            cb(files[0]);
        });
        fi.dom.click();
    }
    exports.saveFile = saveFile;
});
/**
* @file md5.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/md5", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Md5 = void 0;
    /*
    TypeScript Md5
    ==============
    Based on work by
    * Joseph Myers: http://www.myersdaily.org/joseph/javascript/md5-text.html
    * André Cruz: https://github.com/satazor/SparkMD5
    * Raymond Hill: https://github.com/gorhill/yamd5.js
    Effectively a TypeScrypt re-write of Raymond Hill JS Library
    The MIT License (MIT)
    Copyright (C) 2014 Raymond Hill
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
    */
    class Md5 {
        static hashStr(str, raw = false) {
            return this.onePassHasher
                .start()
                .appendStr(str)
                .end(raw);
        }
        static hashAsciiStr(str, raw = false) {
            return this.onePassHasher
                .start()
                .appendAsciiStr(str)
                .end(raw);
        }
        // Private Static Variables
        static stateIdentity = new Int32Array([1732584193, -271733879, -1732584194, 271733878]);
        static buffer32Identity = new Int32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        static hexChars = '0123456789abcdef';
        static hexOut = [];
        // Permanent instance is to use for one-call hashing
        static onePassHasher = new Md5();
        static _hex(x) {
            const hc = Md5.hexChars;
            const ho = Md5.hexOut;
            let n;
            let offset;
            let j;
            let i;
            for (i = 0; i < 4; i += 1) {
                offset = i * 8;
                n = x[i];
                for (j = 0; j < 8; j += 2) {
                    ho[offset + 1 + j] = hc.charAt(n & 0x0F);
                    n >>>= 4;
                    ho[offset + 0 + j] = hc.charAt(n & 0x0F);
                    n >>>= 4;
                }
            }
            return ho.join('');
        }
        static _md5cycle(x, k) {
            let a = x[0];
            let b = x[1];
            let c = x[2];
            let d = x[3];
            // ff()
            a += (b & c | ~b & d) + k[0] - 680876936 | 0;
            a = (a << 7 | a >>> 25) + b | 0;
            d += (a & b | ~a & c) + k[1] - 389564586 | 0;
            d = (d << 12 | d >>> 20) + a | 0;
            c += (d & a | ~d & b) + k[2] + 606105819 | 0;
            c = (c << 17 | c >>> 15) + d | 0;
            b += (c & d | ~c & a) + k[3] - 1044525330 | 0;
            b = (b << 22 | b >>> 10) + c | 0;
            a += (b & c | ~b & d) + k[4] - 176418897 | 0;
            a = (a << 7 | a >>> 25) + b | 0;
            d += (a & b | ~a & c) + k[5] + 1200080426 | 0;
            d = (d << 12 | d >>> 20) + a | 0;
            c += (d & a | ~d & b) + k[6] - 1473231341 | 0;
            c = (c << 17 | c >>> 15) + d | 0;
            b += (c & d | ~c & a) + k[7] - 45705983 | 0;
            b = (b << 22 | b >>> 10) + c | 0;
            a += (b & c | ~b & d) + k[8] + 1770035416 | 0;
            a = (a << 7 | a >>> 25) + b | 0;
            d += (a & b | ~a & c) + k[9] - 1958414417 | 0;
            d = (d << 12 | d >>> 20) + a | 0;
            c += (d & a | ~d & b) + k[10] - 42063 | 0;
            c = (c << 17 | c >>> 15) + d | 0;
            b += (c & d | ~c & a) + k[11] - 1990404162 | 0;
            b = (b << 22 | b >>> 10) + c | 0;
            a += (b & c | ~b & d) + k[12] + 1804603682 | 0;
            a = (a << 7 | a >>> 25) + b | 0;
            d += (a & b | ~a & c) + k[13] - 40341101 | 0;
            d = (d << 12 | d >>> 20) + a | 0;
            c += (d & a | ~d & b) + k[14] - 1502002290 | 0;
            c = (c << 17 | c >>> 15) + d | 0;
            b += (c & d | ~c & a) + k[15] + 1236535329 | 0;
            b = (b << 22 | b >>> 10) + c | 0;
            // gg()
            a += (b & d | c & ~d) + k[1] - 165796510 | 0;
            a = (a << 5 | a >>> 27) + b | 0;
            d += (a & c | b & ~c) + k[6] - 1069501632 | 0;
            d = (d << 9 | d >>> 23) + a | 0;
            c += (d & b | a & ~b) + k[11] + 643717713 | 0;
            c = (c << 14 | c >>> 18) + d | 0;
            b += (c & a | d & ~a) + k[0] - 373897302 | 0;
            b = (b << 20 | b >>> 12) + c | 0;
            a += (b & d | c & ~d) + k[5] - 701558691 | 0;
            a = (a << 5 | a >>> 27) + b | 0;
            d += (a & c | b & ~c) + k[10] + 38016083 | 0;
            d = (d << 9 | d >>> 23) + a | 0;
            c += (d & b | a & ~b) + k[15] - 660478335 | 0;
            c = (c << 14 | c >>> 18) + d | 0;
            b += (c & a | d & ~a) + k[4] - 405537848 | 0;
            b = (b << 20 | b >>> 12) + c | 0;
            a += (b & d | c & ~d) + k[9] + 568446438 | 0;
            a = (a << 5 | a >>> 27) + b | 0;
            d += (a & c | b & ~c) + k[14] - 1019803690 | 0;
            d = (d << 9 | d >>> 23) + a | 0;
            c += (d & b | a & ~b) + k[3] - 187363961 | 0;
            c = (c << 14 | c >>> 18) + d | 0;
            b += (c & a | d & ~a) + k[8] + 1163531501 | 0;
            b = (b << 20 | b >>> 12) + c | 0;
            a += (b & d | c & ~d) + k[13] - 1444681467 | 0;
            a = (a << 5 | a >>> 27) + b | 0;
            d += (a & c | b & ~c) + k[2] - 51403784 | 0;
            d = (d << 9 | d >>> 23) + a | 0;
            c += (d & b | a & ~b) + k[7] + 1735328473 | 0;
            c = (c << 14 | c >>> 18) + d | 0;
            b += (c & a | d & ~a) + k[12] - 1926607734 | 0;
            b = (b << 20 | b >>> 12) + c | 0;
            // hh()
            a += (b ^ c ^ d) + k[5] - 378558 | 0;
            a = (a << 4 | a >>> 28) + b | 0;
            d += (a ^ b ^ c) + k[8] - 2022574463 | 0;
            d = (d << 11 | d >>> 21) + a | 0;
            c += (d ^ a ^ b) + k[11] + 1839030562 | 0;
            c = (c << 16 | c >>> 16) + d | 0;
            b += (c ^ d ^ a) + k[14] - 35309556 | 0;
            b = (b << 23 | b >>> 9) + c | 0;
            a += (b ^ c ^ d) + k[1] - 1530992060 | 0;
            a = (a << 4 | a >>> 28) + b | 0;
            d += (a ^ b ^ c) + k[4] + 1272893353 | 0;
            d = (d << 11 | d >>> 21) + a | 0;
            c += (d ^ a ^ b) + k[7] - 155497632 | 0;
            c = (c << 16 | c >>> 16) + d | 0;
            b += (c ^ d ^ a) + k[10] - 1094730640 | 0;
            b = (b << 23 | b >>> 9) + c | 0;
            a += (b ^ c ^ d) + k[13] + 681279174 | 0;
            a = (a << 4 | a >>> 28) + b | 0;
            d += (a ^ b ^ c) + k[0] - 358537222 | 0;
            d = (d << 11 | d >>> 21) + a | 0;
            c += (d ^ a ^ b) + k[3] - 722521979 | 0;
            c = (c << 16 | c >>> 16) + d | 0;
            b += (c ^ d ^ a) + k[6] + 76029189 | 0;
            b = (b << 23 | b >>> 9) + c | 0;
            a += (b ^ c ^ d) + k[9] - 640364487 | 0;
            a = (a << 4 | a >>> 28) + b | 0;
            d += (a ^ b ^ c) + k[12] - 421815835 | 0;
            d = (d << 11 | d >>> 21) + a | 0;
            c += (d ^ a ^ b) + k[15] + 530742520 | 0;
            c = (c << 16 | c >>> 16) + d | 0;
            b += (c ^ d ^ a) + k[2] - 995338651 | 0;
            b = (b << 23 | b >>> 9) + c | 0;
            // ii()
            a += (c ^ (b | ~d)) + k[0] - 198630844 | 0;
            a = (a << 6 | a >>> 26) + b | 0;
            d += (b ^ (a | ~c)) + k[7] + 1126891415 | 0;
            d = (d << 10 | d >>> 22) + a | 0;
            c += (a ^ (d | ~b)) + k[14] - 1416354905 | 0;
            c = (c << 15 | c >>> 17) + d | 0;
            b += (d ^ (c | ~a)) + k[5] - 57434055 | 0;
            b = (b << 21 | b >>> 11) + c | 0;
            a += (c ^ (b | ~d)) + k[12] + 1700485571 | 0;
            a = (a << 6 | a >>> 26) + b | 0;
            d += (b ^ (a | ~c)) + k[3] - 1894986606 | 0;
            d = (d << 10 | d >>> 22) + a | 0;
            c += (a ^ (d | ~b)) + k[10] - 1051523 | 0;
            c = (c << 15 | c >>> 17) + d | 0;
            b += (d ^ (c | ~a)) + k[1] - 2054922799 | 0;
            b = (b << 21 | b >>> 11) + c | 0;
            a += (c ^ (b | ~d)) + k[8] + 1873313359 | 0;
            a = (a << 6 | a >>> 26) + b | 0;
            d += (b ^ (a | ~c)) + k[15] - 30611744 | 0;
            d = (d << 10 | d >>> 22) + a | 0;
            c += (a ^ (d | ~b)) + k[6] - 1560198380 | 0;
            c = (c << 15 | c >>> 17) + d | 0;
            b += (d ^ (c | ~a)) + k[13] + 1309151649 | 0;
            b = (b << 21 | b >>> 11) + c | 0;
            a += (c ^ (b | ~d)) + k[4] - 145523070 | 0;
            a = (a << 6 | a >>> 26) + b | 0;
            d += (b ^ (a | ~c)) + k[11] - 1120210379 | 0;
            d = (d << 10 | d >>> 22) + a | 0;
            c += (a ^ (d | ~b)) + k[2] + 718787259 | 0;
            c = (c << 15 | c >>> 17) + d | 0;
            b += (d ^ (c | ~a)) + k[9] - 343485551 | 0;
            b = (b << 21 | b >>> 11) + c | 0;
            x[0] = a + x[0] | 0;
            x[1] = b + x[1] | 0;
            x[2] = c + x[2] | 0;
            x[3] = d + x[3] | 0;
        }
        _dataLength;
        _bufferLength;
        _state = new Int32Array(4);
        _buffer = new ArrayBuffer(68);
        _buffer8;
        _buffer32;
        constructor() {
            this._buffer8 = new Uint8Array(this._buffer, 0, 68);
            this._buffer32 = new Uint32Array(this._buffer, 0, 17);
            this.start();
        }
        start() {
            this._dataLength = 0;
            this._bufferLength = 0;
            this._state.set(Md5.stateIdentity);
            return this;
        }
        // Char to code point to to array conversion:
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charCodeAt
        // #Example.3A_Fixing_charCodeAt_to_handle_non-Basic-Multilingual-Plane_characters_if_their_presence_earlier_in_the_string_is_unknown
        appendStr(str) {
            const buf8 = this._buffer8;
            const buf32 = this._buffer32;
            let bufLen = this._bufferLength;
            let code;
            let i;
            for (i = 0; i < str.length; i += 1) {
                code = str.charCodeAt(i);
                if (code < 128) {
                    buf8[bufLen++] = code;
                }
                else if (code < 0x800) {
                    buf8[bufLen++] = (code >>> 6) + 0xC0;
                    buf8[bufLen++] = code & 0x3F | 0x80;
                }
                else if (code < 0xD800 || code > 0xDBFF) {
                    buf8[bufLen++] = (code >>> 12) + 0xE0;
                    buf8[bufLen++] = (code >>> 6 & 0x3F) | 0x80;
                    buf8[bufLen++] = (code & 0x3F) | 0x80;
                }
                else {
                    code = ((code - 0xD800) * 0x400) + (str.charCodeAt(++i) - 0xDC00) + 0x10000;
                    if (code > 0x10FFFF) {
                        throw new Error('Unicode standard supports code points up to U+10FFFF');
                    }
                    buf8[bufLen++] = (code >>> 18) + 0xF0;
                    buf8[bufLen++] = (code >>> 12 & 0x3F) | 0x80;
                    buf8[bufLen++] = (code >>> 6 & 0x3F) | 0x80;
                    buf8[bufLen++] = (code & 0x3F) | 0x80;
                }
                if (bufLen >= 64) {
                    this._dataLength += 64;
                    Md5._md5cycle(this._state, buf32);
                    bufLen -= 64;
                    buf32[0] = buf32[16];
                }
            }
            this._bufferLength = bufLen;
            return this;
        }
        appendAsciiStr(str) {
            const buf8 = this._buffer8;
            const buf32 = this._buffer32;
            let bufLen = this._bufferLength;
            let i;
            let j = 0;
            for (;;) {
                i = Math.min(str.length - j, 64 - bufLen);
                while (i--) {
                    buf8[bufLen++] = str.charCodeAt(j++);
                }
                if (bufLen < 64) {
                    break;
                }
                this._dataLength += 64;
                Md5._md5cycle(this._state, buf32);
                bufLen = 0;
            }
            this._bufferLength = bufLen;
            return this;
        }
        appendByteArray(input) {
            const buf8 = this._buffer8;
            const buf32 = this._buffer32;
            let bufLen = this._bufferLength;
            let i;
            let j = 0;
            for (;;) {
                i = Math.min(input.length - j, 64 - bufLen);
                while (i--) {
                    buf8[bufLen++] = input[j++];
                }
                if (bufLen < 64) {
                    break;
                }
                this._dataLength += 64;
                Md5._md5cycle(this._state, buf32);
                bufLen = 0;
            }
            this._bufferLength = bufLen;
            return this;
        }
        getState() {
            const self = this;
            const s = self._state;
            return {
                buffer: String.fromCharCode.apply(null, self._buffer8),
                buflen: self._bufferLength,
                length: self._dataLength,
                state: [s[0], s[1], s[2], s[3]]
            };
        }
        setState(state) {
            const buf = state.buffer;
            const x = state.state;
            const s = this._state;
            let i;
            this._dataLength = state.length;
            this._bufferLength = state.buflen;
            s[0] = x[0];
            s[1] = x[1];
            s[2] = x[2];
            s[3] = x[3];
            for (i = 0; i < buf.length; i += 1) {
                this._buffer8[i] = buf.charCodeAt(i);
            }
        }
        end(raw = false) {
            const bufLen = this._bufferLength;
            const buf8 = this._buffer8;
            const buf32 = this._buffer32;
            const i = (bufLen >> 2) + 1;
            let dataBitsLen;
            this._dataLength += bufLen;
            buf8[bufLen] = 0x80;
            buf8[bufLen + 1] = buf8[bufLen + 2] = buf8[bufLen + 3] = 0;
            buf32.set(Md5.buffer32Identity.subarray(i), i);
            if (bufLen > 55) {
                Md5._md5cycle(this._state, buf32);
                buf32.set(Md5.buffer32Identity);
            }
            // Do the final computation based on the tail and length
            // Beware that the final length may not fit in 32 bits so we take care of that
            dataBitsLen = this._dataLength * 8;
            if (dataBitsLen <= 0xFFFFFFFF) {
                buf32[14] = dataBitsLen;
            }
            else {
                const matches = dataBitsLen.toString(16).match(/(.*?)(.{0,8})$/);
                if (matches === null) {
                    return;
                }
                const lo = parseInt(matches[2], 16);
                const hi = parseInt(matches[1], 16) || 0;
                buf32[14] = lo;
                buf32[15] = hi;
            }
            Md5._md5cycle(this._state, buf32);
            return raw ? this._state : Md5._hex(this._state);
        }
    }
    exports.Md5 = Md5;
});
/*
if (Md5.hashStr('hello') !== '5d41402abc4b2a76b9719d911017c592') {
    console.error('Md5 self test failed.');
}
*/ 
/**
* @file rating.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/rating", ["require", "exports", "x4/component", "x4/layout", "x4/input", "x4/x4_events"], function (require, exports, component_js_32, layout_js_19, input_js_8, x4_events_js_27) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Rating = void 0;
    class Rating extends layout_js_19.HLayout {
        m_els;
        m_input;
        constructor(props) {
            super(props);
            props.steps = props.steps ?? 5;
        }
        render(props) {
            let shape = props.shape ?? 'star';
            let value = props.value ?? 0;
            this.m_input = new input_js_8.Input({
                cls: '@hidden',
                name: props.name,
                value: '' + value
            });
            this.addClass(shape);
            this.setDomEvent('click', (e) => this._onclick(e));
            this.m_els = [];
            for (let i = 0; i < props.steps; i++) {
                let cls = 'item';
                if (i + 1 <= value) {
                    cls += ' checked';
                }
                let c = new component_js_32.Component({
                    tag: 'option',
                    cls,
                    data: { value: i + 1 }
                });
                this.m_els.push(c);
            }
            this.m_els.push(this.m_input);
            this.setContent(this.m_els);
        }
        getValue() {
            return this.m_props.value ?? 0;
        }
        set value(v) {
            this.m_props.value = v;
            for (let c = 0; c < this.m_props.steps; c++) {
                this.m_els[c].setClass('checked', this.m_els[c].getData('value') <= v);
            }
            this.m_input.value = '' + this.m_props.value;
        }
        set steps(n) {
            this.m_props.steps = n;
            this.update();
        }
        set shape(shape) {
            this.removeClass(this.m_props.shape);
            this.m_props.shape = shape;
            this.addClass(this.m_props.shape);
        }
        _onclick(ev) {
            let on = true;
            for (let el = this.dom.firstChild; el; el = el.nextSibling) {
                let comp = component_js_32.Component.getElement(el);
                comp.setClass('checked', on);
                if (el == ev.target) {
                    this.m_input.value = comp.getData('value');
                    on = false;
                }
            }
            this.emit('change', (0, x4_events_js_27.EvChange)(this.m_props.value));
        }
    }
    exports.Rating = Rating;
});
/**
* @file svgcomponent.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/svgcomponent", ["require", "exports", "x4/component"], function (require, exports, component_js_33) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SVGComponent = exports.SVGPathBuilder = void 0;
    class SVGPathBuilder {
        m_path;
        m_attrs;
        constructor() {
            this.clear();
        }
        moveTo(x, y) {
            this.m_path += `M${x} ${y}`;
            return this;
        }
        lineTo(x, y) {
            this.m_path += `L${x} ${y}`;
            return this;
        }
        attr(attr, value) {
            this.m_attrs.set(attr, value);
            return this;
        }
        render(clear = true) {
            let result = '<path d="' + this.m_path + '"';
            this.m_attrs.forEach((v, k) => {
                result += ` ${k} = "${v}"`;
            });
            result += '></path>';
            if (clear) {
                this.clear();
            }
            return result;
        }
        clear() {
            this.m_path = '';
            this.m_attrs = new Map();
        }
    }
    exports.SVGPathBuilder = SVGPathBuilder;
    class SVGComponent extends component_js_33.Component {
        constructor(props) {
            super(props);
            this.setProp('tag', 'svg');
            this.setProp('namespace', 'http://www.w3.org/2000/svg');
            this.setProp('xmlns', 'http://www.w3.org/2000/svg');
            this.setAttributes({
                viewBox: props.viewBox,
            });
            this.setContent(props.path);
        }
    }
    exports.SVGComponent = SVGComponent;
});
/**
* @file texthiliter.ts
* @author Etienne Cochard
* @license
* Copyright (c) 2019-2021 R-libre ingenierie
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
**/
define("x4/texthiliter", ["require", "exports", "x4/component"], function (require, exports, component_js_34) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextHiliter = void 0;
    class TextHiliter extends component_js_34.Component {
        m_text;
        m_ed;
        m_hi;
        m_top;
        m_kwList;
        constructor(props) {
            super(props);
            this.m_kwList = props.kwList;
            this.m_top = 0;
            this.m_text = props.text ?? '';
            this.mapPropEvents(props, 'change');
        }
        /** @ignore */
        render() {
            this.setContent([
                this.m_hi = new component_js_34.Component({
                    tag: 'span',
                    cls: '@fit @syntax-hiliter',
                }),
                this.m_ed = new component_js_34.Component({
                    tag: 'textarea',
                    cls: '@fit',
                    width: '100%',
                    attrs: {
                        spellcheck: 'false',
                        wrap: 'off',
                    },
                    dom_events: {
                        input: () => this._hiliteText(),
                        scroll: () => this._updateScroll(),
                        keydown: (e) => this._keydown(e),
                    }
                }),
            ]);
        }
        componentCreated() {
            super.componentCreated();
            this.value = this.m_text;
        }
        get value() {
            if (this.dom) {
                return this.m_ed.dom.value;
            }
            else {
                return this.m_text;
            }
        }
        set value(t) {
            if (this.dom) {
                this.m_ed.dom.value = t;
            }
            this.m_text = t;
            this._hiliteText();
        }
        _keydown(e) {
            if (e.key == 'Tab') {
                e.preventDefault();
                e.stopPropagation();
                let dom = this.m_ed.dom;
                let ss = dom.selectionStart;
                let se = dom.selectionEnd;
                dom.setRangeText('\t', ss, se);
                dom.setSelectionRange(ss + 1, ss + 1);
                dom.dispatchEvent(new Event('input'));
            }
            else if (e.key == 'Enter') {
                e.stopPropagation();
            }
        }
        _hiliteText() {
            let text = this.m_ed.dom.value;
            if (!this.m_hi.dom.firstChild) {
                this.m_hi.dom.innerHTML = '<div style="position:absolute"></div>';
            }
            this.m_hi.dom.firstChild.innerHTML = this._tokenize(text);
            //	this._updateScroll( );
        }
        _updateScroll() {
            this.startTimer('sync', 0, false, () => {
                let top = this.m_ed.dom.scrollTop;
                if (top != this.m_top) {
                    this.m_hi.dom.scrollTop = top;
                    this.m_top = top;
                }
                this.m_hi.dom.scrollLeft = this.m_ed.dom.scrollLeft;
                //this.m_hi.setStyleValue( 'width', this.m_ed.dom.clientWidth );
            });
        }
        _escape(text) {
            text = text.replace(/&/gm, '&amp;');
            text = text.replace(/</gm, '&lt;');
            text = text.replace(/>/gm, '&gt;');
            return text;
        }
        _tokenize(text) {
            const reNUM = /\d/;
            const reNUM2 = /[\d.]/;
            const rePUNC = /\+|-|,|\/|\*|=|%|!|\||;|\.|\[|\]|\{|\|\(|\)|}|<|>|&/;
            const reKW = /[a-zA-Z_]/;
            const reKW2 = /[a-zA-Z0-9_]/;
            let result = '';
            let i = 0;
            let length = text.length;
            let s;
            console.time("hilite");
            while (i < length) {
                let c = text.charAt(i);
                // numbers
                if (reNUM.test(c)) {
                    let s = i;
                    do {
                        c = text.charAt(++i);
                    } while (reNUM2.test(c) && i < length);
                    result += '<span class="num">' + text.substring(s, i) + '</span>';
                    continue;
                }
                // keywords
                if (this.m_kwList) {
                    if (reKW.test(c)) {
                        let s = i;
                        do {
                            c = text.charAt(++i);
                        } while (reKW2.test(c) && i < length);
                        let kw = text.substring(s, i);
                        if (this.m_kwList.has(kw)) {
                            result += '<span class="kword">' + kw + '</span>';
                        }
                        else {
                            result += kw;
                        }
                        continue;
                    }
                }
                if (c == '#') {
                    let ne = text.indexOf('\n', i + 1);
                    if (ne < 0) {
                        ne = text.length;
                    }
                    result += '<span class="cmt">' + this._escape(text.substring(i, ne)) + '</span>';
                    i = ne;
                    continue;
                }
                //	comments
                if (c == '/') {
                    let cn = text.charAt(i + 1);
                    if (cn == '*') {
                        let ne = text.indexOf('*/', i + 2);
                        if (ne < 0) {
                            ne = text.length;
                        }
                        result += '<span class="cmt">' + this._escape(text.substring(i, ne + 2)) + '</span>';
                        i = ne + 2;
                        continue;
                    }
                    else if (cn == '/') {
                        let ne = text.indexOf('\n', i + 2);
                        if (ne < 0) {
                            ne = text.length;
                        }
                        result += `<span class="cmt">${this._escape(text.substring(i, ne))}</span>`;
                        i = ne;
                        continue;
                    }
                }
                // punctuation
                if (rePUNC.test(c)) {
                    s = i;
                    do {
                        c = text.charAt(++i);
                    } while (rePUNC.test(c) && i < length);
                    result += `<span class="punc">${text.substring(s, i)}</span>`;
                    continue;
                }
                // strings
                if (c == '"' || c == '\'' || c == '\`') {
                    s = i;
                    let delim = c;
                    do {
                        c = text.charAt(++i);
                    } while (c != delim && i < length);
                    result += `<span class="str">${this._escape(text.substring(s, ++i))}</span>`;
                    continue;
                }
                i++;
                result += c;
            }
            console.timeEnd("hilite");
            return result + '\n\n\n';
        }
    }
    exports.TextHiliter = TextHiliter;
});
