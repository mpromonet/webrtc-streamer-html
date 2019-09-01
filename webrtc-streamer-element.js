import "./libs/request.min.js";
import "./libs/adapter.min.js";
import "./webrtcstreamer.js";

class WebRTCStreamerElement extends HTMLElement {
	static get observedAttributes() {
		return ['url', 'options', 'webrtcurl', 'notitle'];
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
		this.titleElement = this.shadowDOM.getElementById("title");
		this.videoElement = this.shadowDOM.getElementById("video");
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
		if (attrName === "notitle") {
			this.titleElement.style.visibility = "hidden";
		} else if (this.initialized) {
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
		
		const webrtcurl = this.getAttribute("webrtcurl") || webrtcConfig.url;

		let videostream = webrtcConfig.defaultvideostream;
		let audiostream = webrtcConfig.defaultaudiostream;

		const url = this.getAttribute("url");
		if (url) {
			let urljson = JSON.parse(url);
			if (urljson) {
				videostream = urljson.video;
				audiostream = urljson.audio;
			} else {
				videostream = url;
			}
		}
		const options = this.getAttribute("options") || webrtcConfig.options;
		
		const notitle = this.getAttribute("notitle");
		if (notitle === null) {
			this.titleElement.innerHTML = videostream; 
		}
		
		this.webRtcServer = new WebRtcStreamer(this.videoElement, webrtcurl);
		this.webRtcServer.connect(videostream, audiostream, options);
	}
	
	
}

customElements.define('webrtc-streamer', WebRTCStreamerElement);
