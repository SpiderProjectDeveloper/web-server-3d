import { TooltipWindow } from './tooltipwindow'
import './checklistwindow.css';

export class CheckListWindow extends TooltipWindow {
	
	checkList = [];
	containerDiv = null;

	constructor( parentDiv = null, settings={} ) {
		let checkList = [];
		//settings.okButton = { callback: function(arg) { callback(arg); }, arg: checkList };
		super( parentDiv, settings )

		this.checkList = checkList;

		this.containerDiv = document.createElement('div');
		this.containerDiv.className = 'checklistwindow-container';
	}

	clear() {
		this.checkList = [];
	}

	add(id, title, checked=false) {
		this.checkList.push( [ id, title, checked ] );
	}

	show( x=null, y = null, w = null, h = null ) {
		while( this.containerDiv.hasChildNodes() ) {
			this.containerDiv.removeChild( this.containerDiv.lastChild );
		}

		for( let item of this.checkList ) {
			let div = document.createElement('div');
			div.className = 'checklistwindow-item-container';
			
			let checkboxElem = document.createElement('input');
			checkboxElem.type = 'checkbox';
			checkboxElem.className = 'checklistwindow-item-checkbox';
			checkboxElem.checked = item[2];
			checkboxElem.onchange = function(e) {
				item[2] = checkboxElem.checked;
			} 
			div.appendChild(checkboxElem);
	
			let titleElem = document.createElement('div');
			titleElem.className = 'checklistwindow-item-title';
			titleElem.innerHTML = item[1];
			div.appendChild(titleElem);
	
			this.containerDiv.appendChild(div);
		}

		super.show( this.containerDiv, x, y, w, h );
	}
}