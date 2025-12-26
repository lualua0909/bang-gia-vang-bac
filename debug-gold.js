const axios = require("axios");
const https = require("https");

const instance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  }),
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Referer": "https://mihong.vn/vi/gia-vang-trong-nuoc"
  },
  withCredentials: true
});

async function main() {
  try {
    // Step 1: Get the main page to get cookies
    console.log("Fetching main page to get cookies...");
    const response1 = await instance.get("https://mihong.vn/vi/gia-vang-trong-nuoc");
    
    // Extract cookies
    const cookies = response1.headers["set-cookie"];
    let cookieHeader = "";
    if (cookies) {
      cookieHeader = cookies.map(c => c.split(";")[0]).join("; ");
      console.log("Got cookies:", cookieHeader);
    }

    // Step 2: Fetch the API
    console.log("Fetching API...");
    const response2 = await instance.get("https://mihong.vn/api/v1/gold/prices/current", {
      headers: {
        "Cookie": cookieHeader,
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    console.log("API Response:", JSON.stringify(response2.data, null, 2));

  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.log("Response status:", error.response.status);
      console.log("Response data:", error.response.data);
    }
  }
}

main();

