import Territory from "../models/Territory.js";

// @desc    Create territory
// @route   POST /api/territories
// @access  Private — company_admin
export const createTerritory = async (req, res) => {
  try {
    const { name, type, parent } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required" });
    }

    const validTypes = ["region", "city", "zone", "route"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: `Type must be one of: ${validTypes.join(", ")}` });
    }

    const territory = await Territory.create({
      company: req.companyId,
      name,
      type,
      parent: parent || null,
    });

    const populated = await Territory.findById(territory._id).populate("parent", "name type");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all territories (scoped to company)
// @route   GET /api/territories
// @access  Private
export const getTerritories = async (req, res) => {
  try {
    const filter = { company: req.companyId };

    if (req.query.type) filter.type = req.query.type;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";
    if (req.query.parent) filter.parent = req.query.parent;
    if (req.query.parentNull === "true") filter.parent = null;

    const territories = await Territory.find(filter)
      .populate("parent", "name type")
      .sort({ type: 1, name: 1 });

    res.json(territories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get territory tree (hierarchical)
// @route   GET /api/territories/tree
// @access  Private
export const getTerritoryTree = async (req, res) => {
  try {
    const all = await Territory.find({
      company: req.companyId,
      isActive: true,
    }).sort({ type: 1, name: 1 });

    const buildTree = (items, parentId = null) => {
      return items
        .filter((item) => {
          if (parentId === null) return item.parent === null || item.parent === undefined;
          return item.parent && item.parent.toString() === parentId.toString();
        })
        .map((item) => ({
          ...item.toObject(),
          children: buildTree(items, item._id),
        }));
    };

    res.json(buildTree(all));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single territory
// @route   GET /api/territories/:id
// @access  Private
export const getTerritoryById = async (req, res) => {
  try {
    const territory = await Territory.findOne({
      _id: req.params.id,
      company: req.companyId,
    }).populate("parent", "name type");

    if (!territory) {
      return res.status(404).json({ message: "Territory not found" });
    }

    res.json(territory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update territory
// @route   PUT /api/territories/:id
// @access  Private — company_admin
export const updateTerritory = async (req, res) => {
  try {
    const territory = await Territory.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!territory) {
      return res.status(404).json({ message: "Territory not found" });
    }

    const fields = ["name", "type", "parent", "isActive"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) territory[field] = req.body[field];
    });

    const updated = await territory.save();
    const populated = await Territory.findById(updated._id).populate("parent", "name type");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete territory
// @route   DELETE /api/territories/:id
// @access  Private — company_admin
export const deleteTerritory = async (req, res) => {
  try {
    const territory = await Territory.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!territory) {
      return res.status(404).json({ message: "Territory not found" });
    }

    // Check if any children exist
    const hasChildren = await Territory.findOne({ parent: req.params.id });
    if (hasChildren) {
      return res.status(400).json({
        message: "Cannot delete territory with sub-territories. Remove children first.",
      });
    }

    await territory.deleteOne();
    res.json({ message: "Territory deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};