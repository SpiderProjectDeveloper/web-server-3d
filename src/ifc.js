import './ifc.css';
import {
  AmbientLight,
  AxesHelper,
  DirectionalLight,
  GridHelper,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
	LoadingManager,
	Raycaster,
	Vector2,
	MeshLambertMaterial, MeshPhongMaterial, MeshStandardMaterial, MeshBasicMaterial,
	Texture, TextureLoader, RepeatWrapping, DoubleSide, CanvasTexture, NearestFilter
} from "three";
import {
	acceleratedRaycast,
	computeBoundsTree,
	disposeBoundsTree
} from 'three-mesh-bvh';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { IFCLoader } from "web-ifc-three/IFCLoader";
import { TooltipWindow } from './tooltipwindow';
import { MessageBox } from './messagebox';
import { createAlphaTexture } from './ifc-helpers';

class DataActivitiesAttachments {
	constructor() {
		this.map = {};
		this.selectedDataItem = -1;
		this.selectedDataItemType = -1; 
	}
}

export class Ifc {
	//Creates the Three.js scene

	constructor( initer, options ) {
		this.initer = initer;
		this.options = options;
		this.locale = options.locale;
		this.pickColor = (options.pickColor) ? options.pickColor : 0xff88ff;
		this.progressColor = (options.progressColor) ? options.progressColor : 0x88ff88;
		this.modelColor = (options.modelColor) ? options.modelColor : null;
		this.modelOpacity = (options.modelOpacity) ? options.modelOpacity : 1.0;
		this.workTypeMaterial = (options.workTypeMaterial) ? options.workTypeMaterial : 'basic';
		this.wireframe = (options.wireframe) ? options.wireframe : true;

		this.depthTest = true;	// Make materials visible from anywhere

		this.pickedExpressId = null;
		this.pickedSubset = null;

		this.attachments = new DataActivitiesAttachments();

		this.messageBox = new MessageBox();

		this.tooltipWindow = new TooltipWindow( null, { 
			title: this.locale.msg('picked_element'), 
			x:Math.floor( window.innerWidth/10), y:Math.floor( window.innerHeight/4),
			onClose: function() {
				if( this.pickedExpressId === null ) return;
				//this.ifcLoader.ifcManager.removeSubset(this.ifcModel.modelID, this.scene, this.pickMat);
				this.scene.remove(this.pickedSubset);
				this.pickedExpressId = null;
				this.pickedSubset = null;
			}.bind(this)
		} );

		this.scene = new Scene();
		this.ifcModel = null;

		//Creates the camera (point of view of the user)
		this.camera = new PerspectiveCamera(75, initer.canvasW / initer.canvasH);
		this.camera.position.z = 25;
		this.camera.position.y = 25;
		this.camera.position.x = 15;

		//Creates the lights of the scene
		const lightColor = 0xffffff;

		this.ambientLight = new AmbientLight(lightColor, 0.5);
		this.scene.add(this.ambientLight);

		this.directionalLight = new DirectionalLight(lightColor, 1);
		this.directionalLight.position.set(0, 10, 0);
		this.directionalLight.target.position.set(-5, 0, 0);
		this.scene.add(this.directionalLight);
		this.scene.add(this.directionalLight.target);

		//Sets up the renderer, fetching the canvas of the HTML
		this.threeCanvas = initer.canvasElem;
		this.threeCanvas.ondblclick = this.pickByClick.bind(this);
		this.renderer = new WebGLRenderer({ canvas: this.threeCanvas, alpha: true });
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.setSize(initer.canvasW, initer.canvasH);

		//Creates grids and axes in the scene
		this.grid = new GridHelper(200, 20, 0xcfcfcf, 0xcfcfcf);
		this.scene.add(this.grid);

		this.axes = new AxesHelper();
		this.axes.material.depthTest = false;
		this.axes.renderOrder = 1;
		this.scene.add(this.axes);

		//Creates the orbit controls (to navigate the scene)
		this.controls = new OrbitControls(this.camera, this.threeCanvas);
		this.controls.enableDamping = true;
		this.controls.target.set(-2, 0, 0);

		//Animation loop
		this.animate = function() {
			this.controls.update();
			this.renderer.render(this.scene, this.camera);
			requestAnimationFrame(this.animate);
		}.bind(this);
		this.animate();

		//Sets up the IFC loading
		const onload = function() {
			//console.log('loaded!');
		};
		const onprogress = function(url, loaded, total) {
			//console.log('progress:', url, loaded, total );
		};
		const onerror = function(e) {
			//console.log('error', e);
		};

		this.loadManager = new LoadingManager( onload, onprogress, onerror );

		this.ifcLoader = new IFCLoader(this.loadManager);
		this.ifcLoader.ifcManager.applyWebIfcConfig({ COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true });
		this.ifcLoader.ifcManager.setupThreeMeshBVH(
			computeBoundsTree, disposeBoundsTree, acceleratedRaycast
		);

		this.raycaster = new Raycaster();
		this.raycaster.firstHitOnly = true;
		this.mouse = new Vector2();

		 // Creates subset material
		this.pickMat = new MeshLambertMaterial(
			{ transparent: false, opacity: 0.5, color: this.pickColor, depthTest: true } 	// { transparent: true, opacity: 0.95, color: this.pickColor, depthTest: false }
		);

		this.progressSteps = 5;
		this.progressTypedMats = null;
		this.progressSubsets = null;

		this.progressMats = {};
		for( let i = 1 ; i <= this.progressSteps ; i++ ) 
		{
			let op = 1.0 * i / this.progressSteps;
			let transparent = (op < 1.0) ? true : false;
			let mprops = { transparent: transparent, opacity: op, color: this.progressColor, depthTest: this.depthTest };
			let m = (this.workTypeMaterial === 'basic') ? (new MeshBasicMaterial(mprops)) : (new MeshLambertMaterial(mprops));			
			this.progressMats[i] = { mat:m, visible: false };
		}
	}

