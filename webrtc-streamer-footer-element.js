import "./libs/request.min.js";

class WebRTCStreamerFooterElement extends HTMLElement {	
	constructor() {
		super(); 
		this.shadowDOM = this.attachShadow({mode: 'open'});
		this.shadowDOM.innerHTML = `
					<style>@import "styles.css"</style>
					<footer id="footer"></footer>
					`;
	}
	connectedCallback() {
		let footerElement = this.shadowDOM.getElementById("footer");
		request("GET" , webrtcConfig.url + "/api/version").done( function (response) { 
			footerElement.innerHTML = "<p><a href='https://github.com/mpromonet/webrtc-streamer'>WebRTC-Streamer</a> " + JSON.parse(response.body).split(" ")[0] + "</p>";			
		});	
	
	}
}

customElements.define('webrtc-streamer-footer', WebRTCStreamerFooterElement);
