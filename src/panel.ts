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

import { Component, CProps, ComponentContent } from './component.js'
import { VLayout, HLayout } from './layout.js'
import { Label } from './label.js'
import { Icon, IconID } from './icon.js';

// ============================================================================
// [PANEL]
// ============================================================================

export interface  PanelProps extends CProps {
	icon?: IconID;
	title: string;
	gadgets?: Component[];
}

	
export class Panel extends VLayout<PanelProps> {
	private m_ui_title: Label;
	private m_ui_body: Component;
	
	constructor( props: PanelProps ) {
		super( props );

		//todo: cannot be called twice do to content overload
		this.m_ui_title = new Label({cls: 'title', text: this.m_props.title});
		this.m_ui_body = new Component( { cls: 'body @vlayout', content: this.m_props.content } );
	}

	/** @ignore */	
	render( ) {
		const gadgets = this.m_props.gadgets ?? [];
		const icon = this.m_props.icon ? new Icon( { icon: this.m_props.icon}) : null;

		super.setContent( [ 
			new HLayout( {
				cls: 'title',
				content: [
					icon,
					this.m_ui_title, 
					...gadgets
				]
			}),
			this.m_ui_body
		] );
	}

	setContent( els: ComponentContent ) {
		this.m_ui_body.setContent( els );
	}

	set title( text: string ) {
		this.m_ui_title.text = text;
	}
}
