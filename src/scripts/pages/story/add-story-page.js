import StoryModel from '../../data/story-model.js';
import AddStoryPresenter from '../../presenter/add-story-presenter.js';
import { 
  showNotification, 
  getUserData, 
  loadMapScript, 
  initCamera, 
  captureImage, 
  processImageFile, 
  stopCamera,
  debugLog  
} from '../../utils';

export default class AddStoryPage {
  constructor() {
    this._storyModel = new StoryModel();
    this._presenter = new AddStoryPresenter({
      view: this,
      model: this._storyModel
    });
    
    this._map = null;
    this._currentMarker = null;
    this._cameraStream = null;
    this._imageBlob = null;
    this._location = {
      lat: null,
      lon: null
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.startCamera = this.startCamera.bind(this);
    this.capturePhoto = this.capturePhoto.bind(this);
    this.resetCamera = this.resetCamera.bind(this);
    this.handleGalleryInput = this.handleGalleryInput.bind(this);
    this.getCurrentLocation = this.getCurrentLocation.bind(this);
    this.isSubmitting = false;
  }

  async render() {
    return `
      <section id="content" class="container" tabindex="-1">
        <h1 class="page-title"><i class="fas fa-plus-circle"></i> Tambah Cerita Baru</h1>
        
        <div class="form-container">
          <div id="add-story-alert" class="alert" style="display: none;"></div>
          
          <form id="add-story-form">
            <div class="form-group">
              <label for="description" class="form-label"><i class="fas fa-edit"></i> Deskripsi</label>
              <textarea 
                id="description" 
                class="form-input" 
                placeholder="Ceritakan pengalamanmu..." 
                required
                rows="4"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label class="form-label"><i class="fas fa-camera"></i> Foto</label>
              
              <div class="camera-section">
                <div class="camera-container">
                  <video id="camera-preview" autoplay playsinline style="display: none;"></video>
                  <canvas id="camera-canvas" style="display: none;"></canvas>
                  <img id="photo-preview" class="photo-preview" src="#" alt="Preview" style="display: none;">
                </div>
                
                <div class="camera-buttons">
                  <button type="button" id="camera-start-button" class="btn btn-primary">
                    <i class="fas fa-camera"></i> Kamera
                  </button>
                  <button type="button" id="gallery-button" class="btn btn-info">
                    <i class="far fa-images"></i> Galeri
                  </button>
                  <button type="button" id="camera-capture-button" class="btn btn-success" style="display: none;">
                    <i class="fas fa-camera-retro"></i> Ambil Foto
                  </button>
                  <button type="button" id="camera-reset-button" class="btn btn-danger" style="display: none;">
                    <i class="fas fa-trash-alt"></i> Reset
                  </button>
                </div>
                
                <input type="file" id="gallery-input" accept="image/*" style="display: none;">
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label"><i class="fas fa-map-marker-alt"></i> Lokasi</label>
              
              <div id="map-container" class="map-container" style="height: 300px;"></div>
              
              <div class="location-info" style="margin-top: 10px;">
                <p id="location-text">Klik pada peta untuk memilih lokasi, atau gunakan lokasi saat ini.</p>
                
                <button type="button" id="current-location-button" class="btn btn-info">
                  <i class="fas fa-crosshairs"></i> Gunakan Lokasi Saat Ini
                </button>
                
                <div class="coordinates-display" style="margin-top: 10px; display: none;" id="coordinates-display">
                  <div class="form-row">
                    <div class="form-group form-group-half">
                      <label for="lat" class="form-label">Latitude</label>
                      <input type="text" id="lat" class="form-input" readonly>
                    </div>
                    <div class="form-group form-group-half">
                      <label for="lon" class="form-label">Longitude</label>
                      <input type="text" id="lon" class="form-input" readonly>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block" id="submit-button">
              <i class="fas fa-paper-plane"></i> Tambah Cerita
            </button>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    try {
      const form = document.getElementById('add-story-form');
      const submitButton = document.getElementById('submit-button');
      const cameraStartButton = document.getElementById('camera-start-button');
      const cameraCaptureButton = document.getElementById('camera-capture-button');
      const cameraResetButton = document.getElementById('camera-reset-button');
      const cameraPreview = document.getElementById('camera-preview');
      const cameraCanvas = document.getElementById('camera-canvas');
      const photoPreview = document.getElementById('photo-preview');
      const galleryButton = document.getElementById('gallery-button');
      const galleryInput = document.getElementById('gallery-input');
      const currentLocationButton = document.getElementById('current-location-button');
      
      await this._presenter.initMap();

      const existingNotification = document.querySelector('.notification-modal');
      if (existingNotification) {
        existingNotification.remove();
      }
      
      if (cameraStartButton) {
        cameraStartButton.addEventListener('click', this.startCamera);
      }
      
      if (cameraCaptureButton) {
        cameraCaptureButton.addEventListener('click', this.capturePhoto);
      }

      if (cameraResetButton) {
        cameraResetButton.addEventListener('click', this.resetCamera);
      }

      if (galleryButton && galleryInput) {
        galleryButton.addEventListener('click', () => {
          this.resetCamera();
          galleryInput.click();
        });
        
        galleryInput.addEventListener('change', this.handleGalleryInput);
      }
      
      if (currentLocationButton) {
        currentLocationButton.addEventListener('click', this.getCurrentLocation);
      }
      
      if (form) {
        form.addEventListener('submit', this.handleSubmit);
      }
    } catch (error) {
      this.showPageError(error);
    }
  }
  
  async startCamera(event) {
    try {
      const cameraStartButton = document.getElementById('camera-start-button');
      const cameraPreview = document.getElementById('camera-preview');
      const cameraCaptureButton = document.getElementById('camera-capture-button');
      const cameraResetButton = document.getElementById('camera-reset-button');
      const photoPreview = document.getElementById('photo-preview');
      
      cameraStartButton.disabled = true;
      cameraPreview.style.display = 'block';
      cameraCaptureButton.style.display = 'inline-block';
      cameraResetButton.style.display = 'inline-block';
      photoPreview.style.display = 'none';
      
      this._cameraStream = await initCamera(cameraPreview);
      cameraCaptureButton.disabled = false;
    } catch (error) {
      showNotification('Error', error.message, 'error');
      const cameraStartButton = document.getElementById('camera-start-button');
      if (cameraStartButton) {
        cameraStartButton.disabled = false;
      }
    }
  }
  
  async capturePhoto(event) {
    try {
      const cameraPreview = document.getElementById('camera-preview');
      const cameraCanvas = document.getElementById('camera-canvas');
      const photoPreview = document.getElementById('photo-preview');
      const cameraCaptureButton = document.getElementById('camera-capture-button');
      
      this._imageBlob = await captureImage(cameraPreview, cameraCanvas);

      const imageUrl = URL.createObjectURL(this._imageBlob);
      photoPreview.src = imageUrl;
      photoPreview.style.display = 'block';
      cameraPreview.style.display = 'none';
      
      if (this._cameraStream) {
        stopCamera(this._cameraStream);
        this._cameraStream = null;
      }
      
      cameraCaptureButton.style.display = 'none';
    } catch (error) {
      showNotification('Error', error.message, 'error');
    }
  }
  
  async handleGalleryInput(event) {
    try {
      const photoPreview = document.getElementById('photo-preview');
      const cameraPreview = document.getElementById('camera-preview');
      const cameraCaptureButton = document.getElementById('camera-capture-button');
      const cameraResetButton = document.getElementById('camera-reset-button');
      const cameraStartButton = document.getElementById('camera-start-button');
      
      if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        
        this._imageBlob = await processImageFile(file);
        
        const imageUrl = URL.createObjectURL(this._imageBlob);
        photoPreview.src = imageUrl;
        photoPreview.style.display = 'block';
        cameraPreview.style.display = 'none';
        cameraCaptureButton.style.display = 'none';
        cameraResetButton.style.display = 'inline-block';
        cameraStartButton.disabled = true;
      }
    } catch (error) {
      showNotification('Error', error.message, 'error');
    }
  }
  
  async handleSubmit(event) {
    event.preventDefault();
    
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    
    try {
      const description = document.getElementById('description').value;
      const photo = this._imageBlob;
      const lat = document.getElementById('lat').value;
      const lon = document.getElementById('lon').value;
      
      const formData = new FormData();
      
      if (description) {
        formData.append('description', description);
      }
      
      if (photo) {
        const filename = 'photo.jpg';
        const photoFile = new File([photo], filename, { type: 'image/jpeg' });
        formData.append('photo', photoFile);
      }
      
      if (lat && lon) {
        formData.append('lat', parseFloat(lat));
        formData.append('lon', parseFloat(lon));
      }
      
      debugLog('Mengirim data cerita baru:', {
        description,
        photoSize: photo ? photo.size : 0,
        hasLocation: !!(lat && lon)
      });
      
      const success = await this._presenter.addStory(formData);
      
      if (success) {
        const form = document.getElementById('add-story-form');
        const photoPreview = document.getElementById('photo-preview');
        
        if (form) form.reset();
        if (photoPreview) photoPreview.style.display = 'none';
        
        this._imageBlob = null;
        this._presenter.resetMapMarker();
        
        setTimeout(() => {
          window.location.href = '#/';
        }, 1500);
      }
    } catch (error) {
      this.showErrorMessage(error.message || 'Gagal menambahkan cerita');
    } finally {
      this.isSubmitting = false;
    }
  }
  
  resetCamera() {
    if (this._cameraStream) {
      stopCamera(this._cameraStream);
      this._cameraStream = null;
    }
    
    this._imageBlob = null;
    
    const photoPreview = document.getElementById('photo-preview');
    const cameraPreview = document.getElementById('camera-preview');
    const cameraCaptureButton = document.getElementById('camera-capture-button');
    const cameraResetButton = document.getElementById('camera-reset-button');
    const cameraStartButton = document.getElementById('camera-start-button');
    
    if (photoPreview) photoPreview.style.display = 'none';
    if (cameraPreview) cameraPreview.style.display = 'none';
    if (cameraCaptureButton) cameraCaptureButton.style.display = 'none';
    if (cameraResetButton) cameraResetButton.style.display = 'none';
    if (cameraStartButton) cameraStartButton.disabled = false;
  }
  
  async initMap() {
    try {
      const L = await loadMapScript();
      const mapContainer = document.getElementById('map-container');
      
      if (!mapContainer) {
        throw new Error('Map container not found');
      }

      this._map = L.map('map-container').setView([-2.5489, 118.0149], 5);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this._map);

      this._map.on('click', (event) => {
        this._presenter.updateMarker(event.latlng.lat, event.latlng.lng);
      });
    } catch (error) {
      throw new Error(`Gagal memuat peta: ${error.message}`);
    }
  }
  
  updateMarker(lat, lng) {
    try {
      const formattedLat = parseFloat(lat).toFixed(6);
      const formattedLng = parseFloat(lng).toFixed(6);
      
      this._location = {
        lat: formattedLat,
        lon: formattedLng
      };

      document.getElementById('lat').value = formattedLat;
      document.getElementById('lon').value = formattedLng;
      document.getElementById('coordinates-display').style.display = 'block';
      document.getElementById('location-text').textContent = `Lokasi dipilih: ${formattedLat}, ${formattedLng}`;

      if (this._currentMarker) {
        this._map.removeLayer(this._currentMarker);
      }

      const customIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      this._currentMarker = L.marker([lat, lng], { icon: customIcon })
        .addTo(this._map)
        .bindPopup('Lokasi cerita')
        .openPopup();
    } catch (error) {
      showNotification('Error', `Gagal memperbarui marker: ${error.message}`, 'error');
    }
  }
  
  resetMapMarker() {
    try {
      this._location = {
        lat: null,
        lon: null
      };
      
      if (this._currentMarker) {
        this._map.removeLayer(this._currentMarker);
        this._currentMarker = null;
      }
      
      document.getElementById('lat').value = '';
      document.getElementById('lon').value = '';
      document.getElementById('coordinates-display').style.display = 'none';
      
      document.getElementById('location-text').textContent = 'Klik pada peta untuk memilih lokasi, atau gunakan lokasi saat ini.';
    } catch (error) {
      console.error('Error resetting map marker:', error);
    }
  }
  
  getCurrentLocation() {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation tidak didukung oleh browser Anda');
      }
      
      const locationButton = document.getElementById('current-location-button');
      const originalButtonText = locationButton.textContent;
      locationButton.textContent = 'Mendapatkan Lokasi...';
      locationButton.disabled = true;
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          this.updateMarker(latitude, longitude);
          this._map.setView([latitude, longitude], 15);
        
          locationButton.textContent = originalButtonText;
          locationButton.disabled = false;
        },
        (error) => {
          let errorMessage = 'Gagal mendapatkan lokasi: ';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Izin lokasi ditolak.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Informasi lokasi tidak tersedia.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Waktu permintaan lokasi habis.';
              break;
            default:
              errorMessage += 'Kesalahan tidak diketahui.';
          }
          
          showNotification('Error', errorMessage, 'error');
          
          locationButton.textContent = originalButtonText;
          locationButton.disabled = false;
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (error) {
      showNotification('Error', error.message, 'error');
    }
  }
  
  showLoading() {
    const submitButton = document.getElementById('submit-button');
    submitButton._originalText = submitButton.textContent;
    submitButton.textContent = 'Mengirim...';
    submitButton.disabled = true;
    
    const alertDiv = document.getElementById('add-story-alert');
    if (alertDiv) {
      alertDiv.className = 'alert alert-info';
      alertDiv.textContent = 'Sedang mengirim cerita...';
      alertDiv.style.display = 'block';
    }
  }
  
  hideLoading() {
    const submitButton = document.getElementById('submit-button');
    
    if (submitButton && submitButton._originalText) {
      submitButton.textContent = submitButton._originalText;
      submitButton.disabled = false;
    }
  }
  
  showSuccessMessage(message) {
    const alertDiv = document.getElementById('add-story-alert');
    if (alertDiv) {
      alertDiv.className = 'alert alert-success';
      alertDiv.textContent = message;
      alertDiv.style.display = 'block';
    }
    
    showNotification('Berhasil', message, 'success');
  }
  
  showErrorMessage(message) {
    const alertDiv = document.getElementById('add-story-alert');
    if (alertDiv) {
      alertDiv.className = 'alert alert-error';
      alertDiv.textContent = message;
      alertDiv.style.display = 'block';
    }
    
    showNotification('Error', message, 'error');
  }
  
  showPageError(error) {
    const container = document.querySelector('.container');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-error">
          <p>Terjadi kesalahan saat memuat halaman tambah cerita.</p>
          <p>${error.message || 'Kesalahan tidak diketahui'}</p>
          <p><a href="#/">Kembali ke beranda</a></p>
        </div>
      `;
    }
  }
  
