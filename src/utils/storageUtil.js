const getLocalStorageData = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (err) {
    console.error("Failed to set local item:", err);
  }
};

const setLocalStorageData = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Failed to set local item:", err);
  }
};

export const storageUtil = {
  getLocalStorageData,
  setLocalStorageData,
};
