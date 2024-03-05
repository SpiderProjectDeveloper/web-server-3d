
export function calcProgress( adata, timeInSeconds, compare=false ) {
	let data = adata.data;
	let activityIdMap = adata.data._activityIdMap;

	let progress = [];
	let progressCompare = [];

	for( let i = 0 ; i < data.activities.length ; i++ ) {
		let o = data.activities[i];
		if( !(!o.Level || o.Level === null || o.Level === '') ) { 	// If not an operation - continue
			continue;
		}
		if( !(i in activityIdMap) ) continue;

		let progressPct = null;
		let progressComparePct = null;

		let vol = 0;
		for( let wi = 0 ; wi < data.performance.length ; wi++ ) {
			let w = data.performance[wi];
			if( w.OperCode != o.Code ) {
				continue;
			}
			if( w.StartInSeconds > timeInSeconds ) {			
				continue; 
			}
			if( w.FinInSeconds < timeInSeconds ) {
				vol += w.Vol;
				continue;				
			}

			let timeSpan =  w.FinInSeconds - w.StartInSeconds;
			if( !(timeSpan > 0) ) {
				vol += w.Vol;
				continue;
			}
			let volShare = (timeInSeconds - w.StartInSeconds) * w.Vol / timeSpan;
			vol += volShare;
		}   	
		let plan = (typeof(o.VolPlan) === 'number') ? o.VolPlan : 0;
		let fact = (typeof(o.VolFact) === 'number') ? o.VolFact : 0;
		let volTotal = plan+fact;
		if( volTotal > 0 )
			progressPct = parseInt( vol * 100 / volTotal );
		else 
			progressPct = 0;
		if( progressPct < 100 ) { 
			if( o.AsapStartInSeconds != -1 && o.AsapFinInSeconds != -1 ) {
				if( timeInSeconds >= o.AsapStartInSeconds ) {
					if( timeInSeconds >= o.AsapFinInSeconds ) {
						progressPct = 100;
					} else {
						if( volTotal > 0 && 'VolPlan' in o && typeof(o.VolPlan) === 'number' ) {
							let volPart = (timeInSeconds - o.AsapStartInSeconds + 1) * o.VolPlan / (o.AsapFinInSeconds - o.AsapStartInSeconds + 1);
							progressPct += parseInt( volPart * 100 / volTotal );
						} else {
							let volPart = (timeInSeconds - o.AsapStartInSeconds + 1) / (o.AsapFinInSeconds - o.AsapStartInSeconds + 1);
							progressPct = parseInt(volPart*100);
						}
					}
				} 
			}
		}

		if( compare && 'Start_COMPInSeconds' in o && 'Fin_COMPInSeconds' in o ) {
			if( o.Start_COMPInSeconds != -1 && o.Fin_COMPInSeconds != -1 ) {
				if( timeInSeconds < o.Start_COMPInSeconds ) {
					progressComparePct = 0;
				} else if( timeInSeconds > o.Fin_COMPInSeconds ) {
					progressComparePct = 100;
				} else {
					let compareTimeSpan = o.Fin_COMPInSeconds - o.Start_COMPInSeconds;
					if( !(compareTimeSpan > 0) ) {
						progressComparePct = 100;
					} else {
						progressComparePct = (timeInSeconds - o.Start_COMPInSeconds) / compareTimeSpan;
					}
				}
			}
		}

		if( progressPct !== null ) {
			progress.push( [i, progressPct] );
		}
		if( compare && progressComparePct !== null ) {
			progressCompare.push( [i, progressComparePct] );
		}
	}
	
	if( compare ) 
		return [ progress, progressCompare ];
	else 
		return progress;
}
