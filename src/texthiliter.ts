/**
* @file texthiliter.ts
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

/**
 * idea came from https://www.cdolivet.com/editarea
 */

import { Component, CProps, CEventMap } from './component'
import { EvChange } from './x4_events'

interface TextHiliterEventMap extends CEventMap {
	change: EvChange;
}


interface TextHiliterProps extends CProps {
	text: string;
	kwList?: Set<string>;
	change?: EvChange;
}


export class TextHiliter extends Component<TextHiliterProps,TextHiliterEventMap> {

	private m_text: string;
	private m_ed: Component;
	private m_hi: Component;
	private m_top: number;
	private m_kwList: Set<string>;

	constructor( props: TextHiliterProps ) {
		super( props );

		this.m_kwList = props.kwList;
		this.m_top = 0;
		this.m_text = props.text ?? '';
	
		this.mapPropEvents( props, 'change' );
	}

	/** @ignore */	
	render( ) {
		this.setContent( [
			this.m_hi = new Component( {
				tag: 'span',
				cls: '@fit @syntax-hiliter',
			}),
			this.m_ed = new Component( {
				tag: 'textarea',
				cls: '@fit',
				width: '100%',
				attrs: {
					spellcheck: 'false',
					wrap: 'off',
				},
				dom_events: {
					input: ()=>this._hiliteText(),
					scroll: ()=> this._updateScroll( ),
					keydown: (e)=> this._keydown(e),
				}
			}),
			
		])
	}

	componentCreated() {
		super.componentCreated( );
		this.value = this.m_text;
	}

	get value( ) : string {

		if( this.dom ) {
			return (<HTMLTextAreaElement>this.m_ed.dom).value;
		}
		else {
			return this.m_text;
		}
	}

	set value( t: string ) {
		if( this.dom ) {
			(<HTMLTextAreaElement>this.m_ed.dom).value = t;
		}
		
		this.m_text = t;
		this._hiliteText( );
	}

	private _keydown( e: KeyboardEvent ) {
		if(e.key=='Tab' ){
			e.preventDefault();
			e.stopPropagation( );

			let dom = <HTMLTextAreaElement>this.m_ed.dom;
			
			let ss = dom.selectionStart;
			let se = dom.selectionEnd;
			dom.setRangeText( '\t', ss, se );
			dom.setSelectionRange( ss+1, ss+1 );
			dom.dispatchEvent( new Event( 'input' ) );
        }
		else if( e.key=='Enter' ) {
			e.stopPropagation( );
        }
	}

	private _hiliteText( ) {
		let text = (<HTMLTextAreaElement>this.m_ed.dom).value;

		if( !this.m_hi.dom.firstChild ) {
			this.m_hi.dom.innerHTML = '<div style="position:absolute"></div>';
		}

		(<HTMLElement>this.m_hi.dom.firstChild).innerHTML = this._tokenize(text);
		//	this._updateScroll( );
	}

	private _updateScroll( ) {
		
		this.startTimer('sync', 0, false, ( ) => {
			let top = this.m_ed.dom.scrollTop;	
			if( top!=this.m_top ) {
				this.m_hi.dom.scrollTop = top;
				this.m_top = top;
			}
			this.m_hi.dom.scrollLeft = this.m_ed.dom.scrollLeft;
			//this.m_hi.setStyleValue( 'width', this.m_ed.dom.clientWidth );
		});
	}

	private _escape( text: string ) : string {
		text = text.replace( /&/gm, '&amp;' );
		text = text.replace( /</gm, '&lt;' );
		text = text.replace( />/gm, '&gt;' );
		return text;
	}



	private _tokenize( text: string ) : string {

		const reNUM = /\d/;
		const reNUM2 = /[\d.]/;
		const rePUNC = /\+|-|,|\/|\*|=|%|!|\||;|\.|\[|\]|\{|\|\(|\)|}|<|>|&/;
		const reKW = /[a-zA-Z_]/;
		const reKW2 = /[a-zA-Z0-9_]/;

		let result = '';

		let i = 0;
		let length = text.length;
		let s;

		console.time( "hilite" );
		
		while( i<length ) {

			let c = text.charAt( i );
			
			// numbers
			if( reNUM.test(c) ) {
				
				let s = i;
				do {
					c = text.charAt( ++i );
				} while( reNUM2.test(c) && i<length );
				
				result += '<span class="num">' + text.substring( s, i ) + '</span>';
				continue;
			}

			// keywords
			if( this.m_kwList ) {
				if( reKW.test(c) ) {

					let s = i;
				
					do {
						c = text.charAt( ++i );
					} while( reKW2.test(c) && i<length );

					let kw = text.substring( s, i );
					if( this.m_kwList.has( kw ) ) {
						result += '<span class="kword">' + kw + '</span>';
					}
					else {
						result += kw;
					}

					continue;
				}
			}

			if( c=='#' ) {
				let ne = text.indexOf( '\n', i+1 );
				if( ne<0 ) {
					ne = text.length;
				}

				result += '<span class="cmt">' + this._escape(text.substring( i, ne )) + '</span>';	
				i = ne;
				continue;
			}
			
			//	comments
			if( c=='/' ) {
				let cn = text.charAt( i+1 );
				if( cn=='*' ) {
					let ne = text.indexOf( '*/', i+2 );
					if( ne<0 ) {
						ne = text.length;
					}

					result += '<span class="cmt">' + this._escape(text.substring( i, ne+2 )) + '</span>';	
					i = ne+2;
					continue;
				}
				else if( cn=='/' ) {
					let ne = text.indexOf( '\n', i+2 );
					if( ne<0 ) {
						ne = text.length;
					}

					result += `<span class="cmt">${this._escape(text.substring( i, ne ))}</span>`;	
					i = ne;
					continue;
				}
			}
			
			// punctuation
			if( rePUNC.test(c) ) {
				 s = i;
				do {
					c = text.charAt( ++i );
				} while( rePUNC.test(c) && i<length );
				
				result += `<span class="punc">${text.substring( s, i )}</span>`;
				continue;
			}
			
			// strings
			if( c=='"' || c=='\'' || c=='\`' ) {
				s = i;

				let delim = c;
				do {
					c = text.charAt( ++i );
				} while( c!=delim && i<length );
				
				result += `<span class="str">${this._escape(text.substring( s, ++i ))}</span>`;
				continue;
			}

			i++;
			result += c;
		}

		console.timeEnd( "hilite" );
		return result + '\n\n\n';
	}
}
