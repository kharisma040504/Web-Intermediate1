class DetailStoryPresenter {
  constructor({ view, model, storyId }) {
    this._view = view;
    this._model = model;
    this._storyId = storyId;
    this._story = null;
  }

  async loadStoryDetail() {
    try {
      this._view.showLoading();
      
      const response = await this._model.getStoryDetail(this._storyId);
      this._story = response.story;
      
      if (!this._story) {
        throw new Error('Cerita tidak ditemukan');
      }
      
      this._view.renderStoryDetail(this._story);
      
      if (this._story.lat && this._story.lon) {
        this.initMap();
      }
    } catch (error) {
      console.error('Error loading story detail:', error);
      this._view.showErrorMessage(error.message);
    } finally {
      this._view.hideLoading();
    }
  }

  async initMap() {
    if (!this._story.lat || !this._story.lon) return;
    
    try {
      await this._view.initMap(this._story.lat, this._story.lon, this._story);
    } catch (error) {
      console.error('Map initialization error:', error);
      this._view.handleMapError(error);
    }
  }
}

export default DetailStoryPresenter;