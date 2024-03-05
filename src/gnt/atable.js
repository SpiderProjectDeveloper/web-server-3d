import { Canvas } from './canvas';
import { HScroll } from './hscroll';
import { VScroll } from './vscroll';
import { EditField } from './editfield';

export class ATable {

	constructor( container, x, y, w, h, hh, adata, settings, options ) {
		this.settings = { 
			minActivitiesOnScreen:10, maxActivitiesOnScreen:100, yZoomFactor:0.1, 
			scrollThick: 8, scrollBkgrColor: '#cfcfcf', scrollSliderColor: '#8f8f8f',
			tableExpandIconColor:'#7f7f7f', tableHeaderFillColor: '#cfcfdf', 
			tableHeaderFontColor: '#4f4f4f', tableHeaderColumnHMargin: 1, 
			tableColumnHMargin: 1, tableColumnTextMargin: 2, tableMaxFontSize: 18,
			tableColumnSplitterColor: '#bfbfcf', tableContentFontColor:'#4f4f4f', tableContentFillColor: '#efefff',
			noSignalColorNumber: 0x2000000, noSignalColor: '#afafaf',
			chatMark:'✉', numberOfMessagesInChatKey:'f_MessagesNumber', hasNewMessagesInChatKey:'f_MessagesNew',
			emptyChatColor: '#cfcfcf', notEmptyChatColor: '#0f0f0f', newMessagesInChatColor: '#ff4444',		 
		};
 		for( let k in settings ) {
			 this.settings[k] = settings[k];
		}

		this.adata = adata;
		this.data = adata.data;

		this.editField = new EditField( adata, function() { this.draw(); }.bind(this) );
		
		this.options = options;

		this.isChat = (this.options.chat) ? true : false;
		this.chat = this.options.chat;
		this.unseenChatMessagesSet = new Set();

		this.messageBox = options.messageBox;

		this.hh = hh;

		this.numLinesOnScreen = null;
		this.scrollPosY = null;		
		this.lineHeight = null;
		this.scrollPosX = null;

		this.calcTableColumnWidths();

		this.tableWidth = null;
		this.calcTableWidth();

		this.containerBBox = container.getBoundingClientRect();

		this.canvas = new Canvas( container, x + this.settings.scrollThick+1, y, w - this.settings.scrollThick - 1, h - this.settings.scrollThick - 1, 
			{ allowEmbeddedListeners:true } );
		this.setNumLinesOnScreen(options.numLinesOnScreen);
		
		this.hscroll = new HScroll( container, x + this.settings.scrollThick, h - this.settings.scrollThick, w - this.settings.scrollThick, this.settings.scrollThick, 
			{ customOverall: this.tableWidth, 
				callback: function(x) { this.setScrollPos(x,null, true, false, true); }.bind(this),
				color: this.settings.scrollBkgrColor, scrollBarColor: this.settings.scrollSliderColor } 
		);	
		this.vscroll = new VScroll( container, 0, this.hh, this.settings.scrollThick, h - this.hh - this.settings.scrollThick, 
			{ customVisible: this.numLinesOnScreen, customOverall: this.adata.getVisibleActivitiesNumber(), 
				callback: function(y) { this.setScrollPos(null, y, true, true, true); }.bind(this),
				color: this.settings.scrollBkgrColor, scrollBarColor: this.settings.scrollSliderColor } 
		);	

		this.setScrollPos(0,0,false, false);

		this.canvas.getCanvas().addEventListener( 'wheel', this.onWheel.bind(this), {passive:false} );

		this.draw();
	};

	onWheel(e) {
		e.preventDefault();
		if( e.shiftKey ) {	// Scaling...
			if( e.deltaY > 0 ) {
				this.scaleVertically( this.settings.yZoomFactor )			
			}
			else if( e.deltaY < 0 ) {
				this.scaleVertically( -this.settings.yZoomFactor )			
			}
			return;
		}

		// Scrolling...
		if( this.numLinesOnScreen >= this.adata.getVisibleActivitiesNumber() ) return;

		if( e.deltaY > 0 ) {
			this.setScrollPos(null, this.scrollPosY+1, true, true);
		}
		else if( e.deltaY < 0 ) {
			this.setScrollPos(null, this.scrollPosY-1, true, true);
		}
	}

