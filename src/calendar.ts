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

import { Button } from "./button.js";
import { Popup } from "./popup.js";
import { Component, CProps, ContainerEventMap, Flex } from "./component.js"
import { EvChange, EventCallback } from './x4_events.js'

import { _tr } from "./i18n.js";
import { Label } from "./label.js";
import { HLayout, VLayout } from "./layout.js"
import { date_hash, date_clone, date_calc_weeknum, formatIntlDate } from './tools.js'
import { Menu, MenuItem } from "./menu.js";


interface CalendarEventMap extends ContainerEventMap {
	change?: EvChange;
}


interface CalendarProps extends CProps<CalendarEventMap> {
	date?: Date;	// initial date to display
	minDate?: Date;	// minimal date before the user cannot go
	maxDate?: Date;	// maximal date after the user cannot go

	change?: EventCallback<EvChange>; // shortcut to events: { change: ... }
}


/**
 * default calendar control
 * 
 * fires:
 * 	EventChange ( value = Date )
 */

export class Calendar extends VLayout<CalendarProps, CalendarEventMap>
{
	private m_date: Date;

	constructor(props: CalendarProps) {
		super(props);

		this.mapPropEvents( props, 'change' );
		this.m_date = props.date?.clone() ?? new Date();
	}

	/** @ignore */

	render(props: CalendarProps) {

		let month_start = date_clone(this.m_date);
		month_start.setDate(1);

		let day = month_start.getDay();
		if (day == 0) {
			day = 7;
		}

		month_start.setDate(-day + 1 + 1);
		let dte = date_clone(month_start);

		let today = this.m_date.hash();

		let month_end = date_clone(this.m_date);
		month_end.setDate(1);
		month_end.setMonth(month_end.getMonth() + 1);
		month_end.setDate(0);

		let end_of_month = date_hash(month_end);

		let rows: HLayout[] = [];

		// month selector
		let header = new HLayout({
			cls: 'month-sel',
			content: [
				new Label({
					cls: 'month',
					text: formatIntlDate(this.m_date, 'O'),
					dom_events: {
						click: () => this._choose('month')
					}
				}),
				new Label({
					cls: 'year',
					text: formatIntlDate(this.m_date, 'Y'),
					dom_events: {
						click: () => this._choose('year')
					}
				}),
				new Flex(),
				new Button({ text: '<', click: () => this._next(false) } ),
				new Button({ text: '>', click: () => this._next(true) } )
			]
		});

		rows.push(header);

		// calendar part
		let day_names = [];

		// day names
		// empty week num
		day_names.push(new HLayout({
			cls: 'weeknum cell',
		}));

		for (let d = 0; d < 7; d++) {
			day_names.push(new Label({
				cls: 'cell',
				flex: 1,
				text: _tr.global.day_short[(d + 1) % 7]
			}));
		}

		rows.push(new HLayout({
			cls: 'week header',
			content: day_names
		}));

		let cmonth = this.m_date.getMonth();

		// weeks
		let first = true;
		while (date_hash(dte) <= end_of_month) {

			let days = [
				new HLayout({ cls: 'weeknum cell', content: new Component({ tag: 'span', content: formatIntlDate(dte, 'w') }) })
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

				days.push(new HLayout({
					cls,
					flex: 1,
					content: new Component({
						tag: 'span',
						content: formatIntlDate(dte, 'd'),
					}),
					dom_events: {
						click: () => this.select(dte.clone())
					}
				}));

				dte.setDate(dte.getDate() + 1);
				first = false;
			}

			rows.push(new HLayout({
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

	private select(date: Date) {
		this.m_date = date;
		this.emit('change', EvChange(date));
		this.update();
	}

	/**
	 * 
	 */

	private _next(n: boolean) {
		this.m_date.setMonth(this.m_date.getMonth() + (n ? 1 : -1));
		this.update();
	}

	/**
	 * 
	 */

	private _choose(type: 'month' | 'year') {

		let items: MenuItem[] = [];

		if (type == 'month') {
			for (let m = 0; m < 12; m++) {
				items.push(new MenuItem({
					text: _tr.global.month_long[m],
					click: () => { this.m_date.setMonth(m); this.update(); }
				}));
			}
		}
		else if (type == 'year') {

			let min = this.m_props.minDate?.getFullYear() ?? 2000;
			let max = this.m_props.maxDate?.getFullYear() ?? 2048;

			for (let m = min; m < max; m++) {
				items.push(new MenuItem({
					text: '' + m,
					click: () => { this.m_date.setFullYear(m); this.update(); }
				}));
			}
		}

		let menu = new Menu({
			items
		});

		let rc = this.getBoundingRect();
		menu.displayAt(rc.left, rc.top);
	}

	get date() {
		return this.m_date;
	}

	set date(date: Date) {
		this.m_date = date;
		this.update();
	}
}

/**
 * default popup calendar
 */

export class PopupCalendar extends Popup {

	m_cal: Calendar;

	constructor(props: CalendarProps) {
		super({ tabIndex: 1 });

		this.enableMask(false);

		this.m_cal = new Calendar(props);
		this.m_cal.addClass('@fit');

		this.setContent(this.m_cal);
	}

	// binded
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

		this.close();
	}

	/** @ignore */
	show(modal?: boolean) {
		document.addEventListener('mousedown', this._handleClick);
		super.show(modal);
	}

	/** @ignore */
	close() {
		document.removeEventListener('mousedown', this._handleClick);
		super.close();
	}

}