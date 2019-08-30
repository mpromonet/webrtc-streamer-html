import "./libs/request.min.js";
import "./libs/adapter.min.js";
import "./webrtcstreamer.js";

class WebRTCStreamerElement extends HTMLElement {
	static get observedAttributes() {
		return ['url', 'options', 'webrtcurl'];
	}  
	
	constructor() {
		super(); 
		this.shadowDOM = this.attachShadow({mode: 'open'});
		this.shadowDOM.innerHTML = `
					<style>@import "styles.css"</style>
					<h2 id="title"></h2>
					<video id="video" muted></video>
					`;
		this.initialized = false;
	}
	connectedCallback() {
		this.connectStream();
		this.initialized = true;
	}
	disconnectedCallback() {
		this.disconnectStream();
		this.initialized = false;
	}
	attributeChangedCallback(attrName, oldVal, newVal) {
		if (this.initialized) {
			this.connectStream();
		}
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
		let url = this.getAttribute("url");
		let videostream = webrtcConfig.defaultvideostream;
		let audiostream = webrtcConfig.defaultaudiostream;
		if (url) {
			let urljson = JSON.parse(url);
			if (urljson) {
				videostream = urljson.video;
				audiostream = urljson.audio;
			} else {
				videostream = url;
			}
		}
		let options = this.getAttribute("options") || webrtcConfig.options;
		
		this.shadowDOM.getElementById("title").innerHTML = videostream; 
		
		let videoElement = this.shadowDOM.getElementById("video");
		this.webRtcServer = new WebRtcStreamer(videoElement, webrtcurl);
		this.webRtcServer.connect(videostream, audiostream, options);
	}
	
	
}

customElements.define('webrtc-streamer', WebRTCStreamerElement);
