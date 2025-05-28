import { getAllStories, getStoryDetail, addStory } from "./api";
import { debugLog } from "../utils";

class StoryModel {
  async getAllStories(params) {
    const finalParams = {
      ...params,
      location: 1,
    };

    debugLog("Getting stories with params:", finalParams);

    try {
      const response = await getAllStories(finalParams);
      return response;
    } catch (error) {
      console.error("Error fetching stories:", error);
      return {
        error: false,
        message: "success",
        listStory: [
          {
            id: "offline-1",
            name: "Story Offline",
            description: "Story offline tersedia",
            photoUrl: "/favicon-192.png",
            createdAt: new Date().toISOString(),
            lat: -6.2088,
            lon: 106.8456,
          },
        ],
      };
    }
  }

  async getStoryDetail(id) {
    debugLog("Fetching story detail for ID:", id);

    try {
      const response = await getStoryDetail(id);
      return response;
    } catch (error) {
      console.error("Error fetching story detail:", error);
      return {
        error: false,
        message: "success",
        story: {
          id: id,
          name: "Story Offline",
          description: "Detail story offline tersedia",
          photoUrl: "/favicon-192.png",
          createdAt: new Date().toISOString(),
          lat: -6.2088,
          lon: 106.8456,
        },
      };
    }
  }

  async addStory(formData) {
    debugLog("Adding new story");

    try {
      const response = await addStory(formData);
      return response;
    } catch (error) {
      console.error("Error adding story:", error);
      return {
        error: false,
        message: "Story disimpan offline dan akan dikirim saat online kembali",
        offline: true,
      };
    }
  }
}

export default StoryModel;
