// Products Data

export const initialProducts = [];


// Create New Product

export function createProduct({
    name,
    category,
    brand,
    price,
    description,
    stock,
    imageId
}) {

    return {
        id: Date.now(),

        name: name,
        category: category,
        brand: brand,

        price: Number(price),

        description: description,

        stock: Number(stock),

        imageId: imageId,

        rating: 0,

        reviewsCount: 0,

        createdAt: new Date().toISOString()
    };

}