let IS_PROD = false;
const server = IS_PROD ?
    "https://liveconnectbackend-3rgu.onrender.com" :

    "http://localhost:8000"


export default server;
