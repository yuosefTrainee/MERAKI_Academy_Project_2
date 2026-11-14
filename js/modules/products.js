// =================================
// SHOPORA - PRODUCT MANAGEMENT
// =================================

import { saveData, getData } from "./storage.js";

import {
    initialProducts,
    createProduct
} from "../data/products.js";

import { isAdmin } from "./auth.js";


// =================================
// Initialize Products
// =================================

export function initializeProducts() {

    const products = getData("products", null);

    if (products === null) {

        saveData("products", initialProducts);

    }

}


// =================================
// Get All Products
// =================================

export function getProducts() {

    return getData("products", []);

}


// =================================
// Add New Product
// =================================

export function addProduct(productData) {

    // Check Admin Permission

    if (!isAdmin()) {

        console.error("Access denied: Admin permission required.");

        return false;

    }


    const products = getProducts();

    const newProduct = createProduct(productData);

    products.push(newProduct);

    const saved = saveData("products", products);

    if (!saved) {

        return false;

    }

    return newProduct;

}


// =================================
// Update Product
// =================================

export function updateProduct(productId, updatedData) {

    // Check Admin Permission

    if (!isAdmin()) {

        console.error("Access denied: Admin permission required.");

        return false;

    }


    const products = getProducts();

    const productIndex = products.findIndex(

        product => String(product.id) === String(productId)

    );

    if (productIndex === -1) {

        return false;

    }


    products[productIndex] = {

        ...products[productIndex],

        ...updatedData

    };

    return saveData("products", products);

}


// =================================
// Delete Product
// =================================

export function deleteProduct(productId) {

    // Check Admin Permission

    if (!isAdmin()) {

        console.error("Access denied: Admin permission required.");

        return false;

    }


    const products = getProducts();

    const updatedProducts = products.filter(

        product => String(product.id) !== String(productId)

    );

    if (updatedProducts.length === products.length) {

        return false;

    }

    return saveData("products", updatedProducts);

}