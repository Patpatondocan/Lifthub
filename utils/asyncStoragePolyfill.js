// AsyncStorage polyfill for web that uses localStorage

const AsyncStorage = {
  getItem: async (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error("AsyncStorage getItem error:", e);
      return null;
    }
  },

  setItem: async (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error("AsyncStorage setItem error:", e);
      return false;
    }
  },

  removeItem: async (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error("AsyncStorage removeItem error:", e);
      return false;
    }
  },

  clear: async () => {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error("AsyncStorage clear error:", e);
      return false;
    }
  },

  multiGet: async (keys) => {
    try {
      return keys.map((key) => [key, localStorage.getItem(key)]);
    } catch (e) {
      console.error("AsyncStorage multiGet error:", e);
      return [];
    }
  },

  multiSet: async (keyValuePairs) => {
    try {
      keyValuePairs.forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      return true;
    } catch (e) {
      console.error("AsyncStorage multiSet error:", e);
      return false;
    }
  },

  getAllKeys: async () => {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i));
      }
      return keys;
    } catch (e) {
      console.error("AsyncStorage getAllKeys error:", e);
      return [];
    }
  },
};

export default AsyncStorage;
