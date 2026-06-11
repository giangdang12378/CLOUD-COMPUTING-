import User from '../models/user.model.js';
import Order from '../models/order.model.js';

// Lấy danh sách tất cả khách hàng với pagination và filters
export const getCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '', // all, active, inactive
      sortBy = 'newest',
      dateFrom = '',
      dateTo = ''
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    let filter = {
      tenantId: req.tenantId, // Lọc theo Store
      $and: [
        {
          $or: [
            { role: 'user' },
            { role: { $exists: false } }
          ]
        }
      ]
    };

    // Search
    if (search) {
      filter.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Status
    if (status === 'active') {
      filter.isVerified = true;
    } else if (status === 'inactive') {
      filter.isVerified = false;
    }

    // Date filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    // Sorting logic
    let sortOption = { createdAt: -1 }; // default: newest
    if (sortBy === 'oldest') sortOption = { createdAt: 1 };
    else if (sortBy === 'name_asc') sortOption = { name: 1 };
    else if (sortBy === 'name_desc') sortOption = { name: -1 };
    else if (sortBy === 'email_asc') sortOption = { email: 1 };
    else if (sortBy === 'email_desc') sortOption = { email: -1 };

    // Tổng số khách hàng + thống kê hoạt động
    const overallStatsAgg = await User.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: { $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] } },
          inactiveCustomers: { $sum: { $cond: [{ $eq: ['$isVerified', false] }, 1, 0] } }
        }
      }
    ]);
    const stats = overallStatsAgg[0] || { totalCustomers: 0, activeCustomers: 0, inactiveCustomers: 0 };

    // Lấy danh sách khách hàng + thống kê đơn hàng
      const customers = await User.aggregate([
          { $match: filter },
          { $sort: sortOption },
          { $skip: skip },
          { $limit: limitNum },
          {
              $lookup: {
                  from: 'orders',
                  localField: '_id',
                  foreignField: 'customerId',
                  as: 'orders'
              }
          },
          {
              $addFields: {
                  'stats.totalOrders': { $size: '$orders' },
                  'stats.totalSpent': {
                      $reduce: {
                          input: '$orders',
                          initialValue: 0,
                          in: { $add: ['$$value', '$$this.totalAmount'] }
                      }
                  },
                  'stats.lastOrderDate': {
                      $max: {
                          $map: {
                              input: '$orders',
                              as: 'order',
                              in: '$$order.createdAt'
                          }
                      }
                  }
              }
          },
          {
              $project: {
                  password: 0,
                  orders: 0
              }
          }
      ]);

    const totalPages = Math.ceil(stats.totalCustomers / limitNum);

    res.json({
      success: true,
      customers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages
      },
      stats
    });
  } catch (error) {
    console.error('Error getting customers:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách khách hàng',
      error: error.message
    });
  }
};

// Lấy chi tiết một khách hàng
export const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await User.findById(id, '-password');
        if (!customer || customer.role !== 'user' || customer.tenantId?.toString() !== req.tenantId?.toString()) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách hàng'
            });
        }

        // Get detailed order history
        const orders = await Order.find({ customerId: id })
            .populate('items.productId', 'productName price image')
            .sort({ createdAt: -1 })
            .limit(10); // Latest 10 orders

        // Get order statistics
        const orderStats = await Order.aggregate([
            { $match: { customerId: customer._id } },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$totalAmount' },
                    avgOrderValue: { $avg: '$totalAmount' },
                    firstOrderDate: { $min: '$createdAt' },
                    lastOrderDate: { $max: '$createdAt' }
                }
            }
        ]);

        // Get order status breakdown
        const orderStatusStats = await Order.aggregate([
            { $match: { customerId: customer._id } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const customerData = customer.toObject();
        customerData.orderHistory = orders;
        customerData.stats = {
            totalOrders: orderStats[0]?.totalOrders || 0,
            totalSpent: orderStats[0]?.totalSpent || 0,
            avgOrderValue: orderStats[0]?.avgOrderValue || 0,
            firstOrderDate: orderStats[0]?.firstOrderDate || null,
            lastOrderDate: orderStats[0]?.lastOrderDate || null,
            orderStatusBreakdown: orderStatusStats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, {})
        };

        res.json({
            success: true,
            customer: customerData
        });
    } catch (error) {
        console.error('Error getting customer by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy thông tin khách hàng',
            error: error.message
        });
    }
};

