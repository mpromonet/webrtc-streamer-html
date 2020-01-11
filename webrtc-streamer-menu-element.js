import "./libs/request.min.js";

class WebRTCStreamerMenuElement extends HTMLElement {	
	static get observedAttributes() {
		return ['selected', 'webrtcurl'];
	}  	
	constructor() {
		super(); 
		this.shadowDOM = this.attachShadow({mode: 'open'});
		this.shadowDOM.innerHTML = `
					<style>@import "styles.css"</style>
					<nav id="mediaList"></nav>
					`;
	}
	connectedCallback() {
		this.fillList();
	}
	
	attributeChangedCallback(attrName, oldVal, newVal) {
		if (attrName === "selected") {
			this.selected = newVal;
			let mediaList = this.shadowDOM.getElementById("mediaList");
			for (const option of mediaList.getElementsByTagName('a')) {
				if (option === newVal) {
					option.selected = true;
				}
			}

		} else if (attrName === "webrtcurl") {
			this.fillList();
		}
	}	

	fillList() {
		let mediaList = this.shadowDOM.getElementById("mediaList");
		const webrtcurl = this.getAttribute("webrtcurl") || "";
		request("GET" , webrtcurl + "/api/getMediaList").done( (response) => { 
			JSON.parse(response.body).forEach( (media) => {
				var option = document.createElement("a");
				option.text = media.video;
				option.value = JSON.stringify(media);
				option.id   = "nav_" + newOption.value;
				if (this.selected && (this.selected === newOption.text) ) {
					option.className = "active";
				}
				option.onclick = () => { 
					if (option.className === "active") {
						option.className = "";
						this.dispatchEvent(new CustomEvent('remove', {
							detail: {
							  url: option.value,
							}
						  }));					  					
					} else {
						option.className = "active";	
						this.dispatchEvent(new CustomEvent('change', {
							detail: {
							  url: option.value,
							}
						  }));							
					}
				}
				mediaList.appendChild(newOption);
			});

			for (const option of mediaList.getElementsByTagName('a')) {
				if (option.className === "active") {
					this.dispatchEvent(new CustomEvent('change', {
						detail: {
						  url: option.value,
						}
					  }));						
				}
			}
		});	
	}
}

customElements.define('webrtc-streamer-menu', WebRTCStreamerMenuElement);
