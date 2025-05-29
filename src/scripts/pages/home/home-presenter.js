
import { getStories } from '../../data/api';
import { saveStories, saveStory, getStories as getStoredStories, deleteStory as deleteStoredStory, saveDeletedStory, getDeletedStories } from '../../utils/db';

export default class HomePresenter {
  constructor({ view }) {
    this.view = view;
  }

  async init() {
    try {
      const stories = await getStories();
      const deletedStories = await getDeletedStories();
      const deletedIds = deletedStories.map(ds => ds.id);
      const filteredStories = stories.filter(story => !deletedIds.includes(story.id));
      // Removed automatic saving to IndexedDB here
      this.view.showStories(filteredStories);
      this.view.initMap(filteredStories);
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

  async saveStoryOnUserAction(story) {
    try {
      await saveStory(story);
      // Optionally update the view or notify user
    } catch (error) {
      console.error('Failed to save story on user action:', error);
      this.view.showError('Failed to save story.');
    }
  }

  async deleteStory(id) {
    try {
      console.log('Deleting story locally with id:', id, 'type:', typeof id);
      const idStr = String(id);
      // Do not call API delete due to CORS limitation
      await deleteStoredStory(idStr);
      await saveDeletedStory(idStr);
      const updatedStories = await getStoredStories();
      this.view.showStories(updatedStories);
      this.view.initMap(updatedStories);
    } catch (error) {
      console.error('Failed to delete story locally:', error);
      this.view.showError('Failed to delete story.');
    }
  }
}