	setHighlightColorMap( typeColorMap ) 
	{
		this.progressTypedMats = {}; 	// progressTypedMats[type][progress] = mat
		this.progressSubsets = {};
		for( let type in typeColorMap ) 
		{
			let mats = {};	// A map of materials for different values of complete pct.
			let subsets = {};
			for( let i = 1 ; i <= this.progressSteps ; i++ ) {
				let op = 1.0 * i / this.progressSteps;
				let transparent = (op < 1.0) ? true : false;				
				/*
				//let image = document.createElement('img');
        //let alphaMap = new CanvasTexture(image);
        //image.onload = function() {
        //    alphaMap.needsUpdate = true;
        //};
				//alphaMap.wrapT = RepeatWrapping;
				//alphaMap.wrapS = RepeatWrapping;
				//alphaMap.repeat.set(32,32);
				//image.src = createAlphaTexture(i, this.progressSteps); //'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGUlEQVQoU2NkYGD4z4AHMP7//x+/gmFhAgCXphP14bko/wAAAABJRU5ErkJggg==';
				//image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGUlEQVQoU2NkYGD4z4AHMP7//x+/gmFhAgCXphP14bko/wAAAABJRU5ErkJggg==';
				let m = new MeshBasicMaterial({ 
					color: typeColorMap[type], transparent: true, side: DoubleSide, alphaTest: 0.5, alphaMap: alphaMap,
					//m.alphaMap.magFilter = NearestFilter;
				});
				*/
				let mprops = { transparent: transparent, opacity: op, color: typeColorMap[type], depthTest: this.depthTest };
				let m = ( this.workTypeMaterial === 'basic' ) ? (new MeshBasicMaterial(mprops)) : (new MeshLambertMaterial(mprops));	
				mats[i] = { mat: m, visible: false };
				subsets[i] = null;
			}
			this.progressTypedMats[type] = mats;
			this.progressSubsets[type] = subsets;
		}
		//this.progressTypedMats[-1] = this.progressMats;
		//this.progressSubsets[-1] = null;
	}

