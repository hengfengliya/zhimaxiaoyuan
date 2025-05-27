const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// R2 配置 (使用 server.js 中的配置)
const R2_CONFIG = {
    accountId: 'eb948869b345b06dd59e86bf89531019',
    accessKeyId: 'ab46254008d768a96a76d5188c1c938c',
    secretAccessKey: '5e82165ffc40629f28ae365d6bd876026f74d8f59bcf695bfeb16baedf57c95d',
    bucketName: 'zhimaxiaoyuan',
    publicUrl: 'https://pub-669fcad3e416420b8198a5cb27edbb3c.r2.dev'
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

// 要删除的对象 Key
const objectKeyToDelete = 'uploads/1748315069287_2.png';

async function testDeleteObject(key) {
    console.log(`尝试删除对象: ${key}`);
    try {
        const command = new DeleteObjectCommand({
            Bucket: R2_CONFIG.bucketName,
            Key: key,
        });

        const response = await s3Client.send(command);
        console.log('删除成功:', response);
        console.log(`对象 ${key} 已从存储桶 ${R2_CONFIG.bucketName} 中删除。`);
    } catch (error) {
        console.error('删除失败:', error);
        console.error(`无法删除对象 ${key}。错误信息: ${error.message}`);
    }
}

// 执行删除测试
testDeleteObject(objectKeyToDelete); 