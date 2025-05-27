import config from './config.js';

class ImageAnalyzer {
    static async analyze(imageFile) {
        try {
            const base64Image = await this.convertToBase64(imageFile);
            console.log('开始调用API分析图片...');

            const payload = {
                model: config.api.model,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "请分析这张美食图片，并严格以 JSON 格式返回分析结果。JSON 对象应包含以下字段：title（标题建议）、type（美食类型）、description（内容描述）和tags（标签数组）。"
                            },
                            {
                                type: "image",
                                image_url: {
                                    url: base64Image
                                }
                            }
                        ]
                    }
                ]
            };

            console.log('发送API请求...');
            const response = await fetch(`${config.api.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.api.apiKey}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }

            const result = await response.json();
            console.log('API响应:', result);

            // 解析返回的JSON内容
            const content = result.choices[0].message.content;
            return JSON.parse(content);

        } catch (error) {
            console.error('分析失败:', error);
            throw error;
        }
    }

    static async convertToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // 移除 base64 URL 的前缀
                const base64 = reader.result.toString().split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

export default ImageAnalyzer;
