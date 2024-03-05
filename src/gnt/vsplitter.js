export class VSplitter {

	recalculateMaxLeft() {
		let r = this.parent.getBoundingClientRect();
		this.maxLeft = r.right - r.left - this.w + 1;	
	}

	constructor( parent, x, y, w, h, props={} ) {
		this.parent = parent;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;

		this.div = document.createElement('div');
		this.div.style.position = 'absolute';
		this.div.style.width = w + 'px';
		this.div.style.height = h + 'px';
		this.div.style.left = x + 'px';
		this.div.style.top = y + 'px';

		this.div.style.cursor = 'pointer';

		this.minLeft = ('minLeft' in props) ? props.minLeft : 0;
		if('maxLeft' in props) {
			this.maxLeft = props.maxLeft-w;
		} else {
			let r = parent.getBoundingClientRect();
			this.maxLeft = r.right - r.left - w + 1;
		} 

		this.callback = ('callback' in props ) ? props.callback : null;

		this.backgroundColor = ('backgroundColor' in props) ? props.backgroundColor : '#efefef';
		this.mouseOverColor = ('mouseOverColor' in props) ? props.mouseOverColor : '#dfdfdf';

		this.div.style.backgroundColor = this.backgroundColor;

		this.captureScreenX = -1;

		this.div.onmouseover = function(e) {
			this.div.style.backgroundColor = this.mouseOverColor;
		}.bind(this);

		this.div.onmouseout = function(e) {
			this.div.style.backgroundColor = this.backgroundColor;
		}.bind(this);


		this.div.onmousedown = function(e) {
			this.captureScreenX = e.screenX;
			document.addEventListener('mouseup', mouseUpListener );
			document.addEventListener('mousemove', mouseMoveListener );
		}.bind(this);

		const mouseUpListener = function(e) {
			if( this.captureScreenX < 0 ) {
				return;
			}
			document.removeEventListener('mouseup', mouseUpListener);
			document.removeEventListener('mousemove', mouseMoveListener);
			this.captureScreenX = -1;
		}.bind(this);

		const mouseMoveListener = function(e) {
			if( this.captureScreenX < 0 ) {
				return;
			}
			let deltaX = e.screenX - this.captureScreenX;
			let curLeft = parseInt( this.div.style.left );
			let newLeft = curLeft + deltaX;
			if( newLeft < this.minLeft ) {
				newLeft = this.minLeft;
			} else if( newLeft > this.maxLeft ) {
				newLeft = this.maxLeft;
			}
			let callback = (newLeft != curLeft) ? true : false;

			this.div.style.left = newLeft + 'px';
			this.captureScreenX = e.screenX;

			if( callback && this.callback ) {
				this.callback(newLeft);
			}

		}.bind(this);

		parent.appendChild(this.div);
	}
}