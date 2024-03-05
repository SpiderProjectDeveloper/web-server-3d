import { ContextMenu } from "./contextmenu";
import { addEntry, formatCheckedDiv } from './ifctreeview-helpers';

export class IFCTreeView {
	bgColor = null;
	pickColor = null;
	checkColor = null;

	expandText = '&nbsp;&plus;';
	collapseText = '&nbsp;&minus;';
	unexpandableText = '&nbsp;&nbsp;';

	hierarchyMargin = 8;

	containerDiv = null;
	rootDiv = null;	

	props = {};

	idMap = {};
	pickedExpressId = null;

	filteredByType = null;
	filteredByTypeParent = null;

	contextMenu = null; 

	typesMap = {};

	constructor( containerDiv, rootNode, options = {} ) {
		if( containerDiv.children.length > 0 ) {
			while( containerDiv.hasChildNodes() ) {
				containerDiv.removeChild(containerDiv.lastChild);
			}
		}
		this.containerDiv = containerDiv;
		this.rootNode = rootNode;
		this.options = options;
		if( 'bgColor' in options ) {
			let c = options.bgColor;
			this.bgColor = `rgb( ${(c & 0xff0000)>>16}, ${(c & 0x00ff00)>>8}, ${(c & 0x0000ff)})`;
		} else {
			this.bgColor = '#ffffff';
		}
		if( 'pickColor' in options ) {
			let c = options.pickColor;
			this.pickColor = `rgba( ${(c & 0xff0000)>>16}, ${(c & 0x00ff00)>>8}, ${(c & 0x0000ff)}, 0.5)`;
		} else {
			this.pickColor = '#ff88ff';
		}
		if( 'checkColor' in options ) {
			let c = options.checkColor;
			this.checkColor = `rgba( ${(c & 0xff0000)>>16}, ${(c & 0x00ff00)>>8}, ${(c & 0x0000ff)}, 0.5)`;
		} else {
			this.checkColor = '#ffff88';
		}
		this.pickCallback = options.pickCallback;
		this.checkIsAllowedCallback = (options.checkIsAllowedCallback) ? options.checkIsAllowedCallback : null;
		this.checkCallback = (options.checkCallback) ? options.checkCallback : null;
		this.getItemInfoCallback = options.getItemInfoCallback;
		this.getItemNameCallback = options.getItemNameCallback;
		this.getItemPropertiesCallback = options.getItemPropertiesCallback;
		this.filterByIdsCallback = (options.filterByIdsCallback) ? (options.filterByIdsCallback) : null;
		this.showAllCallback = (options.showAllCallback) ? (options.showAllCallback) : null;
		this.messageCallback = (options.messageCallback) ? options.messageCallback : null; 
		this.contextMenu = new ContextMenu( { fontSize: '12px'} );

		this.rootDiv = addEntry( this, null, rootNode );
	}

	highlightPicked( expressId ) {
		if( this.pickedExpressId !== null ) {
			let mapEntry = this.idMap[this.pickedExpressId];
			if( mapEntry && mapEntry.titleDiv ) {
				mapEntry.titleDiv.style.backgroundColor = this.bgColor;
			}
		}
		this.pickedExpressId = expressId;
		if( expressId === null ) {
			return;
		}
		let mapEntry = this.idMap[expressId];
		if( mapEntry && mapEntry.titleDiv ) {
			mapEntry.titleDiv.style.backgroundColor = this.pickColor;
		}
	}

	highlightChecked( expressId, check=true, enable = null ) {
		let mapEntry = this.idMap[expressId];
		if( mapEntry && mapEntry.checkBox ) {
			formatCheckedDiv( mapEntry.checkBox, check, this.bgColor, this.checkColor, enable );
		}
	}
}


