import Shop from "../models/Shop.js";
import AuditLog from "../models/AuditLog.js";

// @desc    Create shop
// @route   POST /api/shops
// @access  Private — company_admin, or employee if settings allow
export const createShop = async (req, res) => {
  try {
    const { name, ownerName, phone, address, area, city, shopType, latitude, longitude, territory } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Shop name is required" });
    }

    // Duplicate check — same phone within same company
    if (phone) {
      const duplicate = await Shop.findOne({ company: req.companyId, phone });
      if (duplicate) {
        return res.status(400).json({ message: "A shop with this phone number already exists" });
      }
    }

    const shop = await Shop.create({
      company: req.companyId,
      name,
      ownerName: ownerName || null,
      phone: phone || null,
      address: address || null,
      area: area || null,
      city: city || null,
      shopType: shopType || null,
      latitude: latitude || null,
      longitude: longitude || null,
      territory: territory || null,
      createdBy: req.user._id,
    });

    await AuditLog.create({
      company: req.companyId,
      user: req.user._id,
      action: "shop_created",
      targetModel: "Shop",
      targetId: shop._id,
      details: { name: shop.name },
      ipAddress: req.ip,
    });

    res.status(201).json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all shops (scoped to company)
// @route   GET /api/shops
// @access  Private
export const getShops = async (req, res) => {
  try {
    const filter = { company: req.companyId };

    if (req.query.status) filter.status = req.query.status;
    if (req.query.city) filter.city = new RegExp(req.query.city, "i");
    if (req.query.area) filter.area = new RegExp(req.query.area, "i");
    if (req.query.territory) filter.territory = req.query.territory;
    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, "i") },
        { ownerName: new RegExp(req.query.search, "i") },
        { phone: new RegExp(req.query.search, "i") },
      ];
    }

    const shops = await Shop.find(filter)
      .populate("territory", "name type")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single shop
// @route   GET /api/shops/:id
// @access  Private
export const getShopById = async (req, res) => {
  try {
    const shop = await Shop.findOne({
      _id: req.params.id,
      company: req.companyId,
    })
      .populate("territory", "name type")
      .populate("createdBy", "name");

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update shop
// @route   PUT /api/shops/:id
// @access  Private — company_admin
export const updateShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    const fields = ["name", "ownerName", "phone", "address", "area", "city", "shopType", "latitude", "longitude", "territory", "status"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) shop[field] = req.body[field];
    });

    const updated = await shop.save();

    await AuditLog.create({
      company: req.companyId,
      user: req.user._id,
      action: "shop_updated",
      targetModel: "Shop",
      targetId: updated._id,
      ipAddress: req.ip,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete shop
// @route   DELETE /api/shops/:id
// @access  Private — company_admin
export const deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    await shop.deleteOne();

    await AuditLog.create({
      company: req.companyId,
      user: req.user._id,
      action: "shop_deleted",
      targetModel: "Shop",
      targetId: req.params.id,
      ipAddress: req.ip,
    });

    res.json({ message: "Shop deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};