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
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error('删除记录失败');
            }
            return await response.json();
        } catch (error) {
            console.error('删除记录失败:', error);
            throw error;
        }
    }
};

// 导出 API 函数
window.uploadFile = api.uploadFile;
window.saveRecord = api.saveRecord;
window.getAllRecords = api.getAllRecords;
window.deleteRecord = api.deleteRecord; 