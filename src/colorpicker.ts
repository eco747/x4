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


import { Container, Component, CProps, ContainerProps, ContainerEventMap } from './component'
import { CheckBox } from './checkbox'
import { Dialog, DialogBoxEventMap, DialogProps } from './dialog'
import { BasicEvent, EvChange, EvClick, EvContextMenu, EventCallback } from './x4_events'
import { VLayout, HLayout } from './layout'
import { Label } from './label'
import { Color } from './color'
import { isString, getMousePos, clamp, classNames } from './tools'
import { TextEdit } from './textedit'
import { Menu, MenuItem } from './menu'

interface ColorPickerEventMap extends ContainerEventMap {
	change: EvChange;
}

export interface ColorPickerProps extends ContainerProps<ColorPickerEventMap> {
	color: Color;
	hasAlpha?: boolean;
}

const pal_colors = {
	blue: 		[0x0e5a8a,0x106ba3,0x137cbd,0x2b95d6,0x48aff0,],
	green: 		[0x0a6640,0x0d8050,0x0f9960,0x15b371,0x3dcc91,],
	orange: 	[0xa66321,0xbf7326,0xd9822b,0xf29d49,0xffb366,],
	red:		[0xa82a2a,0xc23030,0xdb3737,0xf55656,0xff7373,],
	vermilion:	[0x9e2b0e,0xb83211,0xd13913,0xeb532d,0xff6e4a,],
	rose:		[0xa82255,0xc22762,0xdb2c6f,0xf5498b,0xff66a1,],
	violet:		[0x5c255c,0x752f75,0x8f398f,0xa854a8,0xc274c2,],
	indigo:		[0x5642a6,0x634dbf,0x7157d9,0x9179f2,0xad99ff,],
	cobalt:		[0x1f4b99,0x2458b3,0x2965cc,0x4580e6,0x669eff,],
	turquoise:	[0x008075,0x00998c,0x00b3a4,0x14ccbd,0x2ee6d6,],
	forest:		[0x1d7324,0x238c2c,0x29a634,0x43bf4d,0x62d96b,],
	lime:		[0x728c23,0x87a629,0x9bbf30,0xb6d94c,0xd1f26d,],
	gold:		[0xa67908,0xbf8c0a,0xd99e0b,0xf2b824,0xffc940,],
	sepia:		[0x63411e,0x7d5125,0x96622d,0xb07b46,0xc99765,],
};



export class ColorPicker extends Container<ColorPickerProps, ColorPickerEventMap> {

	private m_colorSel: Component;
	private m_colorHue: Component;
	private m_colorAlpha: Component;
	private m_sample: Component;
	private m_selMark: Component;
	private m_hueMark: Component;
	private m_alphaMark: Component;

	private m_baseHSV: { h: number, s: number, v: number, a: number };
	private m_baseColor: Color;
	private m_transpCk: CheckBox;
	private m_colorEdit: TextEdit;

	private m_palmode: boolean;

	static last_palmode = false;

	constructor(props: ColorPickerProps) {
		super(props);
		this.m_palmode = ColorPicker.last_palmode;
		this.setDomEvent('contextmenu', (e) => this._showCtx(e) );
	}

	private _showCtx( e: UIEvent ) {
		const menu = new Menu( {
			items: [
				new MenuItem( { text: 'Palette', checked: this.m_palmode, click: ( ) => {
					this.m_palmode = !this.m_palmode;
					ColorPicker.last_palmode = this.m_palmode;
					this.update( );
				} } )
			]
		})

		let pt = getMousePos( e, true );
		menu.displayAt( pt.x, pt.y );
	}

