import './index.css';
import { Initializer } from './initializer';
import { Ifc } from './ifc'; 
import { GnT } from './gnt/gnt';
import { AData } from './adata';
import { WindowWidthResizeWidget } from './WindowWidthResizeWidget';
import { ContextMenu } from './contextmenu';
import { MessageBox } from './messagebox';
import { calcProgress } from './index-helpers';
import { ColorCodingWindow } from './colorcodingwindow';
import { Locale } from './locale';

const pickColor = 0xa0a040;
const modelColor = 0xdfdfdf;
const modelOpacity = 0.25;

const highlightColor = 'rgba(100, 100, 255, 0.25)';
const hoverHighlightColor = 'rgba(200, 200, 255, 0.25)';

const initer = new Initializer();

const locale = new Locale( (initer.lang) ? initer.lang : undefined );

if( !initer.projectId || !initer.user || !initer.sessId ) {
	const mb = new MessageBox();
	mb.show( locale.msg('auth_error') );
}

const _ifc = new Ifc( initer, 
	{ pickColor:pickColor, modelColor:modelColor, modelOpacity:modelOpacity, locale:locale } 
);

// *** Data & Gantt section

const _adata = new AData({}, initer.projectId, initer.user, initer.sessId );

var _gnt = null;

const onDataLoad = function( status, adata ) {
	document.getElementById('header-project-name').innerHTML = 
		`${_adata.data.project.Name} [${_adata.data.project.Version}]`;

	// Initializing the play speed 
	document.getElementById('header-speed-input').value = 
		Math.round( (_adata.data._time.max - _adata.data._time.min) / (60*60) / 40 ); 

	let typeColorMap  = _adata.createTypeColorMap();
	if( typeColorMap || true ) {
		_ifc.setHighlightColorMap(typeColorMap);
	}

	let activityIdMap = _adata.createActivityIdMap();

	const cmenu = new ContextMenu( { fontSize: '12px' } );
	const menuCallback = function(i, e) {
		let cmenuItems = [];
		cmenuItems.push( ['Option', (i) => { return; }, i] ); 
		// cmenu.show( e, cmenuItems );	
	}
	_gnt = new GnT('gnt', adata, 
		{ highlightColor: highlightColor, hoverHighlightColor: hoverHighlightColor }, 
		{ 
			highlightCallback: null, //function(i, t, e) { return; },  
			isHighlightEnabled: null, // function() { return true; },
			menuCallback: null, // menuCallback
			timePointerOn: true,
			timePointerCallback: function(tm, e) { 
				let progress = calcProgress(_adata, tm); 
				_ifc.drawProgress( _adata, progress );
				displayDateTimeInHeader(tm);
			}
		} 
	);

	// "Color - work type" window tooltip
	let ccWin = new ColorCodingWindow(
		_adata.data, 
		{ windowTitle: locale.msg('color_coding'), msgUnavailable: locale.msg('color_coding_unavailable') } 
	);
	const colorCodingButtonElem = document.getElementById('header-color-coding-button');
	colorCodingButtonElem.addEventListener( 'click', function(e) { ccWin.show(); }, false );	

	let ifcUrl = _adata.settings.modelUrl + '?' + initer.projectId;
	_ifc.loadModel( ifcUrl );
};

_adata.load( onDataLoad );
// ****

window.addEventListener('contextmenu', function(e) { e.preventDefault(); return true; });

document.body.addEventListener( 'selectstart', function(e) { e.preventDefault(); return false; } );
document.body.addEventListener( 'selectend', function(e) { e.preventDefault(); return false; } );

const gntResizeWidget = new WindowWidthResizeWidget( 
	document.getElementById('gnt'), 1, 
	function( width ) {
		_gnt.fitContainerWidth();
	}
);

const playButtonElem = document.getElementById('header-play-button');
playButtonElem.addEventListener( 'click', function(e) { play(); }, false );

const pauseButtonElem = document.getElementById('header-pause-button');
pauseButtonElem.addEventListener( 'click', function(e) { pause(); }, false );

document.getElementById('header-speed-prompt').innerHTML = locale.msg('speed_prompt')

document.getElementById('header-hide-not-started-prompt').innerHTML = locale.msg('hide_not_started');
document.getElementById('header-hide-not-started-input').onchange = function(e) {
	if( _ifc.ifcModel === null ) return;

	if( e.currentTarget.checked ) {
		_ifc.setModelColor('hide');
	} else {
		_ifc.setModelColor();
	}
}

const helpButtonElem = document.getElementById('header-help-button');
helpButtonElem.addEventListener( 'click', function(e) {
		let mb = new MessageBox( { textAlign:'left' } );
		mb.confirm( 
			locale.helpText(), locale.helpTitle(), 
			100, 100, window.innerWidth - 200, window.innerHeight - 200 
		);
	} 
);

function pause() {
	pauseButtonElem.style.display = 'none';
	playButtonElem.style.display = 'inline-block';
}

function play( ) {
	if( pauseButtonElem.style.display === 'inline-block' ) return; 	// Is playing now?

	const mb = new MessageBox();	
	if( _ifc.ifcModel === null ) {
		mb.confirm(locale.msg('ifc_not_loaded'));
		return;
	}			
	let playSpeed = parseInt(document.getElementById('header-speed-input').value);
	if( !playSpeed || isNaN(playSpeed) ) {
		mb.confirm(locale.msg('play_speed_incorrect'));
		return;
	}

	playButtonElem.style.display = 'none';
	pauseButtonElem.style.display = 'inline-block';

	const step = function( _tm ) {
		if( playButtonElem.style.display === 'inline-block' ) return; 	// Was stopped?

		let tm = _tm + playSpeed*60*60;
		let tmX = _gnt.agantt.timeToScreen(tm);
		if( tmX > _gnt.agantt.w / 2 ) { 		// If the time pointer passes the middle of the screen
			let _tmX = _gnt.agantt.timeToScreen(_tm); 	// scrolling the gantt chart
			_gnt.agantt.hscroll.scrollLeft(tmX - _tmX);	
		}
		_gnt.agantt.setTimePointer(tm, _tm);		// Positioning the time pointer accordingly
		let progress = calcProgress(_adata, tm); 
		displayDateTimeInHeader(tm);
		_ifc.drawProgress( _adata, progress );
		if( !(tm < _adata.data._time.max) ) {
			pause();
			return;
		}
		setTimeout( function() { step(tm); }, 1000 );
	}

	let startTime = (_gnt.agantt.timePointer) ? _gnt.agantt.timePointer : _adata.data._time.min;	
	if( !(startTime < _adata.data._time.max) ) {
		startTime = _adata.data._time.min;
	}
	step(startTime);
}


function displayDateTimeInHeader(tm) {
	document.getElementById('header-datetime').innerHTML = _adata.secondsToDate(tm, true);
}
