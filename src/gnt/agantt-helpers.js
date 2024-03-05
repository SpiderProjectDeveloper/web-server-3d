
export function createTimePointerDiv(h) {
	let timePointerDiv = document.createElement('div');
	timePointerDiv.style.display = 'none';
	timePointerDiv.style.position = 'absolute';
	timePointerDiv.style.boxSizing = 'border-box';
	timePointerDiv.style.border = '0px';
	timePointerDiv.style.backgroundColor = 'rgb(255,50,50)';
	timePointerDiv.style.top = '0px';
	timePointerDiv.style.width = '1px';
	timePointerDiv.style.minWidth = '1px';
	timePointerDiv.style.height = h + 'px';
	timePointerDiv.style.pointerEvents = 'none';
	timePointerDiv.style.display = 'none';
	return timePointerDiv;
}

export function createTimePointerPromptDiv() {
	let timePointerPromptDiv = document.createElement('div');
	timePointerPromptDiv.style.display = 'none';
	timePointerPromptDiv.style.position = 'absolute';
	timePointerPromptDiv.style.boxSizing = 'border-box';
	timePointerPromptDiv.style.fontFamily = 'Arial';
	timePointerPromptDiv.style.border = '0px';
	timePointerPromptDiv.style.padding = '4px';
	timePointerPromptDiv.style.backgroundColor = 'rgba(10,10,10,0.5)';
	timePointerPromptDiv.style.color = '#ffffff';
	timePointerPromptDiv.style.fontSize = '10px';
	timePointerPromptDiv.style.top = '0px';
	timePointerPromptDiv.style.width = 'auto';
	timePointerPromptDiv.style.height = 'auto';
	timePointerPromptDiv.style.pointerEvents = 'none';
	timePointerPromptDiv.style.display = 'none';
	timePointerPromptDiv.style.zIndex = 999999;
	return timePointerPromptDiv;
}