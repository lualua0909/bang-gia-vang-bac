const axios = require("axios");
const cheerio = require("cheerio");

const CACHE_TTL = 60 * 1000; // 60 seconds in milliseconds
let cache = {
  data: null,
  timestamp: null
};

/**
 * Normalize price string to number
 * Removes dots, commas, and other formatting characters
 */
function normalizePrice(priceString) {
  if (!priceString) return null;

  // Remove all non-digit characters except decimal point
  let cleaned = priceString.toString().replace(/[^\d.,]/g, "");

  // Handle Vietnamese number format (dots as thousand separators, comma as decimal)
  // or standard format (commas as thousand separators, dot as decimal)
  cleaned = cleaned.replace(/\./g, ""); // Remove dots (thousand separators)
  cleaned = cleaned.replace(",", "."); // Replace comma with dot for decimal

  const price = parseFloat(cleaned);
  return isNaN(price) ? null : Math.round(price);
}

/**
 * Extract silver buy/sell prices from giabac.vn HTML
 */
async function crawlSilverPrice() {
  try {
    // Check cache first
    const now = Date.now();
    if (cache.data && cache.timestamp && now - cache.timestamp < CACHE_TTL) {
      console.log("Returning cached silver price data");
      return cache.data;
    }

    console.log("Fetching silver price from giabac.vn...");

    // Fetch HTML content
    const response = await axios.get("https://giabac.vn/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      timeout: 10000 // 10 seconds timeout
    });

    const $ = cheerio.load(response.data);

    let buyPrice = null;
    let sellPrice = null;

    /**
     * Find "Giá mua vào" and "Giá bán ra" by looking for <p class="mb-1"> tags
     * and reading the price from the next <p> tag
     * Note: The price might be loaded dynamically, so we also check the table as fallback
     */

    // Find "Giá mua vào"
    $("p.mb-1").each((_, element) => {
      const text = $(element).text().trim();
      if (text.includes("Giá mua vào")) {
        // Get the next <p> tag (sibling)
        const nextP = $(element).next("p");
        if (nextP.length > 0) {
          const priceText = nextP.text().trim();
          // Only use if priceText is not empty (might be loaded dynamically)
          if (priceText) {
            buyPrice = normalizePrice(priceText);
            return false; // break
          }
        }
      }
    });

    // Find "Giá bán ra"
    $("p.mb-1").each((_, element) => {
      const text = $(element).text().trim();
      if (text.includes("Giá bán ra")) {
        // Get the next <p> tag (sibling)
        const nextP = $(element).next("p");
        if (nextP.length > 0) {
          const priceText = nextP.text().trim();
          // Only use if priceText is not empty (might be loaded dynamically)
          if (priceText) {
            sellPrice = priceText;
            return false; // break
          }
        }
      }
    });

    // Fallback: If prices are not found (loaded dynamically), get from table
    // Look for the first row in the table that contains "Bạc" and get prices from there
    if (!buyPrice || !sellPrice) {
      $("table").each((_, table) => {
        const $table = $(table);
        const headerRow = $table.find("tr").first();
        const headers = headerRow.find("th, td");

        let buyIndex = -1;
        let sellIndex = -1;

        headers.each((i, cell) => {
          const headerText = $(cell).text().toLowerCase();
          if (headerText.includes("mua") || headerText.includes("mua vào")) {
            buyIndex = i;
          }
          if (headerText.includes("bán") || headerText.includes("bán ra")) {
            sellIndex = i;
          }
        });

        if (buyIndex !== -1 && sellIndex !== -1) {
          // Find first row with "Bạc" in it
          $table
            .find("tr")
            .slice(1)
            .each((_, row) => {
              const $row = $(row);
              const rowText = $row.text().toLowerCase();
              if (rowText.includes("bạc") && !rowText.includes("thương hiệu")) {
                const cells = $row.find("td");
                if (cells.length > Math.max(buyIndex, sellIndex)) {
                  if (!buyPrice) {
                    const buyText = $(cells[buyIndex]).text().trim();
                    buyPrice = buyText;
                  }
                  if (!sellPrice) {
                    const sellText = $(cells[sellIndex]).text().trim();
                    sellPrice = sellText;
                  }
                  return false; // break
                }
              }
            });
        }

        // If we found both prices, stop searching
        if (buyPrice && sellPrice) {
          return false;
        }
      });
    }

    // Try to find updated time
    const timeSelectors = [
      ".updated",
      ".time",
      '[class*="time"]',
      '[class*="update"]',
      '[id*="time"]',
      '[id*="update"]'
    ];

    for (const selector of timeSelectors) {
      const timeElement = $(selector).first();
      if (timeElement.length > 0) {
        const timeText = timeElement.text().trim();
        if (timeText) {
          updatedAt = timeText;
          break;
        }
      }
    }

    if (!buyPrice || !sellPrice) {
      throw new Error("Could not extract buy/sell prices from the website");
    }

    const result = {
      source: "giabac.vn",
      "Giá mua": buyPrice,
      "Giá bán": sellPrice
    };

    // Update cache
    cache.data = result;
    cache.timestamp = Date.now();

    console.log("Successfully crawled silver price:", result);
    //Send POST to https://ntfy.sh
    await axios.post(
      "https://ntfy.sh/bang-gia-0909?Title=Gi%C3%A1+b%E1%BA%A1c+hi%E1%BB%87n+t%E1%BA%A1i",
      result
    );
    return result;
  } catch (error) {
    console.error("Error crawling silver price:", error.message);

    // If we have cached data, return it even if expired
    if (cache.data) {
      console.log("Returning stale cached data due to crawl error");
      return {
        ...cache.data,
        error: "Using cached data due to crawl failure"
      };
    }

    throw error;
  }
}

module.exports = {
  crawlSilverPrice
};
