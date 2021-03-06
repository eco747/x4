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

import { CEventMap, Component, CProps } from './component'
import { EvClick, EventCallback } from './x4_events'

import { Popup, PopupProps } from './popup'
import { Icon, IconID } from './icon'
import { Label } from './label'
import { HLayout } from './layout'

// ============================================================================
// [MENU]
// ============================================================================

export class MenuSeparator extends Component {
}

export class MenuTitle extends Label {
}


/**
 * Standard Menu
 */

export type MenuOrSep = MenuItem | MenuSeparator | MenuTitle;

export interface MenuProps extends PopupProps {
	items?: MenuOrSep[];
}

export class Menu extends Popup<MenuProps>
{
	private static watchCount: number = 0;
	private static rootMenu: Menu = null;

	protected m_subMenu: Menu;
	protected m_opener: MenuItem;
	protected m_virtual: boolean;
	protected m_lock: number;

	constructor(props: MenuProps, opener?: MenuItem) {
		super(props);

		this.addClass('@shadow');

		this.m_opener = opener;
		this.m_virtual = false;
		this.m_lock = 0;

		this.enableMask(false);
	}

	lock(yes: boolean) {
		this.m_lock += yes ? 1 : -1;
	}

	setVirtual() {
		this.m_virtual = true;
	}

	setSubMenu(menu: Menu) {
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
	render(props: MenuProps) {
		this.setContent(props.items);
	}

	/**
	* 
	*/

	public show() {
		if (!this.m_virtual) {
			Menu._addMenu(this);
		}

		super.show();
	}

	/**
	 * 
	*/

	public close() {

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

	public clear() {
		this.m_props.items = [];
	}

	/**
	* @internal
	*/

	public static _addMenu(menu) {
		//console.log( 'addmenu' );
		if (Menu.watchCount == 0) {
			Menu.rootMenu = menu;
			document.addEventListener('mousedown', Menu._mouseWatcher);
		}

		Menu.watchCount++;
	}

	public static _removeMenu() {
		//console.log( 'removemenu' );
		console.assert(Menu.watchCount > 0);
		Menu.watchCount--;

		if (Menu.watchCount == 0) {
			document.removeEventListener('mousedown', Menu._mouseWatcher);
		}
	}

	private static _mouseWatcher(ev: MouseEvent) {
		if (ev.defaultPrevented) {
			return;
		}

		let elOn = <HTMLElement>ev.target;

		while (elOn) {
			// is mouse on a menu
			let mouseon = Component.getElement(elOn);
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

	public static _discardAll() {
		if (Menu.rootMenu) {
			Menu.rootMenu.close();
			Menu.rootMenu = null;
		}
	}

	public displayAt(x: number, y: number, align: string = 'top left', offset?: { x, y }) {
		if (!this.m_lock) {
			Menu._discardAll();
		}

		super.displayAt(x, y, align, offset);
	}
}

/**
 * MENU ITEM
 */

interface MenuItemEventMap extends CEventMap {
	click: EvClick;
}

export interface MenuItemProps extends CProps {
	itemId?: any;
	text?: string;
	icon?: IconID;		// pass -1 to avoid space for icon
	items?: MenuOrSep[];
	checked?: boolean;
	cls?: string;

	click?: EventCallback<EvClick>;	// shortcut to events: { click ... }
}



export class MenuItem extends Component<MenuItemProps, MenuItemEventMap> {

	private m_menu: Menu;
	private m_isOpen: boolean;

	constructor(props: MenuItemProps) {
		super(props);

		this.m_menu = null;
		this.m_isOpen = false;

		this.setDomEvent('mousedown', (e) => this._mousedown(e));
		this.setDomEvent('click', (e) => this._click(e));
		this.mapPropEvents(props, 'click');
	}

	/** @ignore */
	render(props: MenuItemProps) {

		let icon = props.icon ?? 0x20;
		let text = props.text;

		if (props.checked !== undefined) {
			icon = props.checked ? 0xf00c : 0;	//todo: use stylesheet
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
			icon < 0 ? null : new Icon({ icon }),
			new Label({ flex: 1, text })
		]);
	}

	get id(): any {
		return this.m_props.itemId;
	}

	get text(): string {
		return this.m_props.text;
	}

	get isPopup(): boolean {
		return !!this.m_props.items;
	}

	public _close() {
		this.removeClass('@opened');
		this.m_isOpen = false;
	}

	protected _click(ev: MouseEvent) {
		if (!this.isPopup) {
			this.emit('click', EvClick());
			Menu._discardAll();
		}
	}

	protected _mousedown(ev: MouseEvent) {

		if (this.isPopup) {
			if (!this.m_menu) {
				this.m_menu = new Menu({ items: this.m_props.items }, this);
			}

			let doClose = this.m_isOpen;

			// if parent menu has an opened sub menu, close it
			let parent_menu = Component.getElement(this.dom, Menu);

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

/**
 * 
 */

export class MenuBar extends HLayout {
	protected m_items: MenuOrSep[];

	constructor(props: MenuProps, opener?: MenuItem) {
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