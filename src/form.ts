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

import { Component, Container, CProps, ContainerEventMap, ComponentContent } from './component.js'
import { HLayout, VLayout } from './layout.js'
import { Button } from './button.js'
import { Input } from './input.js'
import { TextEdit } from './textedit.js'
import { ajaxRequest, RequestProps } from './request.js'
import { BasicEvent, EventCallback } from './x4_events.js'
import { EvBtnClick } from './dialog.js'

import { _tr } from './i18n.js'

// ============================================================================
// [FORM]
// ============================================================================

export type FormBtn = 'ok' | 'cancel' | 'ignore' | 'yes' | 'no' | 'close' | 'save' | 'dontsave';
export type FormButtons = (FormBtn | Button | Component)[];

export interface FormEventMap extends ContainerEventMap {
	btnClick?: EvBtnClick;
}

export interface FormProps extends CProps<FormEventMap> {
	buttons?: FormButtons;
	btnClick?: EventCallback<EvBtnClick>;	// shortcut for events: { btnClick: ... }
}

/**
 * 
 */

export class Form extends VLayout<FormProps, FormEventMap>
{
	protected m_height: string | number;
	protected m_container: Container;
	protected m_buttons: HLayout;

	constructor(props: FormProps) {

		let content = props.content;
		props.content = null;

		// save height, because real form height is 'height' PLUS button bar height
		let height = props.height;
		props.height = undefined;

		super(props);

		this.setProp('tag', 'form');
		this.mapPropEvents( props, 'btnClick' );
		this.updateContent(content, props.buttons, height);
	}

	get container(): Container {
		return this.m_container;
	}

	public onChange(cb: () => void) {

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

	public updateContent(items: ComponentContent, buttons: FormButtons, height: string | number = 0) {

		if (height) {
			// keep height for next time
			this.m_height = height;
		}

		let content = [
			this.m_container = new VLayout({
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

	enableButton(name: string, enable = true) {
		let button = this.getButton(name);
		if (button) {
			button.enable(enable);
		}
	}

	getButton(name: string) {
		let button = this.itemWithRef<Button>('@' + name);
		return button;
	}


	/**
	 * 
	 */

	private _makeButtons(buttons?: FormButtons): HLayout {

		if (!buttons) {
			return null;
		}

		let btns: Component[] = [];
		for (let b of buttons) {
			if (b instanceof Component) {
				btns.push(b);
			}
			else {
				switch (b) {
					case 'ok': { btns.push(new Button({ ref: '@' + b, text: _tr.global.ok, click: () => { this._click(<FormBtn>b); } })); break; }
					case 'cancel': { btns.push(new Button({ ref: '@' + b, text: _tr.global.cancel, click: () => { this._click(<FormBtn>b); } })); break; }
					case 'ignore': { btns.push(new Button({ ref: '@' + b, text: _tr.global.ignore, click: () => { this._click(<FormBtn>b); } })); break; }
					case 'yes': { btns.push(new Button({ ref: '@' + b, text: _tr.global.yes, click: () => { this._click(<FormBtn>b); } })); break; }
					case 'no': { btns.push(new Button({ ref: '@' + b, text: _tr.global.no, click: () => { this._click(<FormBtn>b); } })); break; }
					case 'close': { btns.push(new Button({ ref: '@' + b, text: _tr.global.close, click: () => { this._click(<FormBtn>b); } })); break; }
					case 'save': { btns.push(new Button({ ref: '@' + b, text: _tr.global.save, click: () => { this._click(<FormBtn>b); } })); break; }
					case 'dontsave': { btns.push(new Button({ ref: '@' + b, text: _tr.global.dontsave, click: () => { this._click(<FormBtn>b); } })); break; }
				}
			}
		}

		if (btns.length == 1) {
			btns[0].setAttribute('autofocus', true);
		}

		return new HLayout({
			cls: 'footer',
			content: btns
		});
	}

	/**
	 * 
	 */

	public validate() {
		let inputs = this.dom.querySelectorAll('input'),
			result = true;

		for (let i = 0; i < inputs.length; i++) {
			let input = Component.getElement(inputs[i], TextEdit);
			if (input && !input.validate()) {
				result = false;
			}
		}

		return result;
	}

	/**
	 * 
	 */

	private _click(btn: FormBtn) {
		this.emit('btnClick', EvBtnClick(btn));
	}

	/**
	 * 
	 */

	public setValues(values: any) {
		console.assert(!!this.dom);

		let elements = (<HTMLFormElement>this.dom).elements;
		for (let e = 0; e < elements.length; e++) {

			let input = <HTMLInputElement>elements[e];

			let item = Component.getElement(input);
			if (!item.hasAttribute("name")) {
				continue;
			}

			let name = item.getAttribute('name'),
				type = item.getAttribute('type');

			if (values[name] !== undefined) {
				(<Input>item).setStoreValue(values[name]);
			}
		}
	}


	/**
	 * values are not escaped
	 * checkbox set true when checked
	 * radio set value when checked
	 */

	public getValues(): any {
		console.assert(!!this.dom);

		let result = {};

		let elements = (<HTMLFormElement>this.dom).elements;
		for (let e = 0; e < elements.length; e++) {

			let el = <HTMLElement>elements[e];
			let item = <Input>Component.getElement(el);
			if (!item.hasAttribute("name")) {
				continue;
			}

			let name = item.getAttribute('name'),
				value = item.getStoreValue();

			if (value !== undefined) {
				result[name] = value;
			}
		}

		return result;
	}

	/**
	 * send the query to the desired handler
	 */
	public submit(cfg: RequestProps, cbvalidation: Function) {

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
		return ajaxRequest(cfg);
	}

}