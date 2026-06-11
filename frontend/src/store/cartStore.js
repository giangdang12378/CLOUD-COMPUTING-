import { create } from "zustand";
import { persist } from "zustand/middleware";

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:4173/api" : "/api";

export const useCartStore = create(
    persist(
        (set, get) => ({
            // State
            items: [], // [{productId, productName, price, quantity, image, maxInventory}]
            isLoading: false,
            error: null,

            // Add item to cart
            addToCart: async (product, quantity = 1) => {
                set({ isLoading: true, error: null });

                try {
                    console.log("Adding to cart:", product, quantity); // Debug log

                    const currentItems = get().items;
                    const existingItemIndex = currentItems.findIndex(item => item.productId === product._id);

                    if (existingItemIndex >= 0) {
                        // Update existing item
                        const existingItem = currentItems[existingItemIndex];
                        const newQuantity = existingItem.quantity + quantity;

                        // Check if new quantity exceeds inventory
                        if (newQuantity > product.inventory) {
                            throw new Error(`Không thể thêm. Chỉ còn ${product.inventory} sản phẩm.`);
                        }

                        const updatedItems = currentItems.map((item, index) =>
                            index === existingItemIndex
                                ? { ...item, quantity: newQuantity }
                                : item
                        );

                        set({ items: updatedItems, isLoading: false });
                    } else {
                        // Add new item
                        if (quantity > product.inventory) {
                            throw new Error(`Không thể thêm. Chỉ còn ${product.inventory} sản phẩm.`);
                        }

                        const newItem = {
                            productId: product._id,
                            productName: product.productName || product.name, // 👈 FIX: Handle both field names
                            price: product.price,
                            quantity: quantity,
                            image: product.image,
                            maxInventory: product.inventory
                        };

                        const updatedItems = [...currentItems, newItem];
                        set({ items: updatedItems, isLoading: false });
                    }

                    console.log("Cart updated:", get().items); // Debug log

                } catch (error) {
                    console.error("Add to cart error:", error);
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            // Update quantity
            updateQuantity: async (productId, newQuantity) => {
                set({ isLoading: true, error: null });

                try {
                    if (newQuantity < 1) {
                        throw new Error("Số lượng phải lớn hơn 0");
                    }

                    const currentItems = get().items;
                    const itemIndex = currentItems.findIndex(item => item.productId === productId);

                    if (itemIndex === -1) {
                        throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
                    }

                    const item = currentItems[itemIndex];

                    if (newQuantity > item.maxInventory) {
                        throw new Error(`Chỉ còn ${item.maxInventory} sản phẩm`);
                    }

                    const updatedItems = currentItems.map((item, index) =>
                        index === itemIndex
                            ? { ...item, quantity: newQuantity }
                            : item
                    );

                    set({ items: updatedItems, isLoading: false });

                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            // Remove item from cart
            removeFromCart: (productId) => {
                const updatedItems = get().items.filter(item => item.productId !== productId);
                set({ items: updatedItems });
            },

            // Clear cart
            clearCart: () => {
                set({ items: [] });
            },

            // Get cart totals
            getCartTotal: () => {
                const items = get().items;
                return items.reduce((total, item) => total + (item.price * item.quantity), 0);
            },

            // Get total items count
            getTotalItems: () => {
                const items = get().items;
                return items.reduce((total, item) => total + item.quantity, 0);
            },

            // Process checkout (create order)
            processCheckout: async (orderData) => {
                set({ isLoading: true, error: null });

                try {
                    const items = get().items;

                    if (items.length === 0) {
                        throw new Error('Giỏ hàng trống');
                    }

                    const response = await fetch(`${API_URL}/orders`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                            ...orderData,
                            items: items.map(item => ({
                                productId: item.productId,
                                quantity: item.quantity,
                                price: item.price
                            })),
                            totalAmount: get().getCartTotal()
                        })
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.message || 'Không thể tạo đơn hàng');
                    }

                    // Clear cart after successful checkout
                    set({ items: [], isLoading: false });

                    return result;

                } catch (error) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            // Clear error
            clearError: () => {
                set({ error: null });
            }
        }),
        {
            name: 'cart-storage', // Storage key
            partialize: (state) => ({ items: state.items }), // Only persist items
        }
    )
);