	drawProgress( adata, progress ) 
	{
		let data = adata.data;
		let activityIdMap = adata.data._activityIdMap;

		let typeProgressIdsMap = {}; 	// A map of maps: typeProgressIdsMap[type][progress] = ids
		for( let p of progress ) 
		{
			let pct = p[1];
			if( !(pct > 0) ) continue;
			let progressNormalized = Math.ceil(pct * this.progressSteps / 100.0)
			
			let i = p[0];
			let type = data.activities[i]['Type'];

			if( !type ) {
				type = -1;
			}

			if( !(type in typeProgressIdsMap) ) {
				typeProgressIdsMap[type] = {};
			}
			if( !(progressNormalized in typeProgressIdsMap[type] ) ) {
				typeProgressIdsMap[type][progressNormalized] = [];
			}
			typeProgressIdsMap[type][progressNormalized] = typeProgressIdsMap[type][progressNormalized].concat( activityIdMap[i] );			
		}

		for( let type in this.progressTypedMats ) 
		{
			//console.log('for( let type in this.progressTypedMats )', type);
			let mats = this.progressTypedMats[type];
			for( let progressNormalized in mats ) {
				//console.log('let progress in mats', progressNormalized);
				let m = mats[progressNormalized];
				let ids = (type in typeProgressIdsMap && progressNormalized in typeProgressIdsMap[type]) ? 
					typeProgressIdsMap[type][progressNormalized] : null; 
				//console.log(ids);
				if( m.visible ) {
					this.scene.remove(this.progressSubsets[type][progressNormalized]);
					this.progressSubsets[type][progressNormalized] = null;
					//this.ifcLoader.ifcManager.removeSubset(this.ifcModel.modelID, this.scene, m.mat );
					m.visible = false; 
					if( ids === null || ids.length === 0 ) {
						continue;
					}					
				} 
				if( ids !== null && ids.length > 0 ) {
					this.progressSubsets[type][progressNormalized] = this.ifcLoader.ifcManager.createSubset({ 
						modelID: this.ifcModel.modelID, ids: ids, 
						material: m.mat, scene: this.scene, removePrevious: true
					});
					m.visible = true;
				}
			}
		}
	}


	pickByClick(event) {
		if( this.ifcModel === null ) return;	// No model - no picking

		let e = event || window.event; // If the right button pressed - no picking as well
		let isRightButton = ("which" in e && e.which === 3) || ("button" in e && e.button === 2); 
		if( isRightButton ) return;

		// Computes the position of the mouse on the screen
		const bounds = this.threeCanvas.getBoundingClientRect();
		const x1 = event.clientX - bounds.left;
		const x2 = bounds.right - bounds.left;
		this.mouse.x = (x1 / x2) * 2 - 1;
		const y1 = event.clientY - bounds.top;
		const y2 = bounds.bottom - bounds.top;
		this.mouse.y = -(y1 / y2) * 2 + 1;
	
		this.raycaster.setFromCamera(this.mouse, this.camera); // Places it on the camera pointing to the mouse
	
		const found = this.raycaster.intersectObjects([this.ifcModel]); // Casts a ray

    if (found[0]) {
			const index = found[0].faceIndex;
			const geometry = found[0].object.geometry;
			const ifc = this.ifcLoader.ifcManager;
			const id = ifc.getExpressId(geometry, index);
			//console.log('found=', found, ', id=', id, ', face index=', index, ', geometry=', geometry);
			//if( !this.checkIsAllowed() ) {	// If check is not allowed - simply highlighting...
			if( !isRightButton  || isRightButton ) {	// To add another functionality for right button later
				this.highlightPicked( [id] );
			} 
    } else {
			this.highlightPicked( null );
		}
	}

