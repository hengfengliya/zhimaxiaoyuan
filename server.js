const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const cors = require('cors');
require('dotenv').config();  // 添加 dotenv 配置
const app = express();
const upload = multer();

// R2 配置
const R2_CONFIG = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    publicUrl: process.env.R2_PUBLIC_URL
};

// 配置 Cloudflare R2 客户端
const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_CONFIG.accessKeyId,
        secretAccessKey: R2_CONFIG.secretAccessKey,
    },
});

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // 提供静态文件服务

// 上传文件到 R2
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: '没有文件被上传' });
        }

        const fileName = `uploads/${Date.now()}_${file.originalname}`;

        await s3Client.send(new PutObjectCommand({
            Bucket: R2_CONFIG.bucketName,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));

        const fileUrl = `${R2_CONFIG.publicUrl}/${fileName}`;
        res.json({ url: fileUrl });
    } catch (error) {
        console.error('上传失败:', error);
        res.status(500).json({ error: '上传失败' });
    }
});

// 保存记录到 R2
app.post('/api/records', async (req, res) => {
    try {
        const record = req.body;
        if (!record || !record.id) {
            return res.status(400).json({ error: '无效的记录数据' });
        }

        const fileName = `records/${record.id}.json`;

        await s3Client.send(new PutObjectCommand({
            Bucket: R2_CONFIG.bucketName,
            Key: fileName,
            Body: JSON.stringify(record),
            ContentType: 'application/json',
        }));

        res.json(record);
    } catch (error) {
        console.error('保存记录失败:', error);
        res.status(500).json({ error: '保存记录失败' });
    }
});

// 获取所有记录
app.get('/api/records', async (req, res) => {
    try {
        const response = await s3Client.send(new ListObjectsV2Command({
            Bucket: R2_CONFIG.bucketName,
            Prefix: 'records/',
        }));

        if (!response.Contents) {
            return res.json([]);
        }

        const records = await Promise.all(
            response.Contents.map(async (item) => {
                const response = await s3Client.send(new GetObjectCommand({
                    Bucket: R2_CONFIG.bucketName,
                    Key: item.Key,
                }));
                const record = await response.Body.transformToString();
                return JSON.parse(record);
            })
        );

        // 按日期排序，最新的在前面
        records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.json(records);
    } catch (error) {
        console.error('获取记录失败:', error);
        res.status(500).json({ error: '获取记录失败' });
    }
});

// 删除记录
app.delete('/api/records/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const recordFileName = `records/${id}.json`;

        let record;
        // 1. 尝试获取记录内容
        try {
            const getObjectResponse = await s3Client.send(new GetObjectCommand({
                Bucket: R2_CONFIG.bucketName,
                Key: recordFileName,
            }));
            const recordString = await getObjectResponse.Body.transformToString();
            record = JSON.parse(recordString);
            console.log(`成功获取记录 ${recordFileName}`);

        } catch (getError) {
            // 如果是 NoSuchKey 错误，说明记录文件不存在，可能已被删除或本来就没存成功
            if (getError.name === 'NoSuchKey') {
                console.warn(`记录文件 ${recordFileName} 不存在，可能已被删除或未创建成功。`);
                // 如果记录文件不存在，跳过删除图片的步骤
                record = null; // 将 record 设置为 null，跳过后面的图片删除循环
            } else {
                // 其他获取错误，直接返回失败
                console.error(`获取记录 ${recordFileName} 失败:`, getError);
                return res.status(500).json({ error: '获取记录失败，无法执行删除操作' });
            }
        }

        // 2. 如果获取到记录，尝试删除关联的图片文件
        if (record && record.images && Array.isArray(record.images)) {
            console.log(`正在删除记录 ${id} 的关联图片...`);
            for (const image of record.images) {
                if (image.url) {
                    try {
                        // 从 URL 提取 Key (文件名)
                        const imageUrl = new URL(image.url);
                        // Key 是 publicUrl 后的路径，去除开头的 /
                        const imageKey = imageUrl.pathname.substring(1);

                        console.log(`尝试删除图片: ${imageKey}`);
                        await s3Client.send(new DeleteObjectCommand({
                            Bucket: R2_CONFIG.bucketName,
                            Key: imageKey,
                        }));
                        console.log(`图片删除成功: ${imageKey}`);
                    } catch (imageDeleteError) {
                        // 如果删除某个图片失败，记录错误但不中断，继续尝试删除其他图片和记录文件
                        console.error(`删除图片 ${image.url} 失败:`, imageDeleteError);
                        // 这里不中断并返回错误，是为了尽量清除关联文件。但需要注意，这意味着即使部分图片删除失败，记录文件仍可能被删除。
                        // 如果需要确保原子性（全部成功或全部失败），这里应中断并返回错误。
                    }
                }
            }
            console.log(`关联图片删除尝试完成.`);
        }

        // 3. 最后尝试删除记录文件本身
        console.log(`正在删除记录文件: ${recordFileName}`);
        await s3Client.send(new DeleteObjectCommand({
            Bucket: R2_CONFIG.bucketName,
            Key: recordFileName,
        }));
        console.log(`记录文件删除成功: ${recordFileName}`);

        // 所有必要的删除操作都已尝试（记录文件删除必须成功），返回成功响应
        res.json({ success: true });

    } catch (error) {
        // 捕获删除记录文件本身的错误或其他未被上面try-catch捕获的错误
        console.error('删除记录失败 (最终捕获):', error);
        res.status(500).json({ error: '删除记录失败' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
}); 