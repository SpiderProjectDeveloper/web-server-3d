import { Canvas } from './canvas';

export class HScroll {

	changeWidth2(w, redraw=true) {
		let customPosition = this.getCustomPosition();		
		
		this.w = w;
		this.canvas.initDims(this.x, this.y, this.w, this.h);

		this.scrollBarWidth = this.calcScrollBarWidth();
		this.scrollBarX1 = this.setCustomPosition( customPosition );
		this.scrollBarX2 = this.scrollBarX1 + this.scrollBarWidth - 1;

		if( redraw ) {
			this.draw();
		}
	}

	constructor(parent, x, y, w, h, props={}) {
		this.props = props;

		this.canvas = new Canvas(parent, x, y, w, h );
		this.canvas.getCanvas().style.cursor = 'pointer';

		this.scrollStep = 10;

		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;

		this.customPosition = 0;

		this.customVisible = ('customVisible' in props) ? props.customVisible : w;
		this.customOverall = ('customOverall' in props) ? props.customOverall : w;
		this.callback = ('callback' in props) ? props.callback : null;

		this.color = ('color' in props) ? props.color : '#efefef';
		this.scrollBarColor = ('scrollBarColor' in props) ? props.scrollBarColor : '#4f4f4f';

		this.scrollBarWidth = this.calcScrollBarWidth();
		this.scrollBarX1 = 0;
		this.scrollBarX2 = this.scrollBarWidth - 1;

		this.scrollBarCaptured = false;
		this.scrollBarCaptureX = -1;
		this.scrollBarCaptureScreenX = -1;
		this.draw();

		this.canvas.addEventListener('mousedown', function(e) {
			if( this.scrollBarWidth <= 0 ) {
				return;
			}
			if( e.offsetX >= this.scrollBarX1 && e.offsetX <= this.scrollBarX2 ) {
				this.scrollBarCaptured = true;
				this.scrollBarCaptureX = e.offsetX;
				this.scrollBarCaptureScreenX = e.screenX;
				document.addEventListener('mouseup', mouseUpListener );
				document.addEventListener('mousemove', mouseMoveListener );
				return;
			}

			let newScrollBarX1;
			let newScrollBarX2;
			if( e.offsetX > this.scrollBarX2 ) {
				newScrollBarX1 = this.scrollBarX1 + this.scrollStep;
				newScrollBarX2 = this.scrollBarX2 + this.scrollStep;
			} else {
				newScrollBarX1 = this.scrollBarX1 - this.scrollStep;
				newScrollBarX2 = this.scrollBarX2 - this.scrollStep;
			}
			if( newScrollBarX1 < 0 ) {
				newScrollBarX1 = 0;
				newScrollBarX2 = this.scrollBarWidth - 1;
			}
			if( newScrollBarX2 >= this.w ) {
				newScrollBarX2 = this.w - 1;
				newScrollBarX1 = newScrollBarX2 - this.scrollBarWidth + 1;
			}
			let callback = (newScrollBarX1 != this.scrollBarX1) ? true : false;
			this.scrollBarX1 = newScrollBarX1;
			this.scrollBarX2 = newScrollBarX2;
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
			if( !this.scrollBarCaptured ) {
				return;
			}
			if( this.scrollBarWidth <= 0 ) {
				return;
			}
			let deltaX = e.screenX - this.scrollBarCaptureScreenX;
			let newScrollBarX1 = this.scrollBarX1 + deltaX;
			if( newScrollBarX1 < 0 ) {
				newScrollBarX1 = 0;
			} else if( newScrollBarX1 > this.w - this.scrollBarWidth ) {
				newScrollBarX1 = this.w - this.scrollBarWidth;
			}
			let callback = ( this.scrollBarX1 != newScrollBarX1 ) ? true : false;
			this.scrollBarX1 = newScrollBarX1;
			this.scrollBarX2 = newScrollBarX1 + this.scrollBarWidth - 1;
			this.scrollBarCaptureScreenX = e.screenX;
			this.draw();

			if( callback && this.callback ) {
				this.callback( this.getCustomPosition() );
			}
		}.bind(this);

		this.canvas.addEventListener('mousemove', mouseMoveListener );
	};

	getCustomPosition() {
		this.customPosition = (this.customOverall - this.customVisible) * this.scrollBarX1 / (this.w - this.scrollBarWidth)
		return this.customPosition;
	}

	setCustomPosition( customPosition ) {
		this.customPosition = customPosition;
		this.scrollBarX1 = customPosition * (this.w - this.scrollBarWidth) / (this.customOverall - this.customVisible); 
		return this.scrollBarX1;
	}

	setCustomDimensions( customVisible, customOverall, redraw=true ) {
		if( customVisible !== null ) {
			this.customVisible = customVisible;
		}
		if( customOverall !== null ) {
			this.customOverall = customOverall;
		}
		this.scrollBarWidth = this.calcScrollBarWidth();
		this.scrollBarX2 = this.scrollBarX1 +	this.scrollBarWidth - 1;
		if( redraw ) {
			this.draw();
		}
	}

	setHorizDims( x = null, w = null, customVisible = null ) {
		//console.log('before:', this.x, this.y, this.w, this.h);
		let oldW = this.w;
		if( w !== null ) {
			this.w = w;
		}
		if( x !== null ) {
			this.x = x;
		}
		this.canvas.initDims(this.x, this.y, this.w, this.h);
		//console.log('after:', this.x, this.y, this.w, this.h);

		if( w !== null || customVisible !== null ) {
			this.customVisible = (customVisible !== null) ? customVisible : ((w !== null) ? w : this.customVisible);

			let oldScrollBarWidth = this.scrollBarWidth;
			this.scrollBarWidth = this.calcScrollBarWidth();

			this.scrollBarX1 = this.scrollBarX1 * (this.w - this.scrollBarWidth) / (oldW - oldScrollBarWidth);
			this.scrollBarX2 = this.scrollBarX1 +	this.scrollBarWidth - 1;
		}
		this.draw();
	}

	changeWidth( w, customVisible = null ) {
		this.setHorizDims( null, w, customVisible );
	}

	calcScrollBarWidth() {
		if( !(this.customVisible < this.customOverall) ) {
			return 0;
		}
		let w = (this.customVisible / this.customOverall) * this.w;
		if( w < 4 ) {
			w = 4;
		}
		return w;
	}

	draw() {
		this.canvas.drawRect( 0, 0, this.w, this.h, { fillStyle: this.color } );

		if(this.customVisible < this.customOverall) {
			this.canvas.drawRect( this.scrollBarX1, 0, this.scrollBarWidth, this.h, { fillStyle: this.scrollBarColor } );
		}
	}

	scrollLeft( stepX ) {
		if( this.scrollBarWidth <= 0 ) {
			return;
		}
		let newScrollBarX1 = this.scrollBarX1 + stepX;
		let newScrollBarX2 = this.scrollBarX2 + stepX;
		if( newScrollBarX2 >= this.w ) {
			newScrollBarX2 = this.w - 1;
			newScrollBarX1 = newScrollBarX2 - this.scrollBarWidth + 1;
		}
		let callback = (newScrollBarX1 != this.scrollBarX1) ? true : false;
		this.scrollBarX1 = newScrollBarX1;
		this.scrollBarX2 = newScrollBarX2;
		this.draw();
		
		if( callback && this.callback ) {
			this.callback( this.getCustomPosition() );
		}			
	}
}