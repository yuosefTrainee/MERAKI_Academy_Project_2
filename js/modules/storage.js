// Local Storage Management


// Save Data
export function saveData(key, data) {

    localStorage.setItem(key, JSON.stringify(data));

}


// Get Data
export function getData(key, defaultValue = []) {

    const data = localStorage.getItem(key);

    if (data === null) {
        return defaultValue;
    }

    try {
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${key}:`, error);

        return defaultValue;
    }

}


// Remove Data
export function removeData(key) {

    localStorage.removeItem(key);

}


// Clear All Data
export function clearStorage() {

    localStorage.clear();

}