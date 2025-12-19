require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const nodemailer = require("nodemailer");
const cron = require("node-cron");

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const TO_EMAIL = process.env.TO_EMAIL; 

const products = {
    "FMAMBR001": "Classic Chicken Broth",
    "FMAMBR002": "Goat Bone Broth",
    "FMAMBR003": "Original Chicken Broth",
    "FMAMCT001": "Punjabi Chicken Gravy",
    "FMAMCT002": "Hydrabadi Chicken Curry",
    "FMAMCT003": "Pepper Chicken Gravy",
    "FMAMCT004": "Mughlai Chicken Gravy",
    "FMAMCT005": "Butter Chicken Gravy",
    "FMAMCT006": "Chettinadu Chicken Gravy",
    "FMAMEG001": "Pasture Raised Eggs",
    "FMAMFL001": "Sprouted Moong Dal Flour",
    "FMAMFL002": "Sprouted Ragi Flour",
    "FMAMFL003": "Sprouted Bajra Flour",
    "FMAMFL004": "Moong Chilla Flour",
    "FMAMFL005": "Carrot Chilla Mix",
    "FMAMFL006": "Beetroot Chilla Mix",
    "FMFSOC001": "Coconut Oil",
    "FMFSOG002": "Groundnut Oil",
    "FMFSOS003": "Sesame Oil",
    "FMFZCH001": "Free Range Chicken Boneless",
    "FMFZCH002": "Chicken Breast Boneless",
    "FMFZCH003": "Chicken Curry Cut without Skin",
    "FMFZCH005": "Free Range Chicken Gizzard",
    "FMFZCH007": "Free Range Chicken Leg Boneless",
    "FMFZCH008": "Free Range Chicken Thigh Without Skin",
    "FMFZCH009": "Chicken Wings",
    "FMFZCH010": "Chicken Liver",
    "FMCOFFEE01": "Arabica Coffee",
    "FMFZCH013": "Free Range Chicken Drumstick Without Skin",
    "FMJMFL001": "Jamun Flakes",
    "FMJMJM001": "Jamun Jam",
    "FMAMPT005": "Ginger Garlic Paste",
    "CHFRFZ101": "Chicken Boneless",
    "CHFRFZ105": "Chicken Gizzard",
    "CHFMFL004": "Moong Chilla Flour",
    "CHFMFL006": "Beetroot Chilla Mix",
    "CHFMFL005": "Carrot Chilla Mix",
    "CHFMFL001": "Sprouted Moong Dal Flour",
    "CHFMFL002": "Sprouted Ragi Flour",
    "CHFMFL003": "Sprouted Bajra Flour",
    "CHFMAMCT001": "Punjabi Chicken Gravy",
    "CHFMAMCT003": "Pepper Chicken Gravy",
    "CHFMAMCT006": "Chettinadu Chicken Gravy",
    "CHFMAMCT005": "Butter Chicken Gravy",
    "CHFMAMCT004": "Mughlai Chicken Gravy",
    "CHFRFZ107": "Chicken Leg Boneless",
    "CHFRFZ102": "Chicken Breast Boneless",
    "CHFRFZ103": "Chicken Curry Cut without Skin",
    "CHFRFZ108": "Chicken Thigh Without Skin",
    "CHFRFZ104": "Chicken Drumstick Without Skin",
    "Standard product": "Free Range Organic Eggs",
    "CHFMAMBR002": "Goat Bone Broth",
    "CHFMFSOG002": "Groundnut Oil",
    "CHFMJMFL001": "Jamun Flakes",
    "CHFMJMJM002": "Jamun jam",
    "CHFMAMCT002": "Hydrabadi Chicken Curry",
    "CHFMFSOS003": "Sesame Oil",
    "CHFMAMBR001": "Classic Chicken Broth",
    "CHFMFSOC001": "Coconut Oil",
    "CHFRFZ109": "Chicken Wings",
    "CHFMJMJM001": "Jamun Jam",
    "CHFMAMBR003": "Original Chicken Broth",
    "CHFRFZ106": "Chicken Liver",
    "CHFMCOFFEE01": "Arabica Coffee",
    "PANFMAMBR001": "Classic Chicken Broth",
    "PANFMAMBR003": "Original Chicken Broth",
    "PANFMAMBR002": "Goat Bone Broth",
    "PANFMAMFL005": "Carrot Chilla Mix",
    "PANFMAMFL006": "Beetroot Chilla Mix",
    "PANFMAMFL004": "Moong Chilla Flour",
    "PANFMAMFL002": "Sprouted Ragi Flour",
    "PANFMAMFL001": "Sprouted Moong Dal Flour",
    "PANFMAMFL003": "Sprouted Bajra Flour",
    "PANFMJMJM001": "Jamun Jam",
    "PANFMJMFL001": "Jamun Flakes",
    "PANFMFSOS003": "Sesame Oil",
    "PANFMFSOG002": "Groundnut Oil",
    "PANFMFSOC001": "Coconut Oil",
    "PANFMAMCT002": "Hydrabadi Chicken Curry",
    "PANFMAMCT001": "Punjabi Chicken Gravy",
    "PANFMAMCT003": "Pepper Chicken Gravy",
    "PANFMAMCT004": "Mughlai Chicken Gravy",
    "PANFMAMCT006": "Chettinadu Chicken Gravy",
    "PANFMAMCT005": "Butter Chicken Gravy",
    "PANFMCOFFEE01": "100% Organic Arabica Coffee",
    "CHFMBAR01": "Coco Bites(Pack of 10)",
    "CHFMBAR02": "Coconut Bites(Pack of 10)",
    "CUSTOMBAR1": "Protein Bar(35g) - Pack of 25",
    "CUSTOMBAR2": "Protein Bar(50g) - Pack of 25",
    "CUSTOMBAR3": "Protein Bar(70g) - Pack of 25",
    "CUSTOMBAR4": "Protein Bar(35g) - Pack of 50",
    "CUSTOMBAR5": "Protein Bar(50g) - Pack of 50",
    "CUSTOMBAR6": "Protein Bar(70g) - Pack of 50",
    "CUSTOMBAR7": "35g Snack Bar - Pack of 25",
    "CUSTOMBAR8": "50g Snack Bar - Pack of 25",
    "CUSTOMBAR9": "70g Snack Bar - Pack of 25",
    "CUSTOMBAR10": "35g Snack Bar - Pack of 50",
    "CUSTOMBAR11": "50g Snack Bar - Pack of 50",
    "CUSTOMBAR12": "70g Snack Bar - Pack of 50"
  };    

