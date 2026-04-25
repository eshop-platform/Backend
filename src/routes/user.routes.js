const express = require("express");
const { getAllUsers, banUser, unbanUser, deleteUser } = require("../controllers/user.controller");
const { protect, adminOnly } = require("../middlewares/auth");

const router = express.Router();

router.get("/", protect, adminOnly, getAllUsers);
router.patch("/:id/ban", protect, adminOnly, banUser);
router.patch("/:id/unban", protect, adminOnly, unbanUser);
router.delete("/:id", protect, adminOnly, deleteUser);

module.exports = router;