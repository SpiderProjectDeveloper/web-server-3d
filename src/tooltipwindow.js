export class TooltipWindow {

	constructor( parentDiv=null, settings={} ) {
		let h = ('h' in settings) ? settings.h : Math.round(window.innerHeight/3);
		let hh = 24;

		this.div = document.createElement('div');
		this.div.style.position = 'absolute';
		this.div.style.borderRadius = '4px';
		this.div.style.border = '1px solid #afafaf;'
		this.div.style.padding = '2px 2px 2px 2px';
		this.div.style.fontFamily = 'Arial';
		this.div.style.left = ('x' in settings) ? settings.x+'px' : (Math.round(window.innerHeight/10) + 'px');
		this.div.style.top = ('y' in settings) ? settings.x+'px' : (Math.round(window.innerHeight/10) + 'px');
		this.div.style.width = ('w' in settings) ? settings.w+'px' : (Math.round(window.innerWidth/4) + 'px');
		this.div.style.height = h + 'px';
		this.div.style.display = 'none';

		this.headerDiv = document.createElement('div');
		this.headerDiv.style.position = 'relative';
		this.headerDiv.style.width = '100%';
		this.headerDiv.style.padding = '0px 2px 2px 2px';
		this.headerDiv.style.height = hh + 'px';
		this.headerDiv.style.overflow = 'hidden';
		this.headerDiv.style.whiteSpace = 'nowrap';
		this.headerDiv.style.backgroundColor = 'rgba(50, 50, 50, 0.5)';
		this.headerDiv.style.fontFamily = 'Arial';
		this.headerDiv.style.overflow = 'hidden';

		this.closeDiv = document.createElement('div');
		this.closeDiv.style.position = 'relative';
		this.closeDiv.style.color = '#ff2020';
		this.closeDiv.style.fontWeight = 'bold';
		this.closeDiv.style.padding = '0px 2px 0px 2px';
		this.closeDiv.style.backgroundColor = 'rgba(50, 50, 50, 0.5)';
		this.closeDiv.style.cursor = 'pointer';
		this.closeDiv.style.display = 'inline-block';
		this.closeDiv.innerHTML = '&#10060;'; // 	✕ &#128940;
		this.closeDiv.onclick = function(e) {
			this.div.style.display = 'none';
			if( settings.onClose ) {
				settings.onClose();
			}
		}.bind(this);
		this.headerDiv.appendChild(this.closeDiv);

		if( 'okButton' in settings ) {
			this.okDiv = document.createElement('div');
			this.okDiv.style.position = 'relative';
			this.okDiv.style.color = '#20ff20';
			this.okDiv.style.fontWeight = 'bold';
			this.okDiv.style.padding = '0px 2px 0px 2px';
			this.okDiv.style.backgroundColor = 'rgba(50, 50, 50, 0.5)';
			this.okDiv.style.cursor = 'pointer';
			this.okDiv.style.display = 'inline-block';
			this.okDiv.innerHTML = '✓'; // 	✕ &#128940;
			this.okDiv.onclick = function(e) {
				this.div.style.display = 'none';
				settings.okButton.callback( settings.okButton.arg );
			}.bind(this);	
			this.headerDiv.appendChild(this.okDiv);
		} 
		
		this.moveDiv = document.createElement('div');
		this.moveDiv.style.position = 'relative';
		this.moveDiv.style.color = '#ffffff';
		this.moveDiv.style.cursor = 'pointer';
		this.moveDiv.style.marginLeft = '4px';
		this.moveDiv.style.display = 'inline-block';
		this.moveDiv.innerHTML = (settings.title) ? settings.title : '&#128204;'; // 	📌 ✕ &#128940;
		this.moveDiv.addEventListener( 'mousedown', function(e) {
			e.stopPropagation(); 
			e.preventDefault(); 
			let originalX = e.screenX, originalY = e.screenY;

			const onMouseMove = function(e) {
				e.stopPropagation(); 
				e.preventDefault(); 	
				let dx = e.screenX - originalX, dy = e.screenY - originalY;
				let oldX = parseInt(this.div.style.left);
				let oldY = parseInt(this.div.style.top);
				this.div.style.left = oldX + dx + 'px';
				this.div.style.top = oldY + dy + 'px';
				originalX = e.screenX;
				originalY = e.screenY;
			}.bind(this);

			const onMouseUp = function(e) {
				document.removeEventListener( 'mouseup', onMouseUp );
				document.removeEventListener( 'mousemove', onMouseMove );
			}.bind(this);

			document.addEventListener( 'mouseup', onMouseUp );
			document.addEventListener( 'mousemove', onMouseMove );
			
		}.bind(this) );

		this.moveDiv.addEventListener( 'selectstart', function(e) { 
			e.stopPropagation(); 
			e.preventDefault(); 
			return false; 
		} );
		this.headerDiv.appendChild(this.moveDiv);

		this.contentDiv = document.createElement('div');
		this.contentDiv.style.position = 'relative';
		this.contentDiv.style.width = '100%';
		this.contentDiv.style.height = (h - hh) + 'px'; 
		this.contentDiv.style.overflow = 'auto'; 
		this.contentDiv.style.padding = '2px';
		this.contentDiv.style.color = '#ffffff';
		this.contentDiv.innerHTML = '';
		this.div.style.backgroundColor = 'rgba(50, 50, 50, 0.75)';

		this.div.appendChild(this.headerDiv);
		this.div.appendChild(this.contentDiv);

		if( parentDiv === null ) {
			parentDiv = document.body;
		}
		parentDiv.appendChild(this.div);
	}

	show( message, x=null, y = null, w = null, h = null ) {
		//if( this.contentDiv.innerHTML.length > 0 ) {
		//	this.contentDiv.innerHTML = undefined;
		//}
		while(this.contentDiv.hasChildNodes()) {
			this.contentDiv.removeChild(this.contentDiv.lastChild);
		}
		if( typeof(message) === 'object' ) {
			this.contentDiv.appendChild(message);
		} else {
			this.contentDiv.innerHTML = message;
		}
		if( x !== null ) {
			this.div.style.left = x + 'px';	
		}
		if( y !== null ) {
			this.div.style.top = y + 'px';	
		}
		if( w !== null ) {
			this.div.style.width = w + 'px';	
		}
		if( h !== null ) {
			this.div.style.height = x + 'px';	
		}
		this.div.style.display = 'block';
	}

	hide() {
		this.div.style.display = 'none';
	}

	isHidden() {
		return (this.div.style.display === 'none');
	}
} 