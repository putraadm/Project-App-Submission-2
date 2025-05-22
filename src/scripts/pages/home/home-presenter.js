import { getStories } from '../../data/api';
import { saveStories, getStories as getStoredStories, deleteStory as deleteStoredStory } from '../../utils/db';

export default class HomePresenter {
  constructor({ view }) {
    this.view = view;
  }

  async init() {
    try {
      const stories = await getStories();
      await saveStories(stories);
      this.view.showStories(stories);
      this.view.initMap(stories);
    } catch (error) {
      console.warn('Failed to fetch stories from API, loading from IndexedDB', error);
      const storedStories = await getStoredStories();
      if (storedStories.length > 0) {
        this.view.showStories(storedStories);
        this.view.initMap(storedStories);
      } else {
        this.view.showError('Failed to load stories.');
      }
    }
  }

  async deleteStory(id) {
    try {
      console.log('Deleting story locally with id:', id, 'type:', typeof id);
      const idStr = String(id);
      // Do not call API delete due to CORS limitation
      await deleteStoredStory(idStr);
      const updatedStories = await getStoredStories();
      this.view.showStories(updatedStories);
      this.view.initMap(updatedStories);
    } catch (error) {
      console.error('Failed to delete story locally:', error);
      this.view.showError('Failed to delete story.');
    }
  }
}
