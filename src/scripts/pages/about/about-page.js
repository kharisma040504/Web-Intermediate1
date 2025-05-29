import AboutPresenter from "../../presenter/about-presenter.js";

export default class AboutPage {
  constructor() {
    this._presenter = new AboutPresenter({
      view: this,
    });
  }

  async render() {
    return `
      <section id="content" class="container" tabindex="-1">
        <h1 class="page-title">Tentang Dicoding Story</h1>
        
        <div class="about-content">
          <p>
            Dicoding Story adalah platform berbagi cerita dan pengalaman seputar Dicoding. 
            Aplikasi ini dibangun sebagai proyek untuk memenuhi submission kelas Dicoding.
          </p>
          
          <h2>Fitur Aplikasi</h2>
          <ul>
            <li>Melihat cerita dari pengguna Dicoding lainnya</li>
            <li>Berbagi cerita Anda sendiri dengan komunitas Dicoding</li>
            <li>Menambahkan lokasi pada cerita Anda</li>
            <li>Melihat lokasi cerita di peta</li>
            <li>Menyimpan cerita favorit ke bookmark</li>
            <li>Mengelola koleksi bookmark cerita</li>
            <li>Akses offline dengan IndexedDB</li>
            <li>Halaman error yang user-friendly</li>
          </ul>
          
          <h2>Teknologi yang Digunakan</h2>
          <ul>
            <li>HTML, CSS, dan JavaScript</li>
            <li>Arsitektur Single-Page Application (SPA)</li>
            <li>Pola Model-View-Presenter (MVP)</li>
            <li>Leaflet untuk menampilkan peta</li>
            <li>View Transition API untuk transisi halaman yang halus</li>
            <li>IndexedDB untuk penyimpanan offline</li>
            <li>Progressive Web App (PWA) features</li>
          </ul>
          
          <h2>Kriteria Proyek</h2>
          <ol>
            <li>Menggunakan Dicoding Story API sebagai sumber data</li>
            <li>Menggunakan arsitektur Single-Page Application</li>
            <li>Menerapkan teknik hash dalam routing</li>
            <li>Menampilkan daftar cerita dengan gambar dan teks</li>
            <li>Menampilkan peta dengan marker untuk cerita</li>
            <li>Fitur tambah cerita baru dengan kamera dan lokasi</li>
            <li>Menerapkan aksesibilitas sesuai standar</li>
            <li>Mengimplementasikan transisi halaman yang halus</li>
          </ol>
          
          <h2>Struktur Aplikasi</h2>
          <div class="app-structure">
            <h3>Halaman yang Tersedia:</h3>
            <ul>
              <li><strong>Beranda:</strong> Menampilkan daftar semua cerita</li>
              <li><strong>Detail Cerita:</strong> Menampilkan detail lengkap cerita dengan peta</li>
              <li><strong>Tambah Cerita:</strong> Form untuk menambahkan cerita baru</li>
              <li><strong>Bookmark:</strong> Koleksi cerita yang disimpan pengguna</li>
              <li><strong>Tentang:</strong> Informasi aplikasi dan fitur</li>
              <li><strong>Login/Register:</strong> Autentikasi pengguna</li>
              <li><strong>404 Not Found:</strong> Halaman error untuk URL tidak valid</li>
            </ul>
          </div>
          
          <h2>Pengalaman Pengguna</h2>
          <div class="ux-features">
            <ul>
              <li>Desain responsif untuk desktop dan mobile</li>
              <li>Loading states untuk feedback visual</li>
              <li>Notifikasi untuk aksi pengguna</li>
              <li>Aksesibilitas keyboard dan screen reader</li>
              <li>Transisi halaman yang smooth</li>
              <li>Offline capability dengan fallback data</li>
            </ul>
          </div>
          
          <p style="margin-top: 30px;">
            &copy; 2025 - Dibuat oleh Kharisma untuk submission kelas Dicoding
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {}
}
