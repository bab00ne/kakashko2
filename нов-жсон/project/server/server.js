const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

process.stdout.setEncoding('utf8');
process.stdin.setEncoding('utf8');

function getUsers() {
    const data = fs.readFileSync(path.join(__dirname, 'users.json'), 'utf-8');
    return JSON.parse(data);
}

function saveUsers(users) {
    fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2), 'utf-8');
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    console.log('Requested Path:', pathname);

    if (pathname === '/' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, '..', 'client', 'public', 'index.html'), 'utf-8', (err, data) => {
            if (err) {
                console.log(err); 
                res.statusCode = 500;
                res.end('Ошибка чтения файла');
                return;
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
            res.end(data);
        });
    }

    else if (pathname === '/index' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
        });
        req.on('end', () => {
            const { username, password } = querystring.parse(body);
            const users = getUsers();

            const user = users.find(user => user.username === username && user.password === password);

            res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
            if (user) {
                res.statusCode = 302; 
                res.setHeader('Location', '/home'); 
                res.end();
            } else {
                res.statusCode = 401;
                res.end('Неверный логин или пароль');
            }
        });
    }

    else if (pathname === '/register' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
        });
        req.on('end', () => {
            const { username, password } = querystring.parse(body);
            const users = getUsers();

            const userExists = users.find(user => user.username === username);
            if (userExists) {
                res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
                res.statusCode = 409; 
                res.end('Пользователь с таким именем уже существует');
                return;
            }

            users.push({ username, password });
            saveUsers(users);

            res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
            res.statusCode = 302; 
            res.setHeader('Location', '/home'); 
            res.end();
        });
    }

    else if (pathname === '/home' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, '..', 'client', 'public', 'home.html'), 'utf-8', (err, data) => {
            if (err) {
                console.log("Ошибка при загрузке страницы:", err);
                res.statusCode = 500;
                res.end('Ошибка сервера');
                return;
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
            res.end(data);
        });
    }    

    else {
        const staticFilePath = path.join(__dirname, pathname);
        
        console.log('Запрашиваем статический файл:', staticFilePath);
    

        fs.exists(staticFilePath, (exists) => {
            if (!exists) {
                console.log(`Файл не найден: ${staticFilePath}`);
                res.statusCode = 404;
                res.end('Не найдено');
                return;
            }
    
            fs.readFile(staticFilePath, (err, data) => {
                if (err) {
                    console.log("Ошибка при чтении файла:", err);
                    res.statusCode = 500;
                    res.end('Ошибка сервера');
                    return;
                }

                const extname = path.extname(pathname);
                let contentType = 'text/plain';
    
                switch (extname) {
                    case '.html':
                        contentType = 'text/html; charset=UTF-8';
                        break;
                    case '.css':
                        contentType = 'text/css';
                        break;
                    case '.js':
                        contentType = 'application/javascript';
                        break;
                    case '.png':
                        contentType = 'image/png';
                        break;
                    case '.jpg':
                    case '.jpeg':
                        contentType = 'image/jpeg';
                        break;
                    case '.gif':
                        contentType = 'image/gif';
                        break;
                    default:
                        contentType = 'text/plain';
                        break;
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', contentType);
                res.end(data);
            });
        });
    }
    
});

const port = 3000;
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
