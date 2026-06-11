import prisma from '../utils/prisma.js';
import path from 'path';
import fs from 'fs';

const VALID_STATUSES = ['available', 'unavailable', 'out_of_stock'];

const normalizeImagePath = (imagePath) => {
  if (!imagePath) return '/placeholder-product.jpg';
  let p = imagePath.replace(/\\/g, '/');
  if (p.startsWith('uploads/')) p = '/' + p;
  else if (!p.startsWith('/uploads/') && !p.startsWith('/placeholder')) {
    p = '/uploads/' + path.basename(p);
  }
  return p;
};

const checkFileExists = (filename) => {
  const possibleLocations = [
    path.join(process.cwd(), 'uploads', filename),
    path.join(process.cwd(), 'backend/uploads', filename),
    path.join(process.cwd(), '../uploads', filename)
  ];
  for (const location of possibleLocations) {
    if (fs.existsSync(location)) {
      console.log('✅ File found at:', location);
      return true;
    }
  }
  console.log('❌ File not found in any location:', filename);
  return false;
};

export const createProduct = async (req, res) => {
  try {
    const { status, inventory, productName, description, category, price } = req.body;
    if (status && !VALID_STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status value.' });
    if (inventory !== undefined && inventory < 0) return res.status(400).json({ message: 'Inventory must be >= 0.' });

    let imagePath = '/placeholder-product.jpg';
    if (req.file) {
      imagePath = normalizeImagePath('uploads/' + req.file.filename);
      console.log('File uploaded:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        normalizedPath: imagePath
      });
      if (!checkFileExists(req.file.filename)) {
        return res.status(500).json({ message: 'Failed to save uploaded image.' });
      }
    }

    const product = await prisma.product.create({
      data: {
        tenantId: req.tenantId,
        productName: productName || '',
        description: description || '',
        image: imagePath,
        category: category || '',
        price: Number(price) || 0,
        inventory: Number(inventory) || 0,
        status: status || 'available'
      }
    });

    product.image = normalizeImagePath(product.image);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '', status = '', category = '', sortBy = 'newest', priceMin = '', priceMax = '' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = { tenantId: req.tenantId };
    if (category && category !== 'all') where.category = category;
    if (search) where.productName = { contains: search, mode: 'insensitive' };
    if (status === 'available') { where.status = 'available'; where.inventory = { gt: 0 }; }
    else if (status === 'out_of_stock') { where.status = { not: 'unavailable' }; where.inventory = { lte: 0 }; }
    else if (status && status !== 'all') where.status = status;
    if (priceMin || priceMax) {
      where.price = {};
      if (priceMin) where.price.gte = parseFloat(priceMin);
      if (priceMax) where.price.lte = parseFloat(priceMax);
    }

    const orderBy = sortBy === 'price_asc' ? { price: 'asc' } : sortBy === 'price_desc' ? { price: 'desc' } :
                    sortBy === 'name_asc' ? { productName: 'asc' } : sortBy === 'name_desc' ? { productName: 'desc' } :
                    sortBy === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' };

    const [products, totalProducts] = await Promise.all([
      prisma.product.findMany({ where, orderBy, skip, take: limitNum }),
      prisma.product.count({ where })
    ]);

    const normalized = products.map(p => ({ ...p, image: normalizeImagePath(p.image) }));
    const totalPages = Math.ceil(totalProducts / limitNum);

    res.json({ products: normalized, pagination: { currentPage: pageNum, totalPages, totalProducts, hasNextPage: pageNum < totalPages, hasPrevPage: pageNum > 1, limit: limitNum } });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getProductAttributes = async (req, res) => {
  try {
    res.json({ colors: [], sizes: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    product.image = normalizeImagePath(product.image);
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { status, inventory, productName, price, description, category } = req.body;
    if (status && !VALID_STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status value.' });
    if (inventory !== undefined && inventory < 0) return res.status(400).json({ message: 'Inventory must be >= 0.' });

    const data = {};
    if (status !== undefined) data.status = status;
    if (inventory !== undefined) data.inventory = Number(inventory);
    if (productName !== undefined) data.productName = productName;
    if (price !== undefined) data.price = Number(price);
    if (description !== undefined) data.description = description;
    if (category !== undefined) data.category = category;
    if (req.file) data.image = normalizeImagePath('uploads/' + req.file.filename);

    const product = await prisma.product.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data });
    if (product.count === 0) return res.status(404).json({ message: 'Product not found' });

    const updated = await prisma.product.findUnique({ where: { id: req.params.id } });
    updated.image = normalizeImagePath(updated.image);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const result = await prisma.product.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data: { status: 'unavailable' } });
    if (result.count === 0) return res.status(404).json({ message: 'Product not found' });
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    product.image = normalizeImagePath(product.image);
    res.json({ message: 'Product set to unavailable', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
