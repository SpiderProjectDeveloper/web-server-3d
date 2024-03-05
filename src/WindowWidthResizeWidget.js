
export class WindowWidthResizeWidget {

	constructor( parent, side, callback ) 
	{
		let sizeToolDiv = document.createElement('div');
		sizeToolDiv.style.position = 'absolute';
		sizeToolDiv.style.cursor = 'pointer';
		if( side === -1 || side === 'left') {
			sizeToolDiv.style.left = -5+'px';
		} else {
			sizeToolDiv.style.right = -5+'px';
		}
		let bbox = parent.getBoundingClientRect();
		sizeToolDiv.style.top = Math.round(bbox.height/2) + 'px';
		sizeToolDiv.innerHTML = (side === -1) ? '❮' : '❯'; // 'ᐊ'; //'🡰';
		
		parent.appendChild(sizeToolDiv);

		sizeToolDiv.addEventListener( 
			'mousedown', 
			function(e) {
				let previousX = e.screenX

				const onMouseMove = function(e) {					
					let dx = e.screenX - previousX;
					let left = parseInt(parent.style.left);
					let width = parseInt(parent.style.width);
					if( side === -1 ) {
						left += dx;
						width -= dx;
						parent.style.left = left + 'px'; 
						parent.style.width = width + 'px'; 
					} else {
						width += dx;
						parent.style.width = width + 'px'; 
					}
					previousX = e.screenX;
					callback(width);
				}

				const onMouseUp = function(e) {
					document.body.removeEventListener( 'mousemove', onMouseMove );
					document.body.removeEventListener( 'mouseup', onMouseUp );
				} 

				document.body.addEventListener( 'mousemove', onMouseMove );
				document.body.addEventListener( 'mouseup', onMouseUp );		
			}
		);
	}
}