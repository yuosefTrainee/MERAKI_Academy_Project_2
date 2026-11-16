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



// =================================
// Reduce Product Stock After Purchase
// =================================

export function reduceProductStock(items) {

    const products = getProducts();

    // Validate all products first
    for (const item of items) {

        const product = products.find(
            p => String(p.id) === String(item.productId)
        );

        if (!product) {
            console.error("Product not found:", item.productId);
            return false;
        }

        const quantity = Number(item.quantity);
        const stock = Number(product.stock);

        if (
            !Number.isFinite(quantity) ||
            quantity <= 0 ||
            !Number.isFinite(stock) ||
            stock < quantity
        ) {
            console.error("Invalid stock or quantity:", item);
            return false;
        }

    }

    // Update stock only after all products are validated
    const updatedProducts = products.map(product => {

        const item = items.find(
            i => String(i.productId) === String(product.id)
        );

        if (!item) return product;

        return {
            ...product,
            stock: Number(product.stock) - Number(item.quantity)
        };

    });

    // Save all changes together
    return saveData("products", updatedProducts);

}
