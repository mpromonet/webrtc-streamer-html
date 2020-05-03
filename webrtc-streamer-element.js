import "./libs/request.min.js";
import "./libs/adapter.min.js";
import "./webrtcstreamer.js";
import "./tensorflow.js";

class WebRTCStreamerElement extends HTMLElement {
	static get observedAttributes() {
		return ['url', 'options', 'webrtcurl', 'notitle', 'width', 'height', 'algo'];
	}  
	
	constructor() {
		super(); 
		this.shadowDOM = this.attachShadow({mode: 'open'});
		this.shadowDOM.innerHTML = `
					<style>@import "styles.css"</style>
					<h2 id="title"></h2>
					<div id="content">
						<video id="video" muted></video>
						<canvas id="canvas"></canvas>
					</div>
					`;
		this.initialized = false;
		this.titleElement = this.shadowDOM.getElementById("title");
		this.videoElement = this.shadowDOM.getElementById("video");
		this.canvasElement = this.shadowDOM.getElementById("canvas");
		this.contentElement = this.shadowDOM.getElementById("content");	
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
		} else if (attrName === "width") {
			this.videoElement.style.width = newVal;
		} else if (attrName === "height") {
			this.videoElement.style.height = newVal;
		} if (this.initialized) {
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
		
		const webrtcurl = this.getAttribute("webrtcurl");

		let videostream;
		let audiostream;

		const url = this.getAttribute("url");
		if (url) {
			try {
				let urljson = JSON.parse(url);
				videostream = urljson.video;
				audiostream = urljson.audio;
			} catch (e) {
				videostream = url;
			}
			
			const options = this.getAttribute("options");
			
			const notitle = this.getAttribute("notitle");
			if (notitle === null) {
				this.titleElement.innerHTML = videostream; 
			}
			this.videoElement.title = videostream;

			this.webRtcServer = new WebRtcStreamer(this.videoElement, webrtcurl);
			this.webRtcServer.connect(videostream, audiostream, options);

			const imgLoaded = new Promise( (resolve,rejet) => {
				this.videoElement.addEventListener('loadeddata', (event) => { 
					resolve(event)
				});
			} );

			let modelLoaded;
			const algo = this.getAttribute("algo");
			if (algo === "posenet") {
				modelLoaded = posenet.load();
				modelLoaded.run = runPosenet;
			} else if (algo === "deeplab") {
				modelLoaded = deeplab.load()
				modelLoaded.run = runDeeplab;
			} else if (algo === "cocossd") {
				modelLoaded = cocoSsd.load();
				modelLoaded.run = runDetect;
			} else {
				modelLoaded = new Promise( (resolve) => resolve() );
			}
		
			Promise.all([imgLoaded, modelLoaded]).then(([event,model]) => {	
				this.setVideoSize(this.videoElement.videoWidth, this.videoElement.videoHeight)

				if (model) {
					modelLoaded.run(model, this.videoElement, this.canvasElement)
				}
			});			
		}
	}	

	setVideoSize(width, height) {
		this.contentElement.style.width = width;
		this.contentElement.style.height = height;				

		this.videoElement.width = width;
		this.videoElement.height = height;

		this.canvasElement.width = width;
		this.canvasElement.height = height;
	}
}

customElements.define('webrtc-streamer', WebRTCStreamerElement);
