import { calendar, calendarIsActive, calendarSetFormat, calendarCancel } from './calendar.js';
import './editfield.css';

var texts = {
	en: {
		datetimeError: 'Date/time format error',
		waitSaveUserData: 'Saving...',
		errorSavingData: 'Error saving data.'
	},
	ru: {
		datetimeError: 'Неверный формат даты/времени',
		waitSaveUserData: 'Сохранение...',
		errorSavingData: 'Ошибка при сохранении данных'
	}
};

export class EditField {

	constructor( adata, onChange ) {
		this.adata = adata;
		this.data = adata.data;

		this.onChange = onChange;

		this.bkgrDiv = document.createElement('div');
		this.bkgrDiv.className = 'editfield-bkgr';
		document.body.appendChild(this.bkgrDiv);

		this.editFieldDiv = document.createElement('div');
		this.editFieldDiv.className = 'editfield';
		document.body.appendChild(this.editFieldDiv);

		this.containerDiv = document.createElement('div');
		this.containerDiv.className = 'editfield-container';
		this.editFieldDiv.appendChild(this.containerDiv);

		this.textarea = document.createElement('textarea');
		this.textarea.className = 'editfield-textarea';
		this.containerDiv.appendChild(this.textarea);

		this.toolboxDiv = document.createElement('div');
		this.toolboxDiv.className = 'editfield-toolbox';
		this.containerDiv.appendChild(this.toolboxDiv);

		this.calendarButton = document.createElement('button');
		this.calendarButton.className = 'editfield-calendar-button';
		this.toolboxDiv.appendChild(this.calendarButton);

		this.cancelButton = document.createElement('button');
		this.cancelButton.className = 'editfield-cancel-button';
		this.cancelButton.innerHTML = '&#10006;';
		this.toolboxDiv.appendChild(this.cancelButton);

		this.messageDiv = document.createElement('div');
		this.messageDiv.className = 'editfield-message';
		this.toolboxDiv.appendChild(this.messageDiv);
	}
}


EditField.prototype.onUserDataSave = function( xmlhttp, valueSaved ) {
	if (xmlhttp.readyState == 4 ) {
		if( xmlhttp.status == 200 ) {
			let ok = false;
			let responseObj = null;
			try {
					//console.log(xmlhttp.responseText);
					responseObj = JSON.parse(xmlhttp.responseText);
					if( responseObj !== null ) {
							if( 'errcode' in responseObj ) {
									if( responseObj.errcode === 0 ) {
											ok = true;
									}
							}
					}
			} catch (e) {;}
			if( ok ) {
				this.data.activities[this.actualRow][ this.actualRef ] = valueSaved;
				this.onChange(valueSaved);
			}
			//	if( 'project' in responseObj && 'dataChanged' in responseObj.project ) {
			//		ifSynchronized( false, responseObj.project.dataChanged );
			//	}
			this.hide();
		} else {
			alert("Error: " + xmlhttp.responseText); // this.responseText contains the error message. 
		}
	}
}

EditField.prototype.validateEditField = function( allowedEmpty=true ) {
	let r = { ok:false, message:'ERROR!' };

	let value = this.textarea.value;

	if( allowedEmpty ) {
		let pattern = new RegExp("[^ ]");
		if( !pattern.test(value) ) {
			r.ok = true;
			r.message = 'EMPTY';
			return r;
		}
	}

	if( this.actualType === 'datetime' ) {
		let pattern = new RegExp("[^ \\:\\.\\-0-9\\\\]");
    	let illegalCharacters = pattern.test(value);
    	if( illegalCharacters ) { 
    		r.message = texts[this.data.parameters.language].datetimeError;
    		return r;
    	}		
		let d = this.adata.parseDate(value);
		if( d === null ) {
    		r.message = texts[this.data.parameters.language].datetimeError;
			return r;
		}
	} else if( this.actualType === 'int' ) {
		let pattern = new RegExp("[^ 0-9]");
    	let illegalCharacters = pattern.test(value);
    	if( illegalCharacters ) { 
    		r.message = _texts[_globals.lang].intError;    		
    		return r;
    	}		
    	if( isNaN( parseInt(value) ) ) {
    		r.message = _texts[_globals.lang].intError;    		
    		return r;
    	}
	} else if( this.actualType === 'number' || this.actualType === 'float' ) {
		let pattern = new RegExp("[^ \\.0-9]");
    	let illegalCharacters = pattern.test(value);
    	if( illegalCharacters ) { 
    		r.message = _texts[_globals.lang].floatError;    		
    		return r;
    	}		
    	if( isNaN( parseFloat(value) ) ) {
    		r.message = _texts[_globals.lang].floatError;    		
    		return r;
    	}
	}
	r.ok = true;
	r.message = 'Ok';
	return r;
}

EditField.prototype.show = function( args, e, rb ) {
	let i=args.i, ref=args.ref, type=args.type, x=args.x, y=args.y, w=args.w, h=args.h;

	this.bkgrDiv.style.display = 'block';

	let value = this.data.activities[i][ ref ];
	if( typeof(value) === 'undefined' || value === null ) {
		value = '';
	}

	this.textarea.style.display = 'block';

	this.editFieldDiv.style.left = x + "px";
	this.editFieldDiv.style.top = y + "px";
	this.editFieldDiv.style.width = w + "px";
	this.editFieldDiv.style.height = h + "px";
	this.editFieldDiv.style.display = 'block';

	if( type === 'datetime' ) {
		this.textarea.value = this.adata.secondsToDate(value);
	} else {
		this.textarea.value = value;
	}

	this.textarea.style.width = '100%';
	this.textarea.style.fontSize = 12 + 'px';

	this.actualValue = value; // Saving an old value to confirm it has been changed or to restore if required.
	setTimeout(function() { this.textarea.focus(); }.bind(this), 0);

	this.actualRow = i;
	this.actualType = type;
	this.actualRef = ref;

	this.textarea.addEventListener( "keydown", this.onKey.bind(this) );
	window.addEventListener( "keydown", this.onKey.bind(this) );

	this.bkgrDiv.addEventListener('click', this.onEditFieldInputFinished); // On click saving changes.. 

	this.cancelButton.onclick = function(e) { this.hide(); }.bind(this); // Cancel button hides  edit field 
	if( type === 'datetime')  {
		this.calendarButton.style.display = 'block';
		this.calendarButton.onclick = function(e) { callCalendar(); }.bind(this);
		setCalendarFormat(this.data.refSettings[ref].format);
	} else {
		this.calendarButton.style.display = 'none';		
	}
}

