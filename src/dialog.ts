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

import { Popup, PopupProps, PopupEventMap, EvMove } from './popup.js'
import { Icon, IconID } from './icon.js'
import { HLayout } from './layout.js'
import { Label } from './label.js'
import { Form, FormButtons } from './form.js'
import { Component, EvSize, flyWrap } from './component.js'
import { BasicEvent, EventCallback } from './x4_events.js'
import { Rect, getMousePos, isFunction, isTouchDevice, isString } from './tools.js'

interface Geometry {
	left: number;
	top: number;
	width: number;
	height: number;
	minimized: boolean;
	maximized: boolean;
}

// ============================================================================
// [DIALOG]
// ============================================================================


export interface EvClose extends BasicEvent {
}

export interface EvBtnClick extends BasicEvent {
	button: string;
}

export function EvBtnClick(button: string) {
	return BasicEvent<EvBtnClick>({ button });
}


export interface DialogBoxEventMap extends PopupEventMap {
	close: EvClose;
	btnClick: EvBtnClick;
}

export type InitFormCallback = () => Form;

export interface DialogProps<E extends DialogBoxEventMap = DialogBoxEventMap> extends PopupProps<E> {
	title?: string;
	icon?: IconID;
	buttons?: FormButtons;
	width?: number | string;
	height?: number | string;

	btnClick?: EventCallback<EvBtnClick>;

	closable?: boolean;
	movable?: boolean;
	maximized?: boolean;
	maximizable?: boolean;
	minimizable?: boolean;
	autoClose?: boolean;	// if true, close the dialog when a button is clicked

	form?: Form | InitFormCallback;
}

/**
 * Standard dialog class
 */

export class Dialog<P extends DialogProps = DialogProps, E extends DialogBoxEventMap = DialogBoxEventMap> extends Popup<P, E>
{
	protected m_icon: IconID;
	protected m_title: string;
	protected m_form: Form;
	protected m_buttons: FormButtons;
	protected m_closable: boolean;
	protected m_movable: boolean;
	protected m_maximized: boolean;
	protected m_minimized: boolean;
	protected m_maximizable: boolean;
	protected m_minimizable: boolean;

	protected m_needFormResize: number;	// 1 -> hz, 2-> vt

	protected m_rc_max: Rect;
	protected m_rc_min: Rect;

	protected m_el_title: Component;
	protected m_last_down: number;
	protected m_auto_close: boolean;

	protected m_ui_title: Label;
	protected m_form_cb: InitFormCallback;

