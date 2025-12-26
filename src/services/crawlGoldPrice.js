const axios = require("axios");
const https = require("https");

const CACHE_TTL = 60 * 1000; // 60 seconds
let cache = {
  data: null,
  timestamp: null
};

const instance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  }),
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Referer": "https://mihong.vn/vi/gia-vang-trong-nuoc"
  },
  withCredentials: true,
  timeout: 10000
});

async function crawlGoldPrice() {
  try {
    // Check cache
    const now = Date.now();
    if (cache.data && cache.timestamp && now - cache.timestamp < CACHE_TTL) {
      console.log("Returning cached gold price data");
      return cache.data;
    }

    console.log("Fetching gold price from mihong.vn...");

    // Step 1: Get cookies
    const pageResponse = await instance.get("https://mihong.vn/vi/gia-vang-trong-nuoc");
    const cookies = pageResponse.headers["set-cookie"];
    let cookieHeader = "";
    if (cookies) {
      cookieHeader = cookies.map(c => c.split(";")[0]).join("; ");
    }

    // Step 2: Call API
    const apiResponse = await instance.get("https://mihong.vn/api/v1/gold/prices/current", {
      headers: {
        "Cookie": cookieHeader,
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    const data = apiResponse.data;
    if (!data || !data.success || !Array.isArray(data.data)) {
      throw new Error("Invalid API response format");
    }

    // Find Gold 999
    const gold999 = data.data.find(item => item.code === "999");
    
    if (!gold999) {
      throw new Error("Gold 999 price not found in response");
    }

    const formatter = new Intl.NumberFormat('vi-VN');
    const result = {
      source: "mihong.vn",
      "Giá mua": formatter.format(gold999.buyingPrice),
      "Giá bán": formatter.format(gold999.sellingPrice),
    };

    // Update cache
    cache.data = result;
    cache.timestamp = Date.now();

    console.log("Successfully crawled gold price:", result);
    
    // Send to ntfy
    try {
        await axios.post(
          "https://ntfy.sh/bang-gia-0909?Title=Gi%C3%A1+v%C3%A0ng+999+Mi+H%E1%BB%93ng",
          result
        );
    } catch (e) {
        console.error("Failed to send notification:", e.message);
    }

    return result;

  } catch (error) {
    console.error("Error crawling gold price:", error.message);
    if (cache.data) {
       console.log("Returning stale cached data due to error");
       return { ...cache.data, error: "Using cached data due to failure" };
    }
    throw error;
  }
}

module.exports = {
  crawlGoldPrice
};
