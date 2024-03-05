export class Canvas {

	initDims(x, y, w, h, scale='auto') {		
		if( scale === 'auto' ) {
			let dpr = window.devicePixelRatio || 1;

			let bsr = this.context.webkitBackingStorePixelRatio || this.context.mozBackingStorePixelRatio || 
				this.context.msBackingStorePixelRatio || this.context.oBackingStorePixelRatio || this.context.backingStorePixelRatio || 1;
			scale = dpr / bsr;
			scale = dpr;
		}
		this.canvas.width = w * scale;
		this.canvas.height = h * scale;

		this.x = x;
		this.y = y;
		this.w = this.canvas.width;
		this.h = this.canvas.height;
		this.styleW = w;
		this.styleH = h;

		this.canvas.style.width = w+'px';
		this.canvas.style.height = h+'px';
		this.canvas.style.position = 'absolute';
		this.canvas.style.left = x+'px';
		this.canvas.style.top = y+'px';
	}

	constructor(parent, x, y, w, h, props={} ) {
		this.canvas = document.createElement("canvas");
		this.context = this.canvas.getContext("2d");

		this.initDims(x, y, w, h);

		parent.appendChild(this.canvas);


		this.getContext = function() {
			return this.context;
		};

		this.getCanvas = function() {
			return this.canvas;
		}

		// 
		// mousedown, rmousedown, mouseover: [  { x1: , y1: , x2: , y2: , cb:, arg: , rb: } ]
		this.callbacks = { mouseover:[], mousedown:[] };
		this.currentlyOver = null;

		this.canvasCapture = ('canvasCapture' in props);
		this.allowEmbeddedListeners = ('allowEmbeddedListeners' in props && props.allowEmbeddedListeners);
		this.captureX = -1;
		this.captureY = -1;

		this.addSysListeners();
	}

	addSysListeners() {		
		if( !this.allowEmbeddedListeners && !this.canvasCapture ) {
			return;
		}

		this.canvas.addEventListener( 'mousemove', function( e ) {
			if( this.captureX !== -1 || this.captureY !== -1 ) {
				return;
			}
			if( this.currentlyOver !== null && this.callbacks.mouseover.length > this.currentlyOver ) {
				let cb = this.callbacks.mouseover[this.currentlyOver];
				if( e.offsetX >= cb.x1 && e.offsetX <= cb.x2 && e.offsetY >= cb.y1 && e.offsetY <= cb.y2 ) {
					return;
				}
				cb.cb( cb.arg, e, false );
				this.currentlyOver = null;
			}
			for( let i = 0 ; i < this.callbacks.mouseover.length ; i++ ) {
				let cb = this.callbacks.mouseover[i];
				if( e.offsetX >= cb.x1 && e.offsetX <= cb.x2 && e.offsetY >= cb.y1 && e.offsetY <= cb.y2 ) {
					cb.cb(cb.arg, e, true);
					this.currentlyOver = i;
					break;
				}
			}
		}.bind(this));

		this.canvas.addEventListener( 'mousedown', function( e ) {
			if( this.captureX !== -1 || this.captureY !== -1 ) {
				return;
			}
			e = e || window.event;
			let rb = ( e.which === 3 ) ? true : false;
			let numCb = this.callbacks.mousedown.length - 1;
			if( this.canvasCapture ) {
				numCb++;
			}
			for( let i = 0 ; i <= numCb ; i++ ) {
				let cb;
				if(i === numCb && this.canvasCapture) { 
					cb = { cb: this.canvasCapture, arg: this.canvasCaptureArg, isCapturable:true, 
						x1:0, y1:0, x2:window.innerWidth, y2:window.innerHeight };
				} else {
						cb = this.callbacks.mousedown[i];
						//console.log('cb',cb);
					}
				if( !(e.offsetX >= cb.x1 && e.offsetX <= cb.x2 && e.offsetY >= cb.y1 && e.offsetY <= cb.y2) ) {
					continue;
				}

				if( !cb.isCapturable ) {
					cb.cb(cb.arg, e, rb);
					break;
				}

				this.captureX = e.screenX;
				this.captureY = e.screenY;
				this.captureRectX1 = cb.x1;
				this.captureRectY1 = cb.y1;

				const mouseMoveListener = function(e) {
					let deltaX = e.screenX - this.captureX;
					let deltaY = e.screenY - this.captureY;
					this.captureRectX1 += deltaX;
					this.captureRectY1 += deltaY;	
					this.captureX = e.screenX;
					this.captureY = e.screenY;
					cb.cb( cb.arg, deltaX, deltaY, this.captureRectX1, this.captureRectY1, true );
				}.bind(this);

				const mouseUpListener = function(e) {
					document.removeEventListener('mouseup', mouseUpListener );
					document.removeEventListener('mousemove', mouseMoveListener );
					this.captureX = -1;
					this.captureY = -1;
					cb.cb( cb.arg, 0, 0, this.captureRectX1, this.captureRectY1, false );
				}.bind(this);

				document.addEventListener( 'mouseup', mouseUpListener );
				document.addEventListener( 'mousemove', mouseMoveListener );
				break;
			}
		}.bind(this));
	}

	addEventListener( ...args ) {
		if( args.length == 2 ) {
			let [ eventName, callback ] = args;
			this.canvas.addEventListener( eventName, callback );
			return;
		}

		let [ eventName, x, y, w, h, cb, arg ] = args;
		let isCapturable = (args.length === 8 && args[7]) ? true : false;  
		if( eventName in this.callbacks ) {
			this.callbacks[eventName].push( { x1: x, y1: y, x2: (x + w - 1), y2: (y + h - 1), cb: cb, arg: arg, isCapturable: isCapturable } );
		}
	}

	removeAllListeners() {
		this.callbacks.mousedown = [];
		this.callbacks.mouseover = [];
	}


	// props.callbacks = [ { event: 'mousedown', cb: callback_function, arg: 100 } ] 
	drawRect( x, y, w, h, props={} ) {
		if( 'mousedown' in props ) {
			this.addEventListener( 'mousedown', x, y, w, h, props.mousedown, props.mousedownArg );
		}
		if( 'mouseover' in props ) {
			this.addEventListener( 'mouseover', x, y, w, h, props.mouseover, props.mouseoverArg );
		}
		if( 'capture' in props ) {
			this.addEventListener( 'mousedown', x, y, w, h, props.capture, props.captureArg, true );
		}

		let ctx = this.context;
		ctx.fillStyle = ( 'fillStyle' in props ) ? props.fillStyle : '#dfdfdf';
	
		if( 'opacity' in props ) {
			ctx.globalAlpha = props.opacity;
		}
		
		ctx.fillRect(x, y, w, h);
	
		if( 'strokeStyle' in props || 'lineWidth' in props ) {
			ctx.lineWidth = ('lineWidth' in props ) ? props.lineWidth : 1;
			ctx.strokeStyle = ('strokeStyle' in props) ? props.strokeStyle : '#dfdfdf';
			ctx.strokeRect(x+ctx.lineWidth/2, y+ctx.lineWidth/2, w-ctx.lineWidth, h-ctx.lineWidth);
		}

		if( 'opacity' in props ) {
			ctx.globalAlpha = 1.0;
		}	
	};
	
	drawRhomb( x, top, height, props ) {
		props.closed = true;
		return this.drawPolygon( this.calcRhombCoords(x, top, height), { props } );
	}
	
	calcRhombCoords( x, top, height ) {
		let inc = 2;
		top -= inc;
		height += inc*2;
		let halfWidth = Math.floor(height / 2.0);
		let halfHeight = halfWidth;
		let points = [ x - halfWidth, top + halfHeight, x, top, x + halfWidth,  top + halfHeight, x, top + height ];
		return points;
	}
	
	
	drawPolygon( points, props ) {
		let ctx = this.context;
	
		ctx.lineWidth = ('lineWidth' in props) ? props.lineWidth : 1;
		ctx.strokeStyle = ('strokeStyle' in props) ? props.strokeStyle : '#4f4f4f';	
		ctx.fillStyle = ('fillStyle' in props) ? props.fillStyle : ( ('fill' in props) ? props.fill : '#4f4f4f' );	
		ctx.setLineDash( ('lineDash' in props) ? props.lineDash : [] );
	
		ctx.beginPath();       
		ctx.moveTo(points[0], points[1]);   
		for( let i = 2 ; i < points.length ; i+= 2) {
			ctx.lineTo(points[i], points[i+1]); 
		}
		if( 'closed' in props && props.closed ) {
			ctx.closePath();
		}
		ctx.stroke();
		ctx.fill(); 
	}
	
	drawCircle( x, y, r, props ) {
		let ctx = this.context;

		ctx.lineWidth = ('lineWidth' in props) ? props.lineWidth : 1;
		ctx.strokeStyle = ('strokeStyle' in props) ? props.strokeStyle : '#4f4f4f';	
		ctx.setLineDash( ('lineDash' in props) ? props.lineDash : [] );
	
		ctx.beginPath();
		ctx.arc(x, y, r, 0, 2 * Math.PI);
		ctx.stroke();	
		if( 'fillStyle' in props ) {
			ctx.fillStyle = props.fillStyle;
			ctx.fill();
		}
	}
	
	drawLine( x1, y1, x2, y2, props ) {
		let ctx = this.context;
	
		ctx.lineWidth = ('lineWidth' in props) ? props.lineWidth : 1;
		ctx.strokeStyle = ( 'strokeStyle' in props ) ? props.strokeStyle : '#4f4f4f';	
		ctx.setLineDash( ('lineDash' in props) ? props.lineDash : [] );
		ctx.beginPath();       
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();         
	}
	
	drawArrow( x1, y1, x2, y2, props ) {
		let ctx = this.context;
	
		ctx.lineWidth = ('lineWidth' in props) ? props.lineWidth : 1;
		ctx.strokeStyle = ( 'strokeStyle' in props ) ? props.strokeStyle : '#4f4f4f';	
		ctx.fillStyle = ( 'fillStyle' in props ) ? props.fillStyle : '#4f4f4f';
		ctx.setLineDash( ('lineDash' in props) ? props.lineDash : [] );
	
		let head = ( 'head' in props ) ? props.head : 10;
		var dx = x2 - x1;
		var dy = y2 - y1;
		var angle = Math.atan2(dy, dx);
		if( !('fillStyle' in props ) ) {
			ctx.beginPath();       
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
			ctx.moveTo(x2, y2);
			ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
			ctx.stroke();         
		} else {
			ctx.beginPath();       
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
			ctx.beginPath(); 
			ctx.moveTo(x2, y2);
			ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
			ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
			//ctx.lineTo(x2, y2);
			ctx.fill();	
		}
		ctx.closePath();       
	}	
	
	drawText( x, y, w, h, text, props={} ) {
		if( 'mousedown' in props ) {
			this.addEventListener( 'mousedown', x, y, w, h, props.mousedown, props.mousedownArg );
		}
		if( 'mouseover' in props ) {
			this.addEventListener( 'mouseover', x, y, w, h, props.mouseover, props.mouseoverArg );
		}
		if( 'capture' in props ) {
			this.addEventListener( 'mousedown', x, y, w, h, props.capture, props.captureArg, true );
		}

		let ctx = this.context;
	
		let noClip = ('noClip' in props && props.noClip) ? true : false;
		let fillRect = 'bkgrFill' in props;
		let strokeRect = 'strokeStyle' in props;
		if( fillRect || strokeRect ) {
			let opacity = 'opacity' in props;
			if( opacity ) {
				ctx.globalAlpha = props.opacity;
			}
			if( fillRect ) {
				ctx.fillStyle = props.bkgrFill;
				ctx.fillRect(x, y, w, h);	
			}
			if( strokeRect ) {
				ctx.strokeStyle = props.strokeStyle;
				ctx.lineWidth = ('lineWidth' in props) ? props.lineWidth : 1; 
				ctx.strokeRect(x, y, w, h);
			}
			if( opacity ) {
				ctx.globalAlpha = 1.0;
			}
		}
		
		let fontSize = (props.fontSize) ? ( (typeof(props.fontSize) === 'number') ? (props.fontSize+'px') : props.fontSize ) :'10px';
		ctx.font = fontSize + " Arial";
		
		if( 'fillStyle' in props ) {
			ctx.fillStyle = props.fillStyle;
		}
		ctx.textAlign = ( 'textAlign' in props ) ? props.textAlign : 'left';
		ctx.textBaseline = ('textBaseline' in props) ? props.textBaseline : 'hanging';

		if( w === null || h === null ) {
			ctx.fillText(text, x, y);
			return;			
		}

		let xPadding = ('xPadding' in props) ? props.xPadding : 0;
		let yPadding = ('yPadding' in props) ? props.yPadding : 0;

		if( !noClip ) {
			ctx.save();
			ctx.beginPath();
			ctx.rect(x + xPadding, y + yPadding, w - 2 * xPadding, h - 2 * yPadding);
			ctx.clip();
		}	

		let textX;
		if( ctx.textAlign === 'left' ) {
			textX = x + xPadding;
		} else if( ctx.textAlign === 'right' ) {
			textX = x + w - 2 * xPadding;
		} else { 	// "middle"
			textX = x + (w - 2 * xPadding)/2;
		}

		let textY;
		if( ctx.textBaseline === 'hanging' ) {
			textY = y + yPadding;
		} else if( ctx.textBaseline === 'bottom' ) {
			textY = y + h - yPadding;
		} else { 	// middle
			textY = y + h/2;
		}
	
		if( props.wrap ) {
			let words = text.split(' ');
			let curY = textY;
			let textChunk = '';
			for( let i = 0 ; i < words.length ; i++ ) {
				let space = (textChunk.length > 0) ? ' ' : '';
				let textChunkWidth = ctx.measureText( textChunk + space + words[i] ).width;
				if( textChunkWidth > w ) {
					if( textChunk.length === 0 ) {
						ctx.fillText(words[i], textX, curY);
						textChunk = '';
					} else {
						ctx.fillText(textChunk, x, curY);
						textChunk = words[i];
					}
					curY += parseInt(fontSize) + 2;
				} else {
					textChunk += space + words[i];
				}
			}
			if( textChunk.length > 0 ) {
				ctx.fillText(textChunk, textX, curY);
			}
		}
		else {
			ctx.fillText(text, textX, textY);
		}
		if( !noClip ) {		
			ctx.restore();
		}
	}	
}
