import './gnt.css';
import { ATable } from './atable';
import { VSplitter } from './vsplitter';
import { AGantt } from './agantt';
import { MessageBox } from './messagebox';

export class GnT {

	fitContainerWidth() {
		let bbox = (this.appContainerIsBody) ? 
			{left:0, top:0, width: window.innerWidth, height: window.innerHeight} : 
			this.appContainer.getBoundingClientRect();
		if( this.headerHeight !== 0 ) {
			this.headerDiv.style.width = bbox.width + 'px';
		}

		this.gntWidth = bbox.width;
		this.gntDiv.style.width = bbox.width + 'px';

		let cc = this.calcWidgetCoords(this.xSplit);
		this.agantt.changeWidth( cc.gw ); 
		
		this.vsplitter.recalculateMaxLeft(); 	// Changing the possible bounds for vertical splitter
	}

	constructor( appContainerName, adata, settings={}, options={} ) {
		this.adata = adata;
		this.data = adata.data;
		this.settings = settings;
		this.options = options;

		this.messageBox = (options.messageBox) ? options.messageBox : new MessageBox();
		this.tableHeaderHeight = (options.tableHeaderHeight) ? options.tableHeaderHeight : 40;
		this.numLinesOnScreen = (options.numLinesOnScreen) ? options.numLinesOnScreen : 24;

		this.headerHeight = (options.headerHeight) ? options.headerHeight : 0;

		this.headerWidth = null;
		this.gntWidth=null;
		this.gntHeight=null;
		this.headerDiv = null;
		this.gntDiv = null;

		this.appContainer = null;

		this.verticalSplitterWidth = null;

		this.xSplit = null;

		if(appContainerName) { 
			this.appContainer = document.getElementById(appContainerName);
		}

		this.appContainerIsBody = false;
		if( !this.appContainer ) {
			this.appContainer = document.body;
			this.appContainerIsBody = true;
		}
		
		this.verticalSplitterWidth = ( this.isTouchDevice ) ? 8 : 4;
		
		let bbox = (this.appContainerIsBody) ? 
			{left:0, top:0, width: window.innerWidth, height: window.innerHeight} : 
			this.appContainer.getBoundingClientRect();
	
		if( this.headerHeight !== 0 ) {
			this.headerDiv = document.createElement('div');
			//this.headerDiv.className = 'initializer-header';
			this.headerDiv.style.position = 'absolute';
			this.headerDiv.style.left = '0px';
			this.headerDiv.style.top = '0px';
			this.headerDiv.style.width = bbox.width + 'px';
			this.headerDiv.style.height = this.headerHeight + 'px';
			this.headerDiv.style.minHeight = this.headerHeight + 'px';
			this.headerDiv.style.overflow = 'hidden';
			this.appContainer.appendChild(this.headerDiv);
		}
		
		this.gntHeight = bbox.height - this.headerHeight;
		this.gntWidth = bbox.width;
		this.gntDiv = document.createElement('div');
		//this.headerDiv.className = 'initializer-header';
		this.gntDiv.style.position = 'absolute';
		this.gntDiv.style.left = '0px';
		this.gntDiv.style.top = this.headerHeight + 'px';
		this.gntDiv.style.width = bbox.width + 'px';
		this.gntDiv.style.height = this.gntHeight + 'px';
		this.gntDiv.style.overflow = 'hidden';
		this.appContainer.appendChild(this.gntDiv);

		this.initWidgets();
	}

	initWidgets() {
		let cc = this.calcWidgetCoords(20);

		this.chat = null; 

		let settings = {
			minActivitiesOnScreen:10, maxActivitiesOnScreen:100, yZoomFactor:0.1, 
			scrollThick: 6, scrollBkgrColor: '#cfcfcf', scrollSliderColor: '#8f8f8f',
			highlightColor: ((this.settings.highlightColor) ? this.settings.highlightColor : null),
			hoverHighlightColor: ((this.settings.hoverHighlightColor) ? this.settings.hoverHighlightColor : null)
	}
	
		this.atable = new ATable( this.gntDiv, cc.tx, cc.ty, cc.tw, cc.th, cc.hh, this.adata, settings,  
			{ numLinesOnScreen: this.numLinesOnScreen, chat: this.chat, messageBox: this.messageBox } );
	
		this.agantt = new AGantt( 
			this.gntDiv, cc.gx, cc.gy, cc.gw, cc.gh, cc.hh, this.adata, settings,
			{ 
				numLinesOnScreen: this.numLinesOnScreen, 
				highlightCallback: (this.options.highlightCallback) ? this.highlightCallback.bind(this) : null,
			 	isHighlightEnabled: (this.options.isHighlightEnabled) ? 
				 	(function() { return this.options.isHighlightEnabled(); }.bind(this)) : null,
				hoverHighlightOn: (this.options.highlightCallback) ? true : false,
				menuCallback: (this.options.menuCallback) ? 
				 (function(i,e) { this.options.menuCallback(i,e); }.bind(this)) : null,
				timePointerOn: this.options.timePointerOn,
				timePointerCallback: this.options.timePointerCallback
			}
		);
	
		const tableScrollCallback = function(y) {
			this.atable.setScrollPos(null, y, true, false);	
		}.bind(this);
		
		const ganttScrollCallback = function(y) {
			this.agantt.setScrollPos(null, y, true, false);	
		}.bind(this);
		
		//const expandCallback = function() {
		//	this.agantt.draw();
		//}.bind(this);

		this.atable.setYScrollCallback( ganttScrollCallback );
		this.atable.setExpandCallback( this.agantt.onExpandCallback.bind(this.agantt) );
		this.agantt.setYScrollCallback( tableScrollCallback );

		this.atable.setYScaleCallback( this.agantt.scaleVertically.bind(this.agantt) );
		this.agantt.setYScaleCallback( this.atable.scaleVertically.bind(this.atable) );

		this.vsplitter = new VSplitter( this.gntDiv, cc.sx, cc.sy, cc.sw, cc.sh,
			{
				callback: function(x) { 
					let cc = this.calcWidgetCoords(x);
					this.atable.resize(cc.tx, cc.ty, cc.tw, cc.th ); 
					this.agantt.resize( cc.gx, cc.gy, cc.gw, cc.gh ); 
				}.bind(this) 
			} 
		);	
	}

	calcWidgetCoords( xSplit = null ) {
		if( xSplit === null ) {
			xSplit = Math.round(this.gntWidth / 2);
		}
		this.xSplit = xSplit;

		let gx = xSplit + this.verticalSplitterWidth;
		let hh = this.tableHeaderHeight;
		return {
			hh: hh,
			tx: 0, ty: 0, tw: xSplit, th: this.gntHeight,
			sx: xSplit, sy: 0, sw: this.verticalSplitterWidth, sh: this.gntHeight, 		 
			gx: gx, gy:0, gw: this.gntWidth - gx, gh: this.gntHeight,
		};
	}

	highlightCallback(i, t, e) {
		if( this.options.highlightCallback ) {
			this.options.highlightCallback(i, t, e);
		}
	}
}
