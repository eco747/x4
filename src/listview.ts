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

import { Container, Component, CProps, ContainerEventMap, EvDblClick } from './component.js'
import { IconID } from './icon.js';
import { HLayout, VLayout } from './layout.js'
import { Popup, PopupEventMap, PopupProps } from './popup.js';
import { HtmlString, isFunction } from './tools.js';
import { Menu, MenuItem } from "./menu.js";

import { EvContextMenu, EvSelectionChange, EvClick, EventCallback, BasicEvent, EvChange } from "./x4_events.js";

/**
 * item definition
 */

export class ListViewItem {
	id: any;
	text?: string | HtmlString;		// if you need pure text
	html?: boolean;		// if text is html
	icon?: IconID;
	data?: any;
};

/**
 * callback to render item
 */

export interface RenderListItem {
	(item: ListViewItem): any;
}

/**
 * callback to fill the list
 */
export interface PopulateItems {
	(): ListViewItem[];
}

/**
 * listview can generate these events
 */

interface ListViewEventMap extends ContainerEventMap {
	click?: EvClick;
	dblClick?: EvDblClick;
	contextMenu?: EvContextMenu;
	selectionChange?: EvSelectionChange;
}


/**
 * listview properties
 */
export interface ListViewProps extends CProps<ListViewEventMap> {
	items?: ListViewItem[];
	populate?: PopulateItems;
	gadgets?: Component[]; // gadgets to instert at bottom

	virtual?: boolean;	// if true, items will be rendered on demand
	itemheight?: number;	// in case of a virtual list, item height

	renderItem?: RenderListItem;

	click?: EventCallback<EvClick>;	// shortcut to events: { click: ... }
	dblClick?: EventCallback<EvDblClick>;// shortcut to events: { dblClick: ... }
	contextMenu?: EventCallback<EvContextMenu>;// shortcut to events: { contentMenu: ... }
	selectionChange?: EventCallback<EvSelectionChange>;// shortcut to events: { selectionChange: ... }
	cancel?: EventCallback<EvCancel>;	// shortcut to events: { cancel: ... }
}

/**
 * Standard listview class
 */

export class ListView extends VLayout<ListViewProps, ListViewEventMap> {

	protected m_selection: {
		item: ListViewItem;
		citem: Component;
	}

	protected m_defer_sel: any;

	protected m_container: Container;
	protected m_view: Container;

	protected m_topIndex: number;
	protected m_itemHeight: number;

	protected m_cache: Map<number, Component>; // recycling elements

	constructor(props: ListViewProps) {
		super(props);

		this.setDomEvent('keydown', (e) => this._handleKey(e));
		this.setDomEvent('click', (e) => this._handleClick(e));
		this.setDomEvent('dblclick', (e) => this._handleClick(e));
		this.setDomEvent('contextmenu', (e) => this._handleCtxMenu(e));

		this._setTabIndex(props.tabIndex, 0);
		this.mapPropEvents(props, 'click', 'dblClick', 'contentMenu', 'selectionChange', 'cancel' );
	}

	componentCreated() {

		if (this.m_props.virtual) {
			this._buildItems();
		}
		else if( this.m_props.populate ) {
			this.items = this.m_props.populate( );
		}
	}

