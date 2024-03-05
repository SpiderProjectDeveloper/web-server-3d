import indexHTML from './index.html';

export class Initializer {
	w = null;	
	h = null;
	appContainer = null;
	user = null;
	sessId = null;
	projectId = null;

	constructor() {
		// Reading project id
		this.projectId = window.location.search;
		if( this.projectId ) {
			this.projectId = this.projectId.substr(1);
		}

		let script = document.getElementById('bundle');
		if( script ) {	
			let appContainerName = script.getAttribute('data-appcontainer');
			if(appContainerName) { 
				this.appContainer = document.getElementById(appContainerName);
			}
			this.user = script.getAttribute('data-user');
		}

		// Reading project id
		let query = this.parseSearchQuery();
		if( ('projectId' in query) ) {
			this.projectId = query.projectId;
		}
		if( ('user' in query) ) {
			this.user = query.user;
		}
		if( ( 'sessId' in query && query.sessId.length > 0 ) ) {
			this.sessId = query.sessId;
			setCookie( "sess_id", query.sessId );
		}
		if( ('lang' in query) ) {
			this.lang = query.lang;
		}

		if( this.user === null ) {
			let cookieUser = getCookie( 'user' );
			if( cookieUser !== null ) {
				this.user = cookieUser;
			}
		}
		if( !this.user ) { 
			this.user = 'NoName';
		}

		if( this.sessId === null ) {
			let cookieSessId = getCookie( 'sess_id' ); 	// Reading the session id
			if( cookieSessId !== null ) {
				this.sessId = cookieSessId;
			} 
		}

		if( this.lang === null ) {
			let cookieLang = getCookie( 'lang' ); 	// Reading the session id
			if( cookieLang !== null ) {
				this.lang = cookieLang;
			}
		}

		this.updateResize();		
	}

	updateResize() {
		if( this.appContainer ) {
			this.appContainer.innerHTML = indexHTML;
			let r = appContainer.getBoundingClientRect();
			this.w = r.width;
			this.h = r.height;
		} else { 
			document.body.innerHTML = indexHTML;
			this.w = window.innerWidth;
			this.h = window.innerHeight;
		}
		this.hh = 40;
		this.contentH = this.h - this.hh;
		this.contentW = this.w;

		this.gntL = 0;
		this.gntT = 0;
		this.gntW = Math.floor( this.contentW *0.28 );
		this.gntH = this.contentH;

		this.canvasL = Math.floor( this.contentW / 10 ); // this.gntW;
		this.canvasT = 0;
		this.canvasW = Math.floor(this.contentW - this.canvasL);
		this.canvasH = this.contentH;

		let pageHeaderElem = document.getElementById('header');
		pageHeaderElem.style.height = this.hh + 'px';
		pageHeaderElem.style.width = this.w + 'px'; 

		let pageContentElem = document.getElementById('ifc-content');
		pageContentElem.style.height = this.contentH + 'px';
		pageContentElem.style.width = this.contentW + 'px'; 

		this.canvasElem = document.getElementById('ifc-canvas');
		this.canvasElem.style.left = this.canvasL + 'px'; 		
		this.canvasElem.style.top = this.canvasT + 'px';
		this.canvasElem.style.width = this.canvasW + 'px'; 		
		this.canvasElem.style.height = this.canvasH + 'px';

		this.gntElem = document.getElementById('gnt');
		this.gntElem.style.left = this.gntL + 'px';
		this.gntElem.style.top = this.gntT + 'px';
		this.gntElem.style.width = this.gntW + 'px'; 		
		this.gntElem.style.height = this.gntH + 'px';
	}

	parseSearchQuery() {
		let r = {};
		if( window.location.search.length < 2 ) return r;
	
		let query = window.location.search.substring(1);
		if( query.indexOf('=') === -1 ) {	 // No '=' if no key-value pairs - project id only then
			r.projectId = query;
			return r;
		}
		var pairs = query.split('&');
		for( let pair of pairs ) {
			let kv = pair.split('=');
			let k = decodeURIComponent(kv[0]);
			if( k !== null && k !== '' ) {
				let v = decodeURIComponent(kv[1]);
				if( v !== null && v !== '' ) {
					r[k] = v;
				}
			}
		}
		return r;
	}
}

function deleteCookie( cname ) {
	document.cookie = cname + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=" + window.location.pathname;
}

function getCookie( cname, type='string' ) {
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
	for( let i = 0 ; i < ca.length ; i++ ) {
		let c = ca[i];
		while( c.charAt(0) == ' ' ) {
			c = c.substring(1);
		}
		if( c.indexOf(name) == 0 ) {
			let value = c.substring(name.length, c.length);
			if( type == 'string' ) {
				return value;
			}
			if( type == 'int' ) {
				let intValue = parseInt(value);
				if( !isNaN(intValue) ) {
					return intValue;
				}
			}
			if( type == 'float' ) {
				let floatValue = parseFloat(value);
				if( !isNaN(floatValue) ) {
					return floatValue;
				}
			}
			return null;
		}
	}
	return null;
}


function setCookie( cname, cvalue, exminutes=null ) 
{
	if( exminutes === null ) {
		document.cookie = `${cname}=${cvalue}; path=/`;
	}
	else {
		let d = new Date();
		d.setTime(d.getTime() + (exminutes*60*1000));
		document.cookie = `${cname}=${cvalue}; expires=${d.toUTCString()}; path=/`;
	}
}
