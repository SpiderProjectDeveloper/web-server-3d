import { Canvas } from './canvas';
import { HScroll } from './hscroll';
import { VScroll } from './vscroll';
import { createTimePointerDiv, createTimePointerPromptDiv } from './agantt-helpers'; 

export class AGantt {

	calcWidgetsCoords( x, y, w, h, hh ) {
		this.containerBBox = this.container.getBoundingClientRect();

		this.x = x; 
		this.y = y;
		this.w = w;
		this.h = h;
		this.hh = hh;		

		let ccs = {};
		ccs.canvas = { x: x, y:y, w: w - this.settings.scrollThick - 1, h: h - this.settings.scrollThick - 1};
		ccs.hscroll = { 
			x: x, y: h - this.settings.scrollThick, 
			w: (w - this.settings.scrollThick), h: this.settings.scrollThick,
			scrollableW: (w - this.settings.scrollThick)*1.5
		}; 
		ccs.vscroll = {
			x: x + w - this.settings.scrollThick, y: hh, 
			w: this.settings.scrollThick, h: (h - hh - this.settings.scrollThick)
		}; 
		this.widgetsCoords = ccs;
		return ccs;
	}

	changeWidth( w ) {
		let ccs = this.calcWidgetsCoords(this.x, this.y, w, this.h, this.hh);
		this.canvas.initDims(ccs.canvas.x, ccs.canvas.y, ccs.canvas.w, ccs.canvas.h);
		this.hscroll.changeWidth( ccs.hscroll.w, ccs.hscroll.w / this.hscale );
		this.vscroll.changeX( ccs.vscroll.x );
		this.draw();
		if( this.highlightDiv ) this.highlightDiv.style.width = (this.containerBBox.width) + 'px';
		if( this.hoverHighlightDiv ) this.hoverHighlightDiv.style.width = (this.containerBBox.width) + 'px';
	}

	constructor(container, x, y, w, h, hh, adata, settings, options ) {
		this.settings = { 
			minActivitiesOnScreen:10, maxActivitiesOnScreen:100, yZoomFactor: 0.1, 
			scrollThick: 8, scrollBkgrColor:'#cfcfcf', scrollSliderColor:'#afafaf',
			highlightColor: 'rgba(100, 100, 255, 0.25)', hoverHighlightColor: 'rgba(200, 200, 255, 0.25)',
			ganttBkgrColor:'#ffffff', ganttOperation0Color: '#2f8f2f', ganttOperation0Opacity: 1.0, 
			ganttPhaseColor:'#0f7f07f', ganttPhaseOpacity:1.0, 
			ganttOperation100Color: '#7f7f7f', ganttOperation100Opacity: 1.0,
			ganttCompareColor: '#cfcfdf', ganttCompareOpacity:0.75, ganttFontColor: '#4f4f4f', 
			ganttLinkStrokeColor: '#000000',	ganttLinkStrokeWidth: 1, ganttEmptyLineColor: '#efefff', 
			ganttLinkOpacity: 0.50, ganttLinkArrowWidth:8, ganttLinkArrowHeight:8, ganttMaxFontSize:18, 
			timeLineFontColor:'#4f4f4f', timeLineBkgrColor:'#cfcfdf', timeLineBorderColor:'#afafaf', 
			timeLineMaxFontSize:12, minRectWidthOnTimeLine:24, 
			gridColor:'#afafaf', gridStrokeWidth:0.25, 
			gridCurrentTimeColor: '#ff7f7f', gridCurrentTimeLineWidth: 1, gridCurrentTimeLineDash:[2,2],
			ganttRectTopMargin: 0.6, ganttRectBottomMargin: 0.125, 
			ganttRectTopMarginTitleFree: 0.1, ganttRectBottomMarginTitleFree: 0.3,
			ganttCompareTopMargin: 0.8, ganttCompareBottomMargin: 0.0, 
			ganttCompareTopMarginTitleFree: 0.6, ganttCompareBottomMarginTitleFree: 0.1,		
			ganttRectBracketRelHeight:0.3,	ganttRectBracketThick:3
		};
		for( let k in settings ) {
			this.settings[k] = settings[k];
		}

		this.adata = adata;
		this.data = adata.data;
		this.options = options;
		this.container = container;

		this.numLinesOnScreen = null;
		this.scrollPosY = 0;		
		this.lineHeight = null;
		this.scrollPosX = 0;

		this.pct0Properties = { fillStyle: this.settings.ganttOperation0Color, opacity: this.settings.ganttOperation0Opacity };
		this.pct100Properties = { fillStyle: this.settings.ganttOperation100Color, opacity: this.settings.ganttOperation100Opacity };
		this.compareProperties = { fillStyle: this.settings.ganttCompareColor, opacity: this.settings.ganttCompareOpacity };	

		this.hscale = null;
		this.scaledWidth = null;
		this.titlesRight = ('titlesRight' in options) ? options.titlesRight : true;

		this.highlightedActivity = -1;
		this.highlightDiv = null;

		this.hoverHighlightDiv = null;

		let ccs = this.calcWidgetsCoords(x, y, w, h, hh);

		this.canvas = new Canvas( container, ccs.canvas.x, ccs.canvas.y, ccs.canvas.w, ccs.canvas.h, 
			{ allowEmbeddedListeners:true } 
		);

		this.setNumLinesOnScreen(options.numLinesOnScreen);
		this.setHScale(1.0);

		this.hscroll = new HScroll( container, ccs.hscroll.x, ccs.hscroll.y, ccs.hscroll.w, ccs.hscroll.h, 
			{ customVisible: ccs.hscroll.w,
				customOverall: ccs.hscroll.scrollableW, // this.timeToScreen( this.data._time.max )*1.5, 
				callback: function(x) { this.setScrollPos(x,null); }.bind(this),
				color: this.settings.scrollBkgrColor, scrollBarColor: this.settings.scrollSliderColor } 
		);	

		this.vscroll = new VScroll( container, ccs.vscroll.x, ccs.vscroll.y, ccs.vscroll.w, ccs.vscroll.h, 
			{ customVisible: this.numLinesOnScreen, customOverall: this.adata.getVisibleActivitiesNumber(), 
				callback: function(y) { this.setScrollPos(null,y); }.bind(this),
				color: this.settings.scrollBkgrColor, scrollBarColor: this.settings.scrollSliderColor } 
		);	

		this.setScrollPos(0,0,false, false);

		this.canvas.getCanvas().addEventListener( 'wheel', this.onWheel.bind(this) );

		if( this.options.highlightCallback ) {
			this.highlightDiv = document.createElement('div');
			this.highlightDiv.style.display = 'none';
			this.highlightDiv.style.position = 'absolute';
			this.highlightDiv.style.boxSizing = 'content-box';
			this.highlightDiv.style.pointerEvents = 'none';
			this.highlightDiv.style.backgroundColor = (settings.highlightColor) ? 
				settings.highlightColor : this.settings.highlightColor;
			container.appendChild(this.highlightDiv);
			this.canvas.getCanvas().addEventListener( 'mousedown', function(e) { 
				this.highlight(e);
			}.bind(this) );
			/*
			this.highlightDiv.addEventListener( 'mousedown', function(e) { 
				e.stopPropagation();
				this.highlight(e);
			}.bind(this) );
			*/
		}

		if( options.hoverHighlightOn ) {
			this.hoverHighlightDiv = document.createElement('div');
			this.hoverHighlightDiv.style.display = 'none';
			this.hoverHighlightDiv.style.position = 'absolute';
			this.hoverHighlightDiv.style.boxSizing = 'content-box';
			this.hoverHighlightDiv.style.backgroundColor = (settings.hoverHighlightColor) ? 
				settings.hoverHighlightColor : this.settings.hoverHighlightColor;
			this.hoverHighlightDiv.style.pointerEvents = 'none';
			container.appendChild(this.hoverHighlightDiv);
			this.canvas.getCanvas().addEventListener( 'mousemove', function(e) { 
				this.hoverHighlight(e);
			}.bind(this) );
			this.canvas.getCanvas().addEventListener( 'mouseleave', function(e) {
				this.hoverHighlight(e, true);
			}.bind(this) );
			this.hoverHighlightLine = -1;
		}

		if( options.timePointerOn ) {
			this.timePointer = null;
			this.timePointerDiv = createTimePointerDiv(this.containerBBox.height);
			container.appendChild(this.timePointerDiv);
			this.timePointerPromptDiv = createTimePointerPromptDiv();
			container.appendChild(this.timePointerPromptDiv);

			this.canvas.getCanvas().addEventListener( 'mousemove', function(e) { 
				this.timePointerMouseMove(e);
			}.bind(this) );
			this.canvas.getCanvas().addEventListener( 'mouseleave', function(e) {
				this.timePointerMouseMove(e, true);
			}.bind(this) );

			this.setTimePointer(this.data.project.curTimeInSeconds); 	// Setting the time pointer to CurTime
			if( options.timePointerCallback ) {
				this.canvas.getCanvas().addEventListener( 'mousedown', function(e) {
					this.timePointerCallback(e);
				}.bind(this) );	

				this.options.timePointerCallback(this.timePointer, null);		// Notifying the time pointer set 
			}
		}

		this.draw();
	}

