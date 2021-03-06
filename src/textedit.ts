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

import { Component, CProps, EvFocus, HtmlString, ContainerEventMap } from './component'
import { Input, InputProps, InputEventMap } from './input'
import { IconID } from './icon'
import { Button } from './button'
import { HLayout, VLayout } from './layout'
import { Label } from './label'
import { PopupCalendar } from './calendar'
import { sprintf, parseIntlDate, formatIntlDate } from "./tools";
import { Tooltip } from './tooltips'
import { EvClick, EvChange, EventCallback } from './x4_events';

import { _tr } from './i18n'

// throw in case of error
// return the corrected
type ValidationFunction = (value: string) => string;

/** @ignore */
const reEmail = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// ============================================================================
// [TEXTEDIT]
// ============================================================================

interface TextEditEventMap extends InputEventMap  {
	click: EvClick;
}

export interface TextEditProps extends InputProps<TextEditEventMap> {
	label?: string | HtmlString;
	labelWidth?: number;	// <0 for flex -> -3 mean flex: 3
	labelAlign?: 'left' | 'right' | 'top';
	required?: boolean;
	icon?: IconID;
	pattern?: string;
	uppercase?: boolean;
	format?: string | 'native'; // default store format on type date. 
	// by default mysql format without time 'YYYY-MM-DD'
	// use 'native' to work on real Date object (get/set value)

	gadgets?: Component[];

	validator?: ValidationFunction;

	change?: EventCallback<EvChange>;	// shortcut to events: { change: ... }
	click?: EventCallback<EvClick>;		// shortcut to events: { click: ... }
	focus?: EventCallback<EvFocus>;		// shortcut to events: { focus: ... }
}



/**
 * TextEdit is a single line editor, it can have a label and an error descriptor.
 */

export class TextEdit<T extends TextEditProps = TextEditProps> extends Component<TextEditProps, TextEditEventMap> {

	private m_cal_popup: PopupCalendar;
	protected m_ui_input: Input;
	private m_error_tip: Tooltip;

	constructor(props: TextEditProps) {
		super(props);
		this.addClass( '@hlayout' );
		this.mapPropEvents( props, 'change', 'click', 'focus' );
	}

