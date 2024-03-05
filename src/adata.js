export class AData {

	status() {
		return this.errorCode;
	}

	calcVisibleActivitiesNumber() {
		let numVisible = 0;
		for( let i = 0 ; i < this.data.activities.length ; i++ ) {
			if( this.data._activities[i].visible ) {
				numVisible += 1;
			}
		}
		this.visibleActivitiesNumber = numVisible;
	}

	getNthVisible(n) {
		let counter=0;
		for( let i = 0 ; i < this.data.activities.length ; i++ ) {
			if( this.data._activities[i].visible ) {
				if( counter === n ) {
					return i;
				}
				counter++;
			}
		}
		return -1;
	}

	getVisibleActivitiesNumber() {
		return this.visibleActivitiesNumber;
	}


	expandOrCollapse(i) {
		if( !this.data._activities[i].expandable ) {
			return false;
		}
		let numVisibleChange=0;
		if( this.data._activities[i].expanded === true ) {
			for( let iO = i+1 ; iO < this.data.activities.length ; iO++ ) {
				for( let iP = 0 ; iP < this.data._activities[iO].parents.length ; iP++ ) {
						if( this.data._activities[iO].parents[iP] == i ) {
							if( this.data._activities[iO].visible ) {
								this.data._activities[iO].visible = false;
								numVisibleChange--;
							}
							break;
					}
				}
			}
			this.data._activities[i].expanded = false;
		} else {
			for( let iO = i+1 ; iO < this.data.activities.length ; iO++ ) {
				for( let iP = 0 ; iP < this.data._activities[iO].parents.length ; iP++ ) {
					let iParent = this.data._activities[iO].parents[iP];
					if( iParent == i ) {
						if( !this.data._activities[iO].visible ) {
							this.data._activities[iO].visible = true;
							numVisibleChange++;
						}
						break;
					}
					if( this.data._activities[iParent].expandable && !this.data._activities[iParent].expanded ) {
						break;
					}
				}
			}
			this.data._activities[i].expanded = true;
		}
		this.visibleActivitiesNumber += numVisibleChange;
		return true;
	}

	createCodeLevelParentKey( dataItem, parent0Code=undefined ) {
		let code = dataItem['Code'];
		let level = ('Level' in dataItem && dataItem['Level'] !== null) ? dataItem['Level'] : 'nolevel';
		let parent;
		if( parent0Code === undefined ) { 	// Parent is specified in the dataITem 
			parent = ('parent' in dataItem && dataItem['parent'] !== null) ? dataItem['parent'] : 'noparent';
		} else {
			parent = ( parent0Code === null ) ? 'noparent' : parent0Code;
		} 
		return code + '_' + level + '_' + parent;
	}

	getMaxExpandableLevel() {
		return this.maxExpandableLevel;
	}
	
	getExpandedTo() {
		return this.expandedTo;
	}

	constructor( settings, projectId, user='', sessId='' ) {

		this.texts = { 
			'en': { monthNames:['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'] },
			'ru': { monthNames:['ЯНВ','ФЕВ','МАР','АПР','МАЙ','ИЮН','ИЮЛ','АВГ','СЕН','ОКТ','НОЯ','ДЕК'] } 
		}; 
	
		this.settings = {
			dataUrl: '/.model_data', modelUrl: '/.get_ifc', 
			logoutUrl:'/.logout', closeProjectUrl: './close_project',
			expandToLevelAtStart: 3
		}
		
		for( let k in settings ) {
			this.settings[k] = settings[k];
	 }
		this.projectId = projectId;
		this.user = user;
		this.sessId = sessId;
	}

	load( cb ) {
		let xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if ( xmlhttp.readyState == 4 ) { 
				if( xmlhttp.status == 200 ) {
					let _data = null;
					try {
						_data = JSON.parse(xmlhttp.responseText); // TO UNCOMMENT!!!!
					} catch(e) {
						; // console.log('Error: ' + e.name + ":" + e.message + "\n" + e.stack + "\n" + e.cause);
					}
					if( !_data ) { 		// To ensure data are parsed ok... // alert(this.responseText);
						cb(-1);
						return;
					}
	
					if( !('activities' in _data) || _data.activities.length == 0 ) {
						cb(-1); 
						return;
					}
					this.data = _data;
					let status = this.initData();
					if( status < 0 ) {
						return status;
					}
					if( !('editables' in _data) || _data.editables.length == 0 ) {
						_data.noEditables = true;
					} else {
						_data.noEditables = false;
					}						
					cb(0, this);
				} else {
					cb(-2); 
				}                        
			}
		}.bind(this);

		xmlhttp.open("GET", this.settings.dataUrl + '?' + "projectId=" + decodeURIComponent(this.projectId), true);
		xmlhttp.setRequestHeader("Cache-Control", "no-cache");
		xmlhttp.send();
	}

	initDataParameters( user, sessId ) {
		if( 'parameters' in this.data ) { 
			if( typeof(this.data.parameters.dateDelim) !== 'string' ) 
				this.data.parameters.dateDelim = '.';
			if( typeof(this.data.parameters.timeDelim) !== 'string' )
				this.data.parameters.timeDelim = ':';
			if( typeof(this.data.parameters.language) !== 'string' )
				this.data.parameters.language = 'en';
			if( typeof(this.data.parameters.secondsInPixel) === 'undefined' ) { 
				this.data.parameters.secondsInPixel = 60*60*24;
			} else {
				this.data.parameters.secondsInPixel = parseInt(this.data.parameters.secondsInPixel);
			}
			if( typeof(this.data.parameters.expandToLevelAtStart) === 'undefined' ) { 
				this.data.expandToLevelAtStart = 3;
			} else {
				this.data.expandToLevelAtStart = parseInt(this.data.expandToLevelAtStart);
			}
			if( typeof(this.data.parameters.user) !== 'string' ) 
				this.data.parameters.user = this.user;
			if( typeof(this.data.parameters.sessId) !== 'string' ) 
				this.data.parameters.sessId = this.sessId;
			if( typeof(this.data.parameters.projectId) !== 'string' ) 
				this.data.parameters.projectId = this.projectId;
			if( !('chatPort' in this.data.parameters) || !this.data.parameters.chatPort ) {
				this.data.parameters.chatPort = null;
				this.data.parameters.chatServer = null;
			} else {
				this.data.parameters.chatServer = window.location.protocol + "//" + 
					window.location.host.split(":")[0] + ":" + this.data.parameters.chatPort + "/";
			}
			if( !('apiPort' in this.data.parameters) || !this.data.parameters.apiPort ) {
				this.data.parameters.apiPort = null;
				this.data.parameters.apiServer = null;
			} else {
				this.data.parameters.apiServer = window.location.protocol + "//" + 
					window.location.host.split(":")[0] + ":" + this.data.parameters.apiPort + "/";
			}

			let patternMDY = new RegExp( '([mM]+)([dD]+)([yY]+)' ); // Determining date format: DMY or MDY
			if( patternMDY.test(this.data.parameters.dateFormat) ) {               
				this.data.parameters.dateDMY = false;
			} else {
				this.data.parameters.dateDMY = true;
			}
		} 	
	}

	initData() {
		this.visibleActivitiesNumber=0;

		this.maxExpandableLevel = 0;
		this.expandedTo = 0;

		this.errorCode = 0;
		this.errorMessage = null;

		this.initDataParameters();

		this.data.project.curTimeInSeconds = this.data.project.CurTime;
		this.data.project.CurTime = this.secondsToDate( this.data.project.CurTime );
		if( this.data.activities.length == 0 ) {
			return -1;				
		}
		if( !('Code' in this.data.activities[0]) || !('Level' in this.data.activities[0]) ) { 	// 'Code' and 'Level' is a must!!!!
			return -1;		
		}
			
		// Retrieving dates of operations, calculating min. and max. dates.
		this.data._time = {};
		this.data._time.min = -1;
		this.data._time.max = -1;
		this.data._activities = new Array(this.data.activities.length);
		for( let i = 0 ; i < this.data.activities.length ; i++ ) {
			this.data._activities[i] = {};
			let d = this.data.activities[i];
			if( typeof(d.AsapStart) !== 'undefined' && d.AsapStart !== null ) {
				d.AsapStartInSeconds = d.AsapStart;
				//d.AsapStart = secondsToDate( d.AsapStartInSeconds );
				this.data._time.min = this.reassignBoundaryValue( this.data._time.min, d.AsapStartInSeconds, false );
			} else {
				d.AsapStartInSeconds = -1;
			}
			if( typeof(d.AsapFin) !== 'undefined' && d.AsapFin !== null) {
				d.AsapFinInSeconds = d.AsapFin;
				//d.AsapFin = secondsToDate( d.AsapFinInSeconds );
				this.data._time.max = this.reassignBoundaryValue( this.data._time.max, d.AsapFinInSeconds, true );
			} else {
				d.AsapFinInSeconds = -1;
			}
			if( typeof(d.FactStart) !== 'undefined' && d.FactStart !== null ) {
				d.FactStartInSeconds = d.FactStart;
				//d.FactStart = secondsToDate( d.FactStartInSeconds );
				this.data._time.min = this.reassignBoundaryValue( this.data._time.min, d.FactStartInSeconds, false );
			} else {
				d.FactStartInSeconds = -1;
			}
			if( typeof(d.FactFin) !== 'undefined' && d.FactFin !== null ) {
				d.FactFinInSeconds = d.FactFin;
				//d.FactFin = secondsToDate( d.FactFinInSeconds );
				this.data._time.max = this.reassignBoundaryValue( this.data._time.max, d.FactFinInSeconds, true );
			} else {
				d.FactFinInSeconds = -1;
			}
			if( typeof(d.Start_COMP) !== 'undefined' && d.Start_COMP !== null ) {
				d.Start_COMPInSeconds = d.Start_COMP;
				//d.Start_COMP = secondsToDate( d.Start_COMPInSeconds );
				this.data._time.min = this.reassignBoundaryValue( this.data._time.min, d.Start_COMPInSeconds, false );			
			} else {
				d.Start_COMPInSeconds = -1;
			}
			if( typeof(d.Fin_COMP) !== 'undefined' && d.Fin_COMP !== null ) {
				d.Fin_COMPInSeconds = d.Fin_COMP;
				//d.Fin_COMP = secondsToDate( d.Fin_COMPInSeconds );
				this.data._time.max = this.reassignBoundaryValue( this.data._time.max, d.Fin_COMPInSeconds, true );			
			} else {
				d.Fin_COMPInSeconds = -1;
			}
	
			if( typeof(d.AlapStart) !== 'undefined' && d.AlapStart !== null ) {
				d.AlapStartInSeconds = d.AlapStart;
				//d.AlapStart = secondsToDate( d.AlapStartInSeconds );
				this.data._time.min = this.reassignBoundaryValue( this.data._time.min, d.AlapStartInSeconds, false );			
			} else {
				d.AlapStartInSeconds = -1;
			}
			if( typeof(d.AlapFin) !== 'undefined' && d.AlapFin !== null ) {
				d.AlapFinInSeconds = d.AlapFin;
				//d.AlapFin = secondsToDate( d.AlapFinInSeconds );
				this.data._time.max = this.reassignBoundaryValue( this.data._time.max, d.AlapFinInSeconds, true );			
			} else {
				d.AlapFinInSeconds = -1;
			}
			if( typeof(d.f_LastFin) !== 'undefined' && d.f_LastFin !== null ) {
				d.lastFinInSeconds = d.f_LastFin;
			} else {			
				d.lastFinInSeconds = d.AsapStartInSeconds; // To prevent error if for some reason unfinished operation has no valid f_LastFin. 
			}
	
			// Start and finish
			if( d.FactFin ) {
				d.status = 100; // finished
				d.displayStartInSeconds = d.FactStartInSeconds; 
				d.displayFinInSeconds = d.FactFinInSeconds;
				d.displayRestartInSeconds = null; 
			} else {
				if( !d.FactStart ) { // Has not been started yet
					d.status = 0; // not started 
					d.displayStartInSeconds = d.AsapStartInSeconds; 
					d.displayFinInSeconds = d.AsapFinInSeconds;
					d.displayRestartInSeconds = null;
				} else { // started but not finished
					let divisor = (d.AsapFinInSeconds - d.AsapStartInSeconds) + (d.lastFinInSeconds - d.FactStartInSeconds); 
					if( divisor > 0 ) {
						d.status = parseInt( (d.lastFinInSeconds - d.FactStartInSeconds) * 100.0 / divisor - 1.0); 
					} else {
						d.status = 50;
					}
					d.displayStartInSeconds = d.FactStartInSeconds; 
					d.displayFinInSeconds = d.AsapFinInSeconds;
					d.displayRestartInSeconds = d.AsapStartInSeconds;
				}
			}
			this.data._activities[i].color = this.decColorToString( d.f_ColorCom, null );
			this.data._activities[i].colorBack = this.decColorToString( d.f_ColorBack, null );
			this.data._activities[i].colorFont = this.decColorToString( d.f_FontColor, null );
			if( !('Level' in d) ) {
					d.Level = null;
			} else if( typeof( d.Level ) === 'string' ) {
				if( d.Level.length === 0 ) {
					d.Level = null;
				}
				else if( this.digitsOnly(d.Level) ) {
					d.Level = parseInt(d.Level);
				}
			}
		}
		if( this.data._time.min == -1 || this.data._time.max == -1 ) {	// If time limits are not defined... 
			this.errorCode = -1;
			return;
		}
	
		this.data._time.span = this.data._time.max - this.data._time.min;
	
		// Initializing the parent-children structure and the link structure
		for( let i = 0 ; i < this.data.activities.length ; i++ ) {
			this.data.activities[i].id = 'ganttRect' + i; // Id
			this.initParents(i);
			this.data._activities[i].isPhase = (typeof(this.data.activities[i].Level) === 'number') ? true : false;
			this.data._activities[i].hasLinks = false;
		}
	
		// Marking 'expandables'
		for( let i = 0 ; i < this.data.activities.length ; i++ ) {
			let hasChild = false;
			for( let j = i+1 ; j < this.data.activities.length ; j++ ) {
				for( let k = 0 ; k < this.data._activities[j].parents.length ; k++ ) {
					if( this.data._activities[j].parents[k] == i ) { // If i is a parent of j
						hasChild = true;
						break;
					}
				}
				if( hasChild ) {
					break;
				}
			}
			if( hasChild ) {
				this.data._activities[i].expanded = true;
				this.data._activities[i].expandable = true;
			} else {
				this.data._activities[i].expanded = true;			
				this.data._activities[i].expandable = false;
			}
			this.data._activities[i].visible = true;
		}
	
		// Searching for the deepest level and creating 'code-level-parent' keys... 
		this.data.codeLevelParentMap = {};
		for( let i = 0 ; i < this.data.activities.length ; i++ ) {
			if( this.data._activities[i].parents.length >= this.maxExpandableLevel ) {
				this.maxExpandableLevel =  this.data._activities[i].parents.length + 1;
			}
			let k = this.createCodeLevelParentKey( this.data.activities[i], this.data._activities[i].parent0Code );
			this.data.codeLevelParentMap[k] = i;	
		}
	
		this.expandedTo = this.settings.expandToLevelAtStart;
		if( this.expandedTo > this.maxExpandableLevel ) // If an invalid _expandToLevelAtStart was specified
			this.expandedTo = this.maxExpandableLevel;
		this.expandToLevel( this.expandedTo ); 	// Expanding...
	
		// Searching for the linked operations, assigning links with operation indexes and marking the operations to know they are linked...
		for( let l = 0 ; ('links' in this.data) && (l < this.data.links.length) ; l++ ) {
			let predOp = -1;
			let succOp = -1;
			for( let op = 0 ; op < this.data.activities.length ; op++ ) {
				if( predOp == -1 ) { 
					if( this.data.activities[op].Code == this.data.links[l].PredCode ) { predOp = op; }
				}
				if( succOp == -1 ) {
					if( this.data.activities[op].Code == this.data.links[l].SuccCode ) { succOp = op; }
				}
				if( predOp != -1 && succOp != -1 ) {
					break;
				}
			}
			if( predOp === -1 || succOp === -1 ) {
				this.data.links[l].predOp = null;
				this.data.links[l].succOp = null;
				continue;
			}
			if( !('links' in this.data._activities[predOp]) ) {
				this.data._activities[predOp].links = [];
			} 
			if( !('links' in this.data._activities[succOp]) ) {
				this.data._activities[succOp].links = [];
			} 

			this.data._activities[predOp].links.push( { from:null, to: succOp, type: this.data.links[l].sfType } )
			this.data._activities[succOp].links.push( { from:predOp, to: null, type: this.data.links[l].sfType } )

			this.data._activities[predOp].hasLinks = true;
			this.data._activities[succOp].hasLinks = true;			
		}

		this.initDataHelpers();

		this.calcVisibleActivitiesNumber();

		return(0);
	}

	initParents( iOperation ) {
		this.data._activities[iOperation].parents = []; // Initializing "parents"
		for( let i = iOperation-1 ; i >= 0 ; i-- ) {
			let l = this.data._activities[iOperation].parents.length;
			let currentLevel;
			if( l == 0 ) {
				currentLevel = this.data.activities[iOperation].Level;
			} else {
				let lastPushedIndex = this.data._activities[iOperation].parents[l-1];
				currentLevel = this.data.activities[lastPushedIndex].Level;
			}
			if( currentLevel === null || currentLevel === 'P' ) { // Current level is an operation
				if( typeof(this.data.activities[i].Level) === 'number' ) {
					this.data._activities[iOperation].parents.push(i);
				}
			} else if( typeof(currentLevel) === 'number' ) { // Current level is a phase
				if( typeof(this.data.activities[i].Level) === 'number' ) {
					if( this.data.activities[i].Level < currentLevel ) { // this.data.activities[iOperation].Level ) {
						this.data._activities[iOperation].parents.push(i);
					}
				}
			} else if( typeof(currentLevel) === 'string' ) { // Current level is a team or resourse or a project
				if( this.data.activities[i].Level === null ) { // The upper level element is an operation
					this.data._activities[iOperation].parents.push(i);
				} else if( currentLevel == 'A' ) {
					if( this.data.activities[i].Level === 'T' ) { // The upper level element is a team
						this.data._activities[iOperation].parents.push(i);
					}
				}
			}
		}
		if(this.data._activities[iOperation].parents.length > 0) {
			this.data._activities[iOperation].parent0Code = this.data.activities[ this.data._activities[iOperation].parents[0] ].Code;
		}	else {
			this.data._activities[iOperation].parent0Code = null;
		}
	}
	
	initDataHelpers() {
		this.data.table = [];
		// Adding a column for expanding rows if required
		if( this.data.table.length === 0 ) {
				this.data.table.push({ 
						ref:"expandColumn", name:"[]", type:null, widthsym:4, hidden:0, format:null, editable:false 
				});
		}
		for( let col = 0 ; col < this.data.fields.length ; col++ ) {
				if( 'hidden' in this.data.fields[col] && this.data.fields[col].hidden === 1 ) {
						continue;
				}
				let editable = ('editable' in this.data.fields[col] && this.data.fields[col].editable===1);
				let widthsym = ('widthsym' in this.data.fields[col]) ? this.data.fields[col].widthsym : null;
				this.data.table.push({
						ref: this.data.fields[col].Code, name:this.data.fields[col].Name, 
						type:this.data.fields[col].Type, format: this.data.fields[col].format,
						editable: editable, widthsym: widthsym
				});
		}
		// Creating editables for better data handling 
		this.data.editables = [];     
		for( let col = 0 ; col < this.data.table.length ; col++ ) {
				if( 'editable' in this.data.table[col] && this.data.table[col].editable ) {
						this.data.editables.push({ 
								ref: this.data.table[col].ref, name:this.data.table[col].name, 
								type:this.data.table[col].type, format: this.data.table[col].format 
						});
				}
		}
				
		// Creating refSettings for better data handling
		this.data.refSettings = {}; 
		for( let col = 0 ; col < this.data.table.length ; col++ ) {
				let o = { column: col, type: this.data.table[col].type, format: this.data.table[col].format, name: this.data.table[col].name, editableType: null };
				for( let ie = 0 ; ie < this.data.editables.length ; ie++ ) { 	// Is editable?
						if( this.data.editables[ie].ref === this.data.table[col].ref ) {
								o.editableType = this.data.editables[ie].type;
						}
				}
				this.data.refSettings[ this.data.table[col].ref ] = o;
		}
	}		

	expandToLevel( level=null ) {
		if( level === null ) {
			level = this.maxExpandableLevel;
		} 
		this.expandedTo = level;
		for( let i = 0 ; i < this.data.activities.length ; i++ ) {
			// console.log(`level=${_data.activities[i].Level}, parents=${_data._activities[i].parents.length}`);
			if( this.data._activities[i].parents.length < level-1 ) {
				this.data._activities[i].expanded = true;
				this.data._activities[i].visible = true;
			} else if( this.data._activities[i].parents.length == level-1 ) {
				this.data._activities[i].expanded = false;
				this.data._activities[i].visible = true;
			} else {
				this.data._activities[i].expanded = false;
				this.data._activities[i].visible = false;
			}
		}
	}

	secondsToDate( date, dateOnly=false ) {
		let spiderDateString = null;
	
		if( typeof(date) === 'undefined' || date === null || date === '' ) {
			return '';
		}
	
		if( typeof(date) !== 'object' ) { 	// Not 'object' implies seconds
			date = new Date( parseInt(date) * 1000 );
		}
		let year = date.getUTCFullYear(); 
		let month = (date.getUTCMonth()+1);
		if( month < 10 ) {
			month = "0" + month;
		}
		let day = date.getUTCDate();
		if( day < 10 ) {
			day = "0" + day;
		}
		if( this.data.parameters.dateDMY ) {
			spiderDateString = day + this.data.parameters.dateDelim + month + this.data.parameters.dateDelim + year; 
		} else {
			spiderDateString = month + this.data.parameters.dateDelim + day + this.data.parameters.dateDelim + year;		 
		}
		if( !dateOnly ) {
			let hours = date.getUTCHours();
			if( hours < 10 ) {
				hours = "0" + hours;
			}
			let minutes = date.getUTCMinutes();
			if( minutes < 10 ) {
				minutes = "0" + minutes;
			}
			spiderDateString += "  " + hours + this.data.parameters.timeDelim +  minutes;
		}
		return( spiderDateString ); 
	}
	
	parseDate( dateString ) {
		if( typeof(dateString) === 'undefined' ) {
			return null;
		}
		if( dateString == null ) {
			return null;
		}
		let date = null;
		let y=null, m=null, d=null, hr=null, mn=null;
		let parsedFull = dateString.match( /([0-9]+)[\.\/\-\:]([0-9]+)[\.\/\-\:]([0-9]+)[ T]+([0-9]+)[\:\.\-\/]([0-9]+)/ );
		if( parsedFull !== null ) {
			if( parsedFull.length == 6 ) {
				y = parsedFull[3];
				if( y.length == 2 )		// If a 2-digit year format
					y = "20" + y;
				if( _globals.dateDMY ) {
					m = parsedFull[2];
					d = parsedFull[1];				
				} else {
					d = parsedFull[2];
					m = parsedFull[1];								
				}
				hr = parsedFull[4];
				mn = parsedFull[5];
				date = new Date(y, m-1, d, hr, mn, 0, 0);
			}
		} else {
			let parsedShort = dateString.match( /([0-9]+)[\.\/\-\:]([0-9]+)[\.\/\-\:]([0-9]+)/ );
			if( parsedShort !== null ) {
				if( parsedShort.length == 4 ) {
					y = parsedShort[3];
					if( y.length == 2 )		// If a 2-digit year format
						y = "20" + y;
					if( _globals.dateDMY ) {
						m = parsedShort[2];
						d = parsedShort[1];					
					} else {
						d = parsedShort[2];
						m = parsedShort[1];										
					}
					hr = 0;
					mn = 0;
					date = new Date(y, m-1, d, hr, mn, 0, 0, 0, 0);
				}
			}
		}
		if( date === null ) {
			return null;
		}
		let timeInSeconds = date.getTime();
		return( { 'date':date, 'timeInSeconds':timeInSeconds/1000 } ); 
	}
	
	isEditable( ref ) {
		return this.data.refSettings[ref].editableType;
		/*
		for( let iE=0 ; iE < _data.editables.length ; iE++ ) {
			let ref = _data.editables[iE].ref;
			if( ref == name ) {
				return _data.editables[iE].type;
			}
		}
		return null;
		*/
	}

	digitsOnly( str ) {
		let l = str.length;
		if( l == 0 ) {
				return false;
		}
		for( let i = 0 ; i < l ; i++ ) {
				if( str[i] === ' ' ) {
						continue;
				}
				if( (str[i] < '0' || str[i] > '9') ) {
						return false;
				}
		}
		return true;
	}	

	reassignBoundaryValue( knownBoundary, newBoundary, upperBoundary ) {
		if( knownBoundary == -1 ) {
			return newBoundary;
		} 
		if( newBoundary == -1 ) {
			return knownBoundary;
		}
		if( !upperBoundary ) { // Min.
			if( newBoundary < knownBoundary ) {
				return newBoundary;			
			} 
		} else { // Max.
			if( newBoundary > knownBoundary ) {
				return newBoundary;			
			} 		
		}
		return knownBoundary;
	}
	
	decColorToString( decColor, defaultColor=null ) {
		if( typeof(decColor) !== 'undefined' ) {		
			if( decColor ) {
				if( this.digitsOnly(decColor) ) {
					decColor = Number(decColor);
					if( decColor > 0xFFFFFF ) {
						return defaultColor;
					}
					let c1 = (decColor & 0xFF0000) >> 16;
					let c1text = c1.toString(16);
					if( c1text.length == 1 ) {
						c1text = "0" + c1text;
					}
					let c2 = (decColor & 0x00FF00) >> 8;
					let c2text = c2.toString(16);
					if( c2text.length == 1 ) {
						c2text = "0" + c2text;
					}
					let c3 = (decColor & 0x0000FF);	  
					let c3text = c3.toString(16);
					if( c3text.length == 1 ) {
						c3text = "0" + c3text;
					}
					return '#' + c3text + c2text + c1text;
				}
			}
		}
		return defaultColor;
	}
	
	createTypeColorMap() 
	{
		if( !('types' in this.data) || this.data.types.length === 0 ) 
		{
			//this.data._typeColorMap = null;
			//return null;
			let c = 0x4f8f4f;
			this.data._typeColorMap = { '-1': (c&0x0000ff)*256*256 + ((c&0x00ff00)>>8)*256 + ((c&0xff0000)>>16) };
			return this.data._typeColorMap;
		}
		this.data._typeColorMap = {};
		for( let item of this.data.types ) {
			let c = parseInt(item['Color']); // This is the SP format: "bgr"
			let t = item['Type'];
			this.data._typeColorMap[t] = (c&0x0000ff)*256*256 + ((c&0x00ff00)>>8)*256 + ((c&0xff0000)>>16);
		}
		return this.data._typeColorMap;
	}

	createActivityIdMap() 
	{
		let data = this.data;
		this.data._activityIdMap = {};
	
		for( let i = 0 ; i < data.activities.length ; i++ ) {
			let activity = data.activities[i];
			if( !(!activity.Level || activity.Level === null || activity.Level === '') ) continue;
			if( !('f_Model' in activity) ) continue;
			if( typeof(activity.f_Model) !== 'string' ) continue;
	
			let ids = [];
			let idss = activity.f_Model.split(',');
			for( let j = 0 ; j < idss.length ; j++ ) {
				const id = parseInt( idss[j] );
				if( isNaN(id) ) continue;
				ids.push( id );
			}
			if( ids.length === 0) continue;
			this.data._activityIdMap[i] = ids;
		}	
		return this.data._activityIdMap;
	}
}