	timePointerMouseMove(e, leave=false ) {		
		//return;
		//console.log(e.offsetX, e.clientX, e.pageX);
		if( leave ) {
			this.timePointerPromptDiv.style.display = 'none';
		} else {
			let tm = this.screenToTime(e.offsetX);
			this.timePointerPromptDiv.innerHTML = this.adata.secondsToDate( Math.floor(tm), true );
			this.timePointerPromptDiv.style.left = (e.clientX) + 'px';
			this.timePointerPromptDiv.style.top = (e.clientY - 10) + 'px';
			if( this.timePointerPromptDiv.style.display !== 'block' ) {
				this.timePointerPromptDiv.style.display = 'block';
			}
		}
	}

	setTimePointer(tm) {
		let x = this.timeToScreen(tm);
		this.timePointerDiv.style.left = (this.containerBBox.left + this.canvas.x + x) + 'px';
		if( this.timePointerDiv.style.display !== 'block' ) {
			this.timePointerDiv.style.display = 'block';
		}
		this.timePointer = tm;
	}

	timePointerCallback(e) {
		this.timePointerDiv.style.left = (this.containerBBox.left + this.canvas.x + e.offsetX) + 'px';
		if( this.timePointerDiv.style.display !== 'block' ) {
			this.timePointerDiv.style.display = 'block';
		}
		let tm = this.screenToTime(e.offsetX);
		this.timePointer = Math.floor(tm)
		this.options.timePointerCallback( this.timePointer, e );
	}


	highlight(e) {
		if( !this.options.isHighlightEnabled() ) {
			return;
		}
		e = e || window.event;	
		let lineNum = Math.floor((this.scrollPosY - this.hh + e.offsetY) / this.lineHeight);
		let activity = this.adata.getNthVisible(lineNum);

		if( ("which" in e && e.which === 3) || ("button" in e && e.button === 2) ) { 	// The right button?
			if( 'menuCallback' in this.options ) {
				//console.log('highlight:', activity );
				this.options.menuCallback(activity, e);
			}
			return;
		}

		let type = (activity >= 0 && 'Type' in this.adata.data.activities[activity]) ? 
			this.adata.data.activities[activity]['Type'] : -1;
		if( activity === -1 || activity === this.highlightedActivity ) {
			this.highlightDiv.style.display = 'none';
			this.highlightedActivity = -1;
		} else {
			let lineTop = this.hh + (this.scrollPosY % this.lineHeight) + this.lineHeight*lineNum;
			this.highlightDiv.style.left = 0; // this.canvas.x + 'px';
			this.highlightDiv.style.top = (lineTop - 2) + 'px';
			this.highlightDiv.style.width = (this.containerBBox.width) + 'px';
			this.highlightDiv.style.height = (this.lineHeight-1) + 'px';
			this.highlightDiv.style.display = 'block';
			this.highlightedActivity = activity;
		}
		this.options.highlightCallback(this.highlightedActivity, type, e);
	}

	hoverHighlight(e, disable=false) {
		let lineNum = Math.floor((this.scrollPosY - this.hh + e.offsetY) / this.lineHeight);
		disable = (disable || !(e.offsetX>0 && e.offsetX<this.w && e.offsetY>this.hh && e.offsetY<this.h));
		//console.log(disable, 'offsetx=',e.offsetX, this.x, this.w, 'offsetY=', e.offsetY, this.y, this.h);
		if( lineNum < 0 || lineNum > this.numLinesOnScreen || disable ) 
		{
			this.hoverHighlightLine = -1;
			if(this.hoverHighlightDiv.style.display !== 'none') this.hoverHighlightDiv.style.display = 'none';
			return;
		}
		if( lineNum === this.hoverHighlightLine ) {
			return;
		}
		let lineTop = this.hh + (this.scrollPosY % this.lineHeight) + this.lineHeight*lineNum;
		this.hoverHighlightDiv.style.left = '0px';
		this.hoverHighlightDiv.style.top = (lineTop - 2) + 'px';
		this.hoverHighlightDiv.style.width = (this.containerBBox.width) + 'px';
		this.hoverHighlightDiv.style.height = (this.lineHeight-1) + 'px';
		this.hoverHighlightDiv.style.display = 'block';
		this.hoverHighlightLine = lineNum;
	}