	constructor(props: P) {

		let content = props.content;


		let width, height;
		let formResize = 0;
		
		props.content = null;
		
		if( !isString(props.width) ) {
			width = props.width;
			props.width = undefined;
		}
		else {
			formResize |= 1;
		}
		
		if( !isString(props.height) ) {
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
			if (!isFunction(props.form)) {
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
			this.m_form = new Form({
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

		this.on('size', (ev: EvSize) => {
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

		if( props.btnClick ) {
			this.on( 'btnClick', props.btnClick );
		}
	}

	componentCreated() // override
	{
		super.componentCreated();

		if( this.m_needFormResize ) {
			this.addClass('@resized');
		}

		if (this.m_props.maximized) {
			this._maximize();
			this.emit('size', EvSize(null));
		}
	}

	private _handleClick(ev: EvBtnClick) {
		this.emit('btnClick', ev);
		if (!ev.defaultPrevented) {
			this.close();
		}
	}

	/**
	 * 
	 */

	setGeometry(geom: Geometry) {

		if (geom.minimized && this.m_minimizable) {
			this._minimize(false);
			this.m_rc_min = new Rect(geom.left, geom.top, geom.width, geom.height);
			this.displayAt(geom.left, geom.top, 'top-left');
		}
		else if (geom.maximized && this.m_maximizable) {
			this._maximize(false);
			this.m_rc_max = new Rect(geom.left, geom.top, geom.width, geom.height);
		}
		else {
			this.setSize(geom.width, geom.height);
			this.displayAt(geom.left, geom.top, 'top-left');
		}
	}

	getGeometry(): Geometry {

		if (this.m_minimized) {
			return {
				left: this.m_rc_min.left,
				top: this.m_rc_min.top,
				width: this.m_rc_min.width,
				height: this.m_rc_min.height,
				minimized: true,
				maximized: false
			}
		}
		else if (this.m_maximized) {
			return {
				left: this.m_rc_max.left,
				top: this.m_rc_max.top,
				width: this.m_rc_max.width,
				height: this.m_rc_max.height,
				minimized: false,
				maximized: true
			}
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

	setSize(width: number, height: number) {
		this.setStyle({ width, height });
		this.emit('size', EvSize({ width, height }));
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
			this.m_el_title = new HLayout({
				cls: 'title',
				content: [
					this.m_icon ? new Icon({ icon: this.m_icon }) : null,
					this.m_ui_title = new Label({ flex: 1, text: this.m_title }),
					this.m_minimizable ? new Icon({ cls: 'min-btn', icon: 0xf2d1, dom_events: { click: () => this._toggleMin() } }) : null,
					this.m_maximizable ? new Icon({ cls: 'max-btn', icon: 0xf2d0, dom_events: { click: () => this._toggleMax() } }) : null,
					this.m_closable ? new Icon({ icon: 0xf410, dom_events: { click: () => this.close() } }) : null,
				]
			});

			if (this.m_movable) {
				if( isTouchDevice() ) {
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

	public get form(): Form {
		return this.m_form;
	}

	public close() {
		this.emit( 'close', {} );
		super.close();
	}

	private _toggleMax() {
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
			this.emit( 'size', EvSize(null, 'restore'));
		}
		else {
			this._maximize();
			this.emit( 'size', EvSize(null, 'maximize'));
		}
	}

	private _toggleMin() {
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
			this.emit('size', EvSize(null, 'restore'));
		}
		else {
			this._minimize();
			this.emit('size', EvSize(null, 'minimize'));
		}
	}

	private _isIcon(target) {
		let el = Component.getElement(target);
		return (el && el.hasClass('@icon'));
	}

	private _mouseDown(event: UIEvent) {

		let { x, y } = getMousePos(event, true);

		let wrc = flyWrap(document.body).getBoundingRect();
		let rc = this.getBoundingRect(true);
		let trc = this.m_el_title.getBoundingRect();

		let dx = x - rc.left,
			dy = y - rc.top;

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
		
		if ( this.m_maximizable && delta < 700) {
			this._toggleMax();
			return;
		}

		this.m_last_down = now;
		if (this.m_maximized) {
			// cannot move in max state
			return;
		}

		let __move = (ex, ey) => {
			let x = ex - dx,
				y = ey - dy;

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
		}

		Component.setCapture(this, (ev) => {

			if (ev.type == 'mousemove') {
				let mev = ev as MouseEvent;
				__move(mev.clientX, mev.clientY);
			}
			else if (ev.type == 'touchmove') {
				let tev = ev as TouchEvent;

				if (tev.touches.length == 1) {
					__move(tev.touches[0].clientX, tev.touches[0].clientY);
				}
			}
			else if (ev.type == 'mouseup' || ev.type == 'touchend') {
				Component.releaseCapture();
				this.emit( 'move', EvMove(null));
			}
			else if (ev.type == 'mousedown' || ev.type == 'touchstart') {

			}
		});
	}

	public maximize() {
		if (!this.m_maximizable || this.m_maximized) {
			return;
		}

		this._maximize();
		this.emit('size', EvSize(null));
	}

	private _maximize(saveRect = true) {

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

	public minimize() {
		if (!this.m_minimizable || this.m_minimized) {
			return;
		}

		this._minimize();
		this.emit('size', EvSize(null));
	}

	private _minimize(saveRect = true) {

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

	set title(title: string) {
		this.m_title = title;
		if (this.m_ui_title) {
			this.m_ui_title.text = title;
		}
	}
}