	render(props: ColorPickerProps) {

		this.m_baseColor = props.color;
		this.m_baseHSV = Color.toHSV(this.m_baseColor);

		if( this.m_palmode ) {

			this.addClass( "pal-mode" );

			let cur = null;

			const buildCol = ( colors: number[] ) => {
				
				const ccolor = this.m_baseColor.value();
				const els = colors.map( x => {
					const selected = x==ccolor;

					let cls = classNames( 'clr-box', { selected } );
					let el = new Component( { cls, style: { backgroundColor: new Color(x).toHex() }, data: { color: x } } );

					if( selected ) {
						cur = el;
					}
					return el;
				});
				
				return new VLayout( {
					cls: 'vcol',
					content: els
				});
			}
			
			let rows = new HLayout( {
				cls: 'hcol',
				content: [
						buildCol( pal_colors.blue ),
						buildCol( pal_colors.green ),
						buildCol( pal_colors.orange ),
						buildCol( pal_colors.red ),
						buildCol( pal_colors.vermilion ),
						buildCol( pal_colors.rose ),
						buildCol( pal_colors.violet ),
						buildCol( pal_colors.indigo ),
						buildCol( pal_colors.cobalt ),
						buildCol( pal_colors.turquoise ),
						buildCol( pal_colors.forest ),
						buildCol( pal_colors.lime ),
						buildCol( pal_colors.gold ),
						buildCol( pal_colors.sepia ),
				]
			});

			this.m_colorEdit = new TextEdit({
				cls: 'hexv',
				value: '',
				attrs: {
					spellcheck: false,
				},
				change: (ev) => {
					const clr = new Color(ev.value);
					if (clr) {
						this.m_baseColor = clr;
						this.m_baseHSV = Color.toHSV(clr);
						this._updateColor(false);
					}
				}
			});

			this.m_transpCk = new CheckBox({
				cls: 'transp',
				text: 'transparent',
				change: (ev) => {
					this.m_baseHSV.a = ev.value ? 0 : 1;
					this._updateColor();
				}
			});

			this.setContent( [rows,this.m_transpCk, this.m_colorEdit] );

			// globally handle click

			rows.setDomEvent( 'click', (ev ) => {

				if( cur ) {
					cur.removeClass( 'selected' );
					cur = null;
				}

				let cell = Component.getElement( ev.target as HTMLElement, 'clr-box' );
				if( cell ) {
					const clr = new Color(cell.getData( 'color' ));
					this.m_baseColor = clr;
					this.m_baseHSV = Color.toHSV(clr);
					this._updateColor();

					cur = cell;
					cell.addClass( 'selected');
				}
				
			});
		}
		else {
			this.removeClass( "pal-mode" );

			this.m_selMark = new Component({ cls: 'marker' });
			this.m_colorSel = new Component({
				cls: 'sel',
				content: [
					new Component({ cls: '@fit light' }),
					new Component({ cls: '@fit dark' }),
					this.m_selMark,
				]
			});

			this.m_hueMark = new Component({ cls: 'marker' });
			this.m_colorHue = new Component({
				cls: 'hue',
				content: [
					this.m_hueMark
				]
			});
			this.m_sample = new Component({ cls: 'sample' });

			if (props.hasAlpha) {
				this.addClass( 'with-alpha' );
				this.m_alphaMark = new Component({ cls: 'marker' });
				this.m_colorAlpha = new Component({
					cls: 'alpha',
					content: [
						new Component({ cls: 'bk @fit', ref: 'color' }),
						this.m_alphaMark
					]
				});
			}
			else {
				this.removeClass( 'with-alpha' );
				this.m_transpCk = new CheckBox({
					cls: 'transp',
					text: 'transparent',
					change: (ev) => {
						this.m_baseHSV.a = ev.value ? 0 : 1;
						this._updateColor();
					}
				});
			}

			this.m_colorEdit = new TextEdit({
				cls: 'hexv',
				value: '',
				attrs: {
					spellcheck: false,
				},
				change: (ev) => {
					const clr = new Color(ev.value);
					if (clr) {
						this.m_baseColor = clr;
						this.m_baseHSV = Color.toHSV(clr);
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

			this.m_colorSel.setDomEvent('mousedown', (ev: MouseEvent) => {
				Component.setCapture(this, (e) => this._selChange(e));
			});

			this.m_colorHue.setDomEvent('mousedown', (ev: MouseEvent) => {
				Component.setCapture(this, (e) => this._hueChange(e));
			});

			if (props.hasAlpha) {
				this.m_colorAlpha.setDomEvent('mousedown', (ev: MouseEvent) => {
					Component.setCapture(this, (e) => this._alphaChange(e));
				});
			}

			this._updateColor();
		}
	}

	set color(clr: Color) {
		this.m_baseColor = clr;
		this.m_baseHSV = Color.toHSV(this.m_baseColor);

		this._updateColor();
	}

	get color() {
		return this.m_baseColor;
	}

	private _selChange(ev: UIEvent) {
		let pt = getMousePos(ev, true);
		console.log(pt);
		let rc = this.m_colorSel.getBoundingRect();

		if (!this.m_props.hasAlpha) {
			this.m_baseHSV.a = 1;
		}

		this.m_baseHSV.s = clamp((pt.x - rc.left) / rc.width, 0, 1);
		this.m_baseHSV.v = 1 - clamp((pt.y - rc.top) / rc.height, 0, 1);
		this._updateColor();

		if (ev.type == 'mouseup' || ev.type == 'touchend') {
			Component.releaseCapture();
		}
	}

	private _hueChange(ev: UIEvent) {
		let pt = getMousePos(ev, true);
		let rc = this.m_colorHue.getBoundingRect();

		this.m_baseHSV.h = clamp((pt.y - rc.top) / rc.height, 0, 1);
		this._updateColor();

		if (ev.type == 'mouseup' || ev.type == 'touchend') {
			Component.releaseCapture();
		}
	}

	private _alphaChange(ev: UIEvent) {
		let pt = getMousePos(ev, true);
		let rc = this.m_colorAlpha.getBoundingRect();

		this.m_baseHSV.a = clamp((pt.x - rc.left) / rc.width, 0, 1);
		this._updateColor();

		if (ev.type == 'mouseup' || ev.type == 'touchend') {
			Component.releaseCapture();
		}
	}

	private _updateColor(edit = true) {

		let color: Color;

		if( !this.m_palmode ) {

			color = Color.fromHSV(this.m_baseHSV.h, 1, 1, 1);
			this.m_colorSel.setStyleValue('backgroundColor', color.toString());

			color = Color.fromHSV(this.m_baseHSV.h, this.m_baseHSV.s, this.m_baseHSV.v, 1);
			this.m_sample.setStyleValue('backgroundColor', color.toString());

			if (this.m_props.hasAlpha) {
				let gradient = `linear-gradient(to right, rgba(0,0,0,0) 0%, ${color.toString()} 100%)`;
				this.m_colorAlpha.itemWithRef<Component>('color').setStyleValue('backgroundImage', gradient);
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
		
		color = Color.fromHSV(this.m_baseHSV.h, this.m_baseHSV.s, this.m_baseHSV.v, this.m_baseHSV.a);
		this.m_baseColor = color;
		
		if (edit) {
			this.m_colorEdit.value = color.alpha()==1 ? color.toHex() : color.toString()	//color.toHex();
		}

		this._change();
	}

	private _change() {
		this.emit('change', EvChange(this.m_baseColor));
	}
}

// :: color dialog ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

interface ColorPickerBoxEventMap extends DialogBoxEventMap {
	change: EvChange;
}

export interface ColorPickerBoxProps extends DialogProps<ColorPickerBoxEventMap> {
	color: Color;
	hasAlpha?: boolean;
	cust_colors?: Color[];

	change?: EventCallback<EvChange>;	// shortcut to { event: change: ... }
}


export class ColorPickerBox extends Dialog<ColorPickerBoxProps, ColorPickerBoxEventMap>
{
	private m_picker: ColorPicker;

	constructor(props: ColorPickerBoxProps) {

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
			new VLayout({
				content: [
					this.m_picker,
					customs
				]
			})
		], ['ok', 'cancel']);

		this.on('btnClick', (ev) => {
			if (ev.button == 'ok') {
				this.emit('change', EvChange(this.m_picker.color));
			}
		});
	}

	private _makeCustoms(cc) {

		let custom = null;

		if (cc && cc.length > 0) {

			let els = [];

			for (let i = 0; i < cc.length; i += 8) {

				let lne = [];

				for (let j = 0; j < 8; j++) {

					let idx = i + j,
						clr = cc[idx];

					lne.push(new Label({
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
									this.emit('change', EvChange(clr));
									this.close();
								}
							}
						}
					}));
				}

				els.push(new HLayout({ cls: 'line', content: lne }));
			}

			custom = new VLayout({ cls: 'customs', content: els });
		}

		return custom;
	}

	set color(clr: Color) {
		this.m_picker.color = clr;
	}

	get color() {
		return this.m_picker.color;
	}

	/**
	 * display a messagebox
	 */

	static show(props: string | ColorPickerBoxProps): ColorPickerBox {

		let msg;

		if (isString(props)) {
			msg = new ColorPickerBox({ color: new Color(props) });
		}
		else {
			msg = new ColorPickerBox(props);
		}

		msg.show();
		return msg;
	}
}

// :: PickerEditor ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

export interface ColorPickerEditorProps extends ColorPickerProps {
	label?: string;
	labelWidth?: number;
	cust_colors?: Color[];

