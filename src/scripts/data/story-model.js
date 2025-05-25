import { getAllStories, getStoryDetail, addStory } from "./api";
import { debugLog } from "../utils";

class StoryModel {
  async getAllStories(params) {
    try {
      const finalParams = {
        ...params,
        location: 1,
      };

      debugLog("Getting stories with params:", finalParams);
      const response = await getAllStories(finalParams);

      if (response.error) {
        throw new Error(response.message || "Gagal memuat cerita");
      }

      if (response.listStory) {
        const storiesWithLocation = response.listStory.filter(
          (story) =>
            story.lat &&
            story.lon &&
            !isNaN(parseFloat(story.lat)) &&
            !isNaN(parseFloat(story.lon))
        ).length;

        debugLog(
          `Received ${response.listStory.length} stories, ${storiesWithLocation} with valid location`
        );
      }

      return response;
    } catch (error) {
      console.error("Error fetching stories:", error);
      throw error;
    }
  }

  async getStoryDetail(id) {
    try {
      debugLog("Fetching story detail for ID:", id);
      const response = await getStoryDetail(id);
      if (response.error) {
        throw new Error(response.message || "Gagal memuat detail cerita");
      }
      return response;
    } catch (error) {
      console.error("Error fetching story detail:", error);
      throw error;
    }
  }

  async addStory(formData) {
    try {
      debugLog("Adding new story");
      const response = await addStory(formData);
      if (response.error) {
        throw new Error(response.message || "Gagal menambahkan cerita");
      }
      return response;
    } catch (error) {
      console.error("Error adding story:", error);
      throw error;
    }
  }
}

export default StoryModel;