// Cập nhật thông tin khách hàng
export const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, isVerified, lastLogin } = req.body;

        // Check if customer exists
        const existingCustomer = await User.findById(id);
        if (!existingCustomer || existingCustomer.role !== 'user' || existingCustomer.tenantId?.toString() !== req.tenantId?.toString()) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách hàng'
            });
        }

        // Check if email is already taken by another user
        if (email && email !== existingCustomer.email) {
            const emailExists = await User.findOne({
                email,
                _id: { $ne: id }
            });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã được sử dụng bởi tài khoản khác'
                });
            }
        }

        // Update customer
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (isVerified !== undefined) updateData.isVerified = isVerified;
        if (lastLogin !== undefined) updateData.lastLogin = lastLogin;

        const updatedCustomer = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, select: '-password' }
        );

        res.json({
            success: true,
            message: 'Cập nhật thông tin khách hàng thành công',
            customer: updatedCustomer
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể cập nhật thông tin khách hàng',
            error: error.message
        });
    }
};

// Xóa khách hàng (soft delete - chuyển thành inactive)
export const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await User.findById(id);
        if (!customer || customer.role !== 'user' || customer.tenantId?.toString() !== req.tenantId?.toString()) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách hàng'
            });
        }

        // Soft delete: set isVerified to false instead of actual deletion
        // This preserves order history and data integrity
        await User.findByIdAndUpdate(id, {
            isVerified: false,
            deletedAt: new Date() // Optional: add deleted timestamp
        });

        res.json({
            success: true,
            message: `Đã vô hiệu hóa tài khoản khách hàng ${customer.name}`
        });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể xóa khách hàng',
            error: error.message
        });
    }
};

// Khôi phục khách hàng
export const restoreCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await User.findById(id);
        if (!customer || customer.role !== 'user') {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách hàng'
            });
        }

        await User.findByIdAndUpdate(id, {
            isVerified: true,
            $unset: { deletedAt: 1 } // Remove deleted timestamp
        });

        res.json({
            success: true,
            message: `Đã khôi phục tài khoản khách hàng ${customer.name}`
        });
    } catch (error) {
        console.error('Error restoring customer:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể khôi phục khách hàng',
            error: error.message
        });
    }
};

// Lấy thống kê khách hàng
export const getCustomerStats = async (req, res) => {
    try {
        const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y

        let dateFilter = {};
        const now = new Date();

        switch (period) {
            case '7d':
                dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
                break;
            case '30d':
                dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
                break;
            case '90d':
                dateFilter = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
                break;
            case '1y':
                dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
                break;
            default:
                dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        }

        // Overall stats
        const overallStats = await User.aggregate([
            { $match: { role: 'user', tenantId: req.tenantId } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: { $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] } },
                    inactive: { $sum: { $cond: [{ $eq: ['$isVerified', false] }, 1, 0] } }
                }
            }
        ]);

        // New registrations in period
        const newRegistrations = await User.countDocuments({
            role: 'user',
            tenantId: req.tenantId,
            createdAt: dateFilter
        });

        // Customer growth over time
        const growthData = await User.aggregate([
            { $match: { role: 'user', tenantId: req.tenantId, createdAt: dateFilter } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // Top customers by spending
        const topCustomers = await User.aggregate([
            { $match: { role: 'user', tenantId: req.tenantId } },
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'orders'
                }
            },
            {
                $addFields: {
                    totalSpent: { $sum: '$orders.totalAmount' },
                    orderCount: { $size: '$orders' }
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 10 },
            {
                $project: {
                    name: 1,
                    email: 1,
                    totalSpent: 1,
                    orderCount: 1,
                    createdAt: 1
                }
            }
        ]);

        res.json({
            success: true,
            stats: {
                overview: overallStats[0] || { total: 0, active: 0, inactive: 0 },
                newRegistrations,
                growthData,
                topCustomers,
                period
            }
        });
    } catch (error) {
        console.error('Error getting customer stats:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy thống kê khách hàng',
            error: error.message
        });
    }
};