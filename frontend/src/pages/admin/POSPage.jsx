import React, { useState, useEffect, useCallback } from "react";
import AdminHeader from "../../components/admin/AdminHeader";
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, User, CreditCard, 
  Banknote, Phone, X, Filter, RotateCcw, Save, Trash, FileText, 
  Ticket, Calculator, Delete, ChevronDown, FolderPlus, FolderOpen
} from "lucide-react";
import { toast } from "react-hot-toast";

const API_PRODUCTS_URL = "http://localhost:4173/api/products";
const API_ORDERS_URL = "http://localhost:4173/api/orders";

const POSPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterSize, setFilterSize] = useState("");
  const [filterColor, setFilterColor] = useState("");
  const [filterStatus, setFilterStatus] = useState("available");
  const [showFilters, setShowFilters] = useState(false);
  const [availableAttributes, setAvailableAttributes] = useState({ colors: [], sizes: [] });
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    fullName: "Khách lẻ",
    phone: "",
    email: "",
    address: "Tại cửa hàng",
  });
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [discount, setDiscount] = useState(0);
  const [customerPaid, setCustomerPaid] = useState(0);
  const [activeInput, setActiveInput] = useState("paid"); // 'paid' or 'discount'
  
  // Promo Code States
  const [appliedPromoCode, setAppliedPromoCode] = useState(null);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [availablePromoCodes, setAvailablePromoCodes] = useState([]);
  const [promoError, setPromoError] = useState("");

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  // Held Orders State
  const [heldOrders, setHeldOrders] = useState(() => {
    try {
      const saved = localStorage.getItem("held_orders");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error reading held orders:", e);
      return [];
    }
  });
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);
  const change = Math.max(0, customerPaid - total);

  useEffect(() => {
    try {
      localStorage.setItem("held_orders", JSON.stringify(heldOrders));
    } catch (e) {
      console.error("Error saving held orders:", e);
    }
  }, [heldOrders]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search: search,
        limit: "50",
        status: filterStatus,
        category: selectedCategory,
        size: filterSize,
        color: filterColor
      });
      
      const response = await fetch(`${API_PRODUCTS_URL}?${queryParams.toString()}`, {
        credentials: "include",
      });
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, filterSize, filterColor, filterStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // Fetch unique attributes for filters on mount
  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const response = await fetch(`${API_PRODUCTS_URL}/attributes`, {
          credentials: "include",
        });
        const data = await response.json();
        if (data.colors || data.sizes) {
          setAvailableAttributes({
            colors: data.colors || [],
            sizes: data.sizes || []
          });
        }
      } catch (error) {
        console.error("Error fetching attributes:", error);
      }
    };
    fetchAttributes();
  }, []);

  // Fetch active promo codes
  const fetchPromoCodes = async () => {
    try {
      const response = await fetch("http://localhost:4173/api/discounts?isActive=true&limit=50", {
        credentials: "include"
      });
      const data = await response.json();
      if (data.discounts) {
        setAvailablePromoCodes(data.discounts);
      }
    } catch (error) {
      console.error("Error fetching promo codes:", error);
    }
  };

  useEffect(() => {
    if (showPromoModal) {
      fetchPromoCodes();
    }
  }, [showPromoModal]);

  // Apply promo code logic
  const handleApplyPromoCode = async (codeToApply) => {
    const code = codeToApply || promoCodeInput;
    if (!code) {
      setPromoError("Vui lòng nhập hoặc chọn mã khuyến mãi.");
      return;
    }
    
    setPromoError("");
    try {
      const response = await fetch("http://localhost:4173/api/discounts/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), orderAmount: subtotal }),
        credentials: "include"
      });
      const data = await response.json();
      if (data.isValid) {
        setAppliedPromoCode(data.discount);
        setDiscount(data.discountAmount);
        setShowPromoModal(false);
        setPromoCodeInput("");
        toast.success(`Đã áp dụng mã ${data.discount.code} thành công!`);
      } else {
        setPromoError(data.message || "Mã không hợp lệ.");
      }
    } catch (error) {
      console.error("Error checking discount:", error);
      setPromoError("Lỗi hệ thống khi xác thực mã.");
    }
  };

  // Remove promo code
  const handleRemovePromoCode = () => {
    setAppliedPromoCode(null);
    setDiscount(0);
    toast.success("Đã gỡ mã khuyến mãi.");
  };

  // Auto recalculate discount based on subtotal changes
  useEffect(() => {
    if (appliedPromoCode) {
      if (subtotal < appliedPromoCode.minOrderValue) {
        setAppliedPromoCode(null);
        setDiscount(0);
        toast.error(`Giỏ hàng giảm xuống dưới ${appliedPromoCode.minOrderValue.toLocaleString()}đ. Đã gỡ mã ${appliedPromoCode.code}.`);
      } else {
        let amt = 0;
        if (appliedPromoCode.discountType === 'percentage') {
          amt = (subtotal * appliedPromoCode.discountValue) / 100;
          if (appliedPromoCode.maxDiscountAmount !== null && amt > appliedPromoCode.maxDiscountAmount) {
            amt = appliedPromoCode.maxDiscountAmount;
          }
        } else {
          amt = appliedPromoCode.discountValue;
        }
        if (amt > subtotal) amt = subtotal;
        setDiscount(amt);
      }
    }
  }, [subtotal, appliedPromoCode]);

  // Handle F5 shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F5") {
        e.preventDefault();
        handleCheckout();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, customerPaid, paymentMethod, orderNote, discount]);

  // Kiểm tra kết quả thanh toán từ PayOS khi quay lại trang POS
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderCode = params.get("orderCode");

    if (orderCode) {
      const verifyPayment = async () => {
        const loadingToast = toast.loading("Đang xác thực trạng thái thanh toán từ PayOS...");
        try {
          const response = await fetch("http://localhost:4173/api/payments/verify-payos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderCode }),
            credentials: "include",
          });

          const data = await response.json();
          if (response.ok && data.success) {
            if (data.status === "PAID") {
              toast.success("Thanh toán thành công! Đơn hàng đã được hoàn thành.", { id: loadingToast });
            } else if (data.status === "CANCELLED") {
              toast.error("Thanh toán đã bị hủy. Đơn hàng đã chuyển sang trạng thái đã hủy.", { id: loadingToast });
            } else {
              toast.info(`Trạng thái thanh toán: ${data.message || data.status}`, { id: loadingToast });
            }
          } else {
            toast.error(data.message || "Không thể xác minh trạng thái thanh toán.", { id: loadingToast });
          }
        } catch (error) {
          console.error("Lỗi xác minh thanh toán:", error);
          toast.defaultError ? toast.defaultError("Có lỗi xảy ra khi xác minh thanh toán.") : toast.error("Có lỗi xảy ra khi xác minh thanh toán.", { id: loadingToast });
        } finally {
          // Xóa các tham số query trên URL để tránh lặp lại hành động khi reload trang
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      };

      verifyPayment();
    }
  }, []);

  // Variant Helper Functions
  const getUniqueColors = (product) => {
    if (!product?.variant || product.variant.length === 0) return [];
    return [...new Set(product.variant.map((v) => v.color).filter(Boolean))];
  };

  const getUniqueSizes = (product) => {
    if (!product?.variant || product.variant.length === 0) return [];
    return [...new Set(product.variant.map((v) => v.size).filter(Boolean))];
  };

  const getSelectedVariant = (product, color, size) => {
    if (!product?.variant || product.variant.length === 0) return null;
    return (
      product.variant.find((v) => v.color === color && v.size === size) ||
      product.variant[0]
    );
  };

  const getAvailableSizesForColor = (product, color) => {
    if (!product?.variant || product.variant.length === 0) return [];
    return product.variant.filter((v) => v.color === color).map((v) => v.size).filter(Boolean);
  };

  const getAvailableColorsForSize = (product, size) => {
    if (!product?.variant || product.variant.length === 0) return [];
    return product.variant.filter((v) => v.size === size).map((v) => v.color).filter(Boolean);
  };

  // Open Modal
  const openModal = (product) => {
    if (product.inventory <= 0) {
      toast.error("Sản phẩm đã hết hàng");
      return;
    }
    setSelectedProduct(product);
    setModalQuantity(1);
    setSelectedColor("");
    setSelectedSize("");
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setModalQuantity(1);
    setSelectedColor("");
    setSelectedSize("");
  };

  // Confirm Add to Cart from Modal
  const confirmAddToCart = () => {
    const product = selectedProduct;
    if (!product) return;

    const hasVariants = product.variant && product.variant.length > 0;
    if (hasVariants && (!selectedColor || !selectedSize)) {
      toast.error("Vui lòng chọn đầy đủ màu sắc và kích thước!");
      return;
    }

    const selectedVariant = hasVariants ? getSelectedVariant(product, selectedColor, selectedSize) : null;
    const finalPrice = product.price + (selectedVariant?.price || 0);
    
    const cartItemId = hasVariants ? `${product._id}-${selectedColor}-${selectedSize}` : product._id;

    const existingItem = cart.find((item) => item.cartItemId === cartItemId);
    if (existingItem) {
      if (existingItem.quantity + modalQuantity > product.inventory) {
        toast.error("Không thể thêm quá số lượng trong kho");
        return;
      }
      setCart(
        cart.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + modalQuantity }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          cartItemId: cartItemId,
          productId: product._id,
          productName: product.productName,
          price: finalPrice,
          quantity: modalQuantity,
          image: product.image,
          inventory: product.inventory,
          selectedColor,
          selectedSize,
          note: ""
        },
      ]);
    }

    toast.success(`Đã thêm ${modalQuantity} ${product.productName}`);
    closeModal();
  };

  // Update quantity
  const updateQuantity = (cartItemId, delta) => {
    setCart(
      cart.map((item) => {
        if (item.cartItemId === cartItemId) {
          const newQty = Math.max(1, item.quantity + delta);
          if (newQty > item.inventory) {
            toast.error("Không đủ hàng trong kho");
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleQuantityChange = (cartItemId, value) => {
    const qty = parseInt(value) || 1;
    setCart(
      cart.map((item) => {
        if (item.cartItemId === cartItemId) {
          if (qty > item.inventory) {
            toast.error("Không đủ hàng trong kho");
            return { ...item, quantity: item.inventory };
          }
          return { ...item, quantity: Math.max(1, qty) };
        }
        return item;
      })
    );
  };

  const updateItemNote = (cartItemId, note) => {
    setCart(cart.map(item => item.cartItemId === cartItemId ? { ...item, note } : item));
  };

  const toggleItemNote = (cartItemId) => {
    setCart(cart.map(item => item.cartItemId === cartItemId ? { ...item, showNote: !item.showNote } : item));
  };

  // Remove from cart
  const removeFromCart = (cartItemId) => {
    setCart(cart.filter((item) => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    if (window.confirm("Xóa tất cả sản phẩm trong giỏ?")) {
      setCart([]);
      setDiscount(0);
      setCustomerPaid(0);
      setOrderNote("");
    }
  };

  // Keypad Logic
  const handleKeypadPress = (val) => {
    let currentVal = activeInput === "paid" ? customerPaid.toString() : discount.toString();
    
    if (val === "del") {
      currentVal = currentVal.slice(0, -1) || "0";
    } else if (val === ".") {
      if (!currentVal.includes(".")) currentVal += ".";
    } else {
      if (currentVal === "0") currentVal = val;
      else currentVal += val;
    }

    if (activeInput === "paid") setCustomerPaid(parseFloat(currentVal));
    else setDiscount(parseFloat(currentVal));
  };

  const setQuickCash = (amount) => {
    setCustomerPaid(amount);
  };

  // Handle Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Giỏ hàng trống");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          productName: item.productName,
          image: item.image,
          color: item.selectedColor,
          size: item.selectedSize,
          note: item.note
        })),
        shippingAddress: {
          fullName: customerInfo.fullName || "Khách lẻ",
          phone: customerInfo.phone || "0000000000",
          email: customerInfo.email,
          address: "Tại cửa hàng",
          city: "Tại cửa hàng",
          district: "Tại cửa hàng",
          ward: "Tại cửa hàng"
        },
        paymentMethod: paymentMethod === 'cash' ? 'cod' : (paymentMethod === 'transfer' ? 'bank_transfer' : 'card'),
        status: "delivered",
        paymentStatus: paymentMethod === 'cash' ? 'paid' : 'pending',
        isPos: true, 
        shippingFee: 0,
        discountAmount: discount,
        totalAmount: total,
        promoCode: appliedPromoCode ? appliedPromoCode.code : null,
        notes: orderNote || "Đơn hàng tạo từ máy PoS",
      };

      console.log("Submitting orderData:", orderData);

      const response = await fetch(API_ORDERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Order created successfully, response data:", data);
        toast.success("Đã tạo đơn hàng thành công!");
        
        if (data.checkoutUrl && paymentMethod === 'transfer') {
          window.open(data.checkoutUrl, '_blank');
        }

        setCart([]);
        setOrderNote("");
        setDiscount(0);
        setCustomerPaid(0);
        setAppliedPromoCode(null);
        setCustomerInfo({ fullName: "Khách lẻ", phone: "", email: "", address: "Tại cửa hàng" });
        fetchProducts(); 
      } else {
        console.error("Order creation failed:", { status: response.status, data });
        toast.error(data.message || "Lỗi khi tạo đơn hàng");
      }
    } catch (error) {
      console.error("Checkout catch error:", error);
      toast.error("Có lỗi xảy ra khi xử lý thanh toán");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHoldOrder = () => {
    if (cart.length === 0) return;

    const newHeldOrder = {
      id: "HOLD-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      cartItems: [...cart],
      customerInfo: { ...customerInfo },
      paymentMethod,
      discount,
      orderNote,
      customerPaid,
    };

    setHeldOrders(prev => [newHeldOrder, ...prev]);
    toast.success("Đã lưu đơn tạm thành công!");

    // Clear active cart
    setCart([]);
    setOrderNote("");
    setDiscount(0);
    setCustomerPaid(0);
    setCustomerInfo({ fullName: "Khách lẻ", phone: "", email: "", address: "Tại cửa hàng" });
  };

  const handleRestoreHeldOrder = (heldOrder) => {
    if (cart.length > 0) {
      const confirmReplace = window.confirm("Giỏ hàng hiện tại đang có sản phẩm. Bạn có chắc chắn muốn thay thế bằng đơn tạm này?");
      if (!confirmReplace) return;
    }

    setCart(heldOrder.cartItems || []);
    setCustomerInfo(heldOrder.customerInfo || { fullName: "Khách lẻ", phone: "", email: "", address: "Tại cửa hàng" });
    setPaymentMethod(heldOrder.paymentMethod || "cash");
    setDiscount(heldOrder.discount || 0);
    setOrderNote(heldOrder.orderNote || "");
    setCustomerPaid(heldOrder.customerPaid || 0);

    setHeldOrders(prev => prev.filter(o => o.id !== heldOrder.id));
    setShowHeldOrdersModal(false);
    toast.success("Đã khôi phục đơn tạm!");
  };

  const handleDeleteHeldOrder = (id) => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa đơn tạm này?");
    if (!confirmDelete) return;

    setHeldOrders(prev => prev.filter(o => o.id !== id));
    toast.success("Đã xóa đơn tạm!");
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Category Sidebar */}
        <div className="w-48 bg-white border-r border-gray-200 flex flex-col overflow-y-auto shrink-0 shadow-sm">
          <div className="p-2 space-y-1">
            {['all', 'Áo', 'Quần', 'Áo khoác', 'Váy', 'Phụ kiện', 'Khác'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-green-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-green-50 hover:text-green-700"
                }`}
              >
                {cat === 'all' ? 'Tất cả' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Middle: Product Selection */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm sản phẩm (Tên, mã...)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-green-500 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-sm transition-all ${
                showFilters ? "bg-green-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-5 h-5" />
              <span className="font-medium">Bộ lọc</span>
            </button>

            <button 
              onClick={() => setShowHeldOrdersModal(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-sm bg-white text-gray-700 hover:bg-gray-50 border border-gray-100 transition-all font-semibold"
            >
              <FolderOpen className="w-5 h-5 text-amber-500" />
              <span>Đơn tạm</span>
              {heldOrders.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-bounce shadow">
                  {heldOrders.length}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mb-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Kích thước</label>
                <select
                  value={filterSize}
                  onChange={(e) => setFilterSize(e.target.value)}
                  className="w-full p-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="">Tất cả</option>
                  {availableAttributes.sizes.map(size => <option key={size} value={size}>{size}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Màu sắc</label>
                <select
                  value={filterColor}
                  onChange={(e) => setFilterColor(e.target.value)}
                  className="w-full p-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="">Tất cả</option>
                  {availableAttributes.colors.map(color => <option key={color} value={color}>{color}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Trạng thái</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="all">Tất cả</option>
                  <option value="available">Còn hàng</option>
                  <option value="out_of_stock">Hết hàng</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {products.map((product) => (
                  <div
                    key={product._id}
                    onClick={() => openModal(product)}
                    className={`bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-xl transition-all border-2 border-transparent active:scale-95 group ${
                      product.inventory <= 0 ? "opacity-60 grayscale" : "hover:border-green-500"
                    }`}
                  >
                    <div className="aspect-[4/5] bg-gray-100 relative">
                      {product.image ? (
                        <img
                          src={`http://localhost:4173${product.image}`}
                          alt={product.productName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                      {product.inventory <= 0 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">HẾT HÀNG</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-gray-800 text-sm line-clamp-2 min-h-[2.5rem] mb-1">{product.productName}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-green-600 font-black text-base">{product.price.toLocaleString()}đ</p>
                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-bold">Tồn: {product.inventory}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer & Notes Section */}
          <div className="mt-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-green-600" />
                <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Thông tin khách hàng</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Tên khách hàng" 
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 shadow-inner"
                    value={customerInfo.fullName === "Khách lẻ" ? "" : customerInfo.fullName}
                    onChange={(e) => setCustomerInfo({...customerInfo, fullName: e.target.value})}
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Số điện thoại" 
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 shadow-inner"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  />
                </div>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="email" 
                    placeholder="Email (nhận hóa đơn)" 
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 shadow-inner"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <div className="w-1/3">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Ghi chú đơn hàng</span>
              </div>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea 
                  placeholder="Nhập ghi chú..." 
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 shadow-inner h-[42px] resize-none"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Cart UI Redesign */}
        <div className="w-[520px] bg-white shadow-2xl flex flex-col border-l border-gray-200 z-10">
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <div>
              <h2 className="font-black text-xl text-gray-800 flex items-center gap-2">
                Đơn hàng
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-lg text-sm font-bold">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              </h2>
            </div>
            <div className="flex gap-2">
              <button onClick={() => fetchProducts()} title="Làm mới" className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-green-600 transition-colors">
                <RotateCcw className="w-5 h-5" />
              </button>
              <button title="Lưu đơn tạm" className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-blue-600 transition-colors">
                <Save className="w-5 h-5" />
              </button>
              <button onClick={clearCart} title="Xóa tất cả" className="p-2 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-600 transition-colors">
                <Trash className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide bg-gray-50/30">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
                <div className="p-6 bg-gray-50 rounded-full">
                  <ShoppingCart className="w-16 h-16 opacity-20" />
                </div>
                <p className="font-bold text-lg">Giỏ hàng đang trống</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.cartItemId} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex gap-3">
                    <img src={item.image ? `http://localhost:4173${item.image}` : "/placeholder.png"} className="w-16 h-16 object-cover rounded-xl shadow-sm" alt="" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-gray-800 truncate pr-2">{item.productName}</p>
                          {(item.selectedColor || item.selectedSize) && (
                            <p className="text-[11px] font-bold text-green-600 uppercase mt-0.5">
                              {item.selectedSize} {item.selectedSize && item.selectedColor && "/"} {item.selectedColor}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-black text-gray-800 whitespace-nowrap">{item.price.toLocaleString()}đ</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center bg-gray-100 rounded-xl p-0.5">
                          <button onClick={() => updateQuantity(item.cartItemId, -1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-gray-500 transition-all">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input 
                            type="number" 
                            className="w-10 bg-transparent text-center text-sm font-black text-gray-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.cartItemId, e.target.value)}
                          />
                          <button onClick={() => updateQuantity(item.cartItemId, 1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-gray-500 transition-all">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-black text-green-700">{(item.price * item.quantity).toLocaleString()}đ</p>
                          <div className="flex gap-1">
                            <button onClick={() => toggleItemNote(item.cartItemId)} className={`p-1.5 rounded-lg transition-colors ${item.note ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                              <FileText className="w-4 h-4" />
                            </button>
                            <button onClick={() => removeFromCart(item.cartItemId)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {item.showNote && (
                    <div className="mt-3">
                      <input 
                        type="text" 
                        placeholder="Thêm ghi chú cho sản phẩm này..." 
                        className="w-full text-xs p-2 bg-gray-50 border-none rounded-lg focus:ring-1 focus:ring-green-500"
                        value={item.note}
                        onChange={(e) => updateItemNote(item.cartItemId, e.target.value)}
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Summary Section */}
          <div className="p-4 bg-white border-t border-gray-100 space-y-3">
            <div className="flex justify-between text-sm font-bold text-gray-500">
              <span>Tạm tính</span>
              <span>{subtotal.toLocaleString()}đ</span>
            </div>


            {/* Mã khuyến mãi */}
            <div className="flex flex-col gap-1 border-t border-dashed border-gray-100 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-500">Mã khuyến mãi</span>
                {appliedPromoCode ? (
                  <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-lg border border-green-200 text-[10px] font-extrabold uppercase">
                    <Ticket className="w-3 h-3 text-green-600" />
                    <span>{appliedPromoCode.code}</span>
                    <button 
                      onClick={handleRemovePromoCode} 
                      className="text-red-500 hover:text-red-700 font-bold ml-1.5 focus:outline-none"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowPromoModal(true)} 
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-extrabold flex items-center gap-1 focus:outline-none"
                  >
                    <Ticket className="w-3 h-3 text-blue-600" />
                    <span>Áp dụng mã</span>
                  </button>
                )}
              </div>
              {appliedPromoCode && (
                <div className="text-[10px] text-gray-400 font-medium">
                  {appliedPromoCode.description || `Đã áp dụng giảm giá ${appliedPromoCode.discountType === 'percentage' ? `${appliedPromoCode.discountValue}%` : `${appliedPromoCode.discountValue.toLocaleString()}đ`}`}
                </div>
              )}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
              <span className="text-lg font-black text-gray-800 uppercase">Khách cần trả</span>
              <span className="text-2xl font-black text-green-700">{total.toLocaleString()}đ</span>
            </div>
          </div>

          {/* Payment Section */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Khách đưa</label>
                  <Calculator className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div 
                  onClick={() => setActiveInput("paid")}
                  className={`p-2.5 rounded-xl text-lg font-black text-right cursor-pointer transition-all border-2 ${activeInput === "paid" ? "bg-white border-green-600 ring-4 ring-green-50" : "bg-gray-100 border-transparent"}`}
                >
                  {customerPaid.toLocaleString()}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Tiền thừa</label>
                <div className="p-2.5 bg-gray-200/50 rounded-xl text-lg font-black text-right text-gray-600 border-2 border-transparent">
                  {change.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Quick Cash Buttons */}
            <div className="flex flex-wrap gap-2">
              {[200000, 500000, 1000000, 2000000].map(amt => (
                <button 
                  key={amt}
                  onClick={() => setQuickCash(amt)}
                  className="flex-1 min-w-[80px] py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:border-green-500 hover:text-green-600 transition-all shadow-sm"
                >
                  {(amt/1000)}K
                </button>
              ))}
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setPaymentMethod("cash")}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl font-bold transition-all border-2 ${paymentMethod === "cash" ? "bg-green-600 border-green-700 text-white shadow-lg" : "bg-white border-gray-100 text-gray-500 hover:border-green-200 shadow-sm"}`}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-[10px] uppercase">Tiền mặt</span>
              </button>
              <button 
                onClick={() => setPaymentMethod("transfer")}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl font-bold transition-all border-2 ${paymentMethod === "transfer" ? "bg-blue-600 border-blue-700 text-white shadow-lg" : "bg-white border-gray-100 text-gray-500 hover:border-blue-200 shadow-sm"}`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-[10px] uppercase">C.Khoản</span>
              </button>
            </div>

            {/* Numeric Keypad & Checkout */}
            <div className="flex gap-4 items-stretch">
              <div className="grid grid-cols-3 gap-2 w-64 shrink-0">
                {[1,2,3,4,5,6,7,8,9,0,"00","del"].map(k => (
                  <button 
                    key={k}
                    onClick={() => handleKeypadPress(k.toString())}
                    className={`h-14 flex items-center justify-center rounded-lg font-black transition-all shadow-sm ${k === "del" ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-white text-gray-700 hover:bg-gray-100"}`}
                  >
                    {k === "del" ? <Delete className="w-5 h-5" /> : k}
                  </button>
                ))}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <button 
                  disabled={isSubmitting || cart.length === 0}
                  onClick={handleCheckout}
                  className={`w-full flex-[2] flex flex-col items-center justify-center gap-1.5 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 ${isSubmitting || cart.length === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 shadow-green-200"}`}
                >
                  <span className="text-xl font-black tracking-tight">XÁC NHẬN</span>
                  <span className="text-[10px] bg-black/10 px-2 py-0.5 rounded-full font-medium">(F5)</span>
                </button>
                
                <button
                  disabled={cart.length === 0}
                  onClick={handleHoldOrder}
                  className={`w-full flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 ${cart.length === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600 shadow-amber-200"}`}
                >
                  <FolderPlus className="w-5 h-5 mb-0.5" />
                  <span className="text-xs uppercase tracking-wider font-extrabold">Đơn tạm (Hold)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-black text-xl text-gray-800 line-clamp-1 flex-1 pr-4">{selectedProduct.productName}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-hide">
              <div className="flex gap-6">
                <div className="w-32 h-40 bg-gray-50 rounded-2xl overflow-hidden shadow-inner flex-shrink-0">
                  {selectedProduct.image ? (
                    <img src={`http://localhost:4173${selectedProduct.image}`} alt={selectedProduct.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <div className="text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Giá sản phẩm</div>
                  <div className="text-3xl font-black text-green-700 mb-2">
                    {(selectedProduct.price + (getSelectedVariant(selectedProduct, selectedColor, selectedSize)?.price || 0)).toLocaleString()}đ
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg uppercase">Tồn kho: {selectedProduct.inventory}</span>
                  </div>
                </div>
              </div>

              {selectedProduct.variant && selectedProduct.variant.length > 0 && (
                <div className="space-y-5">
                  {getUniqueColors(selectedProduct).length > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Màu sắc</label>
                        {selectedColor && <span className="text-xs font-bold text-green-600">{selectedColor}</span>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {getUniqueColors(selectedProduct).map(color => (
                          <button
                            key={color}
                            onClick={() => {
                              setSelectedColor(color);
                              const availableSizes = getAvailableSizesForColor(selectedProduct, color);
                              if (selectedSize && !availableSizes.includes(selectedSize)) {
                                setSelectedSize(availableSizes[0] || "");
                              }
                            }}
                            className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${
                              selectedColor === color ? 'bg-green-600 border-green-700 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-600 hover:border-green-200'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {getUniqueSizes(selectedProduct).length > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Kích thước</label>
                        {selectedSize && <span className="text-xs font-bold text-green-600">{selectedSize}</span>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {getUniqueSizes(selectedProduct).map(size => {
                          const isAvailable = selectedColor ? getAvailableSizesForColor(selectedProduct, selectedColor).includes(size) : true;
                          return (
                            <button
                              key={size}
                              disabled={!isAvailable}
                              onClick={() => {
                                if (isAvailable) {
                                  setSelectedSize(size);
                                  const availableColors = getAvailableColorsForSize(selectedProduct, size);
                                  if (selectedColor && !availableColors.includes(selectedColor)) {
                                    setSelectedColor(availableColors[0] || "");
                                  }
                                }
                              }}
                              className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${
                                !isAvailable ? 'bg-gray-50 border-transparent text-gray-300 cursor-not-allowed' :
                                selectedSize === size ? 'bg-green-600 border-green-700 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-600 hover:border-green-200'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Số lượng</label>
                <div className="flex items-center gap-6">
                  <div className="flex items-center bg-gray-100 rounded-2xl p-1 w-fit shadow-inner">
                    <button 
                      onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                      className="w-12 h-12 flex items-center justify-center bg-white hover:bg-gray-50 text-gray-600 rounded-xl shadow-sm transition-all"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-16 text-center text-xl font-black text-gray-800">{modalQuantity}</span>
                    <button 
                      onClick={() => setModalQuantity(Math.min(selectedProduct.inventory, modalQuantity + 1))}
                      className="w-12 h-12 flex items-center justify-center bg-white hover:bg-gray-50 text-gray-600 rounded-xl shadow-sm transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-xs font-bold text-gray-400">Tối đa: {selectedProduct.inventory}</div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
              <button 
                onClick={closeModal}
                className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-200 rounded-2xl transition-all"
              >
                Đóng
              </button>
              <button 
                onClick={confirmAddToCart}
                disabled={selectedProduct.variant && selectedProduct.variant.length > 0 && (!selectedColor || !selectedSize)}
                className={`flex-[2] py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                  selectedProduct.variant && selectedProduct.variant.length > 0 && (!selectedColor || !selectedSize)
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 shadow-green-200'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                THÊM VÀO GIỎ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Held Orders Modal */}
      {showHeldOrdersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-6 h-6 text-amber-500" />
                <h3 className="font-black text-xl text-gray-800">Danh sách đơn tạm ({heldOrders.length})</h3>
              </div>
              <button 
                onClick={() => setShowHeldOrdersModal(false)} 
                className="text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* List */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[60vh] scrollbar-hide">
              {heldOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <FolderOpen className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="font-semibold text-lg">Chưa có đơn hàng tạm nào</p>
                  <p className="text-sm">Nhân viên có thể lưu đơn tạm để thanh toán sau</p>
                </div>
              ) : (
                heldOrders.map((order) => {
                  const totalItems = order.cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                  const totalAmount = order.cartItems?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;
                  const finalAmount = totalAmount - (order.discount || 0);

                  return (
                    <div 
                      key={order.id}
                      className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">
                            {order.id.split("-")[1] ? new Date(Number(order.id.split("-")[1])).toLocaleTimeString("vi-VN") : "Đơn tạm"}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {order.id.split("-")[1] ? new Date(Number(order.id.split("-")[1])).toLocaleDateString("vi-VN") : ""}
                          </span>
                        </div>
                        
                        <div className="text-sm font-black text-gray-800">
                          Khách hàng: <span className="text-green-700 font-extrabold">{order.customerInfo?.fullName || "Khách lẻ"}</span>
                          {order.customerInfo?.phone && ` (${order.customerInfo.phone})`}
                        </div>

                        {/* Items preview */}
                        <div className="text-xs text-gray-500 line-clamp-1">
                          Sản phẩm: {order.cartItems?.map(item => `${item.productName} (x${item.quantity})`).join(", ")}
                        </div>
                      </div>

                      <div className="flex md:flex-col items-end gap-2 justify-between w-full md:w-auto border-t md:border-t-0 pt-2 md:pt-0">
                        <div className="text-right">
                          <div className="text-xs text-gray-400 font-bold uppercase">TỔNG TIỀN</div>
                          <div className="text-lg font-black text-green-700">{finalAmount.toLocaleString("vi-VN")}đ</div>
                          <div className="text-[10px] text-gray-400 font-medium">{totalItems} sản phẩm</div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteHeldOrder(order.id)}
                            className="p-2 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-xl transition-all"
                            title="Xóa đơn tạm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRestoreHeldOrder(order)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95 flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Khôi phục
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setShowHeldOrdersModal(false)}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promo Code Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200 text-gray-800">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-green-700" />
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                  Áp dụng Mã khuyến mãi
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowPromoModal(false);
                  setPromoCodeInput("");
                  setPromoError("");
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              
              {/* Manual Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Nhập mã khuyến mãi thủ công
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="MÃ GIẢM GIÁ (Ví dụ: GIAM10)"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-600 uppercase text-gray-800 placeholder-gray-400"
                  />
                  <button
                    onClick={() => handleApplyPromoCode()}
                    className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white font-extrabold text-xs rounded-xl shadow transition-all active:scale-95 whitespace-nowrap"
                  >
                    Áp dụng
                  </button>
                </div>
                {promoError && (
                  <p className="text-[11px] text-red-500 font-bold flex items-center gap-1 mt-1">
                    <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    {promoError}
                  </p>
                )}
              </div>

              {/* Available List */}
              <div className="space-y-3 pt-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Mã khuyến mãi hiện có tại cửa hàng
                </label>
                
                {availablePromoCodes.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                    <Ticket className="w-10 h-10 mx-auto mb-2 text-gray-300 animate-bounce" />
                    <p className="text-xs font-bold text-gray-500">Chưa có mã khuyến mãi nào hoạt động</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {availablePromoCodes.map((code) => {
                      const isEligible = subtotal >= code.minOrderValue;
                      const hasExpiry = !!code.endDate;
                      const isExpired = hasExpiry && new Date(code.endDate) < new Date();
                      const limitReached = code.usageLimit !== null && code.usageCount >= code.usageLimit;
                      const isSelectable = isEligible && !isExpired && !limitReached;

                      return (
                        <div 
                          key={code._id}
                          onClick={() => isSelectable && handleApplyPromoCode(code.code)}
                          className={`p-3.5 border rounded-2xl transition-all flex justify-between items-center gap-3 ${
                            isSelectable 
                              ? "border-green-200 hover:border-green-400 bg-green-50/20 hover:bg-green-50/40 cursor-pointer active:scale-[0.98]" 
                              : "border-gray-200 bg-gray-50/50 opacity-60 cursor-not-allowed"
                          }`}
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-extrabold rounded-md border border-blue-200">
                                {code.code}
                              </span>
                              <span className="text-xs font-black text-gray-800">
                                {code.discountType === "percentage" 
                                  ? `Giảm ${code.discountValue}%` 
                                  : `Giảm ${code.discountValue.toLocaleString()}đ`
                                }
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 font-medium">{code.description || "Không có mô tả chi tiết."}</p>
                            
                            {/* Conditions */}
                            <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[10px] font-bold text-gray-400">
                              {code.minOrderValue > 0 && (
                                <span className={isEligible ? "text-green-600" : "text-amber-600"}>
                                  Đơn tối thiểu: {code.minOrderValue.toLocaleString()}đ
                                  {!isEligible && ` (Cần thêm ${(code.minOrderValue - subtotal).toLocaleString()}đ)`}
                                </span>
                              )}
                              {code.usageLimit !== null && (
                                <span>Lượt dùng: {code.usageCount}/{code.usageLimit}</span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isSelectable ? (
                              <div className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-extrabold text-[10px] rounded-lg shadow-sm">
                                Áp dụng
                              </div>
                            ) : (
                              <div className="px-3 py-1.5 bg-gray-200 text-gray-400 font-bold text-[10px] rounded-lg">
                                {isExpired ? "Hết hạn" : limitReached ? "Hết lượt" : "Chưa đủ Đơn"}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => {
                  setShowPromoModal(false);
                  setPromoCodeInput("");
                  setPromoError("");
                }}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSPage;
