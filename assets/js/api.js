// API 服务
const api = {
    // 上传文件到 R2
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:3000/api/upload', {
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
            const response = await fetch('http://localhost:3000/api/records', {
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
            const response = await fetch('http://localhost:3000/api/records');
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
            const response = await fetch(`http://localhost:3000/api/records/${id}`, {
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