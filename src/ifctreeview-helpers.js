/*
		treeview.idMap[ expressId ] = { 
			div: nodeDiv, titleDiv: titleDiv, checkBox: checkBox, expressId, parentExpressId,
			type?:, children?:[ expressId, expressId ], 
			parentGlobalId?: ,   
		};	
*/

export function addEntry( treeview, parentExpressId, node ) {
	let pentry = (parentExpressId) ? treeview.idMap[ parentExpressId ] : null; 
	let level = (pentry) ? (pentry.level + 1) : 0;
	let parentDiv = (pentry) ? pentry.div : treeview.containerDiv;

	let nodeDiv = document.createElement('div');
	nodeDiv.className = 'ifc-treeview-element';
	
	let expressId = node['expressID'];
	nodeDiv.dataset.expressId = expressId;
	
	let typeName = node['type'];
	if( !(typeName in treeview.typesMap) ) {
		let [ pname, pgid, typeNumber ] = treeview.getItemPropertiesCallback( expressId );
		treeview.typesMap[typeName] = typeNumber;
	}

	if( !node.children || !node.children.length ) {	// Has no children, not expandable then...
		let [ checkBox, titleDiv ] = createCheckable(treeview, nodeDiv, node, level);
		parentDiv.appendChild(nodeDiv);
		treeview.idMap[expressId] = { 
			level: level, div: nodeDiv, titleDiv: titleDiv, checkBox: checkBox, 
			expressId: expressId, type: node.type, parentExpressId: parentExpressId
		};
		titleDiv.onmousedown = function(e) { 
			if( !isRightButton(e) ) {	
				if( !treeview.checkIsAllowedCallback() ) {
					treeview.pickCallback( [expressId], expressId ); 
				}
			} else {
				onRightButton( e, treeview, nodeDiv );
			}				
		};
		return nodeDiv;
	}

	// Has children - creating expandable
	let [ containerDiv, checkBox, titleDiv, expandDiv ] = createExpandable( treeview, node, level );
	if( !pentry ) { 	// The root node
		checkBox.checked = false;
		checkBox.disabled = true;
	}
	nodeDiv.appendChild( containerDiv );
	let children = [];
	for( let child of node.children ) {
		children.push(child['expressID']);
	}
	treeview.idMap[expressId] = { 
		level:level, div: nodeDiv, titleDiv: titleDiv, checkBox: checkBox, 
		expressId: expressId, children: children, type: node.type, parentExpressId: parentExpressId 
	};
	titleDiv.onmousedown = function(e) { 
		if( !isRightButton(e) ) {
			treeview.pickCallback( findAllUnexpandableChildNodes(node), expressId ); 
		} else {
			onRightButton( e, treeview, nodeDiv );
		}
	};
	nodeDiv.dataset.expanded = 'n';

	parentDiv.appendChild(nodeDiv);

	for( let i = 0 ; i < node.children.length ; i++ ) {
		nodeDiv.dataset.expanded = 'y';
		expandDiv.innerHTML = treeview.collapseText;
		addEntry( treeview, expressId, node.children[i] );
	}

	const expandListener = function(e) {
		e.stopPropagation();
		if( nodeDiv.dataset.expanded === 'n') {
			nodeDiv.dataset.expanded = 'y';
			expandDiv.innerHTML = treeview.collapseText;
			for( let i = 1 ; i < nodeDiv.children.length ; i++ ) {
				let childDiv = nodeDiv.children[i];
				childDiv.style.display = 'block';
			}
		} else {
			nodeDiv.dataset.expanded = 'n';
			expandDiv.innerHTML = treeview.expandText;
			for( let i = 1 ; i < nodeDiv.children.length ; i++ ) {
				let childDiv = nodeDiv.children[i];
				childDiv.style.display = 'none';
			}
		}
	}
	expandDiv.addEventListener('click', expandListener, false );
	return nodeDiv;
}


function onRightButton( e, treeview, nodeDiv ) {
	let eid = treeview.getDatasetExpressId(nodeDiv);
	if( eid === null ) {
		return;
	}
	let types = new Set;
	let entry = treeview.idMap[ eid ];
	const  doEntry = function( entry_, isAdd ) {
		if( isAdd && !types.has(entry_.type) ) {
			types.add(entry_.type);
		}
		if( entry_.children ) {
			for( let childExpressId of entry_.children ) {
				let childEntry = treeview.idMap[ childExpressId ];
				if( childEntry ) {
					doEntry(childEntry, true);
				}
			}
		}
	}
	doEntry(entry, false);

	let items = [];
	items.push( [ 'Uncheck', checkByType, [treeview, entry, null, false] ] );
	items.push( [ 'Check by Type:', null, null ] );
	for( let type of types ) {
		items.push( [	type, checkByType, [treeview, entry, type, true] ] );
	}
	items.push( [ 'Unhide All', clearFilteredByType, [treeview] ] );
	items.push( [ 'Hide All Except Type:', null, null ] );
	for( let type of types ) {
		items.push( [	type, filterByType, [treeview, entry, type] ] );
	}
	treeview.contextMenu.show( e, items );
}

function checkByType( args ) {
	let [ treeview, entry, type, check ] = args;
	if( !treeview.checkIsAllowedCallback() ) {
		return;
	}
	const doEntry = function( entry_ ) {
		if( (type === null) || (entry_.type === type) ) {
			entry_.checkBox.checked = check;
			treeview.checkCallback(entry_.expressId, check); 
		}
		if( entry_.children ) {
			for( let childExpressId of entry_.children ) {
				if( treeview.idMap[childExpressId] ) {
					doEntry( treeview.idMap[childExpressId] );
				}
			}
		}
	}
	doEntry( entry );
}

