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
    "CHFMAMCT002": "Hydrabadi Chicken Curry",
    "CHFMFSOS003": "Sesame Oil",
    "CHFMAMBR001": "Classic Chicken Broth",
    "CHFMFSOC001": "Coconut Oil",
    "CHFRFZ109": "Chicken Wings",
    "CHFMJMJM001": "Jamun Jam",
    "CHFMAMBR003": "Original Chicken Broth",
    "CHFRFZ106": "Chicken Liver"
  };    

// Fetch all locations dynamically (Returns an array of { id, name })
const getLocations = async () => {
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

        return response.data.locations.map(location => ({
            id: location.id,
            name: location.name,
        }));
    } catch (error) {
        console.error("❌ Error fetching locations:", error.response?.data || error.message);
        return [];
    }
};

// Fetch inventory for multiple locations
const getInventory = async () => {
    try {
        const locations = await getLocations();
        if (locations.length === 0) {
            console.log("❌ No locations found.");
            return;
        }

        let allInventoryData = [];

        for (const { id: locationId, name: locationName } of locations) {
            console.log(`📦 Fetching inventory for location: ${locationName} (${locationId})...`);
            
            const response = await axios.get(
                `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2025-01/locations/${locationId}/inventory_levels.json`,
                {
                    headers: {
                        "X-Shopify-Access-Token": ACCESS_TOKEN,
                        "Accept": "application/json",
                    },
                }
            );

            const inventoryLevels = response.data["inventory_levels"];

            if (inventoryLevels.length === 0) {
                console.log(`⚠️ No inventory found for location ${locationName}`);
                continue;
            }

            // Fetch product details for inventory items
            const inventoryItemIds = inventoryLevels.map(item => item.inventory_item_id).join(",");

            const productDetailsResponse = await axios.get(
                `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2025-01/inventory_items.json?ids=${inventoryItemIds}`,
                {
                    headers: {
                        "X-Shopify-Access-Token": ACCESS_TOKEN,
                        "Accept": "application/json",
                    },
                }
            );
            const inventoryItems = productDetailsResponse.data["inventory_items"];

            // Combine inventory data
            const locationInventoryData = inventoryLevels.map(item => {
                const product = inventoryItems.find(p => p.id === item.inventory_item_id && Boolean(p.sku));
                //console.log(inventoryItems.filter(p => Boolean(p.sku)));
                
                return {
                    Location_Name: locationName, // 🔹 Replaced Location ID with Location Name
                    Product_Name: product ? products[product.sku] : "Bundle Products(Leave this)", // Use SKU or other identifier
                    Inventory_Item_ID: item.inventory_item_id,
                    Available: item.available,
                    Updated_At: new Date(item.updated_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
                };
            });

            allInventoryData = [...allInventoryData, ...locationInventoryData];
        }

        if (allInventoryData.length === 0) {
            console.log("❌ No inventory data found for any location.");
            return;
        }

        // Convert to CSV format
        const csvContent = [
            ["Location Name", "Product Name", "Inventory Item ID", "Available", "Updated At"],
            ...allInventoryData.map(row => [row.Location_Name, row.Product_Name, row.Inventory_Item_ID, row.Available <= 5 ? `LOW STOCK (${row.Available})` : row.Available, row.Updated_At])
        ].map(e => e.join(",")).join("\n");

        // Save as CSV file
        const filePath = "inventory_report.csv";
        fs.writeFileSync(filePath, csvContent);
        console.log("✅ Inventory data saved to inventory_report.csv");

        // Send email with CSV report
        await sendEmail(filePath);

    } catch (error) {
        console.error("❌ Error fetching inventory:", error.response?.data || error.message);
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
cron.schedule("15 10 * * *", () => {
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
