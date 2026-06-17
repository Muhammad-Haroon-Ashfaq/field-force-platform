import Submission from "../models/Submission.js";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import { Parser } from "json2csv";

const buildDateFilter = (dateFrom, dateTo) => {
  const filter = {};
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = to;
    }
  }
  return filter;
};

// @desc    Dashboard overview stats
// @route   GET /api/reports/overview
// @access  Private — company_admin, manager
export const getOverview = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const dateFilter = buildDateFilter(dateFrom, dateTo);

    const baseFilter = { company: req.companyId, ...dateFilter };

    const [
      totalSubmissions,
      syncedSubmissions,
      pendingSubmissions,
      failedSubmissions,
      totalShops,
      activeEmployees,
      flaggedSubmissions,
    ] = await Promise.all([
      Submission.countDocuments(baseFilter),
      Submission.countDocuments({ ...baseFilter, syncStatus: "synced" }),
      Submission.countDocuments({ ...baseFilter, syncStatus: "pending" }),
      Submission.countDocuments({ ...baseFilter, syncStatus: "failed" }),
      Shop.countDocuments({ company: req.companyId, status: "active" }),
      User.countDocuments({ company: req.companyId, role: "employee", isActive: true }),
      Submission.countDocuments({
        ...baseFilter,
        "location.validationStatus": "warning_outside_radius",
      }),
    ]);

    res.json({
      totalSubmissions,
      syncedSubmissions,
      pendingSubmissions,
      failedSubmissions,
      totalShops,
      activeEmployees,
      flaggedSubmissions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submissions by employee
// @route   GET /api/reports/by-employee
// @access  Private — company_admin, manager
export const getByEmployee = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const dateFilter = buildDateFilter(dateFrom, dateTo);

    const results = await Submission.aggregate([
      {
        $match: {
          company: req.user.company._id,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$user",
          totalSubmissions: { $sum: 1 },
          syncedCount: {
            $sum: { $cond: [{ $eq: ["$syncStatus", "synced"] }, 1, 0] },
          },
          flaggedCount: {
            $sum: {
              $cond: [
                { $eq: ["$location.validationStatus", "warning_outside_radius"] },
                1,
                0,
              ],
            },
          },
          lastSubmission: { $max: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $project: {
          employeeId: "$_id",
          employeeName: "$employee.name",
          employeeEmail: "$employee.email",
          employeeCode: "$employee.employeeCode",
          totalSubmissions: 1,
          syncedCount: 1,
          flaggedCount: 1,
          lastSubmission: 1,
        },
      },
      { $sort: { totalSubmissions: -1 } },
    ]);

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submissions by activity type
// @route   GET /api/reports/by-activity
// @access  Private — company_admin, manager
export const getByActivity = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const dateFilter = buildDateFilter(dateFrom, dateTo);

    const results = await Submission.aggregate([
      {
        $match: {
          company: req.user.company._id,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$activityType",
          totalSubmissions: { $sum: 1 },
          lastSubmission: { $max: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "activitytypes",
          localField: "_id",
          foreignField: "_id",
          as: "activity",
        },
      },
      { $unwind: "$activity" },
      {
        $project: {
          activityId: "$_id",
          activityName: "$activity.name",
          totalSubmissions: 1,
          lastSubmission: 1,
        },
      },
      { $sort: { totalSubmissions: -1 } },
    ]);

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submissions by date range (daily breakdown)
// @route   GET /api/reports/by-date
// @access  Private — company_admin, manager
export const getByDate = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const dateFilter = buildDateFilter(dateFrom, dateTo);

    const results = await Submission.aggregate([
      {
        $match: {
          company: req.user.company._id,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          totalSubmissions: { $sum: 1 },
          syncedCount: {
            $sum: { $cond: [{ $eq: ["$syncStatus", "synced"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.day",
            },
          },
          totalSubmissions: 1,
          syncedCount: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Shop visit history
// @route   GET /api/reports/shop-visits
// @access  Private — company_admin, manager
export const getShopVisits = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const dateFilter = buildDateFilter(dateFrom, dateTo);

    const results = await Submission.aggregate([
      {
        $match: {
          company: req.user.company._id,
          shop: { $ne: null },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$shop",
          visitCount: { $sum: 1 },
          lastVisit: { $max: "$createdAt" },
          uniqueEmployees: { $addToSet: "$user" },
        },
      },
      {
        $lookup: {
          from: "shops",
          localField: "_id",
          foreignField: "_id",
          as: "shop",
        },
      },
      { $unwind: "$shop" },
      {
        $project: {
          shopId: "$_id",
          shopName: "$shop.name",
          shopArea: "$shop.area",
          shopCity: "$shop.city",
          visitCount: 1,
          lastVisit: 1,
          uniqueEmployeeCount: { $size: "$uniqueEmployees" },
        },
      },
      { $sort: { visitCount: -1 } },
    ]);

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export submissions as CSV
// @route   GET /api/reports/export-csv
// @access  Private — company_admin, manager
export const exportCSV = async (req, res) => {
  try {
    const { dateFrom, dateTo, activityType, user } = req.query;
    const dateFilter = buildDateFilter(dateFrom, dateTo);

    const filter = { company: req.companyId, ...dateFilter };
    if (activityType) filter.activityType = activityType;
    if (user) filter.user = user;

    const submissions = await Submission.find(filter)
      .populate("user", "name email employeeCode")
      .populate("shop", "name area city")
      .populate("activityType", "name")
      .sort({ createdAt: -1 })
      .limit(5000);

    const data = submissions.map((s) => ({
      ID: s._id.toString(),
      ClientUUID: s.clientUUID,
      Employee: s.user?.name || "",
      EmployeeCode: s.user?.employeeCode || "",
      Activity: s.activityType?.name || "",
      Shop: s.shop?.name || "",
      Area: s.shop?.area || "",
      City: s.shop?.city || "",
      Latitude: s.location?.lat || "",
      Longitude: s.location?.lng || "",
      LocationStatus: s.location?.validationStatus || "",
      DistanceFromShop: s.location?.distanceFromShop
        ? Math.round(s.location.distanceFromShop) + "m"
        : "",
      SyncStatus: s.syncStatus,
      Comments: s.comments || "",
      SubmittedAt: s.createdAt.toISOString(),
      SyncedAt: s.syncedAt ? s.syncedAt.toISOString() : "",
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=submissions_${Date.now()}.csv`
    );
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};