// API 基础配置
const API_BASE_URL = 'https://zhimaxiaoyuan.onrender.com';

// API 端点配置
const API_ENDPOINTS = {
    upload: `${API_BASE_URL}/api/upload`,
    list: `${API_BASE_URL}/api/records`,
    delete: `${API_BASE_URL}/api/records`,
    get: `${API_BASE_URL}/api/records`
};

// AI 配置
const AI_CONFIG = {
    api: {
        baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
        apiKey: 'b4884617-7a44-451b-b350-215bf46722f5',
        model: 'doubao-1.5-vision-lite-250315'
    }
};

// 移除 OSS 配置
// const OSSConfig = { ... };

// 移除 Cloudflare R2 配置
// const R2_CONFIG = { ... };

// 将配置暴露到全局作用域
window.API_ENDPOINTS = API_ENDPOINTS;
window.AI_CONFIG = AI_CONFIG;
