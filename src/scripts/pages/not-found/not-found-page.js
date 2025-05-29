export default class NotFoundPage {
  constructor() {
    this._currentPath = window.location.hash.replace("#", "") || "/";
  }

  async render() {
    return `
      <section id="content" class="container" tabindex="-1">
        <div class="not-found-page">
          <div class="not-found-content">
            <div class="not-found-icon">
              <i class="fas fa-search"></i>
              <span class="not-found-number">404</span>
            </div>
            
            <h1 class="not-found-title">Halaman Tidak Ditemukan</h1>
            
            <p class="not-found-description">
              Maaf, halaman yang Anda cari tidak dapat ditemukan atau mungkin telah dipindahkan.
            </p>
            
            <div class="not-found-path">
              <p>Path yang diminta: <code>${this._currentPath}</code></p>
            </div>
            
            <div class="not-found-actions">
              <a href="#/" class="btn btn-primary">
                <i class="fas fa-home"></i> Kembali ke Beranda
              </a>
              
              <button id="go-back-btn" class="btn btn-secondary">
                <i class="fas fa-arrow-left"></i> Halaman Sebelumnya
              </button>
              
              <a href="#/about" class="btn btn-outline">
                <i class="fas fa-info-circle"></i> Tentang Aplikasi
              </a>
            </div>
            
            <div class="not-found-suggestions">
              <h3>Mungkin Anda mencari:</h3>
              <ul class="suggestions-list">
                <li><a href="#/"><i class="fas fa-home"></i> Halaman Beranda</a></li>
                <li><a href="#/add"><i class="fas fa-plus-circle"></i> Tambah Cerita Baru</a></li>
                <li><a href="#/bookmarks"><i class="fas fa-bookmark"></i> Bookmark Saya</a></li>
                <li><a href="#/about"><i class="fas fa-info-circle"></i> Tentang Aplikasi</a></li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this._attachEventListeners();
  }

  _attachEventListeners() {
    const goBackBtn = document.getElementById("go-back-btn");
    if (goBackBtn) {
      goBackBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.hash = "#/";
        }
      });
    }
  }

  cleanup() {
    const goBackBtn = document.getElementById("go-back-btn");
    if (goBackBtn) {
      goBackBtn.removeEventListener("click", this._handleGoBack);
    }
  }
}
