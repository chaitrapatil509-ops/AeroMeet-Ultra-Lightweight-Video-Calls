// Smart Auto-Detection for Production
const IS_PROD = !window.location.hostname.includes("localhost");

const server = IS_PROD ?
    "https://aeromeet-backend.onrender.com" :
    "http://localhost:8000";

export default server;