	setDataActivitySelected(i, t) {
		if( this.ifcModel === null ) {
			return;
		}	
		let selectedDataItem = this.attachments.selectedDataItem;
		if( selectedDataItem !== null && selectedDataItem >= -1 ) { // If there is a data item (activity) selected
			let ids = this.attachments.map[selectedDataItem];
			if( ids && ids.length > 0 ) {
				this.ifcLoader.ifcManager.removeSubset(this.ifcModel.modelID, this.scene, this.activeCheckMat );
			}	
		} 
		this.treeView.checkAll( false, (i === null || i < 0 ) ? false : true );
		
		this.attachments.selectedDataItem = i; 
		this.attachments.selectedDataItemType = t; 
		if( i !== null && i >= -1 ) {
			this.activeCheckMat = (t === null) ? this.checkMat : ((this.checkMats[t]) ? this.checkMats[t] : this.checkMat);
			let ids = this.attachments.map[i];
			if( ids && ids.length > 0 ) {
				this.ifcLoader.ifcManager.createSubset({ 
					modelID: this.ifcModel.modelID, ids: ids, material: this.activeCheckMat, 
					scene: this.scene, removePrevious: false
				});
				this.treeView.checkByIds(ids);		
			}
		}
	}


	async highlightPicked( ids ) {
		let currentlyPicked = this.pickedExpressId;

		if( this.pickedExpressId !== null ) {
			//this.ifcLoader.ifcManager.removeSubset(this.ifcModel.modelID, this.scene, this.pickMat);
			this.scene.remove(this.pickedSubset);
			this.pickedExpressId = null;
			this.pickedSubset = null;
		}

		if( ids !== null && ids.length ) {
			let id = ids[0];
			if( currentlyPicked === id ) { 	// Picking the same element - must be unpicked then...
				this.tooltipWindow.hide();
			} else {
				// Creates subset
				this.pickedSubset = this.ifcLoader.ifcManager.createSubset({ 
					modelID: this.ifcModel.modelID, ids: ids, material: this.pickMat, 
					scene: this.scene, removePrevious: true
				});
				let info = await this.getItemInfo( id );
				let message = this.formatItemInfo( info, id );
				this.tooltipWindow.show( message );
				
				this.pickedExpressId = id;
			}
		} else {
			this.tooltipWindow.hide();
		}
	}

	async getCoords(id) {
		let iprops = await this.ifcLoader.ifcManager.getItemProperties(this.ifcModel.modelID, id, true);
		//console.log('getCoords', iprops);
		if( iprops.ObjectPlacement && iprops.ObjectPlacement.RelativePlacement && iprops.ObjectPlacement.RelativePlacement.Location ) {
			let cc = iprops.ObjectPlacement.RelativePlacement.Location.Coordinates;
			//console.log(cc);
			if( cc ) {
				this.camera.position.x = cc[0].value + 15;
				this.camera.position.z = cc[1].value + 13;
				this.camera.position.y = cc[2].value + 8;
				this.controls.target.set(this.camera.position.x-5, this.camera.position.y, this.camera.position.z-5);
			}
		}		
	}

	async getItemInfo(id) {
		let info = {};
		let props = await this.ifcLoader.ifcManager.getPropertySets(this.ifcModel.modelID, id, true);
		for( let p of props ) {
			if( p.constructor.name === 'IfcPropertySet' ) {
				if( p.HasProperties ) {
					for( let singleValue of p.HasProperties ) {
						if( singleValue.constructor.name === 'IfcPropertySingleValue') {
							info[singleValue.Name.value] = (singleValue.NominalValue) ? singleValue.NominalValue.value : '';
						}
					}
				}
			}
			if( p.constructor.name === 'IfcElementQuantity' ) {
				if( p.Quantities ) {
					for( let q of p.Quantities ) {
						if( q.Name && q.VolumeValue ) {
							info[q.Name.value] = q.VolumeValue.value;
						}
					}
				}
			}
		}
		let iprops = await this.ifcLoader.ifcManager.getItemProperties(this.ifcModel.modelID, id, true);
		if( iprops['Name'] ) { info['Name'] = iprops['Name'].value; }
		if( iprops['GlobalId'] ) { info['GlobalId'] = iprops['GlobalId'].value; }		

		let mprops = await this.ifcLoader.ifcManager.getMaterialsProperties(this.ifcModel.modelID, id, true);
		let materials = [];
		for( let mp of mprops ) {
			if( mp.constructor.name === 'IfcMaterialLayerSetUsage' ) {
				if( mp.ForLayerSet && mp.ForLayerSet.MaterialLayers ) {
					for( let lr of mp.ForLayerSet.MaterialLayers ) {
						//console.log('m=', lr);
						if( lr.Material && lr.Material.Name && lr.Material['expressID'] ) {
							let material = [ 
								lr.Material['expressID'], lr.Material.Name.value,
								((lr.LayerThickness) ? lr.LayerThickness.value : null)
						 	];
							materials.push( material ); 
						}
					}
				}
			} else if( mp.constructor.name === 'IfcMaterial' ) {
				//console.log('m=', mp);
				if( mp['expressID'] && mp.Name ) {
					materials.push( [ mp['expressID'], mp.Name.value, null ] );
				}		
			}
		}
		if( materials.length > 0 ) {
			info['__materials'] = materials;
		}
		//console.log(info);
		return info;
	}

