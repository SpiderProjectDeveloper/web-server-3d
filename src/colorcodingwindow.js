import { TooltipWindow } from './tooltipwindow';

export class ColorCodingWindow {
	constructor( data, options={} ) {
		this.data = data;
		this.windowTitle = ('windowTitle' in options) ? options.windowTitle : '&nbsp;&nbsp;&nbsp;&nbsp;'
		this.msgUnavailable = ('msgUnavailable' in options) ? 
			options.msgUnavailable : 'No color coding is specified for any work type!';

		this.tooltipWindow = new TooltipWindow( null, 
			{ title:this.windowTitle, x:Math.floor( window.innerWidth/10), y:Math.floor( window.innerHeight/4) }
		);
	}

	show = function() {
		if( !this.tooltipWindow.isHidden() ) {
			this.tooltipWindow.hide();
			return;
		}
		if( !this.data.types || this.data.types.length === 0 ) {
			this.tooltipWindow.show(this.msgUnavailable);
			return;
		}

		let message = '';
		for( let item of this.data.types ) {
			let t = item['Type'];
			let colorNum = this.data._typeColorMap[t];

			let color = '#' +  colorNum.toString(16).padStart(6, '0'); // (c&0x0000ff)*256*256 + ((c&0x00ff00)>>8)*256 + ((c&0xff0000)>>16);
			let name = item['TypeName'];
			message += `<span style='padding-right:6px; letter-spacing: -4px; background-color:white; color: ${color}'>❚❚❚❚</span> ${name}<br/>`;
		}

		this.tooltipWindow.show( message );
	}
}