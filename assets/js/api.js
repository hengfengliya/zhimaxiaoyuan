// API 服务
const api = {
    // 上传文件到 R2
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(API_ENDPOINTS.upload, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('上传失败');
            }

            const data = await response.json();
            return data.url; // 返回文件的公共访问 URL
        } catch (error) {
            console.error('上传文件失败:', error);
            throw error;
        }
    },

    // 保存记录到 R2
    async saveRecord(record) {
        try {
            const response = await fetch(API_ENDPOINTS.list, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(record)
            });

            if (!response.ok) {
                throw new Error('保存记录失败');
            }

            return await response.json();
        } catch (error) {
            console.error('保存记录失败:', error);
            throw error;
        }
    },

    // 获取所有记录
    async getAllRecords() {
        try {
            const response = await fetch(API_ENDPOINTS.list);
            if (!response.ok) {
                throw new Error('获取记录失败');
            }
            return await response.json();
        } catch (error) {
            console.error('获取记录失败:', error);
            throw error;
        }
    },

    // 删除记录
    async deleteRecord(id) {
        try {
            const response = await fetch(`${API_ENDPOINTS.delete}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('删除失败响应:', errorData);
                throw new Error(`删除失败: ${response.status} ${errorData}`);
            }

            // 检查响应内容类型
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return { success: true }; // 如果没有 JSON 响应，返回成功状态
            }
        } catch (error) {
            console.error('删除记录失败:', error);
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                throw new Error('网络连接失败，请检查网络连接后重试');
            }
            throw error;
        }
    }
};

// 导出 API 函数
window.uploadFile = api.uploadFile;
window.saveRecord = api.saveRecord;
window.getAllRecords = api.getAllRecords;
window.deleteRecord = api.deleteRecord; 