// ================= IMPORTS =================

import {
    addProduct,
    getProducts,
    updateProduct
} from "./products.js";

import {
    saveImage,
    deleteImage
} from "./database.js";

import {
    renderAdminProducts
} from "../admin/manageProducts.js";


// ================= VARIABLES =================

let editingProductId = null;


// ================= DOM ELEMENTS =================

const productForm = document.getElementById("productForm");

const addProductBtn = document.getElementById("addProductBtn");

const cancelProductBtn = document.getElementById("cancelProductBtn");

const productImage = document.getElementById("productImage");

const imagePreview = document.getElementById("imagePreview");


// ================= OPEN FORM =================

function openProductForm() {

    productForm.classList.remove("hidden");

    productForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ================= CLOSE FORM =================

function closeProductForm() {

    productForm.reset();

    productForm.classList.add("hidden");

    editingProductId = null;

    imagePreview.src = "";

    imagePreview.classList.add("hidden");

    clearAllErrors();

    const title = productForm.querySelector("h3");

    if (title) {
        title.textContent = "Add New Product";
    }

}


// ================= CLEAR FIELD ERROR =================

function clearFieldError(fieldId) {

    const input = document.getElementById(fieldId);

    const error = document.getElementById(fieldId + "Error");

    if (input) {
        input.classList.remove("input-error");
    }

    if (error) {
        error.textContent = "";
    }

}


// ================= CLEAR ALL ERRORS =================

function clearAllErrors() {

    const fields = [
        "productName",
        "productImage",
        "productCategory",
        "productBrand",
        "productPrice",
        "productStock",
        "productDescription"
    ];

    fields.forEach(field => {
        clearFieldError(field);
    });

}


// ================= SHOW FIELD ERROR =================

function showFieldError(fieldId, message) {

    const input = document.getElementById(fieldId);

    const error = document.getElementById(fieldId + "Error");

    if (input) {
        input.classList.add("input-error");
    }

    if (error) {
        error.textContent = message;
    }

}


// ================= VALIDATE FORM =================

function validateProductForm(data) {

    clearAllErrors();

    let isValid = true;


    // Product Name

    if (!data.name.trim()) {

        showFieldError(
            "productName",
            "Product name is required."
        );

        isValid = false;

    }


    // Product Image

    if (!data.image && !editingProductId) {

        showFieldError(
            "productImage",
            "Please select a product image."
        );

        isValid = false;

    }


    // Image Type and Size

    if (data.image) {

        if (!data.image.type.startsWith("image/")) {

            showFieldError(
                "productImage",
                "Please select a valid image."
            );

            isValid = false;

        }

        else if (data.image.size > 5 * 1024 * 1024) {

            showFieldError(
                "productImage",
                "Image size must be less than 5MB."
            );

            isValid = false;

        }

    }


    // Category

    if (!data.category) {

        showFieldError(
            "productCategory",
            "Please select a category."
        );

        isValid = false;

    }


    // Brand

    if (!data.brand.trim()) {

        showFieldError(
            "productBrand",
            "Brand name is required."
        );

        isValid = false;

    }


    // Price

    if (
        data.price === "" ||
        !Number.isFinite(Number(data.price)) ||
        Number(data.price) <= 0
    ) {

        showFieldError(
            "productPrice",
            "Price must be greater than zero."
        );

        isValid = false;

    }


    // Stock

    if (
        data.stock === "" ||
        !Number.isInteger(Number(data.stock)) ||
        Number(data.stock) < 0
    ) {

        showFieldError(
            "productStock",
            "Quantity must be zero or a positive integer."
        );

        isValid = false;

    }


    // Description

    if (!data.description.trim()) {

        showFieldError(
            "productDescription",
            "Product description is required."
        );

        isValid = false;

    }


    return isValid;

}


// ================= IMAGE PREVIEW =================

function previewProductImage() {

    const file = productImage.files[0];

    clearFieldError("productImage");

    if (!file) {

        imagePreview.src = "";

        imagePreview.classList.add("hidden");

        return;

    }

    if (!file.type.startsWith("image/")) {

        showFieldError(
            "productImage",
            "Please select a valid image."
        );

        imagePreview.classList.add("hidden");

        return;

    }

    const imageURL = URL.createObjectURL(file);

    imagePreview.src = imageURL;

    imagePreview.classList.remove("hidden");

}


// ================= EDIT PRODUCT =================

function editProduct(productId) {

    const products = getProducts();

    const product = products.find(
        item => String(item.id) === String(productId)
    );

    if (!product) {

        Swal.fire({
            icon: "error",
            title: "Product Not Found",
            text: "The selected product could not be found."
        });

        return;

    }


    editingProductId = product.id;


    // Fill Form Fields

    document.getElementById("productName").value = product.name;

    document.getElementById("productCategory").value = product.category;

    document.getElementById("productBrand").value = product.brand;

    document.getElementById("productPrice").value = product.price;

    document.getElementById("productStock").value = product.stock;

    document.getElementById("productDescription").value = product.description;


    // Reset Image Input

    productImage.value = "";


    // Show Existing Image Placeholder

    imagePreview.classList.add("hidden");


    // Change Form Title

    const title = productForm.querySelector("h3");

    if (title) {
        title.textContent = "Edit Product";
    }


    clearAllErrors();

    openProductForm();

}


// ================= SUBMIT PRODUCT =================

async function handleProductSubmit(event) {

    event.preventDefault();


    // Get Form Data

    const productData = {

        name: document.getElementById("productName").value.trim(),

        image: productImage.files[0],

        category: document.getElementById("productCategory").value,

        brand: document.getElementById("productBrand").value.trim(),

        price: document.getElementById("productPrice").value,

        stock: document.getElementById("productStock").value,

        description: document.getElementById("productDescription").value.trim()

    };


    // Validate Form

    if (!validateProductForm(productData)) {

        return;

    }


    let newImageId = null;


    try {

        // Save New Image

        if (productData.image) {

            newImageId = await saveImage(productData.image);

        }


        // ================= EDIT PRODUCT =================

        if (editingProductId !== null) {

            const products = getProducts();

            const oldProduct = products.find(
                item => String(item.id) === String(editingProductId)
            );

            if (!oldProduct) {
                throw new Error("Product not found.");
            }


            const updatedData = {

                name: productData.name,

                category: productData.category,

                brand: productData.brand,

                price: Number(productData.price),

                stock: Number(productData.stock),

                description: productData.description

            };


            // Update image only if a new image was selected

            if (newImageId) {

                updatedData.imageId = newImageId;

            }


            const updated = updateProduct(
                editingProductId,
                updatedData
            );


            if (!updated) {
                throw new Error("Could not update product.");
            }


            // Delete Old Image After Successful Update

            if (newImageId && oldProduct.imageId) {

                await deleteImage(oldProduct.imageId);

            }


            Swal.fire({
                icon: "success",
                title: "Product Updated!",
                text: "Your product has been updated successfully.",
                confirmButtonColor: "#687c45"
            });

        }


        // ================= ADD NEW PRODUCT =================

        else {

            const newProduct = addProduct({

                name: productData.name,

                category: productData.category,

                brand: productData.brand,

                price: productData.price,

                stock: productData.stock,

                description: productData.description,

                imageId: newImageId

            });


            if (!newProduct) {
                throw new Error("Could not save product.");
            }


            Swal.fire({
                icon: "success",
                title: "Product Added!",
                text: "Your new product has been added successfully.",
                confirmButtonColor: "#687c45"
            });

        }


        // Refresh Products Table

        renderAdminProducts();


        // Close Form

        closeProductForm();

    }

    catch (error) {

        console.error("Product Error:", error);


        // Delete Newly Uploaded Image If Operation Failed

        if (newImageId) {

            await deleteImage(newImageId);

        }


        Swal.fire({
            icon: "error",
            title: "Something Went Wrong",
            text: "Could not save the product. Please try again.",
            confirmButtonColor: "#687c45"
        });

    }

}


// ================= CLEAR ERRORS WHILE TYPING =================

function initializeFieldValidation() {

    const fields = [
        "productName",
        "productImage",
        "productCategory",
        "productBrand",
        "productPrice",
        "productStock",
        "productDescription"
    ];


    fields.forEach(fieldId => {

        const input = document.getElementById(fieldId);

        if (!input) return;


        input.addEventListener("input", () => {

            clearFieldError(fieldId);

        });


        input.addEventListener("change", () => {

            clearFieldError(fieldId);

        });

    });

}


// ================= INITIALIZE PRODUCT FORM =================

export function initializeProductForm() {


    // Add Product Button

    addProductBtn.addEventListener("click", () => {

        editingProductId = null;

        productForm.reset();

        clearAllErrors();

        imagePreview.classList.add("hidden");

        const title = productForm.querySelector("h3");

        if (title) {
            title.textContent = "Add New Product";
        }

        openProductForm();

    });


    // Cancel Button

    cancelProductBtn.addEventListener("click", () => {

        closeProductForm();

    });


    // Image Preview

    productImage.addEventListener("change", previewProductImage);


    // Submit Form

    productForm.addEventListener("submit", handleProductSubmit);


    // Edit Product Button

    $(document).on("click", ".btn-edit", function () {

        const productId = $(this).data("id");

        editProduct(productId);

    });


    // Initialize Validation

    initializeFieldValidation();

}