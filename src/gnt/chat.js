import './chat.css';

export class Chat {
	
	constructor( adata, settings={} ) {
		this.adata = adata;
		this.data = adata.data;
		
		this.texts = {
			'en': {
				chatIsBeingLoadedMessage: 'Loading. Please wait...', 
				chatErrorLoadingMessages: 'Error loading messages!',
				chatMessageCanNotBeEmpty: 'A message can not be empty!',
				chatSendMessageError: 'Error sending the message!',
				chatCloseButton: 'Leave',
				chatCancelButton: 'Cancel',
				chatSendButton: 'Send',
				chatUnseenTitle: 'You have new messages:',
				chatNoUnseenMessage: 'You have no unseen messages'
			}, 
			'ru': {
				chatIsBeingLoadedMessage: 'Загрузка. Пожалуйста ждите...', 
				chatErrorLoadingMessages: 'Ошибка при загрузке сообщений!',
				chatMessageCanNotBeEmpty: 'Сообщение не может быть пустым!',
				chatSendMessageError: 'Ошибка при отправке сообщения!',
				chatCloseButton: 'Закрыть чат',
				chatCancelButton: 'Отменить',
				chatSendButton: 'Отправить',
				chatUnseenTitle: 'У вас есть новые сообщения:',
				chatNoUnseenMessage: 'Непросмотренных сообщений нет...'
			}
		};
	
		let server = window.location.protocol + "//" + window.location.host.split(":")[0] + ":" + this.data.parameters.chatPort + "/";

		this.settings = { 
			lang: this.data.parameters.language, msgLimit: 50, server: server,
			chatReadUrl:'.chat_read', chatReadImageUrl: '.chat_read', chatInsertUrl:'.chat_write',
			chatUpdateUrl:'.chat_update', chatRemoveUrl:'.chat_remove',
			chatCheckForNewMessagesTimeout: 30000,
			chatUpdateHTML:'&#9998;', chatSendUpdateHTML:'&#10004;', chatRemoveHTML:'&#10006;', chatCancelEditHTML:'&nwarhk;', 
		};

		this.chatContainerElem = null;
		this.chatActivityTitleElem = null;
		this.chatSendMessageElem = null; 
		this.chatSysMessageElem = null;
		this.chatMessageListElem = null; 
	
		this.chatIsFullyLoaded = false;
		this.chatMessagesNumber = 0;
		this.chatMaxRowId = -1;		
		this.chatIconAttached = null;
		this.chatImageAttached = null;
	}

	assignActivityCredentials(obj) {
		obj.sessId = this.chatActivityCredentials.sessId;
		obj.user = this.chatActivityCredentials.user;
		obj.projectId = this.chatActivityCredentials.projectId;
		obj.activity = this.chatActivityCredentials.activity;
		obj.level = this.chatActivityCredentials.level;
		obj.parent = this.chatActivityCredentials.parent;
	}


	show(i) {
		let parent=null;
		if( 'parents' in this.data._activities[i] && this.data._activities[i].parents.length > 0 ) {
			let pindex = this.data._activities[i].parents[0];
			parent = this.data.activities[pindex]['Code'];
		}
		this.loadAndDisplayChat( this.data.activities[i]['Level'], this.data.activities[i]['Code'], parent, this.data.activities[i]['Name'] );
	}

