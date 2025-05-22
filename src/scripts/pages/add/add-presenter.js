import { addStory } from '../../data/api';
import { saveStories, getStories, deleteStory } from '../../utils/db';

export default class AddPresenter {
  constructor({ view }) {
    this.view = view;
    window.addEventListener('online', () => {
      this.syncOfflineStories();
    });
  }

  async init() {
    this.view.startCamera();
    await this.view.loadLeaflet();
    this.view.initMap();
  }

  async submitStory({ photoBlob, description, lat, lon }) {
    try {
      await addStory({
        photo: photoBlob,
        description,
        lat,
        lon,
      });
      this.view.showSuccess('Story added successfully!');
      this.view.resetForm();
      this.view.stopCamera();
      // Navigate to home page
      window.location.hash = '#/';
    } catch (error) {
      console.error('Error adding story:', error);
      this.view.showError('Failed to add story. Saving offline...');
      // Save story offline
      const offlineStory = {
        id: Date.now().toString(),
        photoBlob,
        description,
        lat,
        lon,
        offline: true,
      };
      await saveStories([offlineStory]);
      this.view.showSuccess('Story saved offline. It will be synced when online.');
      this.view.resetForm();
      this.view.stopCamera();
      window.location.hash = '#/';
    }
  }

  async syncOfflineStories() {
    const offlineStories = await getStories();
    for (const story of offlineStories) {
      if (story.offline) {
        try {
          await addStory({
            photo: story.photoBlob,
            description: story.description,
            lat: story.lat,
            lon: story.lon,
          });
          await deleteStory(story.id);
          console.log(`Offline story ${story.id} synced successfully.`);
        } catch (error) {
          console.error(`Failed to sync offline story ${story.id}:`, error);
        }
      }
    }
  }
}
