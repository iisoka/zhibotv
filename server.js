const http = require('http');
const fs = require('fs');
const path = require('path');
const port = 3000;
const rootDir = 'c:/Users/Administrator/Documents/trae_projects/tv';

console.log('根目录路径:', rootDir);
console.log('index.html路径:', path.join(rootDir, 'index.html'));
console.log('检查index.html是否存在:', fs.existsSync(path.join(rootDir, 'index.html')));

const server = http.createServer((req, res) => {
    console.log('收到请求:', req.method, req.url);
    // 只使用URL的路径部分，忽略查询参数
    const urlPath = req.url.split('?')[0];
    let filePath = path.join(rootDir, urlPath === '/' ? 'index.html' : urlPath);
    console.log('请求文件路径:', filePath);
    
    // 获取文件扩展名
    const extname = path.extname(filePath);
    
    // 设置MIME类型
    let contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'application/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
        case '.jpeg':
            contentType = 'image/jpeg';
            break;
    }
    
    // 读取并发送文件
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // 文件不存在
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('404 Not Found');
            } else {
                // 服务器错误
                res.writeHead(500);
                res.end('服务器错误: ' + err.code);
            }
        } else {
            // 成功读取文件
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// 启动服务器
server.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});
