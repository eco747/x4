/**
* @file image.ts
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

import { Component, CProps, html } from './component'

// ============================================================================
// [IMAGE]
// ============================================================================

interface ImageProps extends CProps
{
	src: string;
	alt?: string;
	lazy?: boolean;	// mark image as lazy loading
	alignment?: 'fill' | 'contain' | 'cover' | 'scale-down' | 'none';
}

const emptyImageSrc = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

function _isStaticImage( src: string ) {
	return src.substr(0,5)=='data:';
}



/**
 * Standard image class
 */
export class Image extends Component<ImageProps>
{
	protected m_created: boolean;
	protected m_lazysrc: string;		// expected 
	
	constructor(props: ImageProps) {
		super(props);

		this.m_created = false;
		
		this.m_props.lazy = props.lazy===false ? false : true;
		this.m_props.alt = props.alt;
		
		if( props.lazy!==false ) {
			this.m_lazysrc = props.src;
			props.src = emptyImageSrc;
		}
		
		this.setDomEvent( 'create', ( ) => {
			if( props.lazy ) {
				this.setImage( this.m_lazysrc, true );
			}
		});
	}

	/** @ignore */
	render( ) {
		let mp = this.m_props;

		const img = new Component( {
			tag: 'img',
			attrs: {
				draggable: false,
				alt: mp.alt ?? '',
				decoding: mp.lazy ? 'async' : undefined,
			},
			style: {
				objectFit: mp.alignment ? mp.alignment : undefined
			}
		});

		this.setContent( img );
	}
	
	/**
	 * change the image
	 * @param src - image path
	 */

	public setImage( src: string, force?: boolean ) {

		if( !src ) {
			src = emptyImageSrc;
		}
		
		if( !this.m_props.lazy ) {
			this.m_props.src = src;
			this.m_lazysrc = src;

			if( this.dom ) {
				(<HTMLElement>this.dom.firstChild).setAttribute( 'src', src );
			}
		}
		else if( force || this.m_lazysrc!=src ) {
			if( _isStaticImage(src) ) {
				// not to download -> direct display
				this.m_props.src = src;
				this.m_lazysrc = src;

				if( this.dom ) {
					(<HTMLElement>this.dom.firstChild).setAttribute( 'src', this.m_props.src );
				}
			}
			else {
				// clear current image while waiting
				this.m_props.src = emptyImageSrc;
				if( this.dom ) {
					(<HTMLElement>this.dom.firstChild).setAttribute( 'src', this.m_props.src );
				}
				
				this.m_lazysrc = src;
				if( this.dom ) {
					this._update_image( );			
				}
			}
		}
	}

	private _update_image( ) {

		console.assert( !!this.dom );

		if( this.m_lazysrc && !_isStaticImage(this.m_lazysrc) ) {
			// we do not push Components in a static array...
			Image.lazy_images_waiting.push( { dom: this.dom, src: this.m_lazysrc } );
			if( Image.lazy_image_timer===undefined ) {
				Image.lazy_image_timer = setInterval( Image.lazyWatch as TimerHandler, 10 );
			}
		}
	}

	private static lazy_images_waiting = [];
	private static lazy_image_timer: number = undefined;

	private static lazyWatch( ) {

		let newList = [];
		let done = 0;
			
		Image.lazy_images_waiting.forEach( ( el ) => {

			let dom = el.dom,
				src = el.src;
				
			// skip deleted elements
			if( !dom || !document.contains(dom) ) {
				// do not append to newList
				return;
			}

			let rc = dom.getBoundingClientRect();

			// if it is visible & inserted inside the document
			if( !done && dom.offsetParent!==null && 
				rc.bottom >= 0 && rc.right >= 0 &&  
				rc.top <= (window.innerHeight || document.documentElement.clientHeight) && 
				rc.left <= (window.innerWidth || document.documentElement.clientWidth) ) {

				// ok, we load the image
				let img = <HTMLElement>dom.firstChild;
				img.setAttribute( 'src', src );
				done++;
			}
			else {
				// still not visible: may be next time
				newList.push( el );
			}
		} );

		Image.lazy_images_waiting = newList;

		// no more elements to watch...
		if( newList.length==0 ) {
			clearInterval( Image.lazy_image_timer );
			Image.lazy_image_timer = undefined;
		}
	}
}