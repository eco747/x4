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

import { Component, CProps } from './component.js'


export interface SVGProps extends CProps {
	path: string;
	viewBox: string;
}

export class SVGPathBuilder 
{
	private m_path: string;
	private m_attrs: Map<string,string>;

	constructor( ) {
		this.clear( );
	}

	moveTo( x: number, y: number ) {
		this.m_path += `M${x} ${y}`;
		return this;
	}

	lineTo( x: number, y: number ) {
		this.m_path += `L${x} ${y}`;
		return this;
	}

	attr( attr: string, value: string ) {
		this.m_attrs.set( attr, value );
		return this;
	}

	render( clear = true ) : string {
		let result = '<path d="' + this.m_path + '"';

		this.m_attrs.forEach( (v,k) => {
			result += ` ${k} = "${v}"`
		});

		result += '></path>';

		if( clear ) {
			this.clear( );
		}

		return result;
	}

	clear( ) {
		this.m_path = '';
		this.m_attrs = new Map<string,string>( );
	}
}

export class SVGComponent extends Component {

	constructor( props: SVGProps ) {
		super( props );

		this.setProp('tag','svg');
		this.setProp('namespace','http://www.w3.org/2000/svg');
		this.setProp('xmlns','http://www.w3.org/2000/svg');

		this.setAttributes( {
			viewBox: props.viewBox,
		});

		this.setContent( props.path );
	}

	
}



