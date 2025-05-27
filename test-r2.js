const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

// R2 配置
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

async function testR2Connection() {
    try {
        console.log('开始测试 R2 连接...');
        
        // 测试写入
        const testData = {
            message: '测试数据',
            timestamp: new Date().toISOString()
        };
        
        console.log('尝试写入测试数据...');
        await s3Client.send(new PutObjectCommand({
            Bucket: R2_CONFIG.bucketName,
            Key: 'test/connection-test.json',
            Body: JSON.stringify(testData),
            ContentType: 'application/json',
        }));
        console.log('写入测试成功！');

        // 测试读取
        console.log('尝试读取测试数据...');
        const response = await s3Client.send(new GetObjectCommand({
            Bucket: R2_CONFIG.bucketName,
            Key: 'test/connection-test.json',
        }));
        
        const data = await response.Body.transformToString();
        console.log('读取测试成功！数据内容:', data);
        
        console.log('R2 配置测试完成，一切正常！');
    } catch (error) {
        console.error('测试失败:', error);
    }
}

testR2Connection(); 