	render(props: ListViewProps) {

		props.items = props.items || [];
		props.gadgets = props.gadgets;
		props.renderItem = props.renderItem;
		props.virtual = props.virtual ?? false;

		this.m_topIndex = 0;

		if (props.virtual) {
			console.assert(props.itemheight !== undefined);
			this.m_itemHeight = props.itemheight;
			this.m_cache = new Map<number, Component>();
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

	public set items(items: ListViewItem[]) {
		this.m_props.items = items;

		this.m_selection = null;
		this._buildContent();
	}

	private _handleKey(ev: KeyboardEvent) {

		let moveSel = (sens) => {

			let items: ListViewItem[];
			if (isFunction(this.m_props.items)) {
				items = this.m_props.items();
				this.m_props.items = items;
			}
			else {
				items = this.m_props.items;
			}

			let newsel: ListViewItem;
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
					newsel = this.selection
				}
			}

			let citem = this._findItemWithId(newsel?.id);
			this._selectItem(newsel, citem, true);
		}

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
	private _buildContent() {

		let props = this.m_props;

		if (props.virtual) {
			this.m_container = new Container({
				cls: '@scroll-container',
				content: []
			});

			this.m_view = new Container({
				cls: '@scroll-view',
				flex: 1,
				content: this.m_container,
				dom_events: {
					sizechange: () => this._updateScroll(true),
					scroll: () => this._updateScroll(false),
				}
			});

			this.setContent(
				[
					this.m_view,
					props.gadgets ? new HLayout({
						cls: 'gadgets',
						content: props.gadgets
					}) : null,
				]
			);
		}
		else {
			this.m_view = undefined;
			this.m_container = new VLayout({
				cls: '@scroll-container',
				content: []
			});

			this.addClass('@scroll-view');
			this.setContent(this.m_container, false);
		}

		if (props.virtual) {
			this.m_container.setStyleValue('height', props.items.length * this.m_itemHeight);
		}

		if (this.dom || !props.virtual ) {
			this._buildItems();
		}
	}

	/**
	 * 
	 */

	private _updateScroll(forceUpdate: boolean) {

		const update = () => {
			let newTop = Math.floor(this.m_view.dom.scrollTop / this.m_itemHeight);

			if (newTop != this.m_topIndex || forceUpdate) {
				this.m_topIndex = newTop;
				this._buildItems();
			}
		}

		if (forceUpdate) {
			this.startTimer('scroll', 10, false, update);
		}
		else {
			update();
		}
	}

	private async _buildItems() {
		let props = this.m_props;
		let items: Component[] = [];

		let list_items = props.items;
		if (isFunction(list_items)) {
			list_items = list_items();
		}

		if (props.virtual) {
			let rc = this.getBoundingRect();
			let limit = 100;

			let y = 0;
			let top = this.m_topIndex * this.m_itemHeight
			let index = this.m_topIndex;
			let height = rc.height;
			let count = props.items.length;

			let newels = [];

			let cache = this.m_cache;
			this.m_cache = new Map<number, Component>();

			let selId = this.m_selection?.item.id;

			while (y < height && index < count && --limit > 0) {

				let it = props.items[index];
				let itm: Component;

				if (cache.has(index)) {
					itm = cache.get(index);	// reuse it
					cache.delete(index);		// cache will contain only elements to remove
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

				this.m_cache.set(index, itm);	// keep it for next time

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

	private _renderItem(item: ListViewItem): Component {

		if (this.m_props.renderItem) {
			return this.m_props.renderItem(item);
		}

		return new HLayout({ content: item.text });
	}

	/** @ignore */
	private _handleClick(e: MouseEvent) {

		let dom = e.target as HTMLElement,
			self = this.dom,
			list_items = this.m_props.items as ListViewItem[];	// already created by build

		// go up until we find something interesting
		while (dom && dom != self) {
			let itm = Component.getElement(dom),
				id = itm?.getData('item-id');

			if (id!==undefined) {
				// find the element
				let item = list_items.find((item) => item.id == id);
				if (item) {
					let event: BasicEvent;
					if (e.type == 'click') {
						event = EvClick(item);
						this.emit('click', event);
					}
					else {
						event = EvDblClick(item);
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
	private _handleCtxMenu(e: MouseEvent) {

		let dom = e.target as HTMLElement,
			self = this.dom,
			list_items = this.m_props.items as ListViewItem[];	// already created by build;

		while (dom && dom != self) {
			let itm = Component.getElement(dom),
				id = itm?.getData('item-id');

			if (id) {

				// find the element
				let item = list_items.find((item) => item.id == id);
				if (item) {
					this._selectItem(item, itm);
					this.emit('contextMenu', EvContextMenu(e, item));
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

	protected _selectItem(item: ListViewItem, citem: Component, notify = true) {

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
			this.emit('selectionChange', EvSelectionChange(item));
		}
	}

	/**
	 * return the current seleciton or null
	 */

	public get selection() {
		return this.m_selection ? this.m_selection.item : null;
	}

	public set selection(id) {
		if (id === null || id === undefined) {
			this._selectItem(null, null);
		}
		else {
			if (isFunction(this.m_props.items)) {
				this.m_defer_sel = id;
			}
			else {
				let item = this.m_props.items.find((item) => item.id == id);
				let citem = this._findItemWithId(item.id);
				this._selectItem(item, citem, false);
			}
		}
	}

	private _findItemWithId(id: any) {
		let citem: Component = null;

		if (this.dom) {
			// make the element visible to user
			// todo: problem with virtual listview
			this.m_container.enumChilds((c: Component) => {
				if (c.getData('item-id') == id) {
					c.scrollIntoView();
					citem = c;
					return true;
				}
			})
		}

		return citem;
	}

	append( item: ListViewItem, prepend = false ) {
		
		if( prepend ) {
			this.m_props.items.unshift( item );
		}
		else {
			this.m_props.items.push( item );
		}

		if( !this.m_view ) {
			this._buildContent();
		}
		else {
			this.m_view._updateContent( );
		}
	}
}



/**
 * Cancel Event
 */

 export interface EvCancel extends BasicEvent {
}

export function EvCancel( context = null ) {
	return BasicEvent<EvCancel>({ context });
}

interface PopupListViewEventMap extends PopupEventMap {
	cancel: EvCancel;
}

interface PopupListViewProps extends PopupProps<PopupListViewEventMap> {

}


/**
 * 
 */

export class PopupListView extends Popup<PopupListViewProps,PopupListViewEventMap> {

	m_list: ListView;

	constructor(props: ListViewProps) {
		super({ tabIndex: false });

		this.enableMask(false);

		props.tabIndex = false;
		this.m_list = new ListView(props);
		//this.m_list.addClass( '@fit' );

		this.setContent(this.m_list);
		this.mapPropEvents( props, 'cancel' );
	}

	set items( items: ListViewItem[] ) {
		this.m_list.items = items;
	}

	// @override
	// todo: move into popup
	private _handleClick = (e: MouseEvent) => {
		if (!this.dom) {
			return;
		}

		let newfocus = <HTMLElement>e.target;

		// child of this: ok
		if (this.dom.contains(newfocus)) {
			return;
		}

		// menu: ok
		let dest = Component.getElement(newfocus, MenuItem);
		if (dest) {
			return;
		}

		this.signal( 'cancel', EvCancel() );
		this.close();
	}

	// todo: move into popup
	show(modal?: boolean) {
		document.addEventListener('mousedown', this._handleClick);
		super.show(modal);
	}

	hide( ) {
		document.removeEventListener('mousedown', this._handleClick);
		super.hide( );
	}

	// todo: move into popup
	close() {
		document.removeEventListener('mousedown', this._handleClick);
		super.close();
	}

	get selection(): any {
		return this.m_list.selection;
	}

	set selection(itemId: any) {
		this.m_list.selection = itemId;
	}
}