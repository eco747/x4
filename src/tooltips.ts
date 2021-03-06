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

import {Component,CProps, flyWrap} from "./component"
import {Label} from "./label"
import { Icon } from "./icon"
import { isTouchDevice } from "./tools"


let tipTmo;
let tooltip;

/**
 * 
 */

export class Tooltip extends Component {

	private m_text: Label;

	set text( text ) {
		this.m_text.text = text;
	}

	/** @ignore */	
	render( ) {
		this.setClass( '@non-maskable', true );
		this.setContent( [
			new Icon( { icon: 0xf05a } ),
			this.m_text = new Label( { text: 'help' } )
		]);
	}

	/**
	* display the menu at a specific position
	* @param x 
	* @param y 
	*/

	public displayAt(x: number, y: number, align: string = 'top left' ) {

		this.show();

		let halign = 'l',
			valign = 't';

		if( align.indexOf('right')>=0 ) {
			halign = 'r';
		}

		if( align.indexOf('bottom')>=0 ) {
			valign = 'b';
		}

		// @TODO: this is a minimal overflow problem solution
		let rc = document.body.getBoundingClientRect(),
			rm = this.getBoundingRect();

		if( halign=='r' ) {
			x -= rm.width;
		}

		if( valign=='b' ) {
			y -= rm.height;
		}

		if ((x + rm.width) > rc.right) {
			x = rc.right - rm.width;
		}

		if ((y + rm.height) > rc.bottom) {
			y = rc.bottom - rm.height - 17;	// default cursor height
		}

		this.setStyle({ left: x, top: y });
	}
}

export type TooltipHandler = ( text: string ) => void;

export function initTooltips( cb?: TooltipHandler ) {

	if( isTouchDevice() ) {
		return;
	}

	let tipTarget = {
		target: null,
		x: 0,
		y: 0
	};

	function handle_mpos( event: MouseEvent ) {
		tipTarget.x = event.pageX;
		tipTarget.y = event.pageY;
	}

	function handle_mouse( event: MouseEvent ) {

		let target: HTMLElement = <HTMLElement>event.target;
		let tip = null;

		tipTarget.x = event.pageX+10;
		tipTarget.y = event.pageY+15;

		while( target ) {
			tip = target.getAttribute('tip');
			if( tip ) {
				break;
			}

			target = target.parentElement;
		}

		if( target==tipTarget.target || (tooltip && target==tooltip.dom) ) {
			return;
		}

		if( !target || !tip ) {
			tipTarget.target = null;

			if( cb ) {cb( null );}
			else {_hideTip( );}
			
			return;
		}

		tipTarget.target = target;
		if( cb ) {cb( null );}
		else {_hideTip( );}
		
		if( cb ) {
			cb( tip );
		}
		else {
			tipTmo = setTimeout( ( ) => {

				if( tooltip===undefined ) {
					tooltip = new Tooltip( {});
					document.body.appendChild(tooltip._build());
				}

				tooltip.text = tip;
				tooltip.displayAt( tipTarget.x+17, tipTarget.y+17, 'top left' );
			}, 700 );
		}

	}

	function _hideTip( ) {
		if( tipTmo ) {
			clearTimeout( tipTmo );
		}
		
		if( tooltip ) {
			tooltip.hide( );
		}
	}

	document.body.addEventListener( 'mouseover', handle_mouse );
	document.body.addEventListener( 'mouseout', handle_mouse );
	document.body.addEventListener( 'mousemove', handle_mpos );
}