	setYScrollCallback( cb ) {
		this.options.yScrollCallback = cb;
	} 

	setYScaleCallback( cb ) {
		this.options.yScaleCallback = cb;
	} 

	setExpandCallback( cb ) {
		this.options.expandCallback = cb;
	}

	calcTableWidth() {
		let w=0;
		for( let i = 0 ; i < this.data.table.length ; i++ ) {
			w += this.data.table[i].width;
		}
		this.tableWidth = w;
	}
	
	setColumnWidth(i, newWidth) {
		let curWidth = this.data.table[i].width;
		this.data.table[i].width = newWidth;
		this.tableWidth += (newWidth - curWidth); 
	}
	
	calcTableColumnWidths() {
		// Handling table columns widths
		for( let col = 0 ; col < this.data.table.length ; col++ ) { // Recalculating widths in symbols into widths in points 
			let add = this.settings.tableColumnHMargin*2 + this.settings.tableColumnTextMargin*2;
			let isWid = ('widthsym' in this.data.table[col] && this.data.table[col].widthsym !== null );
			this.data.table[col].width = (isWid) ? (this.data.table[col].widthsym * this.settings.tableMaxFontSize*0.5 + add) : 5;
		}
	}

	canvasCapture(arg, dx, dy, x, y, isFinished ) {
		//console.log('capture:', arg, dx, dy, x, y, isFinished );
	};

	resize( x, y, w, h ) {
		this.canvas.initDims( x + this.settings.scrollThick + 1, y, w - this.settings.scrollThick - 1, h - this.settings.scrollThick - 1 );
		this.hscroll.changeWidth( w - this.settings.scrollThick );
		this.draw();
	};

	setNumLinesOnScreen( numLines ) {
		this.numLinesOnScreen = numLines;
		this.lineHeight = (this.canvas.h - this.hh) / this.numLinesOnScreen;
	}

	setScrollPos( posX, posY, isRedraw=true, isCallCallback=true, isCalledByVscroll=false ) {
		if( posX !== null ) {
			this.scrollPosX = posX;
		}
		if( posY !== null && !isCalledByVscroll ) {
			posY = this.vscroll.setCustomPosition(posY);
		}
		if( posY !== null ) {
			this.scrollPosY = posY;
		}
		
		if( isRedraw && (posX !== null || posY !== null) ) {
			this.draw();
		}
		if( isCallCallback && this.options.yScrollCallback && posY !== null ) {
			this.options.yScrollCallback(posY);
		}
	} 
}

ATable.prototype.draw = function() {
	window.requestAnimationFrame( function() { this._draw.call(this); }.bind(this) );
}

