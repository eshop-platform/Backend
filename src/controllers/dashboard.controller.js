const User = require("../models/user.model");
const Product = require("../models/product.model");
const Purchase = require("../models/purchase.model");
const Category = require("../models/category.model");

exports.getDashboardStats = async (req, res, next) => {
  try {
    // Total Users
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: "active" });
    const bannedUsers = await User.countDocuments({ status: "banned" });

    // Products Stats
    const totalProducts = await Product.countDocuments();
    const pendingProducts = await Product.countDocuments({ status: "pending" });
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });

    // Purchases Stats
    const pendingPurchases = await Purchase.countDocuments({ status: "pending" });
    
    // Revenue & Commission
    const completedPurchases = await Purchase.find({ status: "completed" });
    let totalRevenue = 0;
    let totalCommission = 0;
    completedPurchases.forEach(p => {
      totalRevenue += p.totalAmount;
      totalCommission += p.commission || (p.totalAmount * 0.05); // Assuming 5% commission if not set
    });

    // Category Distribution
    const categoryDistribution = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      {
        $unwind: "$categoryDetails"
      },
      {
        $project: {
          _id: 0,
          categoryName: "$categoryDetails.name",
          count: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          banned: bannedUsers
        },
        products: {
          total: totalProducts,
          pending: pendingProducts,
          outOfStock: outOfStockProducts
        },
        purchases: {
          pending: pendingPurchases
        },
        financials: {
          revenue: totalRevenue,
          commission: totalCommission
        },
        categoryDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};