function clearFilteredByType( args ) {
	let [ treeview ] = args;
	treeview.clearFilteredByType();
}

function filterByType( args ) {
	let [ treeview, entry, type ] = args;

	treeview.filteredByTypeParent = treeview.idMap[entry.expressId].titleDiv;
	treeview.filteredByTypeParent.className = 'ifc-treeview-title-filtered-by-type-parent';

	treeview.filteredByType = [];
	const doEntry = function( e ) {
		if( e.type === type ) {
			treeview.filteredByType.push( e.expressId );
			treeview.idMap[e.expressId].titleDiv.className = 'ifc-treeview-title-filtered-by-type';		 
		}
		if( e.children ) {
			for( let i = 0 ; i < e.children.length ; i++ ) {
				let id = e.children[i];
				if( treeview.idMap[id] ) {
					doEntry( treeview.idMap[id] );
				}
			}
		}
	}; 
	doEntry(entry);

	treeview.filterByIdsCallback( treeview.filteredByType );
}

function isRightButton(e) {
	let isRight;
	e = e || window.event;
	if ("which" in e)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
		isRight = (e.which === 3); 
	else if ("button" in e)  // IE, Opera 
		isRight = (e.button === 2); 
	return isRight;
}

function createTitleText( treeview, node ) {
	let name;
	if( 'expressID' in node ) {
		name = treeview.getItemNameCallback(node['expressID']);
		if( name === '' ) { 
			name = node.type; // name = node['expressID']; 
		} else {
			name = node.type + ':' + name;
		}
	} 
	return name;
}

function createCheckbox( isChecked = false, node = null, treeview ) {
	let callback = treeview.checkCallback;
	let isAllowedCallback = treeview.isAllowedCallback;
	let bgColor = treeview.bgColor;
	let checkColor = treeview.checkColor;
	let cb = document.createElement('div');
	//cb.type = 'checkbox';
	cb.className = 'ifc-treeview-checkbox';
	formatCheckedDiv( cb, isChecked, bgColor, checkColor, false );
	if( node !== null && callback !== null ) {
		cb.onmouseup = function(e) { 
			if( isAllowedCallback ) {
				if( !isAllowedCallback() ) {
					return;
				}
			}
			//callback(node.expressID, ((cb.dataset.checked === 'n') ? true : false) );
			callback(findAllChildNodes(node), ((cb.dataset.checked === 'n') ? true : false) );
		};
	}
	return cb;
}

function createCheckable( treeview, nodeDiv, node, level ) {
	let checkBox = createCheckbox(false, node, treeview );

	let expandDiv = null;
	expandDiv = document.createElement('div');
	expandDiv.className = 'ifc-treeview-expander';
	expandDiv.innerHTML = treeview.unexpandableText;

	let titleDiv = document.createElement('div');
	titleDiv.innerHTML = createTitleText( treeview, node, level );
	titleDiv.style.paddingLeft = (level * treeview.hierarchyMargin) + 'px';
	titleDiv.className = 'ifc-treeview-title';

	nodeDiv.appendChild(checkBox);
	nodeDiv.appendChild(expandDiv);
	nodeDiv.appendChild(titleDiv);	

	return [ checkBox, titleDiv ];
}

function createExpandable( treeview, node, level ) {
	let containerDiv = document.createElement('div');

	let checkBox = createCheckbox(false, node, treeview);

	let titleDiv = document.createElement('div');
	titleDiv.innerHTML = createTitleText( treeview, node );
	titleDiv.style.paddingLeft = (level * treeview.hierarchyMargin) + 'px';
	titleDiv.className = 'ifc-treeview-title';

	let expandDiv = null;
	expandDiv = document.createElement('div');
	expandDiv.className = 'ifc-treeview-expander';
	expandDiv.innerHTML = treeview.expandText;

	containerDiv.appendChild(checkBox);
	containerDiv.appendChild(expandDiv);
	containerDiv.appendChild(titleDiv);

	return [ containerDiv, checkBox, titleDiv, expandDiv ];
}

function findAllUnexpandableChildNodes(node) {
	let nodeList = [];
	const doNode = function(node, nodeList ) {
		if( !node.children || !node.children.length ) {
			nodeList.push(node['expressID']);
			return;
		}
		for( let childNode of node.children ) {
			doNode( childNode, nodeList );  
		}
	}
	doNode( node, nodeList );
	return nodeList;
}


function findAllChildNodes(node) {
	let nodeList = [];
	const doNode = function(node, nodeList ) {
		nodeList.push(node['expressID']);
		if( !node.children || !node.children.length ) {
			return;
		}
		for( let childNode of node.children ) {
			doNode( childNode, nodeList );  
		}
	}
	doNode( node, nodeList );
	return nodeList;
}


export function formatCheckedDiv(div, check, bgColor, checkColor, enable=null ) {
	//div.style.backgroundColor = (check) ? checkColor : bgColor;
	div.innerHTML = (check) ? '☑' : '☐';
	div.dataset.checked = (check) ? 'y' : 'n';
	if( enable !== null ) {
		div.style.visibility = (enable || true) ? 'visible' : 'hidden';
	}
}