IFCTreeView.prototype.export = function() {	
		const exportDiv = function(div, activities, materialsMap, activitiesMaterials, level) {
			let id = parseInt(div.dataset.expressId);
			let entry = this.idMap[id];
			if( entry.checkBox.checked ) {
				level++;
				let activity = {};
				let info = this.getItemInfoCallback( id );
				activity.Code = info.GlobalId;
				activity.Name = (info.Name) ? info.Name : ( (entry.type) ? entry.type : '' );
				activity.IfcType = entry.type;
				activity.f_Model = id;
				if( 'NetVolume' in info ) {
					activity.VolPlan = info['NetVolume'];
				}
				if( '__materials' in info ) {
					//console.log('info.__materials=', info.__materials);
					for( let m of info.__materials ) { 	// m[0] - expressId, m[1] - name, n[2] - thickness
						let expressId = m[0];
						let props = this.getItemPropertiesCallback( expressId );
						//console.log('props=', props);
						let materialGlobalId = ( props && options.length >= 2 && props[1] !== null ) ? props[1] : expressId;
						if( !(materialGlobalId in materialsMap) ) { // materialsMap = { 'id' : 'name' }
							materialsMap[materialGlobalId] = m[1];
						}
						if( m[2] ) {
							activitiesMaterials.push( { OperCode: activity.Code, MatCode: materialGlobalId, Fix: m[2] } );
						}
					}
				}				
				activity.Level = level;
				activities.push(activity);
			}

			if( entry.children ) {
				for( let i = 1 ; i < div.children.length ; i++ ) {
					exportDiv( div.children[i], activities, materialsMap, activitiesMaterials, level );
				}
			} 
		}.bind(this);

		if( this.rootDiv.children.length < 2 ) {
			//console.log('Error!');
			return;
		}
		let expressId = this.rootDiv.dataset.expressId;
		if(!expressId) {
			//console.log('Error!');
			return;
		}

		let info = this.getItemInfoCallback(parseInt(expressId));

		let exportProject = { Code: info.GlobalId, Name: info.Name, Version: 1 };

		let level = 0;
		let exportActivities = [];
		let materialsMap = {};
		let exportActivitiesMaterials = [];
		exportDiv( this.rootDiv.children[1], exportActivities, materialsMap, exportActivitiesMaterials, level );

		let exportMaterials = [];
		for( let k in materialsMap ) {
			exportMaterials.push( { Code: k, Name: materialsMap[k] } );
		}

		return { command: 'createProject', project: exportProject, activities: exportActivities, 
			materials: exportMaterials, activitiesMaterials: exportActivitiesMaterials };	
}

IFCTreeView.prototype.checkAll = function(check, enable=true ) {

	const checkDiv = function( div ) {
		let id = parseInt(div.dataset.expressId);
		if( id === null ) {
			return;
		}	 
		let entry = this.idMap[id];
		if( !entry ) {
			return;
		}
		if( entry.level > 0 ) {
			this.highlightChecked( id, check, enable );
		}

		if( 'children' in entry ) {
			for( let i = 1 ; i < div.children.length ; i++ ) {
				checkDiv( div.children[i], check );
			}
		} 
	}.bind(this);	

	checkDiv( this.rootDiv );
}

IFCTreeView.prototype.checkById = function( ids, check ) {
	for( let id of ids ) {
		this.highlightChecked( id, check )
	}
}

IFCTreeView.prototype.checkByIds = function(ids) {
	for( let id of ids ) {
		this.highlightChecked( id, true );
	}
}

IFCTreeView.prototype.clearFilteredByType = function() {
	if( !this.filteredByType ) {
		return;
	}
	this.filteredByTypeParent.className = 'ifc-treeview-title';
	for( let id of  this.filteredByType ) {
		let entry = this.idMap[ id ];
		if( entry ) {
			entry.titleDiv.className = 'ifc-treeview-title';
		}
	}
	this.filteredByType = null;
	this.filteredByTypeParent = null;
	this.showAllCallback();
} 


IFCTreeView.prototype.getDatasetExpressId = function( elem ) {
	let eid = null;
	if( 'expressId' in elem.dataset ) {
		try {
			let parsed = parseInt( elem.dataset.expressId ); 
			if( !isNaN(parsed) ) {
				eid = parsed;
			}
		} catch(e) {
			;
		}
	}
	return eid;
}