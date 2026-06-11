

  
  import Product from '../models/product.model.js';

// Giảm inventory khi có đơn hàng
export const reduceInventory = async (productId, quantity) => {
    try {
        const product = await Product.findById(productId);

        if (!product) {
            throw new Error('Product not found');
        }

        if (product.status !== 'available') {
            throw new Error('Product is not available for purchase');
        }

        if (product.inventory < quantity) {
            throw new Error(`Not enough inventory. Available: ${product.inventory}, Requested: ${quantity}`);
        }

        // Trừ inventory
        const newInventory = product.inventory - quantity;
        const updateData = { inventory: newInventory };

        // Nếu hết hàng, tự động chuyển status
        if (newInventory === 0) {
            updateData.status = 'out_of_stock';
        }

        
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            updateData,
            { new: true }
        );

        return {
            success: true,
            product: updatedProduct,
            message: `Inventory updated. Remaining: ${newInventory}`
        };

    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
};

// Tăng inventory (khi hủy đơn hoặc hoàn hàng)
export const increaseInventory = async (productId, quantity) => {
    try {
        const product = await Product.findById(productId);

        if (!product) {
            throw new Error('Product not found');
        }

        const newInventory = product.inventory + quantity;
        const updateData = { inventory: newInventory };

        // Nếu có hàng trở lại và đang out_of_stock, chuyển về available
        if (product.status === 'out_of_stock' && newInventory > 0) {
            updateData.status = 'available';
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            updateData,
            { new: true }
        );

        return {
            success: true,
            product: updatedProduct,
            message: `Inventory restored. Current: ${newInventory}`
        };

    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
};

// Kiểm tra inventory trước khi đặt hàng
export const checkInventory = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const available = product.status === 'available' && product.inventory >= quantity;

        res.json({
            available,
            currentInventory: product.inventory,
            requestedQuantity: quantity,
            productStatus: product.status,
            message: available
                ? 'Product available for purchase'
                : `Not enough inventory or product unavailable. Available: ${product.inventory}`
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// API endpoint để process order (giảm inventory)
export const processOrder = async (req, res) => {
    try {
        const { items } = req.body; // Array of {productId, quantity}
        const results = [];
        const errors = [];

        // Process từng item trong đơn hàng
        for (const item of items) {
            const result = await reduceInventory(item.productId, item.quantity);

            if (result.success) {
                results.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    newInventory: result.product.inventory,
                    status: result.product.status
                });
            } else {
                errors.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    error: result.message
                });
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some items could not be processed',
                errors,
                processed: results
            });
        }

        res.json({
            success: true,
            message: 'Order processed successfully',
            updatedProducts: results
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// API endpoint để cancel order (tăng inventory)
export const cancelOrder = async (req, res) => {
    try {
        const { items } = req.body; // Array of {productId, quantity}
        const results = [];

        for (const item of items) {
            const result = await increaseInventory(item.productId, item.quantity);
            results.push(result);
        }

        res.json({
            success: true,
            message: 'Order cancelled, inventory restored',
            updatedProducts: results
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};