	onWheel(e) {
		e.preventDefault();

		// Scaling...
		if( e.shiftKey ) {
			if( e.deltaY > 0 ) {
				this.scaleVertically( this.settings.yZoomFactor )			
			}
			else if( e.deltaY < 0 ) {
				this.scaleVertically( -this.settings.yZoomFactor )			
			}
			return;
		}
		if( e.ctrlKey ) {
			if( e.deltaY > 0 ) {
				this.scaleHorizontally( this.settings.yZoomFactor )			
			}
			else if( e.deltaY < 0 ) {
				this.scaleHorizontally( -this.settings.yZoomFactor )			
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

	onExpandCallback() {
		let n = this.adata.getVisibleActivitiesNumber();
		this.vscroll.setCustomDimensions( (this.numLinesOnScreen < n) ? this.numLinesOnScreen : n, n );
		this.draw();
	}

	setHScale(hscale) {
		this.hscale = hscale;
		this.scaledWidth = this.canvas.w * hscale;
	}

	setNumLinesOnScreen( numLines ) {
		this.numLinesOnScreen = numLines;
		this.lineHeight = (this.canvas.h - this.hh) / this.numLinesOnScreen;
	}

	scaleVertically( factor, _newLinesOnScreen=null ) {
		let newLinesOnScreen;
		if( _newLinesOnScreen === null ) {		// If null - scaleVertically is called by this object 
			newLinesOnScreen = this.numLinesOnScreen + Math.round(this.options.numLinesOnScreen * factor);
			if( newLinesOnScreen < this.settings.minActivitiesOnScreen ) {
				return;
			}
		} else {	//	Called from another module if not null
			newLinesOnScreen = _newLinesOnScreen;
		}
		let n = this.adata.getVisibleActivitiesNumber();
		if( newLinesOnScreen > this.settings.maxActivitiesOnScreen || newLinesOnScreen > n ) {
			return;
		}
		this.setNumLinesOnScreen( newLinesOnScreen );
		this.draw();
		this.vscroll.setCustomDimensions( (this.numLinesOnScreen < n) ? this.numLinesOnScreen : n, n );

		if( _newLinesOnScreen === null && this.options.yScaleCallback ) { 	// If not called from another module
			this.options.yScaleCallback( null, _newLinesOnScreen )						// calling the callback
		}
	}

	scaleHorizontally( factor ) {
		let newScale = (factor > 0) ? (this.hscale * 1.5) : (this.hscale / 1.5);
		this.setHScale( newScale );
		this.draw();
		this.hscroll.setCustomDimensions( null,  this.widgetsCoords.hscroll.scrollableW * this.hscale );
		//this.hscroll.setHorizDims( null, null, this.widgetsCoords.hscroll.w / this.hscale );
		if( this.timePointer !== null ) { 	// Moving the time pointer accordingly to the new size
			this.setTimePointer(this.timePointer);
		}
	}

	resize( x, y, w, h ) {
		let ccs = this.calcWidgetsCoords( x, y, w, h, this.hh);
		this.canvas.initDims( ccs.canvas.x, ccs.canvas.y, ccs.canvas.w, ccs.canvas.h );
		this.hscroll.setCustomDimensions(null, ccs.hscroll.scrollableW * this.hscale, false);
		this.hscroll.setHorizDims( ccs.hscroll.x, ccs.hscroll.w );
		this.draw();

		if( this.timePointer !== null ) { 	// Moving the time pointer accordingly to the new size
			this.setTimePointer(this.timePointer);
		}
	};

	setScrollPos( posX, posY, isRedraw=true, isCallCallback=true, isCalledByVscroll = false ) {
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
			if( this.timePointer !== null ) {		// Moving the time pointer
				this.setTimePointer(this.timePointer);
			}
		}		
		if( isCallCallback && this.options.yScrollCallback && posY !== null ) {
			this.options.yScrollCallback(posY);
		}
	} 
}

AGantt.prototype.timeToScreen = function(t) {
	return Math.round(this.scaledWidth * (t - this.data._time.min) / this.data._time.span - this.scrollPosX);
}

AGantt.prototype.screenToTime = function(x) {
	//return x = this.scaledWidth * (t - this.data._time.min) / this.data._time.span - this.scrollPosX;
	return (x + this.scrollPosX) * this.data._time.span / this.scaledWidth + this.data._time.min;
}


AGantt.prototype.draw = function() {
	window.requestAnimationFrame( function() { this._draw.call(this); }.bind(this) );
}


AGantt.prototype._draw = function() {
	this.canvas.removeAllListeners();

	this.canvas.drawRect(0, 0, this.canvas.w, this.canvas.h, {fillStyle: this.settings.ganttBkgrColor });

	this.calcTimeLine();
	this.drawTimeLineGrid();

	let unscalableFontH = Math.floor( this.lineHeight * 0.6 );
	let fontSize = (unscalableFontH < this.settings.ganttMaxFontSize) ? unscalableFontH : this.settings.ganttMaxFontSize;
	
	// Drawing the content
	let linesToSkip = Math.floor(this.scrollPosY);
	let linesSkipped = 0;
	let linesDone = 0;
	let highlightDone = (this.highlightDiv !== null && this.highlightedActivity !== -1) ? false : true;
	
	if( this.hoverHighlight ) this.hoverHighlightCoords = []; 	// If "Hover Highlight" functionality is on
	
	for( let i = 0 ; i < this.data.activities.length ; i++ ) {
		if( !this.data._activities[i].visible ) {
			continue;
		}
		if( linesSkipped < linesToSkip ) {
			linesSkipped++;
			continue;
		}
		
		let lineFromTop = linesSkipped + linesDone;

		if( this.hoverHighlight ) { 	// If "Hover Highlight" functionality is on
			this.hoverHighlightCoords.push( [lineFromTop, i] );
		}

		// Highlight functionality
		if( !highlightDone ) {	// Moving highlight div according to the new location  
			if( this.highlightedActivity === i ) {
				this.highlightDiv.style.top = 
					(this.hh + (lineFromTop - this.scrollPosY) * this.lineHeight - 2) + 'px';
				highlightDone = true;
			}
		}

		this.drawGanttLine( i, lineFromTop, fontSize );
		linesDone++;
		if( linesDone > this.numLinesOnScreen ) {
			break;
		}
	}
	if( linesDone <= this.numLinesOnScreen ) {
		for( ; linesDone <= this.numLinesOnScreen ; linesDone++ ) {
			this.drawEmptyGanttLine( linesSkipped + linesDone );
		}
	}	

	this.drawTimeLine();

	// Hiding highlight div if this data activity is no more visible 
	if( !highlightDone ) {
		this.highlightedActivity = -1;
		this.highlightDiv.style.display = 'none';
		this.options.highlightCallback(-1, -1, null);	// To let 'em know there is no more highlighted activity 
	}
}

AGantt.prototype.calcRectCoords = function(i, lineFromTop ) {

	let rectBottomMargin, rectTopMargin, compareBottomMargin, compareTopMargin;
	if( !this.titlesRight ) {
		rectBottomMargin = this.settings.ganttRectBottomMargin;
		rectTopMargin = this.settings.ganttRectTopMargin;
		compareBottomMargin = this.settings.ganttCompareBottomMargin;
		compareTopMargin = this.settings.ganttCompareTopMargin;
	} else {
		rectBottomMargin = this.settings.ganttRectBottomMarginTitleFree;
		rectTopMargin = this.settings.ganttRectTopMarginTitleFree;
		compareBottomMargin = this.settings.ganttCompareBottomMarginTitleFree;
		compareTopMargin = this.settings.ganttCompareTopMarginTitleFree;		
	}

	let left = this.timeToScreen( this.data.activities[i].displayStartInSeconds );
	let right = this.timeToScreen( this.data.activities[i].displayFinInSeconds );
	let top = this.hh + (lineFromTop - this.scrollPosY) * this.lineHeight;
	let bottom = top + this.lineHeight; 
	let rectTop = top + rectTopMargin * this.lineHeight;
	let rectBottom = bottom - rectBottomMargin * this.lineHeight;
	let rectWidth = right - left + 1;
	let width;
	if( rectWidth < 3 && this.data.activities[i].displayFinInSeconds > this.data.activities[i].displayStartInSeconds ) {
		left -= 1;
		right += 1;
		width = 3;
	} else {
		width = rectWidth;
	}

	let r = { left:left, top:top,right:right, bottom:bottom, width: width, 
		rectTop: rectTop, rectBottom:rectBottom, rectHeight: rectBottom - rectTop +1 };

	if( this.data.activities[i].Start_COMPInSeconds != -1 && this.data.activities[i].Fin_COMPInSeconds != -1 ) {
		r.rectCompareStart = this.timeToScreen( this.data.activities[i].Start_COMPInSeconds );
		r.rectCompareEnd = this.timeToScreen( this.data.activities[i].Fin_COMPInSeconds );
		r.rectCompareTop = top +  compareTopMargin * this.lineHeight;
		r.rectCompareBottom = bottom - compareBottomMargin * this.lineHeight;
		r.displayCompare = true;
		if( this.data.activities[i].Fin_COMPInSeconds > this.data.activities[i].Start_COMPInSeconds ) {
			r.displayCompareAsARhomb = false;
		} else {
			r.displayCompareAsARhomb = true;				
		}
	} else {
		r.displayCompare = false;
	}

	return r;
}

AGantt.prototype.drawGanttLine = function(i, lineFromTop, fontSize) {
	if( !this.titlesRight ) {
		fontSize = fontSize * 0.75;			
	} 

	let coords = this.calcRectCoords(i, lineFromTop);	

	// Drawing links
	if( 'links' in this.data._activities[i] ) {
		let lineProperties = { strokeStyle: this.settings.ganttLinkStrokeColor, lineWidth: this.settings.ganttLinkStrokeWidth, 
			opacity:this.settings.ganttLinkOpacity, fillStyle: this.settings.ganttLinkStrokeColor };
		let arrowLineProperties = { strokeStyle: this.settings.ganttLinkStrokeColor, lineWidth: 1, 
			head:this.settings.ganttLinkArrowHeight, fillStyle: this.settings.ganttLinkStrokeColor };
	
		for( let j = 0 ; j < this.data._activities[i].links.length ; j++ ) {
			let o = this.data._activities[i].links[j];
			let predOp, succOp, type, predCoords, succCoords;
			if( o.from === null ) {
				predOp = i;
				succOp = o.to;
				if( succOp < i || !this.data._activities[succOp].visible ) {
					continue;
				}
				predCoords = coords;
				let dl = this.calcDistanceInLines(i, succOp);
				succCoords = this.calcRectCoords(succOp, dl + lineFromTop);
			} else {
				predOp = o.from;
				succOp = i;
				if( predOp < i || !this.data._activities[predOp].visible ) {
					continue;
				}
				let dl = this.calcDistanceInLines(i, predOp);
				predCoords = this.calcRectCoords(predOp, dl + lineFromTop);
				succCoords = coords;
			}
			type = o.type;

			let lineX1, lineY1, lineX2, lineY2, arrowY;
			if( type === 'SS' || type === 'SF' ) {
				lineX1 = predCoords.left;
			} else {
				lineX1 = predCoords.right;				
			}
			if( predCoords.top < succCoords.top ) {
				lineY1 = predCoords.rectBottom;
				lineY2 = succCoords.rectTop - this.settings.ganttLinkArrowHeight;
				arrowY = succCoords.rectTop; // - this.settings.ganttLinkArrowHeight;
			} else {
				lineY1 = predCoords.rectTop;
				lineY2 = succCoords.rectBottom + this.settings.ganttLinkArrowHeight;
				arrowY = succCoords.rectBottom; // + this.settings.ganttLinkArrowHeight;
			}
			if( type ==='SF' || type === 'FF' ) {
				lineX2 = succCoords.right;
			} else {
				lineX2 = succCoords.left;				
			}

			this.canvas.drawLine( lineX1, lineY1, lineX2, lineY2, lineProperties );
			this.canvas.drawArrow( lineX2, lineY2, lineX2, arrowY, arrowLineProperties );
		}
	}	

	// **********************************************************************************
	// Drawing main gantt visual elements...

	if( coords.displayCompare ) { // To compare with...
		if( coords.displayCompareAsARhomb ) { 	// Displaying compare rectangle
			let w = coords.rectCompareEnd - coords.rectCompareStart;
			let h = coords.rectCompareBottom - coords.rectCompareTop;
			this.canvas.drawRect( coords.rectCompareStart, coords.rectCompareTop, w, h, this.compareProperties ); // Compare rectangle
		} else {		// Diplaying compare as a rhomb
			this.canvas.drawRhomb( coords.rectCompareStart, coords.rectCompareTop, coords.rectHeight, this.compareProperties );
		}
	}

	if( this.data.activities[i].status == 0 ) { // Not started
		this.pct0Properties.fillStyle = (this.data._activities[i].color) ? this.data._activities[i].color : this.settings.ganttOperation0Color;
		if( !(coords.width > 0) ) {
			this.canvas.drawRhomb( coords.left, coords.rectTop, coords.rectHeight, this.pct0Properties );
		} else if( !this.data._activities[i].isPhase ) { // Not a phase ?
			this.canvas.drawRect( coords.left, coords.rectTop, coords.width, coords.rectHeight, this.pct0Properties ); // Rectangle
		} else {
			//let pcc = this.calcPhaseCoords( coords.left, coords.rectTop, coords.width, coords.rectHeight);
			//this.canvas.drawPolygon( pcc, this.pct0Properties );
			let phb = this.calcPhaseBrackets( coords );
			this.canvas.drawRect( phb[0], phb[1], phb[2], phb[3], this.pct0Properties ); // Rectangle
			this.canvas.drawRect( phb[4], phb[5], phb[6], phb[7], this.pct0Properties ); // Rectangle
			this.canvas.drawRect( phb[8], phb[9], phb[10], phb[11], this.pct0Properties ); // Rectangle
		}
	} else if( this.data.activities[i].status == 100 ) { // Finished
		if( !(coords.width > 0) ) {
			this.canvas.drawRhomb( coords.left, coords.rectTop, coords.rectHeight, this.pct100Properties );
		} else if( !this.data._activities[i].isPhase ) { // Not a phase
			drawRect( coords.left, coords.rectTop, coords.width, coords.rectHeight, this.pct100Properties ); // Rectangle
		} else {
			let phb = this.calcPhaseBrackets( coords );
			this.canvas.drawRect( phb[0], phb[1], phb[2], phb[3], this.pct100Properties ); // Rectangle
			this.canvas.drawRect( phb[4], phb[5], phb[6], phb[7], this.pct100Properties ); // Rectangle
			this.canvas.drawRect( phb[8], phb[9], phb[10], phb[11], this.pct100Properties ); // Rectangle
			//drawPolygon( this.calcPhaseCoords( coords.left, coords.rectTop, coords.width, coords.rectHeight ), pct100Properties );
		}
	} else { // Started but not finished
		let xLastFin = this.timeToScreen( this.data.activities[i].lastFinInSeconds );
		let xRestart = this.timeToScreen( this.data.activities[i].displayRestartInSeconds );
		let widthDone = xLastFin - coords.left;
		if( !(widthDone > 0) ) {
			this.canvas.drawRhomb( coords.left, coords.rectTop, coords.rectHeight, this.pct100Properties );
		} else if( !this.data._activities[i].isPhase ) { // Not a phase
			this.canvas.drawRect( coords.left, rectTop, widthDone, rectHeight, this.pct100Properties  ); // Rectangle
		} else {
			coords.widthDone = widthDone;
			let phb = this.calcPhaseBrackets( coords, -1 );
			this.canvas.drawRect( phb[0], phb[1], phb[2], phb[3], this.pct100Properties ); // Rectangle
			this.canvas.drawRect( phb[4], phb[5], phb[6], phb[7], this.pct100Properties ); // Rectangle
			//this.canvas.drawPolygon( this.calcPhaseCoords(coords.left, coords.rectTop, width100, coords.rectHeight,-1), this.pct100Properties );
		}

		if( this.data.activities[i].lastFinInSeconds < this.data.activities[i].displayRestartInSeconds ) { // A gap between 
			this.canvas.drawRect( xLastFin, coords.rectTop+rectHeight*0.33, xRestart - xLastFin, 1 , coords.pct100Properties  ); // Rectangle
		} 
		
		this.pct0Properties.fill = this.data._activities[i].color;
		let widthNotDone = coords.right - xRestart;
		if( !(widthNotDone > 0) ) {
			this.canvas.drawRhomb( coords.right, coords.rectTop, coords.rectHeight, this.pct0Properties );
		} else if( !this.data._activities[i].isPhase ) { // Not a phase
			this.canvas.drawRect( xRestart, coords.rectTop, widthNotDone, coords.rectHeight, this.pct0Properties  ); // Rectangle
		} else {
			coords.widthNotDone = widthNotDone;
			//let phb = this.calcPhaseBrackets( xRestart, coords.rectTop, width0, coords.rectHeight, 1 );
			this.canvas.drawRect( phb[0], phb[1], phb[2], phb[3], this.pct0Properties ); // Rectangle
			this.canvas.drawRect( phb[4], phb[5], phb[6], phb[7], this.pct0Properties ); // Rectangle
			//this.canvas.drawPolygon( this.calcPhaseCoords(xRestart, coords.rectTop, width0, coords.rectHeight, 1), this.pct0Properties );
		}
	}

	let textX, textY;
	if( !this.titlesRight ) {
		textX = coords.left;
		textY = coords.rectTop - 4;
	} else {
		let rhomb = false;
		if( this.data.activities[i].status == 0 || this.data.activities[i].status == 100 ) { // Not started or finished...
			; // rhomb = !(rectWidth > 0);				
		} else { // Started but not finished
			rhomb = (this.data.activities[i].displayFinInSeconds == this.data.activities[i].displayRestartInSeconds);
		}
		if( !rhomb ) { // It is not a rhomb
			textX = coords.right + coords.rectHeight/2 + 4;
		} else {
			textX = coords.right + coords.rectHeight/2 + 4;
		}
		textY = coords.rectTop;			
	}

	this.canvas.drawText( textX, textY, null, null, this.data.activities[i].Name, 
		{ fontSize:fontSize, fillStyle: this.settings.ganttFontColor, textAlign:'left', textBaseline:'hanging' } );	
}

AGantt.prototype.calcPhaseBrackets = function( cc, brackets=0 ) {
	let phaseBracketHeight = cc.rectHeight * this.settings.ganttRectBracketRelHeight;
	let phaseBrackets;
	if( brackets == 0 ) { // Both brackets
		let thick = (cc.width + cc.width > this.settings.ganttRectBracketThick) ? this.settings.ganttRectBracketThick : 1;
		phaseBrackets = [ cc.left, cc.rectTop, cc.width, cc.rectHeight - phaseBracketHeight, 
			cc.left, cc.rectTop, thick, cc.rectHeight, 
			cc.right - thick + 1, cc.rectTop, thick, cc.rectHeight ];
	} else if( brackets == 1 ) {  // Only right bracket
		let thick = (cc.widthNotDone + cc.widthNotDone > this.settings.ganttRectBracketThick) ? this.settings.ganttRectBracketThick : 1;
		phaseBrackets = [ 
			cc.right - cc.widthNotDone + 1, rectTop, cc.widthNotDone, rectHeight - phaseBracketHeight,
			cc.right - thick + 1, cc.rectTop, thick, cc.rectHeight ];				
	} else { // Only left bracket
		let thick = (cc.widthDone + cc.widthDone > this.settings.ganttRectBracketThick) ? this.settings.ganttRectBracketThick : 1;
		phaseBrackets = [ cc.left, cc.top, cc.widthDone, cc.rectHeight - phaseBracketHeight,
			cc.left, cc.rectTop, thick, cc.rectHeight ];		
	}
	return phaseBrackets;
}


AGantt.prototype.calcPhaseCoords = function( rectStart, rectTop, rectWidth, rectHeight, brackets=0 ) {
	let phaseBracketHeight = rectHeight * this.settings.ganttRectBracketRelHeight;
	let thick = (rectWidth+rectWidth > this.settings.ganttRectBracketThick) ? this.settings.ganttRectBracketThick : 1;
	let rectEnd = rectStart + rectWidth;
	let rectBottom = rectTop + rectHeight;
	let phaseCoords;
	if( brackets == 0 ) { // Both brackets
		phaseCoords = [ rectStart, rectTop, rectEnd, rectTop, rectEnd, rectBottom,
			(rectEnd - thick), (rectBottom - phaseBracketHeight), 
			(rectStart + thick), (rectBottom - phaseBracketHeight),
			rectStart, rectBottom ];		
	} else if( brackets == 1 ) {  // Only right bracket
		phaseCoords = [ rectStart, rectTop, rectEnd, rectTop, rectEnd, rectBottom,
			(rectEnd - thick), (rectBottom - phaseBracketHeight),
			rectStart, (rectBottom-phaseBracketHeight) ];				
	} else { // Only left bracket
		phaseCoords = [ rectStart, rectTop, rectEnd, rectTop, rectEnd, (rectBottom- phaseBracketHeight),
			(rectStart + thick), (rectBottom-phaseBracketHeight), rectStart, rectBottom ];		
	}
	return phaseCoords;
}

AGantt.prototype.drawEmptyGanttLine = function(lineFromTop) {
	let top = this.hh + (lineFromTop - this.scrollPosY) * this.lineHeight;
	this.canvas.drawRect( 0, top, this.canvas.w, this.lineHeight, { fillStyle: this.settings.ganttEmptyLineColor } ); 
}

AGantt.prototype.calcTimeLine = function() 
{
	this.timeTexts = []; 	// To draw time scale later
	this.timeGrid = []; // To draw a grid later on the Gantt chart...

	let displayHours=0, displayDays=false, displayWeeks=false, displayMonths=0, displayYears=0;
	let hourRectWidth, dayRectWidth, weekRectWidth, monthRectWidth, yearRectWidth;
	let hoursInScreen, daysInScreen, weeksInScreen, monthsInScreen, yearsInScreen;
	let hoursFontSize, daysFontSize, weeksFontSize, monthsFontSize, yearsFontSize;

	let maxFontSizeFromHeaderHeight = Math.floor( this.hh*0.28 );

	hoursInScreen = (this.data._time.span)/ (60*60) / this.hscale;
	hourRectWidth = this.canvas.w / hoursInScreen;
	if( hourRectWidth > this.settings.minRectWidthOnTimeLine ) {
		hoursFontSize = hourRectWidth*0.75;
		if( hourRectWidth > this.settings.minRectWidthOnTimeLine*2.5 ) {
			displayHours = 2;
			hoursFontSize = hourRectWidth * 0.2; 
		} else {
			displayHours = 1;
			hoursFontSize = hourRectWidth * 0.5; 				
		}
		if( hoursFontSize > this.settings.timeLineMaxFontSize ) {
			hoursFontSize = this.settings.timeLineMaxFontSize;
		}
		if( hoursFontSize > maxFontSizeFromHeaderHeight ) {
			hoursFontSize = maxFontSizeFromHeaderHeight;
		}
	}

	daysInScreen = hoursInScreen / 24.0;
	dayRectWidth = hourRectWidth * 24.0;
	if( dayRectWidth > this.settings.minRectWidthOnTimeLine ) {
		displayDays = true;		
		daysFontSize = Math.floor(dayRectWidth*0.3);
		if( daysFontSize > this.settings.timeLineMaxFontSize ) {
			daysFontSize = this.settings.timeLineMaxFontSize;
		}
		if( daysFontSize > maxFontSizeFromHeaderHeight ) {
			daysFontSize = maxFontSizeFromHeaderHeight;
		}
	}

	if( !displayDays ) {
		weeksInScreen = daysInScreen / 7.0;
		weekRectWidth = dayRectWidth * 7.0;
		if( weekRectWidth > this.settings.minRectWidthOnTimeLine )	{
			displayWeeks = true;
		}
		weeksFontSize = Math.floor(weekRectWidth*0.5);
		if( weeksFontSize > this.settings.timeLineMaxFontSize ) {
			weeksFontSize = this.settings.timeLineMaxFontSize;
		}
		if( weeksFontSize > maxFontSizeFromHeaderHeight ) {
			weeksFontSize = maxFontSizeFromHeaderHeight;
		}
	}
	if( displayHours === 0 ) {
		monthsInScreen = daysInScreen / 30.0;
		monthRectWidth = dayRectWidth * 30.0;
		if( monthRectWidth > this.settings.minRectWidthOnTimeLine ) {
			if( monthRectWidth > this.settings.minRectWidthOnTimeLine*10 ) {
				displayMonths = 3;
				monthsFontSize = Math.floor(monthRectWidth * 0.2); 
			} else if( monthRectWidth > this.settings.minRectWidthOnTimeLine*5 ) {
				displayMonths = 2;
				monthsFontSize = Math.floor( monthRectWidth * 0.3); 
			} else {
				displayMonths = 1;
				monthsFontSize = Math.floor(monthRectWidth * 0.5); 				
			}
			if( monthsFontSize > this.settings.timeLineMaxFontSize ) {
				monthsFontSize = this.settings.timeLineMaxFontSize;
			}
			if( monthsFontSize > maxFontSizeFromHeaderHeight ) {
				monthsFontSize = maxFontSizeFromHeaderHeight;
			}			
		}
	}

	if( !displayDays && displayMonths != 3 ) {
		yearsInScreen = daysInScreen / 365.0;
		yearRectWidth = dayRectWidth * 365.0;
		if( yearRectWidth > this.settings.minRectWidthOnTimeLine ) {
			if( yearRectWidth > this.settings.minRectWidthOnTimeLine * 2 ) {
				displayYears = 2;
				yearsFontSize = Math.floor( yearRectWidth / 4 );
			} else {
				displayYears = 1;
				yearsFontSize = Math.floor( yearRectWidth * 0.35 );				
			}
			if( yearsFontSize > this.settings.timeLineMaxFontSize ) {
				yearsFontSize = this.settings.timeLineMaxFontSize;
			}
			if( yearsFontSize > maxFontSizeFromHeaderHeight ) {
				yearsFontSize = maxFontSizeFromHeaderHeight;
			}			
		}
	}

	let height = this.hh / 2.0;
	//let textProperties = { fillStyle: this.settings.timeLineFontColor,
	//	strokeStyle: this.settings.timeLineBorderColor, //bkgrFill: this.settings.timeLineBkgrColor,
	//	textAlign:'center', textBaseline:'bottom', noClip: true };
	let rectProperties = {};

	let minTime = this.screenToTime(0) * 1000; // _globals.ganttVisibleLeft * 1000; // screenToTime(0) * 1000;
	let maxTime = this.screenToTime(this.canvas.w) * 1000; //_globals.ganttVisibleWidth * 1000; // screenToTime( _globals.timeSVGWidth ) * 1000;
	let minDT = new Date(minTime);
	let maxDT = new Date(maxTime);
	//minDT.setTime( minDT.getTime() + minDT.getTimezoneOffset()*60*1000);
	//maxDT.setTime( maxDT.getTime() + maxDT.getTimezoneOffset()*60*1000);
	let minY = minDT.getUTCFullYear();
	let maxY = maxDT.getUTCFullYear();

	let rowNumber = 2;
	if( displayHours !== 0 ) {
		let textProperties = { 
			fontSize: hoursFontSize, fillStyle: this.settings.timeLineFontColor, 
			textAlign:'center', textBaseline:'bottom', noClip: true 
		};
		let rectProperties = { _rowNumber: rowNumber, _top: ((rowNumber - 1) * height), _height: height };
		this.calcTimeLineHours( rectProperties, textProperties, displayHours, minDT, maxDT );
		rowNumber -= 1;
	}

	// Adjusting to the beginning of day
	//console.log('minDT', minDT, minDT.getUTCFullYear(), minDT.getUTCMonth(), minDT.getUTCDate() );
	minDT = new Date( minDT.getUTCFullYear(), minDT.getUTCMonth(), minDT.getUTCDate(), -minDT.getTimezoneOffset()/60, 0, 0, 0 );
	//console.log('minDT', minDT);
	maxDT = new Date( maxDT.getUTCFullYear(), maxDT.getUTCMonth(), maxDT.getUTCDate(), -minDT.getTimezoneOffset()/60, 0, 0, 0 );

	if( displayDays && rowNumber > 0 ) {
		let textProperties = { 
			fontSize: daysFontSize, fillStyle: this.settings.timeLineFontColor, 
			textAlign:'center', textBaseline:'bottom', noClip: true 
		};
		let rectProperties = { _rowNumber: rowNumber,_top: (rowNumber - 1) * height, _height: height };
		this.calcTimeLineDays( rectProperties, textProperties, minDT, maxDT  );
		rowNumber -= 1;
	}

	if( displayWeeks && rowNumber > 0 ) {
		let textProperties = { 
			fontSize: weeksFontSize, fillStyle: this.settings.timeLineFontColor, 
			textAlign:'center', textBaseline:'bottom', noClip: true 
		};
		let rectProperties = { _rowNumber: rowNumber, _top: ((rowNumber - 1) * height), _height: height };		
		this.calcTimeLineWeeks( rectProperties, textProperties, minDT, maxDT );
		rowNumber -= 1;		
	}

	if( displayMonths !== 0 && rowNumber > 0 ) {
		let textProperties = { 
			fontSize: monthsFontSize, fillStyle: this.settings.timeLineFontColor, 
			textAlign:'center', textBaseline:'bottom', noClip: true 
		};
		let rectProperties = {_rowNumber: rowNumber, _top: (rowNumber - 1) * height, _height: height };		
		this.calcTimeLineMonths( rectProperties, textProperties, displayMonths, minY, maxY, minDT, maxDT );
		rowNumber -= 1;				
	}

	if( displayYears !== 0 && rowNumber > 0 ) {
		let textProperties = { 
			fontSize: yearsFontSize, fillStyle: this.settings.timeLineFontColor, 
			textAlign:'center', textBaseline:'bottom', noClip: true 
		};
		let rectProperties = { _rowNumber: rowNumber,_top: (rowNumber - 1) * height, _height: height };		
		this.calcTimeLineYears( rectProperties, textProperties, displayYears, minY, maxY );
	}
}

AGantt.prototype.drawTimeLine = function() {
	this.canvas.drawRect( 0, 0, this.canvas.w, this.hh, { fillStyle:this.settings.timeLineBkgrColor } ); // backgroud rect
	for( let t of this.timeTexts ) {
		let x = t[0], y =t[1], w = t[2], h = t[3], text = t[4], props = t[5];
		this.canvas.drawText( x, y, w, h, text, props );
	}
}

AGantt.prototype.drawTimeLineGrid = function() {
	let gridLineProperties = { strokeStyle: this.settings.gridColor, 
		lineWidth: this.settings.gridStrokeWidth }; 
	for( let i = 0 ; i < this.timeGrid.length ; i++ ) {
		this.canvas.drawLine( this.timeGrid[i], this.hh, this.timeGrid[i], this.canvas.h, gridLineProperties );
	}		
	let gridXNow = this.timeToScreen( this.data.project.curTimeInSeconds );
	gridLineProperties.strokeStyle = this.settings.gridCurrentTimeColor;
	gridLineProperties.lineWidth = this.settings.gridCurrentTimeLineWidth;
	gridLineProperties.lineDash = this.settings.gridCurrentTimeLineDash;
	this.canvas.drawLine( gridXNow, this.hh, gridXNow, this.canvas.h, gridLineProperties );
}

AGantt.prototype.calcTimeLineYears = function( rectProperties, textProperties, displayYears, minY, maxY ) 
{
	let top = rectProperties._top;
	let height = rectProperties._height;

	for( let y = minY ; y <= maxY ; y++ ) {
		if( minY == maxY ) {
			this.timeTexts.push([ 0, 0, this.canvas.w, height, minY, textProperties]);
		} else {
			let startOfYear = new Date(y,0,1,0,0,0,0);
			let startOfYearInSeconds = startOfYear.getTime() / 1000;
			let endOfYear = new Date(y,11,31,23,59,59,999);
			let endOfYearInSeconds = endOfYear.getTime() / 1000;
			let yearStartX = this.timeToScreen(startOfYearInSeconds);
			let yearEndX = this.timeToScreen(endOfYearInSeconds);
			let text;
			if( displayYears == 1 ) { // 2-digit format
				text = parseInt(y.toString().slice(-2));
			} else { // 4-digit format
				text = y.toString();
			}
			this.timeTexts.push( [ yearStartX, top, (yearEndX - yearStartX), height, text, textProperties ] );
			if( rectProperties._rowNumber == 2 ) {
				this.timeGrid.push(yearEndX); // To draw a grid later on the Gantt chart...
			}			
		}
	}
}


AGantt.prototype.calcTimeLineMonths = function( rectProperties, textProperties, displayMonths, minY, maxY, minDT, maxDT ) 
{
	let top = rectProperties._top;
	let height = rectProperties._height;

	for( let y = minY ; y <= maxY ; y++ ) {
		let minM = ( y == minY ) ? minDT.getUTCMonth() : 0;
		let maxM = ( y == maxY ) ? maxDT.getUTCMonth() : 11;
		let mNames = this.adata.texts[this.data.parameters.language]['monthNames'];
		for( let m = minM ; m <= maxM ; m++ ) {
			let startOfMonth = new Date(y,m,1,0,0,0,0);
			let startOfMonthInSeconds = startOfMonth.getTime() / 1000;
			let endOfMonth = new Date(y,m+1,0,23,59,59,999);
			let endOfMonthInSeconds = endOfMonth.getTime() / 1000;
			let monthStartX = this.timeToScreen(startOfMonthInSeconds);
			let monthEndX = this.timeToScreen(endOfMonthInSeconds);
			let text;
			if( displayMonths == 3 ) { // Display with year
				let yearShort = y.toString().slice(-2);
				text = mNames[m] + "'" + yearShort;
			} else if( displayMonths == 2 ) { // Display with name
				text = mNames[m];
			} else { // Display with digits
				text = (m+1).toString();
			}
			this.timeTexts.push([ monthStartX, top, monthEndX - monthStartX, height, text, textProperties ]);
			if( rectProperties._rowNumber == 2 ) {
				this.timeGrid.push( monthEndX ); // To draw a grid later on the Gantt chart...
			}			
		}
	}
}


AGantt.prototype.calcTimeLineWeeks = function( rectProperties, textProperties, minDT, maxDT ) 
{
	let top = rectProperties._top;
	let height = rectProperties._height;
	let bottom = top + height;
	let numSecondsInDay = 24 * 60 * 60;
	let numSecondsInWeek = 7 * numSecondsInDay;

	let savedStrokeStyle = textProperties.strokeStyle;
	delete textProperties.strokeStyle;
	let firstDay = minDT.getUTCDay(); // To adjust to the beginning of a week.
	if( firstDay == 0 ) { // If Sunday... 
		firstDay = 7; // ... making it 7 instead of 0
	}
	let startDT;
	if( firstDay > 1 ) { // If not monday...
		startDT = new Date( minDT.getTime() - numSecondsInDay*1000*(firstDay-1) ); // ... making it Monday
	} else {
		startDT = minDT; //  new Date( minDT.getUTCFullYear(), minDT.getUTCMonth(), minDT.getUTCDate(), 0, 0, 0, 0 );
	}
	let startOfWeekInSeconds = startDT.getTime() / 1000;
	let endOfWeekInSeconds = startOfWeekInSeconds + numSecondsInWeek;
	let endInSeconds = maxDT.getTime()/1000 + numSecondsInWeek - 1;		
	for( ; startOfWeekInSeconds < endInSeconds ; ) {
		let weekStartX = this.timeToScreen(startOfWeekInSeconds);
		let weekEndX = this.timeToScreen(endOfWeekInSeconds);
		let startOfWeekDate = new Date( startOfWeekInSeconds*1000 );
		let halfWidth = (weekEndX - weekStartX) / 2;
		this.timeTexts.push( [ 
			weekStartX - halfWidth, top, 2*halfWidth, height, 
			(startOfWeekDate.getUTCDate()).toString(), textProperties 
		]);
		if( rectProperties._rowNumber == 2 ) {
			this.timeGrid.push(weekEndX); // To draw a grid later on the Gantt chart...
		}
		startOfWeekInSeconds = endOfWeekInSeconds;
		endOfWeekInSeconds += numSecondsInWeek;
	}								
	textProperties.strokeStyle = savedStrokeStyle;
}


AGantt.prototype.calcTimeLineDays = function( rectProperties, textProperties, minDT, maxDT ) 
{
	let top = rectProperties._top;
	let height = rectProperties._height;
	let bottom = top + height;
	let numSecondsInDay = 24 * 60 * 60;

	let startOfDayInSeconds = minDT.getTime() / 1000;
	let endOfDayInSeconds = startOfDayInSeconds + numSecondsInDay;
	let endInSeconds = maxDT.getTime()/1000 + 1;		
	for( ; startOfDayInSeconds < endInSeconds ; ) {
		let dayStartX = this.timeToScreen(startOfDayInSeconds);
		let dayEndX = this.timeToScreen(endOfDayInSeconds);
		let startOfDayDate = new Date( startOfDayInSeconds*1000 );
		this.timeTexts.push([
			dayStartX, top, dayEndX-dayStartX, height, (startOfDayDate.getUTCDate()).toString(), textProperties
		]);
		if( rectProperties._rowNumber == 2 ) {
			this.timeGrid.push(dayEndX); // To draw a grid later on the Gantt chart...
		}		
		startOfDayInSeconds = endOfDayInSeconds;
		endOfDayInSeconds += numSecondsInDay;
	}								
}


AGantt.prototype.calcTimeLineHours = function( rectProperties, textProperties, displayHours, minDT, maxDT ) 
{
	let top = rectProperties._top;
	let height = rectProperties._height;
	let bottom = top + height;
	let numSecondsInHour = 60 * 60;

	let startDT = new Date( minDT.getUTCFullYear(), minDT.getUTCMonth(), minDT.getUTCDate(), minDT.getUTCHours(), 0, 0, 0 );
	let endDT = new Date( maxDT.getUTCFullYear(), maxDT.getUTCMonth(), maxDT.getUTCDate(), maxDT.getUTCHours(), 0, 0, 0 );

	let currentHour = startDT.getUTCHours();
	let startOfHourInSeconds = startDT.getTime() / 1000;
	let endOfHourInSeconds = startOfHourInSeconds + numSecondsInHour;
	let endInSeconds = endDT.getTime()/1000 + 1;		
	for( ; startOfHourInSeconds < endInSeconds ; ) {
		let hourStartX = this.timeToScreen(startOfHourInSeconds, false);
		let hourEndX = this.timeToScreen(endOfHourInSeconds, false);

		let text = currentHour.toString();
		if( currentHour < 10 ) {
			text = "0" + text;
		}
		if( displayHours == 2 ) { // Display minutes
			text = text + ":00";			
		}
		this.timeTexts.push([hourStartX, top, hourEndX - hourStartX, height, text, textProperties]);
		if( rectProperties._rowNumber == 2 ) {
			this.timeGrid.push(hourEndX); // To draw a grid later on the Gantt chart...
		}		
		startOfHourInSeconds = endOfHourInSeconds;
		endOfHourInSeconds += numSecondsInHour;
		currentHour = (currentHour < 23) ? (currentHour+1) : 0;
	}								
}

AGantt.prototype.calcDistanceInLines = function(i, succOp) {
	let d = 0;
	for( let j = i+1 ; j <= succOp ; j++ ) {
		if( this.data._activities[j].visible ) {
			d++;
		}
	}
	return d;
}