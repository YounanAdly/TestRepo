// src/app/map/map.component.ts
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="map-container">
      <div #mapContainer class="map"></div>
      <div class="controls">
        <button (click)="clearMarkers()">Clear Markers</button>
        <button (click)="goToMyLocation()">My Location</button>
      </div>
      <div class="info-text mx-5">Click on the map to add markers</div>
    </div>
  `,
  styles: [`
    .map-container {
      position: relative;
      height: 500px;
      width: 500px;
    }

    .map {
      height: 100%;
      width: 100%;
      z-index: 1;
    }

    .controls {
      position: absolute;
      bottom: 20px;
      left: 20px;
      z-index: 1000;
      display: flex;
      gap: 10px;
    }

    button {
      padding: 10px 15px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    button:hover {
      background-color: #45a049;
    }

    .info-text {
      position: absolute;
      top: 10px;
      left: 20px;
      z-index: 1000;
      background-color: rgba(255, 255, 255, 0.9);
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;
      color: #333;
    }

    .coords-display {
      position: absolute;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      background-color: white;
      padding: 15px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      font-size: 12px;
      line-height: 1.8;
    }

    .editable-name {
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 3px;
      transition: background-color 0.2s;
    }

    .editable-name:hover {
      background-color: #f0f0f0;
    }

    .name-input {
      width: 100%;
      padding: 4px;
      border: 1px solid #4CAF50;
      border-radius: 3px;
      font-size: 12px;
    }
  `]
})
export class MapComponent implements OnInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  
  private map!: any;
  private markerGroup: any;
  private markers: any[] = [];
  private markerNames: Map<any, string> = new Map();
  private selectedMarker: any = null;
  private L: typeof import('leaflet') | null = null;
  selectedMarkerCoords: { lat: number; lng: number } | null = null;
  markerName: string = '';
  editingName: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.L = await import('leaflet');
      this.markerGroup = this.L.featureGroup();
      
      // Wait for DOM to be ready
      setTimeout(() => this.initMap(), 100);
    }
  }

  private initializeDefaultMarker() {
    const lat = 25.29000366093246;
    const lng = 55.355098255821794;
    const name = 'Islamic Affairs & Charitable Activities Department';
    
    this.createMarker(lat, lng);
    this.markerName = name;
    this.markerNames.set(this.selectedMarker, name);
    this.updateMarkerName();
    
    // Center map on default marker
    if (this.map) {
      this.map.setView([lat, lng], 15);
    }
  }

  private initMap() {
    if (!this.L || !this.mapContainer) return;

    try {
      // Create map centered on a default location
      this.map = this.L.map(this.mapContainer.nativeElement).setView([51.505, -0.09], 13);

      // Add tile layer (OpenStreetMap)
      this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        // attribution: false
      }).addTo(this.map);

      // Add marker group to map
      this.markerGroup.addTo(this.map);

      // Invalidate size to ensure map renders correctly
      this.map.invalidateSize();

      // Handle map click to add markers
    //   this.map.on('click', (e: any) => {
    //     this.createMarker(e.latlng.lat, e.latlng.lng);
    //   });

      // Fix Leaflet icon issue
      this.fixLeafletIcons();

      // Initialize default marker
      this.initializeDefaultMarker();
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  private createMarker(lat: number, lng: number) {
    if (!this.L) return;

    const marker = this.L.marker([lat, lng], { draggable: true })
      .bindPopup(`Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`)
      .addTo(this.markerGroup)
      .openPopup();

    // Update coordinates when marker is moved
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      this.selectedMarkerCoords = { lat: pos.lat, lng: pos.lng };
      this.selectedMarker = marker;
      marker.setPopupContent(`Lat: ${pos.lat.toFixed(6)}<br>Lng: ${pos.lng.toFixed(6)}`);
      console.log('Marker position:', this.selectedMarkerCoords);
    });

    // Set coordinates on click (even if just created)
    marker.on('click', (e: any) => {
      e.originalEvent.stopPropagation();
      const pos = marker.getLatLng();
      this.selectedMarkerCoords = { lat: pos.lat, lng: pos.lng };
      this.selectedMarker = marker;
      this.markerName = this.markerNames.get(marker) || '';
      console.log('Marker selected:', this.selectedMarkerCoords);
    });

    this.markers.push(marker);
    this.selectedMarkerCoords = { lat, lng };
    this.selectedMarker = marker;
    this.markerName = '';
  }

  private fixLeafletIcons() {
    if (!this.L) return;
    const iconRetinaUrl = 'assets/leaflet/marker-icon-2x.png';
    const iconUrl = 'assets/leaflet/marker-icon.png';
    const shadowUrl = 'assets/leaflet/marker-shadow.png';

    const defaultIcon = this.L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });

    this.L.Marker.prototype.setIcon(defaultIcon);
  }

  clearMarkers() {
    if (!isPlatformBrowser(this.platformId) || !this.L) return;
    this.markers.forEach(marker => this.markerGroup.removeLayer(marker));
    this.markers = [];
    this.selectedMarkerCoords = null;
    this.selectedMarker = null;
  }

  removeSelectedMarker() {
    if (!this.selectedMarker) {
      console.log('No marker selected');
      return;
    }
    
    try {
      // Remove from marker group
      this.markerGroup.removeLayer(this.selectedMarker);
      
      // Remove from markers array
      const index = this.markers.indexOf(this.selectedMarker);
      if (index > -1) {
        this.markers.splice(index, 1);
      }
      
      // Remove from names map
      this.markerNames.delete(this.selectedMarker);
      
      this.selectedMarker = null;
      this.selectedMarkerCoords = null;
      this.markerName = '';
      this.editingName = false;
      console.log('Marker removed successfully');
    } catch (error) {
      console.error('Error removing marker:', error);
    }
  }

  updateMarkerName() {
    if (!this.selectedMarker) return;
    
    const name = this.markerName || 'Unnamed';
    const lat = this.selectedMarkerCoords?.lat.toFixed(6);
    const lng = this.selectedMarkerCoords?.lng.toFixed(6);
    
    // Store name in map
    this.markerNames.set(this.selectedMarker, this.markerName);
    
    this.selectedMarker.setPopupContent(`<strong>${name}</strong><br>Lat: ${lat}<br>Lng: ${lng}`);
    console.log('Marker name updated:', name);
  }

  goToMyLocation() {
    if (!isPlatformBrowser(this.platformId) || !this.L) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        this.map.setView([latitude, longitude], 15);
        
        const marker = this.L!.marker([latitude, longitude], { draggable: true })
          .bindPopup('Your Location')
          .addTo(this.markerGroup)
          .openPopup();

        // Update coordinates when marker is moved
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          this.selectedMarkerCoords = { lat: pos.lat, lng: pos.lng };
          this.selectedMarker = marker;
          marker.setPopupContent(`Your Location - ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
        });

        marker.on('click', (e: any) => {
          e.originalEvent.stopPropagation();
          const pos = marker.getLatLng();
          this.selectedMarkerCoords = { lat: pos.lat, lng: pos.lng };
          this.selectedMarker = marker;
          this.markerName = this.markerNames.get(marker) || '';
        });
        
        this.markers.push(marker);
        this.selectedMarkerCoords = { lat: latitude, lng: longitude };
        this.selectedMarker = marker;
        this.markerName = '';
      });
    } else {
      alert('Geolocation not supported');
    }
  }
}