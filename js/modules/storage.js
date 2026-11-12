// =================================
// SHOPORA - LOCAL STORAGE
// =================================


// Save Data
export function saveData(key, data) {

    try {

        localStorage.setItem(key, JSON.stringify(data));

        return true;

    } catch (error) {

        console.error("Error saving data:", error);

        return false;

    }

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

        console.error("Error reading data:", error);

        return defaultValue;

    }

}


// Remove Data
export function removeData(key) {

    localStorage.removeItem(key);

}


// Clear Storage
export function clearStorage() {

    localStorage.clear();

}