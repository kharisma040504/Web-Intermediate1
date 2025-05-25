// src/scripts/presenter/home-presenter.js
import { debugLog } from '../utils';

class HomePresenter {
  constructor({ view, model }) {
    this._view = view;
    this._model = model;
    this._page = 1;
    this._storiesPerPage = 5;
    this._isLoading = false;
    this._hasMoreData = true;
    this._stories = [];
  }

  async loadStories() {
    if (this._isLoading) return;

    this._isLoading = true;
    this._view.showLoading(this._page === 1);
    
    debugLog(`Loading stories page ${this._page}, size ${this._storiesPerPage}`);

    try {
      const response = await this._model.getAllStories({
        page: this._page,
        size: this._storiesPerPage,
        location: 1, 
      });

      if (!response.listStory || !Array.isArray(response.listStory)) {
        throw new Error('Format data cerita tidak valid');
      }

      const storiesWithLocation = response.listStory.filter(story => 
        story.lat && story.lon && 
        !isNaN(parseFloat(story.lat)) && 
        !isNaN(parseFloat(story.lon))
      );
      
      debugLog(`Received ${response.listStory.length} stories, ${storiesWithLocation.length} have valid coordinates`);
      
      if (storiesWithLocation.length > 0) {
        debugLog('Sample location data:', {
          name: storiesWithLocation[0].name,
          lat: storiesWithLocation[0].lat,
          lon: storiesWithLocation[0].lon
        });
      }

      const newStories = response.listStory;
      const existingIds = new Set(this._stories.map((story) => story.id));
      const uniqueNewStories = this._page > 1
        ? newStories.filter((story) => !existingIds.has(story.id))
        : newStories;

      if (this._page === 1) {
        debugLog('Setting initial stories list');
        this._stories = uniqueNewStories;
      } else {
        debugLog(`Adding ${uniqueNewStories.length} new stories to existing ${this._stories.length}`);
        this._stories = [...this._stories, ...uniqueNewStories];
      }

      this._hasMoreData = newStories.length === this._storiesPerPage;
      debugLog(`Has more data: ${this._hasMoreData}`);

      if (this._stories.length > 0) {
        this._view.renderStories(this._page > 1, uniqueNewStories);
        this._view.toggleLoadMoreButton(this._hasMoreData);
        
        if (!this._view.isMapError()) {
          debugLog(`Updating map markers with ${this._stories.length} stories`);
          this._view.updateMapMarkers(this._stories);
        }
      } else {
        this._view.showEmptyStoriesMessage();
      }
    } catch (error) {
      debugLog('Error loading stories:', error);
      this._view.showErrorMessage(error.message);
    } finally {
      this._isLoading = false;
      this._view.hideLoadingIndicator();
    }
  }

  loadMoreStories() {
    if (this._isLoading || !this._hasMoreData) return;
    
    debugLog('Loading more stories');
    this._page++;
    this.loadStories();
  }

  setupInfiniteScroll() {
    debugLog('Setting up infinite scroll');
    this._view.setupInfiniteScroll(() => this.loadMoreStories());
  }

  async initMap() {
    try {
      debugLog('Initializing map from presenter');
      await this._view.initMap();
      
      if (this._stories && this._stories.length > 0) {
        debugLog(`Updating markers after map init. Total stories: ${this._stories.length}`);

        setTimeout(() => {
          this._view.updateMapMarkers(this._stories);
        }, 300);
      }
    } catch (error) {
      debugLog('Map initialization error:', error);
      this._view.handleMapError(error);
    }
  }
}

export default HomePresenter;