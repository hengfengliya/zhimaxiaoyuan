const config = {
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

// API 端点配置
const API_ENDPOINTS = {
    upload: '/api/upload',
    list: '/api/records',
    delete: '/api/records',
    get: '/api/records'
};

// 导出 API_ENDPOINTS
export { API_ENDPOINTS };

// 注意：config 中的 AI API 密钥也应通过后端调用
export default config;
