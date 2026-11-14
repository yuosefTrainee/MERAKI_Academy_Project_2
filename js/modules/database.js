// =================================
// SHOPORA - INDEXEDDB DATABASE
// =================================

const DB_NAME = "ShoporaDB";
const DB_VERSION = 1;
const STORE_NAME = "productImages";


// Open Database
export function openDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // Create Object Store
        request.onupgradeneeded = function (event) {

            const database = event.target.result;

            if (!database.objectStoreNames.contains(STORE_NAME)) {

                database.createObjectStore(STORE_NAME, {
                    keyPath: "id"
                });

            }

        };

        // Database Opened Successfully
        request.onsuccess = function (event) {

            resolve(event.target.result);

        };

        // Database Error
        request.onerror = function () {

            reject(request.error);

        };

    });

}


// Save Product Image
export async function saveImage(imageFile) {

    try {

        const database = await openDatabase();

        const imageId = crypto.randomUUID();

        return new Promise((resolve, reject) => {

            const transaction = database.transaction(
                STORE_NAME,
                "readwrite"
            );

            const store = transaction.objectStore(STORE_NAME);

            const request = store.add({
                id: imageId,
                image: imageFile,
                createdAt: new Date().toISOString()
            });

            request.onsuccess = function () {

                resolve(imageId);

            };

            request.onerror = function () {

                reject(request.error);

            };

            transaction.oncomplete = function () {

                database.close();

            };

        });

    } catch (error) {

        console.error("Error saving image:", error);

        throw error;

    }

}


// Get Product Image
export async function getImage(imageId) {

    const database = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction = database.transaction(
            STORE_NAME,
            "readonly"
        );

        const store = transaction.objectStore(STORE_NAME);

        const request = store.get(imageId);

        request.onsuccess = function () {

            resolve(request.result?.image || null);

        };

        request.onerror = function () {

            reject(request.error);

        };

        transaction.oncomplete = function () {

            database.close();

        };

    });

}


// Delete Product Image
export async function deleteImage(imageId) {

    const database = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction = database.transaction(
            STORE_NAME,
            "readwrite"
        );

        const store = transaction.objectStore(STORE_NAME);

        const request = store.delete(imageId);

        request.onsuccess = function () {

            resolve(true);

        };

        request.onerror = function () {

            reject(request.error);

        };

        transaction.oncomplete = function () {

            database.close();

        };

    });

}