import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:4173/api/wishlist';

export const useWishlistStore = create(
    persist(
        (set, get) => ({
            // State
            items: [],
            isLoading: false,
            error: null,

            // Actions

            // Fetch wishlist từ server
            fetchWishlist: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch(API_URL, {
                        credentials: 'include', // Để gửi cookies
                    });

                    if (!response.ok) {
                        throw new Error('Failed to fetch wishlist');
                    }

                    const data = await response.json();

                    if (data.success) {
                        // Transform data để match với format frontend
                        const transformedItems = data.wishlistItems.map(item => ({
                            _id: item.product._id,
                            productName: item.product.productName,
                            price: item.product.price,
                            originalPrice: item.product.originalPrice,
                            image: item.product.image,
                            status: item.product.status,
                            inventory: item.product.inventory,
                            description: item.product.description,
                            variant: item.product.variant,
                            addedToWishlistAt: item.addedAt,
                            wishlistItemId: item._id // ID của wishlist item (không phải product)
                        }));

                        set({ items: transformedItems, isLoading: false });
                    } else {
                        throw new Error(data.message || 'Failed to fetch wishlist');
                    }
                } catch (error) {
                    console.error('Error fetching wishlist:', error);
                    set({ error: error.message, isLoading: false });
                    toast.error('Không thể tải danh sách yêu thích');
                }
            },

            // Thêm vào wishlist
            addToWishlist: async (productId) => {
                try {
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({ productId }),
                    });

                    const data = await response.json();

                    if (data.success) {
                        // Transform và thêm item mới vào state
                        const newItem = {
                            _id: data.wishlistItem.product._id,
                            productName: data.wishlistItem.product.productName,
                            price: data.wishlistItem.product.price,
                            originalPrice: data.wishlistItem.product.originalPrice,
                            image: data.wishlistItem.product.image,
                            status: data.wishlistItem.product.status,
                            inventory: data.wishlistItem.product.inventory,
                            description: data.wishlistItem.product.description,
                            variant: data.wishlistItem.product.variant,
                            addedToWishlistAt: data.wishlistItem.addedAt,
                            wishlistItemId: data.wishlistItem._id
                        };

                        set(state => ({
                            items: [newItem, ...state.items]
                        }));

                        toast.success(data.message || 'Đã thêm vào danh sách yêu thích');
                        return { success: true };
                    } else {
                        toast.error(data.message || 'Không thể thêm vào danh sách yêu thích');
                        return { success: false, message: data.message };
                    }
                } catch (error) {
                    console.error('Error adding to wishlist:', error);
                    toast.error('Có lỗi xảy ra khi thêm vào danh sách yêu thích');
                    return { success: false, message: error.message };
                }
            },

            // Xóa khỏi wishlist
            removeFromWishlist: async (productId) => {
                try {
                    const response = await fetch(`${API_URL}/${productId}`, {
                        method: 'DELETE',
                        credentials: 'include',
                    });

                    const data = await response.json();

                    if (data.success) {
                        // Xóa item khỏi state
                        set(state => ({
                            items: state.items.filter(item => item._id !== productId)
                        }));

                        toast.success(data.message || 'Đã xóa khỏi danh sách yêu thích');
                        return { success: true };
                    } else {
                        toast.error(data.message || 'Không thể xóa khỏi danh sách yêu thích');
                        return { success: false, message: data.message };
                    }
                } catch (error) {
                    console.error('Error removing from wishlist:', error);
                    toast.error('Có lỗi xảy ra khi xóa khỏi danh sách yêu thích');
                    return { success: false, message: error.message };
                }
            },

            // Toggle wishlist (thêm nếu chưa có, xóa nếu đã có)
            toggleWishlist: async (productId) => {
                try {
                    const response = await fetch(`${API_URL}/toggle`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({ productId }),
                    });

                    const data = await response.json();

                    if (data.success) {
                        if (data.action === 'added') {
                            // Thêm item mới vào state
                            const newItem = {
                                _id: data.wishlistItem.product._id,
                                productName: data.wishlistItem.product.productName,
                                price: data.wishlistItem.product.price,
                                originalPrice: data.wishlistItem.product.originalPrice,
                                image: data.wishlistItem.product.image,
                                status: data.wishlistItem.product.status,
                                inventory: data.wishlistItem.product.inventory,
                                description: data.wishlistItem.product.description,
                                variant: data.wishlistItem.product.variant,
                                addedToWishlistAt: data.wishlistItem.addedAt,
                                wishlistItemId: data.wishlistItem._id
                            };

                            set(state => ({
                                items: [newItem, ...state.items]
                            }));
                        } else {
                            // Xóa item khỏi state
                            set(state => ({
                                items: state.items.filter(item => item._id !== productId)
                            }));
                        }

                        toast.success(data.message);
                        return {
                            success: true,
                            action: data.action,
                            isInWishlist: data.isInWishlist
                        };
                    } else {
                        toast.error(data.message || 'Không thể thực hiện thao tác');
                        return { success: false, message: data.message };
                    }
                } catch (error) {
                    console.error('Error toggling wishlist:', error);
                    toast.error('Có lỗi xảy ra');
                    return { success: false, message: error.message };
                }
            },

            // Xóa tất cả wishlist
            clearWishlist: async () => {
                try {
                    const response = await fetch(API_URL, {
                        method: 'DELETE',
                        credentials: 'include',
                    });

                    const data = await response.json();

                    if (data.success) {
                        set({ items: [] });
                        toast.success(data.message || 'Đã xóa tất cả khỏi danh sách yêu thích');
                        return { success: true };
                    } else {
                        toast.error(data.message || 'Không thể xóa danh sách yêu thích');
                        return { success: false, message: data.message };
                    }
                } catch (error) {
                    console.error('Error clearing wishlist:', error);
                    toast.error('Có lỗi xảy ra khi xóa danh sách yêu thích');
                    return { success: false, message: error.message };
                }
            },

            // Kiểm tra sản phẩm có trong wishlist không
            isInWishlist: (productId) => {
                const items = get().items;
                return items.some(item => item._id === productId);
            },

            // Lấy tổng số items
            getTotalItems: () => {
                return get().items.length;
            },

            // Reset state (khi logout)
            resetWishlist: () => {
                set({ items: [], isLoading: false, error: null });
            },

            // Sync với server (refresh data)
            syncWishlist: async () => {
                await get().fetchWishlist();
            }
        }),
        {
            name: 'wishlist-storage', // Key trong localStorage
            partialize: (state) => ({
                items: state.items // Chỉ persist items, không persist loading/error states
            }),
        }
    )
);