EditField.prototype.setCalendarFormat = function( format ) {
	if( !( format > 0) ) { // For dates the "format" specifies if time required (1) or not (0) 
		calendarSetFormat( {'dateOnly':true} );
	} else {
		calendarSetFormat( {'dateOnly':false} );				
	}			
}


EditField.prototype.callCalendar = function() {
	if( calendarIsActive() ) {
		return;
	}
	let d = this.adata.parseDate( this.textarea.value );
	if( d !== null ) {
		calendar( this.editFieldDiv, this.updateEditFieldWithCalendarChoice.bind(this), 
			20, 20, d.date, this.adata.texts[this.data.parameters.language].monthNames );
	}
}


EditField.prototype.updateEditFieldWithCalendarChoice = function( d ) {
	if( d !== null ) {
		let flag = ( !(this.data.refSettings[this.actualRef].format > 0) ) ? true : false;
		this.textarea.value = this.adata.secondsToDate( d, flag );
		onEditFieldInput();
	} else {
		hideEditField();
	}
}


EditField.prototype.onKey = function(event) {
	if( event.keyCode == 13 && !event.shiftKey ) { // && _editFieldType != 'text' ) {
		event.preventDefault();
		this.onEditFieldInputFinished();
		return false;
	}
	if( event.keyCode == 27 ) {
		event.preventDefault();
		this.hide();
	}	
}


EditField.prototype.onEditFieldInputFinished = function() {
	if( !this.textarea.value && !this.actualValue ) { // Nothing has been changed...
		hideEditField();
		return;
	}
	let comparedOk = false;
	if( this.type === 'datetime' ) {
    let d = this.adata.parseDate( this.textarea.value );
		comparedOk = (d===null) ? 
			((this.actualValue.length===0)?true:false) : ((d.timeInSeconds === this.actualValue)?true:false);
	} else {
		if( this.textarea.value == this.actualValue ) { // Nothing has been changed...
			comparedOk = true;
		}
	}
	if( comparedOk ) {
		this.hide();
		return;
	}

	calendarCancel(); // If the "onEditFieldInputOk()" function is called not through a calendar event (e.g. on clicking blackOutDiv). 

	let valid = this.validateEditField();
	if( !valid.ok ) {
		this.messageDiv.innerText = valid.message;
		this.messageDiv.style.display = 'block';
		return;
	}	

	let data = this.createUserDataObjectToSendAfterEditing();
	if( !data ) {
    return;
  }

	this.messageDiv.style.display = 'block';
	this.messageDiv.innerText = texts[this.data.parameters.language].waitSaveUserData;

	var xmlhttp = new XMLHttpRequest();

	xmlhttp.onerror = function(e) { 
		this.message.innerText = texts[this.data.parameters.language].errorSavingData;
		this.message.style.display = 'block';
	}.bind(this);

	xmlhttp.onreadystatechange = function(v) { 
		if( xmlhttp.readyState == 4 ) {
			if( xmlhttp.status == 200 ) { 
				this.onUserDataSave( xmlhttp, data.valueToSave, false ); 
				return;
			}
			this.message.innerText = texts[this.data.parameters.language].errorSavingData;
			this.message.style.display = 'block';            
		}
	}.bind(this);

	xmlhttp.open("POST", this.adata.settings.saveDataUrl, true);
	xmlhttp.setRequestHeader("Cache-Control", "no-cache");
	xmlhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');		
	xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8"); //"application/x-www-form-urlencoded");
	xmlhttp.send( data.json_data );		    
}


EditField.prototype.hide = function() {
	calendarCancel();

	this.textarea.removeEventListener( "keydown", this.onKey.bind(this) );
	window.removeEventListener( "keydown", this.onKey.bind(this) );

	this.bkgrDiv.style.display='none';	
	this.bkgrDiv.onclick = null;
	this.editFieldDiv.style.display='none';
	this.messageDiv.style.display = 'none';
} 


EditField.prototype.createUserDataObjectToSendAfterEditing = function() {
	let data = {};

	let value = this.textarea.value; 
	let i = this.actualRow;
	let type = this.actualType;
	if( type === 'datetime' ) {
		let parsed = this.adata.parseDate( value );
		value = ( parsed === null ) ? '' : parsed.timeInSeconds;
	}
	data[ this.actualRef ] = value;

	let isLevel = typeof(this.data.activities[i].Level) !== 'undefined' && this.data.activities[i].Level !== null;
	let level = (isLevel) ? String(this.data.activities[i].Level) : '';
	let code = this.data.activities[i].Code;
	let parent = this.data._activities[i].parent0Code;
	return { 
		json_data: JSON.stringify({
				Code: code, Level: level, parent: parent, fileName: this.data.parameters.projectId, data: data
		}),
		valueToSave: value
	};
}
