require("dotenv").config();
const express = require("express");
const getInventory = require("./inventory");

const app = express();
const PORT = process.env.PORT || 4000;

app.get("/inventory", async (req, res) => {
    const data = await getInventory();
    res.json(data || { error: "Failed to fetch inventory" });
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
