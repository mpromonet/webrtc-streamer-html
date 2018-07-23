var XMPPVideoRoom = (function() {

	
	/** 
	 * Interface with Jitsi Video Room and WebRTC-streamer API
	 * @constructor
	 * @param {string} xmppUrl - url of XMPP server
	 * @param {string} srvurl - url of WebRTC-streamer
	*/
	var XMPPVideoRoom = function XMPPVideoRoom (xmppUrl, srvurl) {	
		this.xmppUrl     = xmppUrl;
		this.handlers    = [];
		this.srvurl      = srvurl || location.protocol+"//"+window.location.hostname+":"+window.location.port;
		this.sessionList = {};
		this.onConnectCallback = [];

		this.connection = new Strophe.Connection(location.protocol+ "//" + xmppUrl + "/http-bind");
		this.connection.addHandler(this.OnJingle, 'urn:xmpp:jingle:1', 'iq', 'set', null, null);
		var bind = this;
		this.connection.connect(xmppUrl, null, function(status) { bind.onConnect(status); });
	};
		

	/** 
	* Ask to publish a stream from WebRTC-streamer in a XMPP Video Room user
	* @param {string} roomid - id of the XMPP Video Room to join
	* @param {string} url - WebRTC stream to publish
	* @param {string} name - name in Video Room
	*/
	XMPPVideoRoom.prototype.join = function(roomid, url, name) {

		var roomUrl = roomid + "@" + "conference." + this.xmppUrl;
		var extPresence = Strophe.xmlElement('nick', {xmlns:'http://jabber.org/protocol/nick'}, name);

		var bind = this;
		if (this.status === Strophe.Status.CONNECTING) {
			this.onConnectCallback.push(function() { bind.connection.muc.join(roomUrl, name, bind.OnMessage, bind.OnPresence, null, null, null, extPresence); } );	
		} else {
			bind.connection.muc.join(roomUrl, name, bind.OnMessage, bind.OnPresence, null, null, null, extPresence);		
		}
	}
		
	XMPPVideoRoom.prototype.OnMessage = function(data)  {
		console.log("OnMessage from:" + data.getAttribute("from") + " to:" + data.getAttribute("to") + " msg:" + data.textContent) 
		return true;
	}
	XMPPVideoRoom.prototype.OnPresence = function(data) {
		console.log("OnPresence from:" + data.getAttribute("from") + " to:" + data.getAttribute("to") );
		return true;
	}

	XMPPVideoRoom.prototype.onReceiveCandidate = function(iq, candidateList) {
		console.log("============candidateList:" +  JSON.stringify(candidateList));
		var jingle = iq.querySelector("jingle");
		var sid = jingle.getAttribute("sid");

		candidateList.forEach(function (candidate) {
			var json = SDPUtil.parse_icecandidate(candidate.candidate);
			console.log("webrtc candidate==================" +  JSON.stringify(json));

			//TODO convert candidate from webrtc to jingle 
			var param = $iq({ type: "set",  from: iq.getAttribute("to"), to: iq.getAttribute("from") })
			var jingle = param.c('jingle', {xmlns: 'urn:xmpp:jingle:1'});
			jingle.attrs({ action: "transport-info",  sid });

			var id = this.connection.sendIQ(jingle, () => {
				console.log("============transport-info ok sid:" + sid);		
			},() => {
				console.log("############transport-info error sid:" + sid);
			});
		});	
	}

	XMPPVideoRoom.prototype.onCall = function(iq, data) {
		console.log("webrtc answer========================" + data.sdp);		
		
		var jingle = iq.querySelector("jingle");
		var sid = jingle.getAttribute("sid");
				
		var sdp = new SDP(data.sdp);
		var iqAnswer = $iq({ type: "set",  from: iq.getAttribute("to"), to: iq.getAttribute("from") })
		var jingle = iqAnswer.c('jingle', {xmlns: 'urn:xmpp:jingle:1'});
		jingle.attrs({ action: "session-accept",  sid, responder:iq.getAttribute("to") });

		var jingleanswer = sdp.toJingle(jingle); 
		var id = this.connection.sendIQ(jingleanswer, () => {
			console.log("============session-accept ok sid:" + sid);
				
			var method = this.srvurl + "/api/getIceCandidate?peerid="+ sid;
			request("GET" , method).done( function (response) { 
					if (response.statusCode === 200) {
						this.onReceiveCandidate(jingleanswer.node,JSON.parse(response.body));
					}
					else {
						this.onError(response.statusCode);
					}
				}
			);			
		},() => {
			console.log("############session-accept error sid:" + sid);
		});
	}
	
	XMPPVideoRoom.prototype.onError = function (error) {
		console.log("############onError:" + error)
	}
		
	XMPPVideoRoom.prototype.OnJingle = function(iq) {
		console.log("OnJingle from:" + iq.getAttribute("from") + " to:" + iq.getAttribute("to") + " action:" +  iq.querySelector("jingle").getAttribute("action"));
		var jingle = iq.querySelector("jingle");
		var sid = jingle.getAttribute("sid");
		var action = jingle.getAttribute("action");

		if (action === "session-initiate") {	
			var sdp = new SDP('');
			sdp.fromJingle($(jingle));

			console.log("xmpp offer============sdp:" + sdp.raw);
			var webrtcStream = document.querySelector('#webrtcStream').value;
			var method = this.srvurl + "/api/call?peerid="+ sid +"&url="+encodeURIComponent(webrtcStream)+"&options="+encodeURIComponent("rtptransport=tcp");
			request("POST" , method, {body:JSON.stringify({type:"offer",sdp:sdp.raw})}).done( function (response) { 
					if (response.statusCode === 200) {
						this.onCall(iq,JSON.parse(response.body));
					}
					else {
						this.onError(response.statusCode);
					}
				}
			);
			this.sessionList[sid]=iq;
			
			var ack = $iq({ type: "result",  from: iq.getAttribute("to"), to: iq.getAttribute("from"), id:iq.getAttribute("id") })
			this.connection.sendIQ(ack);		

		} else if (action === "transport-info") {

			var session = this.sessionList[sid];
			console.log("xmpp candidate============sid:" + sid);

			var contents = $(jingle).find('>content');
			contents.each( (contentIdx,content) => {
				var transports = $(content).find('>transport');
				transports.each( (idx,transport) => {
					var ufrag = transport.getAttribute('ufrag');
					var candidates = $(transport).find('>candidate');
					candidates.each ( (idx,candidate) => {
						var sdp = SDPUtil.candidateFromJingle(candidate);
						sdp = sdp.replace("a=candidate","candidate");
						sdp = sdp.replace("\r\n"," ufrag " + ufrag + "\r\n");
						var candidate = { candidate:sdp, sdpMid:"", sdpMLineIndex:contentIdx }
						console.log("send webrtc candidate============:" + JSON.stringify(candidate));
			
						var method = this.srvurl + "/api/addIceCandidate?peerid="+ sid;
						request("POST" , method, { body: JSON.stringify(candidate) }).done( function (response) { 
								if (response.statusCode === 200) {
									console.log("method:"+method+ " answer:" +response.body);
								}
								else {
									this.onError(response.statusCode);
								}
							}
						);							
					});
				});
			});
	
			var ack = $iq({ type: "result",  from: iq.getAttribute("to"), to: iq.getAttribute("from"), id:iq.getAttribute("id") })
			this.connection.sendIQ(ack);		
		}
					
		return true;		
	}
	
	XMPPVideoRoom.prototype.onConnect = function(status)
	{		
		this.status = status;
	    if (status === Strophe.Status.CONNECTING) {
			console.log('Strophe is connecting.');
	    } else if (status === Strophe.Status.CONNFAIL) {
			console.log('Strophe failed to connect.');
	    } else if (status === Strophe.Status.DISCONNECTING) {
			console.log('Strophe is disconnecting.');
	    } else if (status === Strophe.Status.DISCONNECTED) {
			console.log('Strophe is disconnected.');
	    } else if (status === Strophe.Status.CONNECTED) {
			console.log('Strophe is connected.');
			
			// disco stuff
			if (this.connection.disco) {
				this.connection.disco.addIdentity('client', 'web');
				this.connection.disco.addFeature(Strophe.NS.DISCO_INFO);
				this.connection.disco.addFeature(Strophe.NS.CAPS);
				this.connection.disco.addFeature("urn:xmpp:jingle:1");
				this.connection.disco.addFeature("urn:xmpp:jingle:apps:rtp:1");
				this.connection.disco.addFeature("urn:xmpp:jingle:transports:ice-udp:1");
				this.connection.disco.addFeature("urn:xmpp:jingle:transports:raw-udp:1");
				this.connection.disco.addFeature("urn:xmpp:jingle:apps:dtls:0");
				this.connection.disco.addFeature("urn:xmpp:jingle:apps:rtp:audio");
				this.connection.disco.addFeature("urn:xmpp:jingle:apps:rtp:video");
				this.connection.disco.addFeature("urn:ietf:rfc:5761") // rtcp-mux
			}

			while (this.onConnectCallback.length) {
				var cb = this.onConnectCallback.shift();
				cb();
			}
		}
		
	}
		
	XMPPVideoRoom.prototype.disconnect = function () {
		if (this.connection) {
			Object.keys(this.sessionList).forEach( (sid) => {
			
				var param = $iq({ type: "set",  from: roomUrl +"/" + userName, to: roomUrl })
				var jingle = param.c('jingle', {xmlns: 'urn:xmpp:jingle:1'});
				jingle.attrs({ action: "session-terminate",  sid});
			
				var method = this.srvurl + "/api/hangup?peerid="+ sid;
				request("GET" , method).done( function (response) { 
						if (response.statusCode === 200) {
							console.log("method:"+method+ " answer:" +response.body);
						}
						else {
							this.onError(response.statusCode);
						}
					}
				);					
			});
		
			this.connection.muc.leave(roomUrl, userName);
			this.connection.flush();
			this.connection.disconnect();
		}
		this.connection = null;
	}

	return XMPPVideoRoom;
})();

module.exports = XMPPVideoRoom;
