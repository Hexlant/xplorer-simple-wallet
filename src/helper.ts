const setLocalStorage = <T>(key: string, data: T | T[]): void => {
  let concatData: T[] = [];

  const storedData = window.localStorage.getItem(key);

  if (storedData) {
    try {
      concatData = JSON.parse(storedData) as T[];
    } catch (error) {
      console.error(`Error parsing stored data for key "${key}":`, error);
    }
  }

  const newData = Array.isArray(data) ? data : [data];
  const updatedData = [...concatData, ...newData];

  window.localStorage.setItem(key, JSON.stringify(updatedData));
};

const getLocalStorage = <T>(key: string): T | null => {
  const data = window.localStorage.getItem(key);
  if (data === null) {
    return null;
  }
  return JSON.parse(data) as T;
};

export { setLocalStorage, getLocalStorage };