	change: EventCallback<EvChange>;
}

export class ColorPickerEditor extends HLayout<ColorPickerEditorProps, ColorPickerEventMap> {

	constructor(props: ColorPickerEditorProps) {
		super(props);

		this.mapPropEvents(props, 'change');
	}

	render(props: ColorPickerEditorProps) {

		let color = props.color;
		let tcolor: string;

		if (this._isTransp(color)) {
			color = Color.NONE;
			tcolor = 'black';
		}
		else {
			tcolor = Color.contrastColor(color).toString();
		}

		this.setContent([
			props.label ? new Label({
				cls: 'label',
				text: props.label,
				flex: props.labelWidth < 0 ? -props.labelWidth : undefined,
				width: props.labelWidth >= 0 ? props.labelWidth : undefined,
			}) : null,
			new Label({
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

	set value(color: Color) {
		this.m_props.color = color;
		this.update();
	}

	get value() {
		return this.m_props.color;
	}

	set custom_colors(v: Color[]) {
		this.m_props.cust_colors = v;
	}

	private _showPicker() {
		let dlg = new ColorPickerBox({
			color: this.m_props.color,
			cust_colors: this.m_props.cust_colors,
			hasAlpha: this.m_props.hasAlpha,
			events: {
				change: (e) => {
					this.m_props.color = e.value as Color;
					this._change();
					this.update();
				}
			}
		});

		let rc = this.getBoundingRect();
		dlg.displayAt(rc.left, rc.bottom, 'tl');
	}

	private _change() {
		this.emit('change', EvChange(this.m_props.color));
	}

	private _isTransp(color: Color) {
		return !color.alpha();
	}
}


