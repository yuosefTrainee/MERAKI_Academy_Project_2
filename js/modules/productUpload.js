// =================================
// SHOPORA - PRODUCT UPLOAD
// =================================


// Open Product Form

export function openProductForm() {

    $("#productForm").removeClass("hidden");

    $("#addProductBtn").addClass("hidden");

}


// Close Product Form

export function closeProductForm() {

    $("#productForm").addClass("hidden");

    $("#addProductBtn").removeClass("hidden");

    $("#productForm")[0].reset();

    $("#imagePreview")
        .attr("src", "")
        .addClass("hidden");

}


// Image Preview

export function previewProductImage() {

    $("#productImage").on("change", function () {

        const file = this.files[0];

        if (!file) {
            return;
        }

        // Validate image type
        if (!file.type.startsWith("image/")) {

            alert("Please select a valid image!");

            this.value = "";

            return;
        }

        // Validate image size (5MB)
        if (file.size > 5 * 1024 * 1024) {

            alert("Image size must be less than 5MB!");

            this.value = "";

            return;
        }

        const imageURL = URL.createObjectURL(file);

        $("#imagePreview")
            .attr("src", imageURL)
            .removeClass("hidden");

    });

}


// Initialize Product Form Events

export function initializeProductForm() {

    $("#addProductBtn").on("click", function () {

        openProductForm();

    });


    $("#cancelProductBtn").on("click", function () {

        closeProductForm();

    });


    previewProductImage();

}