// Fetch all locations dynamically (Returns an array of { id, name })
const getCentralWarehouseLocation = async () => {
  try {
    const response = await axios.get(
      `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2025-01/locations.json`,
      {
        headers: {
          "X-Shopify-Access-Token": ACCESS_TOKEN,
          "Accept": "application/json",
        },
      }
    );

    const location = response.data.locations.find(
      loc => loc.name === "Central Warehouse - Shachi Farms"
    );

    if (!location) {
      console.error("❌ Central Warehouse - Shachi Farms not found");
      return null;
    }

    return location;
  } catch (error) {
    console.error("❌ Error fetching location:", error.message);
    return null;
  }
};

// Fetch inventory for multiple locations
const getInventory = async () => {
  try {
    const location = await getCentralWarehouseLocation();
    if (!location) return;

    const inventoryRes = await axios.get(
      `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2025-01/locations/${location.id}/inventory_levels.json`,
      {
        headers: {
          "X-Shopify-Access-Token": ACCESS_TOKEN,
        },
      }
    );

    const inventoryLevels = inventoryRes.data.inventory_levels;

    if (!inventoryLevels.length) {
      console.log("⚠️ No inventory at this location");
      return;
    }

    /** 1️⃣ Fetch ACTIVE + LISTED products ONLY */
    const productsRes = await axios.get(
      `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2025-01/products.json`,
      {
        headers: {
          "X-Shopify-Access-Token": ACCESS_TOKEN,
        },
        params: {
          status: "active",
          limit: 250,
        },
      }
    );

    const activeProducts = productsRes.data.products.filter(p =>
      p.tags
        .split(",")
        .map(t => t.trim().toLowerCase())
        .includes("listed")
    );

    /** 2️⃣ Map inventory_item_id → product */
    const inventoryMap = [];

    for (const product of activeProducts) {
      for (const variant of product.variants) {
        const level = inventoryLevels.find(
          i => i.inventory_item_id === variant.inventory_item_id
        );

        if (!level) continue;

        inventoryMap.push({
          Location_Name: location.name,
          Product_Name: products[variant.sku] || product.title,
          Available:
            level.available <= 10
              ? `LOW STOCK (${level.available})`
              : level.available,
          Updated_At: new Date(level.updated_at).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          }),
        });
      }
    }

    if (!inventoryMap.length) {
      console.log("❌ No active + listed products found");
      return;
    }

    /** 3️⃣ CSV */
    const csvContent = [
      ["Location Name", "Product Name", "Available", "Updated At"],
      ...inventoryMap.map(r => [
        r.Location_Name,
        r.Product_Name,
        r.Available,
        r.Updated_At,
      ]),
    ]
      .map(row => row.join(","))
      .join("\n");

    fs.writeFileSync("inventory_report.csv", csvContent);

    console.log("✅ Inventory CSV generated");
    await sendEmail("inventory_report.csv");

  } catch (error) {
    console.error(
      "❌ Inventory error:",
      error.response?.data || error.message
    );
  }
};


// Function to send email
const sendEmail = async (filePath) => {
    try {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS,
            },
        });

        let mailOptions = {
            from: `"Shopify Inventory" <${EMAIL_USER}>`,
            to: TO_EMAIL,
            subject: "📊 Daily Multi-Location Inventory Report",
            text: "Please find the attached inventory report for all locations.",
            attachments: [
                {
                    filename: "inventory_report.csv",
                    path: filePath,
                },
            ],
        };

        let info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${TO_EMAIL} (ID: ${info.messageId})`);
    } catch (error) {
        console.error("❌ Error sending email:", error.message);
    }
};

// Schedule task to run at 6 PM every day
cron.schedule("30 4,12 * * *", () => {
    console.log("⏳ Running scheduled task: Fetching multi-location inventory & sending email...");
    getInventory();
}, {
    timezone: "Asia/Kolkata",
});

console.log("🚀 Cron job scheduled to run every day at 6 PM (Asia/Kolkata)");

// Run immediately for testing
(async () => {
    console.log("🔍 Running initial fetch & email test...");
    await getInventory();
})();