  handleMapError(error) {
    showNotification('Error', `Gagal memuat peta: ${error.message}`, 'error');
  }
  
  cleanup() {
    try {
      const form = document.getElementById('add-story-form');
      if (form) {
        form.removeEventListener('submit', this.handleSubmit);
      }
      
      const cameraStartButton = document.getElementById('camera-start-button');
      if (cameraStartButton) {
        cameraStartButton.removeEventListener('click', this.startCamera);
      }
      
      const cameraCaptureButton = document.getElementById('camera-capture-button');
      if (cameraCaptureButton) {
        cameraCaptureButton.removeEventListener('click', this.capturePhoto);
      }
      
      const cameraResetButton = document.getElementById('camera-reset-button');
      if (cameraResetButton) {
        cameraResetButton.removeEventListener('click', this.resetCamera);
      }
      
      const galleryInput = document.getElementById('gallery-input');
      if (galleryInput) {
        galleryInput.removeEventListener('change', this.handleGalleryInput);
      }
      
      const currentLocationButton = document.getElementById('current-location-button');
      if (currentLocationButton) {
        currentLocationButton.removeEventListener('click', this.getCurrentLocation);
      }
      
      if (this._cameraStream) {
        stopCamera(this._cameraStream);
        this._cameraStream = null;
      }

      if (this._map) {
        this._map.remove();
        this._map = null;
      }

      const existingNotification = document.querySelector('.notification-modal');
      if (existingNotification) {
        existingNotification.remove();
      }
      
      console.log("AddStoryPage resources cleaned up");
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}