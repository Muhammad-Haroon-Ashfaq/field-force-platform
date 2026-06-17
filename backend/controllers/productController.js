import Product from "../models/Product.js";
import AuditLog from "../models/AuditLog.js";

// @desc    Create product
// @route   POST /api/products
// @access  Private — company_admin
export const createProduct = async (req, res) => {
  try {
    const { name, sku, brand, category, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Product name is required" });
    }

    const product = await Product.create({
      company: req.companyId,
      name,
      sku: sku || null,
      brand: brand || null,
      category: category || null,
      sortOrder: sortOrder || 0,
    });

    await AuditLog.create({
      company: req.companyId,
      user: req.user._id,
      action: "product_created",
      targetModel: "Product",
      targetId: product._id,
      details: { name: product.name },
      ipAddress: req.ip,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all products (scoped to company)
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res) => {
  try {
    const filter = { company: req.companyId };

    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = new RegExp(req.query.category, "i");
    if (req.query.brand) filter.brand = new RegExp(req.query.brand, "i");
    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, "i") },
        { sku: new RegExp(req.query.search, "i") },
      ];
    }

    const products = await Product.find(filter).sort({ sortOrder: 1, name: 1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private — company_admin
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const fields = ["name", "sku", "brand", "category", "sortOrder", "status"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    });

    const updated = await product.save();

    await AuditLog.create({
      company: req.companyId,
      user: req.user._id,
      action: "product_updated",
      targetModel: "Product",
      targetId: updated._id,
      ipAddress: req.ip,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private — company_admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.deleteOne();

    await AuditLog.create({
      company: req.companyId,
      user: req.user._id,
      action: "product_deleted",
      targetModel: "Product",
      targetId: req.params.id,
      ipAddress: req.ip,
    });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};