ATable.prototype._draw = function() {
	this.canvas.removeAllListeners();
	this.unseenChatMessagesSet.clear();

	let unscalableFontH = Math.floor( this.lineHeight * 0.6 );
	let fontSize = (unscalableFontH < this.settings.tableMaxFontSize) ? unscalableFontH : this.settings.tableMaxFontSize;
	
	// Drawing the content
	let linesToSkip = Math.floor(this.scrollPosY);
	let linesSkipped = 0;
	let linesDone = 0; 
	for( let i = 0 ; i < this.data.activities.length ; i++ ) {
		if( !this.data._activities[i].visible ) {
			continue;
		}
		if( linesSkipped < linesToSkip ) {
			linesSkipped++;
			continue;
		}
		this.drawTableLine( i, linesSkipped + linesDone, fontSize );
		linesDone++;
		if( linesDone > this.numLinesOnScreen ) {
			break;
		}
	}
	if( linesDone <= this.numLinesOnScreen ) {
		for( ; linesDone <= this.numLinesOnScreen ; linesDone++ ) {
			this.drawEmptyTableLine( linesSkipped + linesDone );
		}
	}	

	// ******************************************
	// Drawing the header and splitters

	const cbSplitter = function( i, dx, dy, rx, ry, isFinished ) {
		let newWidth = this.data.table[i].width + dx;
		if( newWidth >= 4 ) {
			this.setColumnWidth( i, newWidth );
		}
		this.draw(); 
		this.hscroll.setCustomDimensions(null, this.tableWidth);
	}.bind(this);

	// The header
	let left = this.data.table[0].width;
	for( let col = 1 ; col < this.data.table.length ; col++ ) {
		let nextLeft = left + this.data.table[col].width;
		if( nextLeft < this.scrollPosX || left - this.scrollPosX > this.canvas.w ) {
			left = nextLeft;
			continue;
		}
		
		let rectWidth = this.data.table[col].width - this.settings.tableHeaderColumnHMargin * 2;
		let title = this.data.table[col].name;
		if( this.adata.isEditable( this.data.table[col].ref ) ) {
			title += "*";
		}

		// The text
		let actualX = left - this.scrollPosX;
		this.canvas.drawText(actualX + this.settings.tableHeaderColumnHMargin, 0, rectWidth, this.hh, title, 
			{ 
				bkgrFill: this.settings.tableHeaderFillColor, fillStyle: this.settings.tableHeaderFontColor, 
				fontSize: fontSize, textAlign: 'center', xPadding:2, yPadding:2
			} 
		);

		// The splitter
		let splitterW = this.settings.tableHeaderColumnHMargin*2;
		this.canvas.drawRect( actualX - this.settings.tableHeaderColumnHMargin, 0, splitterW, this.canvas.h, 
			{ 
				fillStyle:this.settings.tableColumnSplitterColor,
				capture: cbSplitter, captureArg: col-1
			} 
		);

		left = nextLeft;
	}	
	this.drawChatHeaderIcon(fontSize);
};

ATable.prototype.drawEmptyTableLine = function(lineFromTop) {
	let top = this.hh + (lineFromTop - this.scrollPosY) * this.lineHeight;
	this.canvas.drawRect( 0 /*this.data.table[0].width*/, top, this.canvas.w, this.lineHeight, { fillStyle: this.settings.tableContentFillColor } ); 
}

