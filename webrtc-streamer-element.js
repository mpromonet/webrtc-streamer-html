import "./libs/request.min.js";

class WebRTCStreamerElement extends HTMLElement {
	static get observedAttributes() {
		return ['videostream','audiostream','options', 'webrtcurl'];
	}  
	
	constructor() {
		super(); 
		this.shadowDOM = this.attachShadow({mode: 'open'});
		this.shadowDOM.innerHTML = `
					<style>@import "styles.css"</style>
					<h2 id="title"></h2>
					<video id="video" muted></video>
					`;
	}
	connectedCallback() {
		this.connectStream();
	}
	disconnectedCallback() {
		this.disconnectStream();
	}
	attributeChangedCallback(attrName, oldVal, newVal) {
		this.connectStream();
	}
	
	disconnectStream() {
		if (this.webRtcServer) {
			this.webRtcServer.disconnect();
			this.webRtcServer = null;
		}
	}
	connectStream() {
		this.disconnectStream();
		
		let webrtcurl = this.getAttribute("webrtcurl") || webrtcConfig.url;
		let videostream = this.getAttribute("videostream") || webrtcConfig.defaultvideostream;
		let audiostream = this.getAttribute("audiostream") || webrtcConfig.defaultaudiostream;
		let options = this.getAttribute("options") || webrtcConfig.options;
		
		this.shadowDOM.getElementById("title").innerHTML = videostream; 
		
		let videoElement = this.shadowDOM.getElementById("video");
		this.webRtcServer = new WebRtcStreamer(videoElement, webrtcurl);
		this.webRtcServer.connect(videostream, audiostream, options);
	}
	
	
}

customElements.define('webrtc-streamer', WebRTCStreamerElement);