	formatItemInfo( info, id=null ) {
		let r = '';
		let name = (info['Name']) ? info['Name'] : 'Undefined';
		r = 'Name: ' + name;
		if( id !== null ) {
			r += '<br/>Express Id: ' + id;
		}
		for( let k in info ) {
			if( k === 'Name' ) {
				continue;
			}
			if( k === '__materials') {
				for( let a of info[k] ) {
					r += '<br/>Material: ' + a[1] + ( (a[2]) ?  ('(' + a[2] + ')') : '' );
				}
				continue;
			}
			r += '<br/>' + k + ': ' + info[k]
		}
		return r;
	}

	async getItemName( id ) {
		let iprops = await this.ifcLoader.ifcManager.getItemProperties(this.ifcModel.modelID, id, true);
		return ( iprops && iprops['Name'] ) ? iprops['Name'].value : ''; 
	}

	async getItemProperties( id ) {
		let iprops = await this.ifcLoader.ifcManager.getItemProperties(this.ifcModel.modelID, id, true);
		let name = ( iprops && iprops['Name'] ) ? iprops['Name'].value : '';
		let gid =  ( iprops && iprops['GlobalId'] ) ? iprops['GlobalId'].value : null;
		let type =  ( iprops && iprops['type'] ) ? iprops['type'] : null;
		return [name, gid, type];
	}

	setModelColor( color=null ) {
		let hide = ( typeof(color) === 'string' && color === 'hide' );
		if( color === null || hide ) {
			color = this.modelColor;
		}
		let opacity = (hide) ? 0.0 : this.modelOpacity;
		let wireframe = (hide) ? false : this.wireframe; 
		let props = {
			transparent: true, opacity: opacity, color: color, wireframe: wireframe
		};
		if( this.workTypeMaterial === 'basic' ) {
			this.ifcModel.material = new MeshBasicMaterial(props);			
		} else {
			this.ifcModel.material = new MeshLambertMaterial(props);			
		}
	}

	loadModel(ifcURL) 
	{
		this.messageBox.show( this.locale.msg('wait_loading_ifc') );
		
		this.ifcLoader.load( 
			ifcURL, 
			function(ifcModel) 
			{
				this.messageBox.hide();

				// Clearing the previous if required
				if( this.ifcModel !== null ) {
					this.scene.remove(this.ifcModel);
				}

				this.scene.add(ifcModel.mesh);
				this.ifcModel = ifcModel.mesh;
				if( this.modelColor ) {
					this.setModelColor();
				}
				let sp = ifcModel.getSpatialStructure(ifcModel.modelID);						
			}.bind(this),
			function(prg) { 
				this.messageBox.show( 
					this.locale.msg('wait_loading_ifc') + '<br/>' + 
					this.locale.msg('loaded') +  ': ' + prg.loaded +  ' ' + 
					this.locale.msg('bytes') 
				);
			}.bind(this),
			function(e) 
			{
				this.messageBox.show( this.locale.msg('ifc_not_loaded') );
			}.bind(this)
		);
		
	};

	filterByIds(ids) {
		const manager = this.ifcLoader.ifcManager;
		manager.hideAllItems(this.ifcModel.modelID);
		manager.showItems(this.ifcModel.modelID, ids);
	}

	showAll() {
		const manager = this.ifcLoader.ifcManager;
		manager.showAllItems(this.ifcModel.modelID);
	}
}