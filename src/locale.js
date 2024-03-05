export class Locale {

	constructor(lang='en') {
		this.lang = lang;

		this.helpButtonText = 'ℹ';
		this.playButtonText = '⏵︎';
		this.pauseButtonText = '⏸︎';
		this.workTypesButtonText = '⚒⚒⚒';

		this.texts = {
			undefined: { en: '', ru: '' },
			success: { en: 'Done!', ru: 'Готово!' },
			loaded: { en: 'Loaded', ru: 'Загружено' },
			bytes: { en: 'bytes', ru: 'байт' },
			auth_error: { en: 'Authentification error!', ru: 'Ошибка авторизации' },
			wait_loading_ifc: { 
				en: 'Please wait while loading IFC geometry', 
				ru: 'Подождите, пока загружается IFC-файл'
			},
			ifc_not_loaded: { en: 'The IFC file has not been loaded...', ru: 'Не удалось загрузить IFC-файл' },
			play_speed_incorrect: { 
				en:'Please specify the play speed correctly...', 
				ru:'Неверно указана скорость воспроизведения'
			},
			hide_not_started: { en: 'Hide Not Started', ru: 'Скрывать неначатое'},
			check_all_title: { en: 'Check all elements', ru: 'Выбрать все элементы'},
			uncheck_all_title: { en: 'Uncheck all elements', ru: 'Очистить выбор для всех элементов'},
			check_by_types_title: { en: 'Check all elements of a chosen type(s)', ru: 'Выбрать все элементы определенного типа(ов)'},
			node_title: { en: 'Node Title:' , ru: 'Имя захватки:' },
			color_coding: { en: 'Color => Work Type' , ru: 'Цвет => Тип работы' },
			color_coding_unavailable: { en: 'Color coding by work type is unavailable' , ru: 'Цветовое кодирование по типу работы не задано!' },
			wait_loading: {
				en: 'Please wait while loading the .ifc file',
				ru: 'Пожалуйста, подождите пока загружается .ifc файл'
			},
			ifc_file: { en: '.IFC file', ru: '.IFC файл' },
			ifc_file_title: { 
				en: 'An .IFC file', 
				ru: '.IFC файл, на основе которого будет создан проект в Спайдер Проджект' 
			},
			picked_element: { en: 'Picked Element', ru: 'Выбранный элемент' },
			select_by_type: { en: 'Select by Type', ru: 'Выбрать по типу' },
			speed_prompt: { en: 'Hours/Sec.', ru: 'Час./сек.' },
			help_title: { en: 'Help', ru: 'Справка' },
			help_text: { 
				en: `After clicking the ${this.playButtonText} button the timeline pointer on the Gantt Chart starts to move and the model displayed would change it's view accordingly painting finished and partly finished elements with appropriate colors. As well you may click the timeline to arbitrarily choose a moment time&nbsp;- the 3d view would change accordingly.`,
				ru: `Нажмите кнопку ${this.playButtonText}. Индикатор временной шкалы на диаграмме Гантта начнет двигаться, а 3D-модель будет менять закраску своих элементов, сообразно их готовности и ходу выполнения работ. Вы также можете щелкнуть мышью на временной шкале, выбрав тем самым интересующий вас момент времени. На изображении 3D-модели будет показано состояние объекта, соответствующее данному временному моменту.`
			}
		}
	}

	helpText() {
		return this.texts.help_text[this.lang];
	}

	helpTitle() {
		return this.texts.help_title[this.lang];
	}

	setLang( lang ) {
		this.lang = lang;
	}

	msg( msgCode ) {
		let msgTexts = this.texts[msgCode];
		if( !msgTexts ) {
			return msgTexts.undefined[this.lang];
		}
		let msgText = msgTexts[this.lang];
		if( !msgText ) {
			return msgTexts.en;
		}
		return msgText;
	}
}