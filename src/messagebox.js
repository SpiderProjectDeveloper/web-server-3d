import './messagebox.css';

export class MessageBox {
	constructor( settings={}, text=null, title=null ) {

		this.bkgrDiv = document.createElement('div');
		this.bkgrDiv.className = 'messagebox-background';

		this.mbcDiv = document.createElement('div');
		this.mbcDiv.className = 'messagebox-container';

		//this.mbDiv = document.createElement('div');
		//this.mbDiv.className = 'messagebox';
		//this.mbcDiv.appendChild(this.mbDiv);

		this.mbtcDiv = document.createElement('div');
		this.mbtcDiv.className = 'messagebox-title-container';
		this.mbcDiv.appendChild(this.mbtcDiv);

		this.callback = null;

		this.cancelDiv = document.createElement('div');
		this.cancelDiv.className = 'messagebox-cancel';
		this.cancelDiv.innerHTML = '🗙'; // ✕
		this.mbtcDiv.appendChild(this.cancelDiv);
		this.cancelDiv.onclick = function(e) {
			this.hide();
			if( this.callback ) {
				this.callback(0);
			}
		}.bind(this);

		this.confirmDiv = document.createElement('div');
		this.confirmDiv.className = 'messagebox-confirm';
		this.confirmDiv.innerHTML = '✓';
		this.mbtcDiv.appendChild(this.confirmDiv);
		this.confirmDiv.onclick = function(e) {
			this.hide();
			if( this.callback ) {
				this.callback(1);
			}
		}.bind(this);

		this.titleDiv = document.createElement('div');
		this.titleDiv.className = 'messagebox-title';
		this.mbtcDiv.appendChild(this.titleDiv);

		this.textDiv = document.createElement('div');
		this.textDiv.className = 'messagebox-text';
		this.mbcDiv.appendChild(this.textDiv);

		if( 'textAlign' in settings ) {
			this.textDiv.style.textAlign = settings.textAlign;
		}

		this.isDisplayed = false;

		if( text !== null ) {
			this.show( text, title );
		}
	}

	setCoords(x, y, w, h) {
		if( x !== null ) { this.mbcDiv.style.left = x + 'px' };
		if( y !== null ) { this.mbcDiv.style.top = y + 'px' };
		if( w !== null ) { 
			this.mbcDiv.style.width = w + 'px'; 
			this.mbcDiv.style.minWidth = w + 'px' 
			this.mbcDiv.style.maxWidth = w + 'px' 
			this.textDiv.style.minWidth = (w-8) + 'px';
			this.textDiv.style.maxWidth = (w-8) + 'px';
		};
		if( h !== null ) { 
			this.mbcDiv.style.height = h + 'px'; 
			this.mbcDiv.style.minHeight = h + 'px' 
			this.mbcDiv.style.maxHeight = h + 'px' 
			this.textDiv.style.minHeight = `${h-54}px`;
			this.textDiv.style.maxHeight = `${h-54}px`;
		}
	}

	display() {
		if( this.isDisplayed ) return;
		document.body.appendChild(this.bkgrDiv);
		document.body.appendChild(this.mbcDiv);
		this.isDisplayed = true;
	}

	show( text, title=null, x=null, y=null, w=null, h=null ) 
	{
		this.setCoords(x, y, w, h);

		this.callback = null;

		this.titleDiv.innerHTML = (title) ? title : '';
		this.titleDiv.style.display = (title) ? 'inline-block' : 'none';

		this.textDiv.innerHTML = (text) ? text : '';

		this.cancelDiv.style.display = 'none';
		this.confirmDiv.style.display = 'none';

		this.display();
	}

	update( text, title=null ) 
	{
		this.titleDiv.innerHTML = (title) ? title : '';
		this.textDiv.innerHTML = (text) ? text : '';
	}


	confirm( text, title=null, x=null, y=null, w=null, h=null ) {
		this.setCoords(x, y, w, h);

		this.callback = null;

		this.titleDiv.innerHTML = (!title) ? '&nbsp;' : title;
		this.titleDiv.style.display = 'inline-block';
		this.textDiv.innerHTML = text;
		this.confirmDiv.style.display = 'inline-block';
		this.cancelDiv.style.display = 'none';

		this.display();
	}

	ask( cb, text, title=null, x=null, y=null, w=null, h=null ) {
		this.setCoords(x, y, w, h);

		this.titleDiv.innerHTML = (!title) ? '&nbsp;' : title;
		this.titleDiv.style.display = 'inline-block';
		this.textDiv.innerHTML = text;
		this.confirmDiv.style.display = 'inline-block';
		this.cancelDiv.style.display = 'inline-block';

		this.callback = cb;

		this.display();
	}

	hide() {
		if( !this.isDisplayed ) return;
		document.body.removeChild(this.bkgrDiv);
		document.body.removeChild(this.mbcDiv);
		this.isDisplayed = false;
	}
}