ATable.prototype.drawTableLine = function( i, lineFromTop, fontSize ) {
	let top = this.hh + (lineFromTop - this.scrollPosY) * this.lineHeight;

	let bkgrColor = (this.data._activities[i].colorBack) ? 
		this.data._activities[i].colorBack : '#ffffff'; 

	// Drawing the background
	// this.canvas.drawRect( 
	// 	this.data.table[0].width, top, this.canvas.w, this.lineHeight, { fillStyle: bkgrColor } 
	// );

	let left = this.data.table[0].width;
	for( let col = 1 ; col < this.data.table.length ; col++ ) {
		let nextLeft = left + this.data.table[col].width;
		if( nextLeft < this.scrollPosX || left - this.scrollPosX > this.canvas.w ) {
			left = nextLeft;
			continue;
		}
		let ref = this.data.table[col].ref;
		let fmt = this.getFormatForTableCellAndValue( i, ref );
		let content = fmt.value; // this.data.activities[i][ref];
		let fontStyle = fmt.fontStyle; // null;
		let fontWeight = fmt.fontWeight; // null;
		let color = (this.data._activities[i].colorFont) ? this.data._activities[i].colorFont : this.settings.tableContentFontColor;

		let actualX = left - this.scrollPosX + this.settings.tableColumnHMargin;
		let actualW = this.data.table[col].width - this.settings.tableColumnHMargin*2;

		let circleR = null;
		let contentX = null;
		let textProperties = { 
			bkgrFill: bkgrColor, fillStyle: color, textAlign: 'left', textBaseline: 'middle',
			fontSize: fontSize, fontStyle: fontStyle, fontWeight: fontWeight, noClip: true
		};
		if( this.data.table[col].type === 'float' || this.data.table[col].type === 'int' ) {
			contentX = actualW - this.settings.tableColumnTextMargin;
			textProperties.textAlign = 'right';
		} else if( this.data.table[col].type === 'string' || this.data.table[col].type === 'text' ) { // For strings "format" stands for alignment
			if( this.data.table[col].format == 1 ) { // Align right
				contentX = columnWidthToUse - this.settings.tableColumnTextMargin*2;
				textProperties.textAlign = 'right';							
			} else if ( this.data.table[col].format == 2 ) {
				contentX = parseInt( (columnWidthToUse - this.settings.tableColumnTextMargin) / 2 );
				textProperties.textAlign = 'center';														
			}
		} else if( this.data.table[col].type === 'signal' ) { // Signals require being 'centered'
			contentX = parseInt( (columnWidthToUse - this.settings.tableColumnTextMargin) / 2 );
			textProperties.fillStyle = decColorToString( content, this.settings.noSignalColor );
			if( Number(content) === this.settings.noSignalColorNumber ) {
				circleR = 0.5;
				textProperties.strokeStyle = this.settings.noSignalColor;						
			} else {
				circleR = parseInt(3*fontSize/7);
				textProperties.strokeStyle = this.settings.tableContentFontColor;						
			}
		}
		if( contentX === null ) {
			contentX = this.settings.tableColumnTextMargin;
		}

		if( circleR === null /*this.data.table[col].type !== 'signal'*/ ) {
			let tx = actualX+contentX, ty = top, tw = this.data.table[col].width, th = this.lineHeight;
			let type = this.data.refSettings[ref].editableType;
			if( type ) {
				textProperties.mousedown = this.editField.show.bind(this.editField);
				let fx = actualX + this.canvas.x + this.containerBBox.left;
				let fy = top + this.canvas.y + this.containerBBox.top;
				textProperties.mousedownArg = {i:i, ref:ref, type:type, x:fx, y:fy, w:actualW, h:th };
			}	else {
				delete textProperties.mousedown;
				delete textProperties.mousedownArg;
			}
			this.canvas.drawText( tx, ty, tw, th, content, textProperties );
		} else {
			this.canvas.drawCircle( actualX+contentX, top + this.lineHeight/2, circleR, textProperties );					
		}
		left = nextLeft; 
	}
	this.drawExpandAndChatIcons(i, top, fontSize );
}


ATable.prototype.getChatIconProps = function(i) {
	if( !this.data.activities[i][this.settings.numberOfMessagesInChatKey] ) {
		return [ this.settings.emptyChatColor, 'e' ];				 
	} else {
		if( !this.data.activities[i][this.settings.hasNewMessagesInChatKey] ) {
			return [ this.settings.notEmptyChatColor, 'm' ];				 
		} else {
			return [ this.settings.newMessagesInChatColor, 'u' ];				 
		}
	} 
}


ATable.prototype.drawChatIcon = function( i, top, fontSize ) {
	if( !this.isChat ) {
		return null;
	}
	
	let [ color, status ] = this.getChatIconProps(i);
	if( status === 'u' ) { // Unseen messages
		this.unseenChatMessagesSet.add(i);
	}

	let w = (this.data.table[0].width > fontSize) ? fontSize : this.data.table[0].width;
	this.canvas.drawText( 1, top, w, this.lineHeight, this.settings.chatMark,  
		{ 
			fillStyle: color, fontSize:fontSize, textAlign:'left', textBaseline:'middle',
			mousedown: this.chat.show.bind(this.chat), mousedownArg: i 
		} 
	);
}


ATable.prototype.getChatHeaderIconColor = function() {
	return (this.unseenChatMessagesSet.size > 0) ? this.settings.newMessagesInChatColor : this.settings.emptyChatColor; 
}

