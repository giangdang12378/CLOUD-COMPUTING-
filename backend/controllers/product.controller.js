import prisma from '../utils/prisma.js';
import { uploadToS3, deleteFromS3 } from '../utils/s3.js';

export const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const skip = (page - 1) * limit;

    const where = { tenantId: req.tenantId };

    if (search) {
      where.productName = {
        contains: search,
        mode: 'insensitive'
      };
    }

    if (status && status !== 'all') {
      where.status = status;
    } else {
      where.status = {
        not: 'unavailable'
      };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);
    res.json({
      success: true,
      products: products.map(p => ({ ...p, _id: p.id })),
      pagination: {
        totalProducts: total,
        totalPages,
        currentPage: page,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    let imageUrl = null;
    if (req.file) imageUrl = await uploadToS3(req.file, 'products');
    const product = await prisma.product.create({
      data: {
        tenantId: req.tenantId,
        productName: req.body.productName,
        price: parseFloat(req.body.price) || 0,
        description: req.body.description || null,
        category: req.body.category || null,
        inventory: parseInt(req.body.inventory) || 0,
        status: req.body.status || 'available',
        image: imageUrl
      }
    });
    res.status(201).json({ success: true, data: { ...product, _id: product.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.product.findFirst({
      where: { id, tenantId: req.tenantId }
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });
    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderItemCount > 0) {
      await prisma.product.update({ where: { id }, data: { status: 'unavailable' } });
      return res.json({ success: true, message: 'San pham da duoc an' });
    }
    if (existing.imageUrl) await deleteFromS3(existing.imageUrl).catch(() => {});
    await prisma.product.delete({ where: { id } });
    res.json({ success: true, message: 'Xoa san pham thanh cong' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category, status } = req.body;

    const existing = await prisma.product.findFirst({
      where: { id, tenantId: req.tenantId }
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });

    let imageUrl = existing.imageUrl;
    if (req.file) {
      if (imageUrl) await deleteFromS3(imageUrl).catch(() => {});
      imageUrl = await uploadToS3(req.file, 'products');
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        price: price !== undefined ? parseFloat(price) : existing.price,
        stock: stock !== undefined ? parseInt(stock) : existing.stock,
        category: category || existing.category,
        status: status || existing.status,
        imageUrl,
      }
    });
    res.json({ success: true, product: { ...updated, _id: updated.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
