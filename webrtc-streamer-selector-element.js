import "./libs/request.min.js";

class WebRTCStreamerSelectorElement extends HTMLElement {	
	static get observedAttributes() {
		return ['selected'];
	}  	
	constructor() {
		super(); 
		this.shadowDOM = this.attachShadow({mode: 'open'});
		this.shadowDOM.innerHTML = `
					<style>@import "styles.css"</style>
					<h2><select id="mediaList"></select></h2>
					`;
	}
	connectedCallback() {
		let mediaList = this.shadowDOM.getElementById("mediaList");
		request("GET" , webrtcConfig.url + "/api/getMediaList").done( (response) => { 
			JSON.parse(response.body).forEach( (media) => {
				var newOption = document.createElement("option");
				newOption.text = media.video;
				newOption.value = JSON.stringify(media);
				if (this.selected && (this.selected === newOption.text) ) {
					newOption.selected = true;
				}
				mediaList.appendChild(newOption);
			});

			if (mediaList.selectedOptions.length > 0) {
				this.dispatchEvent(new CustomEvent('change', {
					detail: {
					  url: mediaList.selectedOptions[0].value,
					}
				  }));				
			}	
		});	

		mediaList.onchange = (event) => {
				this.dispatchEvent(new CustomEvent('change', {
					detail: {
					  url: mediaList.selectedOptions[0].value,
					}
				  }));		
			}
	}
	
	attributeChangedCallback(attrName, oldVal, newVal) {
		if (attrName === "selected") {
			this.selected = newVal;
		}
	}	
}

customElements.define('webrtc-streamer-selector', WebRTCStreamerSelectorElement);