ATable.prototype.drawChatHeaderIcon = function(fontSize) {		 
	// To fill this rect...
	this.canvas.drawRect( 0, 0, this.data.table[0].width, this.hh, 
		{ fillStyle: this.settings.tableContentFillColor } 
	);
	if( !this.isChat ) {
		return;
	}
	const cb = function(arg, e, r) {
		let htmlElem = document.createElement('div');
		let captionElem = document.createElement('div');
		captionElem.style.textAlign = 'center';
		captionElem.style.marginBottom = '14px';
		captionElem.style.fontSize = '100%'; 
		captionElem.innerHTML = `${this.chat.texts[this.data.parameters.language].chatUnseenTitle}`;
		htmlElem.appendChild(captionElem);
		let numNew = 0;
		for( let i = 0 ; i < this.data.activities.length ; i++ ) {
			if( !this.data.activities[i][ this.settings.hasNewMessagesInChatKey ] ) {
				continue;
			}
			numNew++;
			let activity = this.data.activities[i].Name;
			let elem = document.createElement('div');
			elem.style.textAlign = 'left';
			elem.style.margin = '8px 0px 8px 10%';
			elem.style.color = '#4444ff';
			elem.style.fontSize = '90%';
			elem.style.cursor = 'pointer';
			elem.onclick = function(e) { this.chat.show(i).bind(this.chat) }.bind(this);
			elem.innerHTML = activity;
			htmlElem.appendChild(elem);
		}
		if( numNew > 1 ) {
			this.messageBox.confirm(htmlElem);
		}
	}.bind(this);

	this.canvas.drawText( 0, 0, this.data.table[0].width, this.hh, this.settings.chatMark,   
		{ 
			fillStyle: this.getChatHeaderIconColor(), bkgrFill: this.settings.tableContentFillColor, 
			fontSize: fontSize, textAlign: 'center', textBaseline:'middle',
			mousedown: cb, mousedownArg: null
	 	} 
	);
}


ATable.prototype.getExpandIconX = function( fontSize ) {
	if( this.isChat ) {
		return fontSize + 1;
	}	else {
		return 1;
	}
}

ATable.prototype.getExpandIconText = function(i) {
	if( this.data._activities[i].expandable ) {
		if( this.data._activities[i].expanded ) {
			return '▼'; // ▼
		 } else {
			return '►'; // ▶				
		}
	}
	return '';
}

ATable.prototype.onExpandIconMouseDown = function( i, e, rightButton ) {
	let status = this.adata.expandOrCollapse(i);
	if( status ) {
		this.draw();
		let n = this.adata.getVisibleActivitiesNumber();
		this.vscroll.setCustomDimensions( (this.numLinesOnScreen < n) ? this.numLinesOnScreen : n, n );
		if( this.options.expandCallback ) {
			this.options.expandCallback();
		}
	}
}

ATable.prototype.scaleVertically = function( factor, _newLinesOnScreen = null ) {
	let newLinesOnScreen;
	if( _newLinesOnScreen === null ) { 	// If null - scaleVertically is called by this object
		newLinesOnScreen = this.numLinesOnScreen + Math.round(this.options.numLinesOnScreen * factor);
		if( newLinesOnScreen < this.settings.minActivitiesOnScreen ) {
			return;
		}
	} else {	// Called from another module If not null - 
		newLinesOnScreen = _newLinesOnScreen;
	}
	let n = this.adata.getVisibleActivitiesNumber();
	if( newLinesOnScreen > this.settings.maxActivitiesOnScreen || newLinesOnScreen > n ) {
		return;
	}
	//console.log(newLinesOnScreen);
	this.setNumLinesOnScreen( newLinesOnScreen );
	this.draw();
	this.vscroll.setCustomDimensions( (this.numLinesOnScreen < n) ? this.numLinesOnScreen : n, n );

	if( _newLinesOnScreen === null && this.options.yScaleCallback ) {
		this.options.yScaleCallback(null, newLinesOnScreen );
	}
}

ATable.prototype.drawExpandIcon = function( i, top, fontSize ) {
	let expandText = this.getExpandIconText(i);

	let x = this.getExpandIconX(fontSize);
	if( x >= this.data.table[0].width ) {
		return;
	}
	let w = fontSize;
	if( x + w >= this.data.table[0].width ) {
		w = this.data.table[0].width - x;
	}
	this.canvas.drawText( x, top, w, this.lineHeight, 
		expandText, 
		{ 
			fontSize:fontSize, textAlign:'left', textBaseline:'middle', fillStyle:this.settings.tableExpandIconColor,
			mousedown: this.onExpandIconMouseDown.bind(this), mousedownArg: i
		} 
	);
}

