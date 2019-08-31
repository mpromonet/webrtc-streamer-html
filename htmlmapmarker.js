class HTMLMapMarker extends google.maps.OverlayView {
    constructor(args) {
      super();
      this._latlng = args.latlng;
      this._html = args.html;
      this._map = args.map;
      this.setMap(args.map);
    }
  
    createDiv() {
      this.div = document.createElement('div');
      this.div.style.position = 'absolute';
      if (this._html) {
        this.div.innerHTML = this._html;
      }

      google.maps.event.addDomListener(this.div, 'click', (event) => {
        event.stopPropagation();

        google.maps.event.trigger(this, 'click', event);
      });        
    }
  
    positionDiv() {
      const point = this.getProjection().fromLatLngToDivPixel(this._latlng);
      if (point) {
        const left = point.x - this.div.clientWidth/2;
        this.div.style.left = `${left}px`;
        const top = point.y - this.div.clientHeight/2;
        this.div.style.top = `${top}px`;
      }
    } 
    onAdd() {
      if (!this.div) {
        this.createDiv();
        this.getPanes().overlayMouseTarget.appendChild(this.div);
      }
      this.positionDiv();
    }

    draw() {
      this.positionDiv();
    }
  
    onRemove() {
      if (this.div) {
        this.div.parentNode.removeChild(this.div);
        this.div = null;
      }
    }

    getPosition() {
      return this._latlng;
    }

    detach() {
      if (this.getMap()) {
        this.setMap(null);
      }
    };

    attach() {
      if (!this.getMap()) {
        this.setMap(this._map);
      }
    };

  }
  
  