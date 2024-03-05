import { IFCWALL, IFCWALLSTANDARDCASE, IFCDOOR, IFCWINDOW } from 'web-ifc';

export function initTypesList(typesListWindow) {
	typesListWindow.add(IFCWALL, 'Wall', true);
	typesListWindow.add(IFCWALLSTANDARDCASE, 'Wall Standard Case', true);
	typesListWindow.add(IFCDOOR, 'Door', true);
	typesListWindow.add(IFCWINDOW, 'Window', true);
}

export function createAlphaTexture( i, n, w=10, h=10 ) {
		let canvas = document.createElement("canvas");
		canvas.width = w;
		canvas.height = h;
	
		var ctx = canvas.getContext("2d");
	
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, w/2, h/2);
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(w/2, 0, w/2, h/2);
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, h/2, w/2, h/2);
		ctx.fillStyle = '#000000';
		ctx.fillRect(w/2, h/2, w/2, h/2);
		return canvas; //canvas.toDataURL();
	
	
	var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	let step = 1;
	let skipRate = Math.floor(pct*10);
	let drawRate=null;
	for( let x = 0 ; x < imageData.width ; x += step ) {
		for( let y = 0 ; y < imageData.height ; y += step ) {
			if( skipRate !== null ) {
				if( x % skipRate == 0 && y % skipRate == 0 ) {
					continue;
				}
			}
			if( drawRate !== null ) {
				if( x % drawRate == 0 && y % drawRate == 0 ) {
					continue;
				}
			}	
			var offset = (y * imageData.width + x) * 4;
			imageData.data[offset+0]=255;
			imageData.data[offset+1]=255;
			imageData.data[offset+2]=255;
			imageData.data[offset + 3] = 0;
		}
	}
	ctx.putImageData(imageData, 0, 0);
	return canvas.toDataURL();
}