ATable.prototype.drawExpandAndChatIcons = function( i, top, fontSize ) {
	this.canvas.drawRect( 0, top, this.data.table[0].width, this.lineHeight, { fillStyle: this.settings.tableContentFillColor } ); 
	this.drawChatIcon( i, top, fontSize );
	this.drawExpandIcon( i, top, fontSize );
}

ATable.prototype.getFormatForTableCellAndValue = function( i, ref ) {
	let r = { value: '', fontStyle: 'normal', fontWeight: 'normal' };

	if( typeof(this.data.activities[i][ref]) === 'undefined' || this.data.activities[i][ref] === null || this.data.activities[i][ref] === '' ) {
		return r;
	} 
	r.value = this.data.activities[i][ref];

	if( this.data.refSettings[ref].type === 'signal' ) {
			return r;
	}

	if( ref === "Level" ) { // To display no 'teams' or 'assignments' (phases only). 
			if( typeof(r.value) === 'string' && r.value.length > 0 && !this.adata.digitsOnly(r.value) ) {
					r.value = '';
			}   
			return r;
	}

	if( ref === 'Name') {
		let hrh = this.data._activities[i].parents.length;
		r.value = this.spacesToPadNameAccordingToHierarchy(hrh) + r.value;
		if( typeof(this.data.activities[i].Level) === 'number' ) { // If it is a phase...
			r.fontWeight = 'bold'; // ... making it bold.
		}
	} else { 
		if( this.data.refSettings[ref].type === 'number' ) {
				r.value = this.formatNumberStringForTable( r.value, this.data.refSettings[ref].type, this.data.refSettings[ref].format );
		} else if( this.data.refSettings[ref].type === 'datetime' ) {
				r.value = this.adata.secondsToDate( r.value, (this.data.refSettings[ref].format === 0) );
		}
	}    
	if( typeof(r.value) === 'undefined' ) {
			r.value = '';
	} else if( r.value === null ) {
			r.value = '';
	}

	return r;
}

ATable.prototype.formatNumberStringForTable = function( str, type='int', radix=2 ) {
	let ret = '';
	let intValue;   	
	let isNegative = false;

	if( type === 'float' ) {
		let floatValue = parseFloat( str );
		if( isNaN(floatValue) ) {
			return str;
		}
		if( !(floatValue < 0) ) {
			intValue = Math.floor( floatValue );
		} else {	
			intValue = Math.floor( Math.abs(floatValue) );
			isNegative = true;
		}
		let power = Math.pow(10,radix);
		let afterDecimal = parseInt(Math.abs(floatValue)*power - intValue*power + 0.5)/power;
		// let afterDecimal = (Math.abs(floatValue) - intValue).toFixed(radix);
		if( !(afterDecimal < 1.0) ) {
			afterDecimal = 0.0;
			intValue += 1;
		}
		if( radix > 0 ) {
			for( let i = 0 ; i < radix ; i++ ) {
				let digit = Math.floor(afterDecimal*10);
				afterDecimal = afterDecimal*10 - digit;
				ret += digit;
			}
			ret = '.' + ret;
		}
	} else {
	    intValue = parseInt( str );
		if( isNaN(intValue) ) {
			return str;
		}
		if( intValue < 0 ) {
			isNegative = true;
			intValue = -intValue;
		}
	}
	if( intValue == 0 ) {
		ret = '0' + ret;
	} else {
		for( let i = 1 ; ; i++ ) {
			ret = Math.floor(intValue % 10).toString() + ret;
			intValue = Math.floor(intValue/10);
			if( !(intValue > 0) ) {
				break;
			}
			if( i % 3 == 0 ) {
				ret = ' ' + ret;
			}
		}
	}
	if( isNegative ) {
		ret = '-' + ret;
	}
	return ret;
}

ATable.prototype.spacesToPadNameAccordingToHierarchy = function( hierarchy ) {
	let s = '';
	for( let i = 0 ; i < hierarchy ; i++ ) {
		s += '   '; // figure space: ' ', '·‧', '•', '⁌','|'
	}
	return s;
}

