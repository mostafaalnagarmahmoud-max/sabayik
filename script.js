// DOM elements
const GOLD24_BOX = document.getElementById("gold-price");
const GOLD22_BOX = document.getElementById("gold22-price");
const GOLD21_BOX = document.getElementById("gold21-price");
const GOLD18_BOX = document.getElementById("gold18-price");
const SILVER_BOX = document.getElementById("silver-price");
const COUNTDOWN = document.getElementById("countdown");
const LIVE_TIME = document.getElementById("live-time");

// Adjustments loaded from MongoDB
let priceAdjustments = { box1: 0, box2: 0, box3: 0, box4: 0, box5: 0, box6: 0 };

// ✅ Load adjustments from MongoDB (works on Render)
async function loadMongoAdjustments() {
  try {
    console.log("📥 Fetching adjustments from MongoDB...");
    const response = await fetch("/api/mongodb-data"); // ✅ relative URL (works on Render)

    const result = await response.json();
    if (result.success && result.data.length > 0) {
      const doc = result.data.find(d => d.goldExchange === "yes"); // ✅ take the correct doc
      if (doc) {
        priceAdjustments = {
          box1: parseFloat(doc["24k"] || 0),
          box2: parseFloat(doc["22k"] || 0),
          box3: parseFloat(doc["21k"] || 0),
          box4: parseFloat(doc["18k"] || 0),
          box5: 0,
          box6: parseFloat(doc["silver"] || 0)
        };
        console.log("✅ Loaded adjustments:", priceAdjustments);
      }
    } else {
      console.warn("⚠️ No Mongo data found, using defaults.");
    }
  } catch (e) {
    console.error("❌ Error loading Mongo adjustments:", e);
  }
}

function formatPrice(price) {
  return Number(price).toLocaleString("en", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

async function fetchPrices() {
  try {
    // First fetch Mongo adjustments
    await loadMongoAdjustments();

    const response = await fetch(
      "https://api.daralsabaek.com/api/goldAndFundBalance/getMetalPrices"
    );
    const data = await response.json();

    if (data.isSuccess && Array.isArray(data.result)) {
      const gold24 = data.result.find((item) => item.metalType === 1);
      const silver = data.result.find((item) => item.metalType === 2);

      if (gold24) {
        const price24 = gold24.buyPrice24 + priceAdjustments.box1;
        const price22 = price24 * (22 / 24) + priceAdjustments.box2;
        const price21 = price24 * (21 / 24) + priceAdjustments.box3;
        const price18 = price24 * (18 / 24) + priceAdjustments.box4;
        const totalValue = price24 * 31.1 * 3.271 + priceAdjustments.box5;

        GOLD24_BOX.textContent = `${formatPrice(price24)} KWD`;
        GOLD22_BOX.textContent = `${formatPrice(price22)} KWD`;
        GOLD21_BOX.textContent = `${formatPrice(price21)} KWD`;
        GOLD18_BOX.textContent = `${formatPrice(price18)} KWD`;
        document.getElementById("calculated-price").textContent =
          `${formatPrice(totalValue)} KWD`;
      }

      if (silver) {
        const silverPerGram = silver.buyPrice24;
        const silverPerKg = silverPerGram * 1000 + priceAdjustments.box6;
        SILVER_BOX.textContent = `${formatPrice(silverPerKg)} KWD`;
      }
    }
  } catch (error) {
    console.error("Fetch failed:", error);
  }
}

function updateLiveTime() {
  const now = new Date();
  LIVE_TIME.textContent = now.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function startCountdown() {
  let timeLeft = 15;
  COUNTDOWN.textContent = timeLeft;
  setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      fetchPrices();
      timeLeft = 15;
    }
    COUNTDOWN.textContent = timeLeft;
  }, 1000);
}

async function init() {
  await fetchPrices();
  updateLiveTime();
  setInterval(updateLiveTime, 1000);
  startCountdown();
}

init();
