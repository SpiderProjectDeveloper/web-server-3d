import './messagebox.css';

export class MessageBox {
	constructor( title=null, text=null ) {

		this.bkgrDiv = document.createElement('div');
		this.bkgrDiv.className = 'messagebox-background';
		document.body.appendChild(this.bkgrDiv);

		this.mbcDiv = document.createElement('div');
		this.mbcDiv.className = 'messagebox-container';
		document.body.appendChild(this.mbcDiv);
		
		this.mbDiv = document.createElement('div');
		this.mbDiv.className = 'messagebox';
		this.mbcDiv.appendChild(this.mbDiv);

		this.titleDiv = document.createElement('div');
		this.titleDiv.className = 'messagebox-title';
		this.mbDiv.appendChild(this.titleDiv);

		this.textDiv = document.createElement('div');
		this.textDiv.className = 'messagebox-text';
		this.mbDiv.appendChild(this.textDiv);

		this.confirmDiv = document.createElement('div');
		this.confirmDiv.className = 'messagebox-confirm';
		this.confirmDiv.innerHTML = '✓';
		this.mbDiv.appendChild(this.confirmDiv);
		this.confirmDiv.onclick = function(e) {
			this.hide();
		}.bind(this);

		if( title!== null || text !== null ) {
			this.show( text, title );
		}
	}

	show( text, title ) {
		this.titleDiv.innerHTML = (title) ? title : '';
		this.titleDiv.style.display = (title) ? 'block' : 'none';

		this.textDiv.innerHTML = (text) ? text : '';

		this.confirmDiv.style.display = 'none';
		this.mbcDiv.style.display = 'block';
		this.bkgrDiv.style.display = 'block';
	}

	confirm( text ) {
		this.titleDiv.innerHTML = '&nbsp;';
		this.titleDiv.style.display = 'block';
		this.textDiv.innerHTML = text;

		this.confirmDiv.style.display = 'block';
		this.mbcDiv.style.display = 'block';
		this.bkgrDiv.style.display = 'block';
	}

	hide() {
		this.mbcDiv.style.display = 'none';
		this.bkgrDiv.style.display = 'none';
	}
}