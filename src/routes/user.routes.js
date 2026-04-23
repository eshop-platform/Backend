const express = require("express");
const { getAllUsers, banUser, unbanUser, deleteUser } = require("../controllers/user.controller");

const router = express.Router();

router.get("/", getAllUsers);
router.patch("/:id/ban", banUser);
router.patch("/:id/unban", unbanUser);
router.delete("/:id", deleteUser);

module.exports = router;