	componentCreated() {
		super.componentCreated( );

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
	render(props: TextEditProps) {

		let eprops: InputProps = {
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
				get: ( ) => this._date_get_hook(),
				set: (e) => this._date_set_hook(e)
			}

			eprops.value_hook = props.value_hook ?? def_hook;
		}

		this.m_ui_input = new Input(eprops);

		//	button
		let button = undefined;
		if (props.icon) {
			button = new Button({
				icon: props.icon,
				click: () => this._btnClick(),
				tabIndex: false
			});
		}
		else if (props.type == 'date') {

			button = new Button({
				cls: 'gadget',
				icon: 0xf073,	// todo: resolve that
				tabIndex: false,
				click: () => this._showDatePicker(button)
			});

			if (!props.validator) {
				props.validator = this._date_validator;
			}
		}

		let ag = props.gadgets ?? [];
		ag.forEach( b => {
			b.addClass( 'gadget' );
		});

		let gadgets = [button, ...ag];

		this.setClass('@required', props.required);
		if (props.gadgets && props.gadgets.length) {
			this.addClass('with-gadgets');
		}

		let width = undefined,
			flex = undefined,
			labelWidth = props.labelWidth;

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

			label = new Label({
				ref: 'label',
				tag: 'label',
				cls: 'label1' + (props.label ? '' : ' @hidden'),	// todo: why 'label1' class name ?
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
				new HLayout({ width, content: [this.m_ui_input, ...gadgets] })
			]);
		}
		else {
			this.addClass('@hlayout');
			this.setContent([label, this.m_ui_input, ...gadgets]);
		}
	}

	enable(ena?: boolean) {
		if (ena === true) {
			this.m_ui_input.enable();
		}

		super.enable(ena);
	}

	disable() {
		this.m_ui_input.disable();
		super.disable();
	}

	private _btnClick() {
		this.emit('click', EvClick(this.value) );
	}

	/**
	 * select the value format for input/output on textedit of type date
	 * cf. formatIntlDate / parseIntlDate
	 * @param fmt 
	 */
	public setDateStoreFormat(fmt: string) {
		this.m_props.format = fmt;
	}

	public setStoreValue(value: any) {
		this.m_ui_input.setStoreValue(value);
	}

	public getStoreValue(): any {
		return this.m_ui_input.getStoreValue();
	}

	private _date_get_hook() {
		let date = parseIntlDate(this.value);
		let props = this.m_props;
		if (props.format == 'native') {
			return date;
		}
		else {
			return date ? formatIntlDate(date, props.format) : null;
		}
	}

	private _date_set_hook(dte) {
		let props = this.m_props;

		if (props.format == 'native') {
			this.value = formatIntlDate(dte);
		}
		else if (dte) {
			let date = parseIntlDate(dte, props.format);
			this.value = formatIntlDate(date);
		}
		else {
			this.value = '';
		}
	}

	public showError(text: string) {

		if (!this.m_error_tip) {
			this.m_error_tip = new Tooltip({ cls: 'error' });
			document.body.appendChild(this.m_error_tip._build());
		}

		let rc = this.m_ui_input.getBoundingRect();

		this.m_error_tip.text = text;
		this.m_error_tip.displayAt(rc.right, rc.top, 'top left');
		this.addClass('@error');
	}

	public clearError() {

		if (this.m_error_tip) {
			this.m_error_tip.hide();
			this.removeClass('@error');
		}
	}

	public get value(): string {
		if (this.m_ui_input) {
			return this.m_ui_input.value;
		}
		else {
			return this.m_props.value;
		}
	}

	public set value(value: string) {
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

	public selectAll() {
		this.m_ui_input.selectAll();
	}

	public select(start: number, length: number = 9999): void {
		this.m_ui_input.select(start, length);
	}

	public getSelection() {
		return this.m_ui_input.getSelection();
	}

	set readOnly(ro: boolean) {
		this.m_ui_input.readOnly = ro;
	}

	get label() {
		return this.itemWithRef<Label>('label')?.text;
	}

	set label(text) {
		this.itemWithRef<Label>('label').text = text;
	}

	/**
	 * content changed
	 * todo: should move into Input
	 */

	private _change() {
		let value = this.m_ui_input.value;
		this.emit('change', EvChange(value));
	}

	/**
	 * getting focus
	 */

	private _focus() {
		this.clearError();
		this.emit('focus', EvFocus(true));
	}

	/**
	 * loosing focus
	 * @param value 
	 */

	private _blur() {
		this._validate(this.m_ui_input.value);
		this.emit('focus', EvFocus(false));
	}

	/**
	 * todo: should move into Input
	 * @returns 
	 */
	public validate(): boolean {
		return this._validate(this.value);
	}

	private _validate(value: string): boolean {
		let props = this.m_props;
		let update = false;

		if (props.required && value.length == 0) {
			this.showError(_tr.global.required_field);
			return false;
		}

		if (value != '') {
			let pattern = this.getAttribute('pattern');
			if (pattern) {
				let re = new RegExp(pattern);
				if (re && !re.test(value)) {
					this.showError(_tr.global.invalid_format);
					return false;
				}
			}

			if (props.type == 'email') {
				if (!reEmail.test(value.toLowerCase())) {
					this.showError(_tr.global.invalid_email);
					return false;
				}
			}
			else if (props.type == 'number') {

				const v = parseFloat(value);
				if (isNaN(v)) {
					this.showError(_tr.global.invalid_number);
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

	_date_validator(value: string): string {

		value = value.trim();
		if (value == '') {
			return '';
		}

		let date: Date;
		if (value == '@') {
			date = new Date();
		}
		else {
			date = parseIntlDate(value);
			if (!date) {
				throw sprintf(_tr.global.invalid_date, _tr.global.date_format);
			}
		}

		return formatIntlDate(date);
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

	private _showDatePicker(btn: Component) {

		if (!this.m_cal_popup) {
			this.m_cal_popup = new PopupCalendar({
				change: (ev: EvChange) => {
					this.value = formatIntlDate(ev.value as Date);
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
