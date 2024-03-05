import "./messagebox.css";

export class MessageBox {

	constructor() {
		this.bkgrDiv = document.createElement('div');
		this.bkgrDiv.className = 'messageBoxBkgr';
		document.body.appendChild(this.bkgrDiv);

		this.mbDiv = document.createElement('div');
		this.mbDiv.className = 'messageBox';
		document.body.appendChild(this.mbDiv);

		this.mbTextDiv = document.createElement('div');
		this.mbTextDiv.className = 'messageBoxText';
		this.mbDiv.appendChild(this.mbTextDiv);

		this.cbDiv = document.createElement('div');
		this.cbDiv.className = 'confirmationBox';
		document.body.appendChild(this.cbDiv);

		this.cbContainerDiv = document.createElement('div');
		this.cbContainerDiv.className = 'confirmationBoxContainer';
		this.cbDiv.appendChild(this.cbContainerDiv);

		this.cbTextDiv = document.createElement('div');
		this.cbTextDiv.className = 'confirmationBoxText';
		this.cbContainerDiv.appendChild(this.cbTextDiv);

		this.cbOk = document.createElement('button');
		this.cbOk.className = 'confirmationBoxOk';
		this.cbOk.innerHTML = '&#10004;';
		this.cbContainerDiv.appendChild(this.cbOk);

		this.cbCancel = document.createElement('button');
		this.cbCancel.className = 'confirmationBoxCancel';
		this.cbCancel.innerHTML = '&#8718;';
		this.cbContainerDiv.appendChild(this.cbCancel);
	}

	show( message ) {
		this.bkgrDiv.style.display = 'block';	
		this.mbDiv.style.display = 'table';
		this.mbTextDiv.innerHTML = message;
	}
	
	hide() {
		this.bkgrDiv.style.display = 'none';	
		this.mbDiv.style.display = 'none';
		this.cbDiv.style.display = 'none';
	}
	
	confirm( message, okFunction=null ) {
		this.bkgrDiv.style.display='block';	
		this.bkgrDiv.onclick = this.hide.bind(this);
		this.cbDiv.style.display = 'table';
	
		// Removing child nodes if left from previous call
		while (this.cbTextDiv.hasChildNodes()) {
			this.cbTextDiv.removeChild(this.cbTextDiv.lastChild);
		}
		if( typeof(message) === 'string' ) {	// If it is a string, making it into "innerHTML"
			this.cbTextDiv.innerHTML = message;
		} else {															// It is an object, not string - appending it as a child node
			this.cbTextDiv.appendChild(message);
		}
	
		if( okFunction === null ) {
			this.cbCancel.style.display = 'none';
			this.cbOk.onclick = function(e) { this.hide(); }.bind(this);
		} else {
			this.cbCancel.style.display = 'inline-block';
			this.cbCancel.onclick = function(e) { this.hide(); }.bind(this);
			this.cbOk.onclick = function(e) { this.hide(); okFunction(); }.bind(this);
		}
	}
}