	loadAndDisplayChat( activityLevel, activityCode, activityParent, activityName ) 
	{
		this.chatIsFullyLoaded = false;

		this.initChat();
		this.showChatWindow( activityCode, activityName );

		this.chatActivityCredentials = { 
			sessId: this.data.parameters.sessId, user: this.data.parameters.user, 
			projectId: this.data.parameters.projectId, 
			activity: activityCode, level: activityLevel, parent: activityParent };

		let xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == 4 ) {
				if( xhttp.status == 200 ) {
					let dataObj = parseJsonString(xhttp.responseText);
					if( dataObj === null || dataObj.errcode !== 0 ) {
						this.displaySysMessage( this.texts[this.settings.lang].chatErrorLoadingMessages );
						return;
					}
					//console.log('dataObj.buffer', dataObj);
					this.displaySysMessage(null);
					this.displayChat( dataObj.buffer );
				} else {
					this.displaySysMessage( this.texts[this.settings.lang].chatErrorLoadingMessages );
				}
			}
		}.bind(this);

		this.displaySysMessage( this.texts[this.settings.lang].chatIsBeingLoadedMessage );
		let jsonObject = { limit:this.settings.msgLimit };
		this.assignActivityCredentials( jsonObject );
		let jsonString = JSON.stringify( jsonObject );
		xhttp.open("POST", this.settings.server + this.settings.chatReadUrl, true);
		xhttp.setRequestHeader("Cache-Control", "no-cache");
		xhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');		
		xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhttp.send( jsonString );
	}

	loadMoreMessages() {
		if( this.chatIsFullyLoaded ) {
			return;
		}
		let xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == 4 ) {
				if( xhttp.status == 200 ) {
					let dataObj = parseJsonString(xhttp.responseText);
					if( dataObj === null || dataObj.errcode !== 0 ) {
						return;
					}
					if( !('buffer' in dataObj) || dataObj.buffer.length < this.settings.msgLimit ) {
						this.chatIsFullyLoaded = true;
					}
					this.displayMoreMessages( dataObj.buffer );
				} else {
					;
				}
			}
		}.bind(this);

		let jsonObject = { 
			limit: this.settings.msgLimit, offset:this.chatMessagesNumber + this.settings.msgLimit 
		};
		this.assignActivityCredentials( jsonObject );
		let jsonString = JSON.stringify( jsonObject );
		xhttp.open("POST", this.settings.server + this.settings.chatReadUrl, true);
		xhttp.setRequestHeader("Cache-Control", "no-cache");
		xhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');		
		xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhttp.send( jsonString );
	}

	showChatWindow( activityCode, activityName ) {
		this.chatContainerElem.style.display = 'block';
		this.chatActivityTitleElem.innerHTML = `<span class='chat-activity-code'>${activityCode}</span>` +
				`&nbsp;//&nbsp;<span class='chat-activity-name'>${activityName}</span>`;
	}

	hideChatWindow() {
		this.chatContainerElem.style.display = 'none';
	}


	initChat() {	
		if( this.chatContainerElem !== null ) {					// If already initialized...
			while( this.chatMessageListElem.hasChildNodes() ) {
				this.chatMessageListElem.removeChild( this.chatMessageListElem.lastChild );
			}
			this.clearImageAttachedToMessageEdited();
			this.setChatMessage('');
			this.onChatMessageInputChange(null);
			this.setChatItemUnderUpdate(null);
			return;
		}

		let containerElem = document.createElement('div');
		containerElem.className = 'chat-container';
		document.body.appendChild(containerElem);
		this.chatContainerElem = containerElem;

		let hmargin = window.innerWidth / 12;
		let vmargin = window.innerHeight / 12;
		let containerElemWidth = window.innerWidth - hmargin*2;
		let containerElemHeight = window.innerHeight - vmargin*2;
		containerElem.style.left = hmargin + 'px';
		containerElem.style.top = vmargin + 'px';
		containerElem.style.height = containerElemHeight + 'px';
		containerElem.style.width = containerElemWidth + 'px';

		let sysMessageElem = document.createElement('div');
		sysMessageElem.innerHTML = '';
		sysMessageElem.className = 'chat-sys-message';
		containerElem.appendChild(sysMessageElem);
		this.chatSysMessageElem = sysMessageElem;

		let activityTitleElem = document.createElement('div');
		activityTitleElem.className = 'chat-activity-title'; 
		containerElem.appendChild(activityTitleElem);
		this.chatActivityTitleElem = activityTitleElem;

		let sendMessageElem = document.createElement('div');
		sendMessageElem.className = 'chat-send-message-container';
		containerElem.appendChild(sendMessageElem);
		this.chatSendMessageElem = sendMessageElem;

		let messageInputElem = document.createElement('textarea');
		messageInputElem.className = 'chat-send-message';
		messageInputElem.rows = 4;
		sendMessageElem.appendChild(messageInputElem);
		this.chatMessageInputElem = messageInputElem;

		let sendButtonElem = document.createElement('input');
		sendButtonElem.type = 'button';
		sendButtonElem.value = this.texts[this.settings.lang].chatSendButton;
		sendButtonElem.className = 'chat-send-button';
		sendMessageElem.appendChild(sendButtonElem);
		this.chatSendButtonElem = sendButtonElem;

		messageInputElem.oninput = function(e) { this.onChatMessageInputChange(e); }.bind(this);
		this.setChatMessage('');

		let imageAttachedPreviewElem = document.createElement('img');
		imageAttachedPreviewElem.className = 'chat-attached-image';
		sendMessageElem.appendChild(imageAttachedPreviewElem);
		this.chatImageAttachedPreviewElem = imageAttachedPreviewElem;

		let cancelAttachedButtonElem = document.createElement('div');
		cancelAttachedButtonElem.innerHTML = '&#128473;';
		cancelAttachedButtonElem.className = 'chat-cancel-attached';
		cancelAttachedButtonElem.onclick = function(e) {
			this.clearImageAttachedToMessageEdited();		
		}.bind(this);
		sendMessageElem.appendChild(cancelAttachedButtonElem);
		this.chatCancelAttachedButtonElem = cancelAttachedButtonElem;

		let attachFileInputElem = document.createElement('input');
		attachFileInputElem.type = 'file';
		attachFileInputElem.addEventListener('change', function(e) {
			this.chatImageAttachListener(e);
		}.bind(this) );
		attachFileInputElem.className = 'chat-file-attach-input';
		sendMessageElem.appendChild(attachFileInputElem);
		this.chatAttachFileInputElem = attachFileInputElem;

		let closeButtonElem = document.createElement('input');
		closeButtonElem.type = 'button';
		closeButtonElem.value = this.texts[this.settings.lang].chatCloseButton;
		closeButtonElem.className = 'chat-close-button';
		sendMessageElem.appendChild(closeButtonElem);
		this.chatCloseButtonElem = closeButtonElem;

		let messageListElem = document.createElement('div');
		messageListElem.className = 'chat-messages-list';
		messageListElem.style.height = (containerElemHeight - 156).toString() + 'px';
		containerElem.appendChild(messageListElem);
		this.chatMessageListElem = messageListElem;

		messageListElem.addEventListener('scroll', function(e) {
			if( messageListElem.scrollTop >= (messageListElem.scrollHeight - messageListElem.offsetHeight) ) {
				this.loadMoreMessages();
			}
		}.bind(this) );

		sendButtonElem.onclick = function(e) {
			this.insertOrUpdate();
		}.bind(this);

		closeButtonElem.onclick = function(e) {
			this.clearImageAttachedToMessageEdited();
			if( this.getChatItemUnderUpdate() ) {	// It is a message being updated - cancelling... 
				this.setUpdatingStyles( this.getChatItemUnderUpdate(), false );
				this.setChatMessage('');
				this.setChatItemUnderUpdate(null);
				return;
			} else { 				// Cancelling the chat window
				this.hideChatWindow();
			}
		}.bind(this);
	}

	displayChat( dataResponse ) {
		for( let i = 0 ; i < dataResponse.length ; i++ ) {
			let fields = dataResponse[i]; 	// 0 - user, 1 - message, 2 - datetime
			if( fields.length < 4 ) {
				continue;
			}
			let rowid;
			try {
				rowid = parseInt(fields.rowid);
			} catch(e) {
				continue;
			}
			let dataItem = { rowid: rowid, user: fields.user, message: fields.message, 
				datetime: this.adata.secondsToDate( fields.datetime ), 
				icon: ((fields.icon) ? fields.icon : null), imageId: ((fields.imageId) ? fields.imageId : null) };
			this.addChatItem( dataItem )
		}

		setTimeout( function() { this.checkForNewMessages() }.bind(this), 
			this.settings.chatCheckForNewMessagesTimeout );
	}

	displayMoreMessages( dataResponse ) {
		for( let i = 0 ; i < dataResponse.length ; i++ ) {
			let fields = dataResponse[i]; 	// 0 - user, 1 - message, 2 - datetime
			if( fields.length < 4 ) {
				continue;
			}
			let dataItem = { rowid: fields.rowid, user: fields.user, message: fields.message, 
				datetime: this.adata.secondsToDate( fields.datetime ),
				icon: ((fields.icon) ? fields.icon : null), imageId: ((fields.imageId) ? fields.imageId : null) };
			this.addChatItem( dataItem );
		}
	}

	displayNewMessages( dataResponse ) {
		for( let i = dataResponse.length -1 ; i >=0 ; i-- ) {
			let fields = dataResponse[i]; 	// 0 - user, 1 - message, 2 - datetime
			if( fields.length < 4 ) {
				continue;
			}
			let dataItem = { rowid: fields.rowid, user: fields.user, message: fields.message, 
				datetime: this.adata.secondsToDate( fields.datetime ),
				icon: ((fields.icon) ? fields.icon : null), imageId: ((fields.imageId) ? fields.imageId : null) };
			this.addChatItem( dataItem, true );
		}
	}


	checkForNewMessages() {
		let xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == 4 ) {
				if( xhttp.status == 200 ) {
					let dataObj = parseJsonString(xhttp.responseText);
					if( dataObj === null || dataObj.errcode !== 0 ) {
						return;
					}
					if( 'buffer' in dataObj && dataObj.buffer.length > 0 ) {					
						this.displayNewMessages( dataObj.buffer );
					}
				} else {
					;
				}
				setTimeout( 
					function() { this.checkForNewMessages(); }.bind(this), 
					this.settings.chatCheckForNewMessagesTimeout 
				);
			}
		}.bind(this);

		let jsonObject = { limit: this.settings.msgLimit, offset:0, rowid: this.chatMaxRowId };
		this.assignActivityCredentials( jsonObject );
		let jsonString = JSON.stringify( jsonObject );
		xhttp.open("POST", this.settings.server + this.settings.chatReadUrl, true);
		xhttp.setRequestHeader("Cache-Control", "no-cache");
		xhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');		
		xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhttp.send( jsonString );	
	}


	addChatItem( dataItem, addFirst = false ) {
		dataItem.meta = {};
		let itemElem = document.createElement('div');
		itemElem.className = (this.data.parameters.user !== dataItem.user) ? 'chat-item' : 'chat-item-user';

		if( !addFirst || this.chatMessageListElem.children.length === 0 ) {
			this.chatMessageListElem.appendChild(itemElem);
		} else {
			this.chatMessageListElem.insertBefore( itemElem, this.chatMessageListElem.children[0] );
		}
		dataItem.meta.itemElem = itemElem;

		let userElem = document.createElement('div');
		userElem.className = 'chat-user';
		userElem.innerHTML = dataItem.user + ':';
		itemElem.appendChild(userElem);
		dataItem.meta.userElem = userElem;

		let messageElem = document.createElement('div');
		messageElem.className = 'chat-message';
		messageElem.innerHTML = dataItem.message;
		itemElem.appendChild(messageElem);
		dataItem.meta.messageElem = messageElem;

		let dateElem = document.createElement('div');
		dateElem.className = 'chat-date';
		let date = dataItem.datetime;
		dateElem.innerHTML = date;
		dataItem.meta.dateElem = dateElem;

		if( 'icon' in dataItem && dataItem.icon && 'imageId' in dataItem && dataItem.imageId > 0 ) {
			let imgElem = document.createElement('img');
			imgElem.src = dataItem.icon;
			itemElem.appendChild(imgElem);
			dataItem.meta.imageElem = imgElem;
			imgElem.className = 'chat-item-image';
			if( !('image' in dataItem) ) { 						// if adding a message just typed in by the user
				imgElem.onclick = function() {
					let xhttp = new XMLHttpRequest();
					xhttp.onreadystatechange = function() {
						if (xhttp.readyState == 4 ) {
							if( xhttp.status == 200 ) {
								let dataObj = parseJsonString(xhttp.responseText);
								if( dataObj === null || dataObj.errcode !== 0 ) {
									return;
								}
								if( 'image' in dataObj && dataObj.image.length > 0 ) {		
									imgElem.src = dataObj.image;			
								}
								imgElem.onclick = null;
							} 
						}
					}
					let jsonObject = { imageId:dataItem.imageId };
					this.assignActivityCredentials( jsonObject );
					let jsonString = JSON.stringify( jsonObject );
					xhttp.open("POST", this.settings.server + this.settings.chatReadUrl, true);
					xhttp.setRequestHeader("Cache-Control", "no-cache");
					xhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');		
					xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
					xhttp.send( jsonString );				
				}
			} else {						// If adding a message read from the SP db - should has an image
				imgElem.onclick = function() {
					imgElem.src = dataItem.image;			
				}
			}
		} 

		if( this.data.parameters.user === dataItem.user ) {
			let removeElem = document.createElement('span');
			removeElem.className = 'chat-remove';
			dateElem.appendChild(removeElem);
			removeElem.innerHTML = this.settings.chatRemoveHTML;
			removeElem.onclick = function(e) { this.remove( dataItem ) }.bind(this);
			dataItem.meta.removeElem = removeElem;

			let updateElem = document.createElement('span');
			updateElem.className = 'chat-update';
			dateElem.appendChild(updateElem);
			updateElem.innerHTML = this.settings.chatUpdateHTML;
			updateElem.onclick = function(e) { this.update( dataItem ) }.bind(this);
			dataItem.meta.updateElem = updateElem;
		}

		itemElem.appendChild(dateElem);
		this.chatMessagesNumber++;
		if( dataItem.rowid > this.chatMaxRowId ) {
			this.chatMaxRowId = dataItem.rowid;
		}
	}

	remove( dataItem ) {
		let xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == 4 ) {
				if( xhttp.status == 200 ) {
					let dataObj = parseJsonString(xhttp.responseText);
					if( dataObj === null || dataObj.errcode !== 0 ) {
						return;
					}
					this.chatMessageListElem.removeChild( dataItem.meta.itemElem );
					//dataItem.itemElem.remove();			
					this.chatMessagesNumber--;
				}
			}
		}.bind(this);

		let jsonObject = { rowid: dataItem.rowid };
		this.assignActivityCredentials( jsonObject )
		let jsonString = JSON.stringify( jsonObject );
		xhttp.open("POST", this.settings.server + this.settings.chatRemoveUrl, true);
		xhttp.setRequestHeader("Cache-Control", "no-cache");
		xhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');		
		xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhttp.send( jsonString );
	}


	insertOrUpdate() {
		let xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == 4 ) {
				if( xhttp.status == 200 ) {
					let dataObj = parseJsonString(xhttp.responseText);
					if( dataObj === null || dataObj.errcode !== 0 ) {
						this.displaySysMessage( this.texts[this.settings.lang].chatSendMessageError )
						return;
					}
					let dataItem = this.getChatItemUnderUpdate();
					if( dataItem ) {	// An existing message was updated
						dataItem.meta.messageElem.innerHTML = this.getChatMessage(true);

						if( this.chatIconAttached && this.chatImageAttached ) { 	// If there is an image attached...
							let imageElem;
							if( 'imageElem' in dataItem.meta ) {		// If there is an img element already appended to this chat item
								imageElem = dataItem.meta.imageElem;
							} else {					// If not - creating one
								imageElem = document.createElement('img');
								dataItem.meta.itemElem.appendChild(imageElem);
								imageElem.className = 'chat-item-image';
							} 	
							let icon = this.chatIconAttached.base64encoded.slice();
							let image = this.chatImageAttached.base64encoded.slice();
							dataItem.icon = icon;
							dataItem.image = image;
							imageElem.src = icon;
							imageElem.onclick = function() {
								imageElem.src = image;
								imageElem.onclick = null;			
							};
							dataItem.meta.imageElem = imageElem;
							dataItem.icon = this.chatIconAttached.base64encoded;
						} else if( 'icon' in dataItem ) { 		// If there is an image elem - the message has (had) image...  
							if( !this.isImageAttachedToMessageEdited() ) {		// If the message no longer has one...
								if( dataItem.meta.imageElem ) { 
									dataItem.meta.itemElem.removeChild( dataItem.meta.imageElem );
									delete dataItem.meta.imageElem;
								}
								delete dataItem.icon;
							}
						}						
						this.setUpdatingStyles(dataItem, false);
						this.setChatItemUnderUpdate(null); 		// delete this.chatDataItemUnderUpdate;
					}
					else {
						let dataItem = { rowid: dataObj.rowid, user: this.data.parameters.user, 
							message: this.getChatMessage(), 
							datetime: this.adata.secondsToDate( dataObj.datetime ) };
						if(	this.chatIconAttached && this.chatImageAttached) {
							dataItem.icon = this.chatIconAttached.base64encoded;
							dataItem.image = this.chatImageAttached.base64encoded;
						}			
						this.addChatItem( dataItem, true );
					}
					this.setChatMessage('');
					this.clearImageAttachedToMessageEdited();
					this.displaySysMessage(null);
				} else{
					this.displaySysMessage( this.texts[this.settings.lang].chatSendMessageError )
				}
			}
		}.bind(this);
		
		let jsonObject = { message: this.getChatMessage() };
		this.assignActivityCredentials( jsonObject );
		let dataItem = this.getChatItemUnderUpdate();
		if( dataItem ) { 	// It is updating, not a new message
			if( this.isImageAttachedToMessageEdited() ) {	// If preview image is not empty - leaving it unchanged
				jsonObject.imageOp	= "unchanged";
			} else {				// If empty - remove
				jsonObject.imageOp	= "remove";
			}
			jsonObject.rowid = dataItem.rowid;
		}
		if( this.chatIconAttached && this.chatImageAttached ) {
			jsonObject.icon = this.chatIconAttached.base64encoded;
			jsonObject.image = this.chatImageAttached.base64encoded;
			jsonObject.width = this.chatImageAttached.width;
			jsonObject.height = this.chatImageAttached.height;
			if( dataItem ) {	// If updating, not inserting
				jsonObject.imageOp = "update";
			}
		}

		let jsonString = JSON.stringify( jsonObject );
		xhttp.open("POST", this.settings.server + ((!dataItem) ? this.settings.chatInsertUrl : this.settings.chatUpdateUrl), true);
		xhttp.setRequestHeader("Cache-Control", "no-cache");
		xhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');		
		xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhttp.send( jsonString );
	}

	setUpdatingStyles( dataItem, isUpdating=true ) {
		if( isUpdating ) {
			dataItem.meta.itemElem.className = 'chat-item-user-updating';
			dataItem.meta.updateElem.className = 'chat-update-updating';
			dataItem.meta.removeElem.className = 'chat-remove-updating';
			dataItem.meta.userElem.className = 'chat-user-updating';
			dataItem.meta.messageElem.className = 'chat-message-updating';
			this.chatCloseButtonElem.innerHTML = this.texts[this.settings.lang].chatCancelButton;
		} else {
			dataItem.meta.itemElem.className = 'chat-item-user';
			dataItem.meta.updateElem.className = 'chat-update';
			dataItem.meta.removeElem.className = 'chat-remove';
			dataItem.meta.userElem.className = 'chat-user';
			dataItem.meta.messageElem.className = 'chat-message';
			this.chatCloseButtonElem.innerHTML = this.texts[this.settings.lang].chatCloseButton;
		}
	}

	update( dataItem ) {
		if( this.getChatItemUnderUpdate() ) {
			return;
		}
		this.clearImageAttachedToMessageEdited();
		this.setUpdatingStyles(dataItem, true);
		this.setChatMessage(dataItem.meta.messageElem.innerHTML, true);
		this.chatMessageInputElem.focus();
		if( 'icon' in dataItem ) {
			this.chatImageAttachedPreviewElem.src = dataItem.icon;
			this.chatImageAttachedPreviewElem.style.display = 'inline-block';
			this.chatCancelAttachedButtonElem.style.display = 'inline-block';
		}
		this.setChatItemUnderUpdate( dataItem ); 
	}

	displaySysMessage( msg ) {
		if( msg === null ) {
			this.chatSysMessageElem.style.display = 'none';
		} else {
			this.chatSysMessageElem.innerHTML = msg;
			this.chatSysMessageElem.style.display = 'block';

		}
	}
	
	setChatItemUnderUpdate(item) {
		if( item ) {
			this.chatDataItemUnderUpdate = item;
			this.chatCloseButtonElem.value = this.texts[this.data.parameters.language].chatCancelButton;
		} else {
			delete this.chatDataItemUnderUpdate;
			this.chatCloseButtonElem.value = this.texts[this.data.parameters.language].chatCloseButton;	
		}
	}
	
	getChatItemUnderUpdate(item) {
		return this.chatDataItemUnderUpdate;
	}
	
	onChatMessageInputChange(e) {
		if( this.chatMessageInputElem.value && this.chatMessageInputElem.value !== '' ) {
			this.chatSendButtonElem.disabled = false;
		} else {
			this.chatSendButtonElem.disabled = true;
		}
	}
	
	setChatMessage( msg, isHtml = false ) {
		this.chatMessageInputElem.value = (!isHtml) ? msg : 
			msg.replace(/<br>/g, '\n').replace(/&lt;/,'<').replace(/&gt;/,'>').replace(/&quot;/g, '"');
		this.onChatMessageInputChange(null);
	}
	
	getChatMessage( isHtml=false ) {
		if( isHtml ) {
			return this.chatMessageInputElem.value.replace(/\</,'&lt;').replace(/\>/,'&gt;').replace(/\n/g, '<br/>').replace(/"/g, '&quot;');
		}
		return this.chatMessageInputElem.value;
	}
	
	
	isImageAttachedToMessageEdited() {
		return (this.chatImageAttachedPreviewElem.style.display !== 'none');
	}
	
	clearImageAttachedToMessageEdited() {
		this.chatIconAttached = null;
		this.chatImageAttached = null;
		this.chatImageAttachedPreviewElem.style.display = 'none';
		this.chatImageAttachedPreviewElem.removeAttribute('src');
		this.chatAttachFileInputElem.value = '';
		this.chatCancelAttachedButtonElem.style.display = 'none';
	}
	
	
	chatImageAttachListener(e) {
		const file = e.target.files[0];
		if( !file ) {
			this.clearImageAttachedToMessageEdited();
			return;
		}
		let originalImg = new Image();	// To make an image from the file chosen
		originalImg.src = URL.createObjectURL(file);
		originalImg.onload = function () {
			this.chatImageAttachedPreviewElem.src = originalImg.src; 	// Diplaying an icon for the user
			this.chatImageAttachedPreviewElem.style.display = 'inline-block';
			this.chatCancelAttachedButtonElem.style.display = 'inline-block';
	
			let originalImageWidth = this.width;
			let originalImageHeight = this.height;
			let widthHeightRatio = originalImageWidth / originalImageHeight;
			let iconHeight = Math.floor( Math.sqrt( 50 * 50 * originalImageHeight / originalImageWidth ) );	// 50x50
			let iconWidth = Math.floor( iconHeight * widthHeightRatio );
			let imageHeight, imageWidth;
			if( originalImageHeight * originalImageWidth < 1200 * 900 ) {
				imageHeight = originalImageHeight;
				imageWidth = originalImageWidth;
			} else {
				imageHeight = Math.sqrt( 1200 * 900 * originalImageHeight / originalImageWidth );	// 12000x900
				imageWidth = imageHeight * widthHeightRatio;
			}
	
			new Compressor( file, {
				quality: 0.6, height: iconHeight, width: iconWidth,		
				success(blob) {
					let iconImg = new Image();
					iconImg.src = URL.createObjectURL(blob);
					iconImg.onload = function() {
						const canvas = document.createElement('canvas');
						const ctx = canvas.getContext('2d');
						canvas.width = iconWidth;
						canvas.height = iconHeight;
						ctx.drawImage(iconImg, 0, 0);
						let base64encoded = canvas.toDataURL('image/jpeg');
						this.chatIconAttached = { width: iconWidth, height: iconHeight, /*blob: blob,*/ base64encoded: base64encoded };
						// console.log("icon=", this.chatIconAttached);
					}
				},
				error(err) { ; }
			});
			new Compressor( file, {
				quality: 0.6, height: imageHeight, width: imageWidth,		
				success(blob) {
					let fullImg = new Image();
					fullImg.src = URL.createObjectURL(blob);
					fullImg.onload = function() {
						const canvas = document.createElement('canvas');
						const ctx = canvas.getContext('2d');
						canvas.width = imageWidth;
						canvas.height = imageHeight;
						ctx.drawImage(fullImg, 0, 0);
						let base64encoded = canvas.toDataURL('image/jpeg');
						this.chatImageAttached = { width: imageWidth, height: imageHeight, /*blob: blob,*/ base64encoded: base64encoded };
					}
				},
				error(err) { ; }
			});
		};
	}
}

function parseJsonString( s ) {
	let parsed;				
		try{
				parsed = JSON.parse(s); 
		} catch(e) {
			//console.log('Error: ' + e.name + ":" + e.message + "\n" + e.stack + "\n" + e.cause);
		return null;
		}
	return parsed;
}

