import { getStories } from '../../data/api';
import { saveStories, saveStory, getStories as getStoredStories, deleteStory as deleteStoredStory, saveDeletedStory, getDeletedStories } from '../../utils/db';

export default class HomePresenter {
  constructor({ view }) {
    this.view = view;
  }

  async init() {
    try {
      const apiStories = await getStories();
      const deletedStories = await getDeletedStories();
      const deletedIds = deletedStories.map(ds => ds.id);
      const filteredApiStories = apiStories.filter(story => !deletedIds.includes(story.id));

      const likedStories = await getStoredStories();
      const filteredLikedStories = likedStories.filter(story => !deletedIds.includes(story.id));

      const mergedStoriesMap = new Map();
      filteredApiStories.forEach(story => mergedStoriesMap.set(story.id, story));
      filteredLikedStories.forEach(story => mergedStoriesMap.set(story.id, story));
      const mergedStories = Array.from(mergedStoriesMap.values());

      this.view.showStories(mergedStories);
      this.view.initMap(mergedStories);
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
      console.log('Saving story on user action:', story);
      await saveStory(story);
      const index = this.view.currentStories.findIndex(s => s.id === story.id);
      if (index !== -1) {
        this.view.currentStories[index].liked = true;
      }
      console.log('Story saved successfully.');
      this.view.showStories(this.view.currentStories);
      this.view.initMap(this.view.currentStories);
    } catch (error) {
      console.error('Failed to save story on user action:', error);
      this.view.showError('Failed to save story.');
    }
  }

  async deleteStory(id) {
    try {
      console.log('Deleting story locally with id:', id, 'type:', typeof id);
      const idStr = String(id);
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

  async removeLikedStory(id) {
    try {
      console.log('Removing liked story with id:', id);
      const idStr = String(id);
      await deleteStoredStory(idStr);
      const index = this.view.currentStories.findIndex(s => s.id === idStr);
      if (index !== -1) {
        this.view.currentStories[index].liked = false;
      }
      this.view.showStories(this.view.currentStories);
      this.view.initMap(this.view.currentStories);
    } catch (error) {
      console.error('Failed to remove liked story:', error);
      this.view.showError('Failed to remove liked story.');
    }
  }
}
