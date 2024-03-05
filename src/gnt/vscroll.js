import { Canvas } from './canvas';
 
export class VScroll {

	changeX( x, redraw=true ) {
		this.x = x;

		this.canvas.initDims(x, this.y, this.w, this.h);
		if( redraw ) {
			this.draw();
		}
	}

	constructor(parent, x, y, w, h, props={}) {
		this.props = props;

		this.canvas = new Canvas( parent, x, y, w, h );
		this.canvas.getCanvas().style.cursor = 'pointer';

		this.scrollStep = 10;

		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;

		this.customVisible = ('customVisible' in props) ? props.customVisible : 1;
		this.customOverall = ('customOverall' in props) ? props.customOverall : 10;
		this.callback = ('callback' in props) ? props.callback : null;

		this.color = ('color' in props) ? props.color : '#efefef';
		this.scrollBarColor = ('scrollBarColor' in props) ? props.scrollBarColor : '#7f7f7f';

		this.scrollBarY1 = 0;
		this.scrollBarY2 = this.getscrollBarHeight() - 1;
		this.scrollBarHeight = this.scrollBarY2 - this.scrollBarY1 + 1;

		this.scrollBarCaptured = false;
		this.scrollBarCaptureY = -1;
		this.scrollBarCaptureScreenY = -1;

		this.draw();

		this.canvas.addEventListener('mousedown', function(e) {
			if( !this.isScrollable() ) return;

			if( e.offsetY >= this.scrollBarY1 && e.offsetY <= this.scrollBarY2 ) {
				this.scrollBarCaptured = true;
				this.scrollBarCaptureY = e.offsetY;
				this.scrollBarCaptureScreenY = e.screenY;
				document.addEventListener('mouseup', mouseUpListener );
				document.addEventListener('mousemove', mouseMoveListener );
				return;
			}

			let newScrollBarY1;
			let newScrollBarY2;
			if( e.offsetY > this.scrollBarY2 ) {
				newScrollBarY1 = this.scrollBarY1 + this.scrollStep;
				newScrollBarY2 = this.scrollBarY2 + this.scrollStep;
			} else {
				newScrollBarY1 = this.scrollBarY1 - this.scrollStep;
				newScrollBarY2 = this.scrollBarY2 - this.scrollStep;
			}
			if( newScrollBarY1 < 0 ) {
				newScrollBarY1 = 0;
				newScrollBarY2 = this.scrollBarHeight - 1;
			}
			if( newScrollBarY2 >= this.h ) {
				newScrollBarY2 = this.h - 1;
				newScrollBarY1 = newScrollBarY2 - this.scrollBarHeight + 1;
			}
			let callback = (newScrollBarY1 != this.scrollBarY1) ? true : false;
			this.scrollBarY1 = newScrollBarY1;
			this.scrollBarY2 = newScrollBarY2;
			this.draw();
			
			if( callback && this.callback ) {
				this.callback( this.getCustomPosition() );
			}			
		}.bind(this));


		const mouseUpListener = function(e) { 
			document.removeEventListener('mouseup', mouseUpListener);
			document.removeEventListener('mousemove', mouseMoveListener);
			this.scrollBarCaptured = false;
		}.bind(this);

		const mouseMoveListener = function(e) {
			if( !this.isScrollable() || !this.scrollBarCaptured ) return;

			let deltaY = e.screenY - this.scrollBarCaptureScreenY;
			let newScrollBarY1 = this.scrollBarY1 + deltaY;
			if( newScrollBarY1 < 0 ) {
				newScrollBarY1 = 0;
			} else if( newScrollBarY1 > this.h - this.scrollBarHeight ) {
				newScrollBarY1 = this.h - this.scrollBarHeight;
			}
			let callback = ( this.scrollBarY1 !== newScrollBarY1 ) ? true : false;
			this.scrollBarY1 = newScrollBarY1;
			this.scrollBarY2 = newScrollBarY1 + this.scrollBarHeight - 1;
			this.scrollBarCaptureScreenY = e.screenY;
			this.draw();

			if( callback && this.callback ) {
				this.callback( this.getCustomPosition() );
			}
		}.bind(this);

		this.canvas.addEventListener('mousemove', mouseMoveListener );
	};

	isScrollable() {
		return !( this.scrollBarHeight <= 0 || (this.scrollBarY1 <= 0 && this.scrollBarY2 <= 0) );
	}

	getCustomPosition() {
		let cp = (this.customOverall - this.customVisible) * this.scrollBarY1 / (this.h - this.scrollBarHeight);
		return cp;
	}

	setCustomPosition( cp ) {
		let y = cp * (this.h - this.scrollBarHeight) / (this.customOverall - this.customVisible); 
		if( y < 0 ) {
			y = 0;
		} else {
			let maxY = this.h - this.scrollBarHeight;
			if( y > maxY ) {
				y = maxY;
			}
		}
		let isRedraw = true; //(this.scrollBarY1 !== y) ? true : false;
		if( isRedraw ) {
			this.scrollBarY1 = y;
			this.scrollBarY2 = y + this.scrollBarHeight - 1;
			this.draw();
		}
		return (isRedraw) ? this.getCustomPosition() : null;
	}
	
	setCustomDimensions( customVisible, customOverall ) {
		let curCustomPos = (this.customOverall - this.customVisible) * this.scrollBarY1 / (this.h - this.scrollBarHeight);
		if( curCustomPos < 0.0 ) {
			curCustomPos = 0.0;
		} else {
			curCustomPos = Math.round(curCustomPos);
		}

		this.customVisible = customVisible;
		this.customOverall = customOverall;
		this.scrollBarHeight = this.getscrollBarHeight();
		let newY1;
		let diff = this.customOverall - this.customVisible;
		if( diff > 0 ){
			newY1 = (curCustomPos / (this.customOverall - this.customVisible)) * (this.h - this.scrollBarHeight);
		} else {
			newY1 = 0.0;
		}
		this.scrollBarY1 = newY1;
		this.scrollBarY2 = this.scrollBarY1 +	this.scrollBarHeight - 1;
		this.draw();
	}
	
	changeHeight( h, customVisible = null ) {
		let oldH = this.h;
		this.h = h;

		this.canvas.initDims(this.x, this.y, this.w, this.h);

		this.customVisible = ( customVisible !== null) ? customVisible : h;

		let oldScrollBarHeight = this.scrollBarHeight;
		this.scrollBarHeight = this.calcScrollBarHeight();

		this.scrollBarY1 = this.scrollBarY1 * (this.h - this.scrollBarHeight) / (oldH - oldScrollBarHeight);
		this.scrollBarY2 = this.scrollBarY1 +	this.scrollBarHeight - 1;
		this.draw();
	}


	getscrollBarHeight() {
		if( !(this.customVisible < this.customOverall) ) {
			return 0;
		}
		let h = (this.customVisible / this.customOverall) * this.h;
		if( h < 4 ) {
			h = 4;
		}
		return h;
	}

	draw() {
		this.canvas.drawRect( 0, 0, this.w, this.h, { fillStyle: this.color } );

		if(this.customVisible < this.customOverall) {
			this.canvas.drawRect( 0, this.scrollBarY1, this.w, this.scrollBarHeight, { fillStyle: this.scrollBarColor } );
		}
	}

};