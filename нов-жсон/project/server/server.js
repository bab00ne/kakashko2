const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

process.stdout.setEncoding('utf8');
process.stdin.setEncoding('utf8');

// Функции для работы с данными пользователей
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
    
   // Обработка логина
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
            res.statusCode = 302; // Код для редиректа
            res.setHeader('Location', '/home'); // Перенаправление на домашнюю страницу (или другую страницу)
            res.end();
        } else {
            res.statusCode = 401;
            res.end('Неверный логин или пароль');
        }
    });
}

    // Обработка регистрации
    // Обработка регистрации
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
        res.statusCode = 302; // Код для редиректа
        res.setHeader('Location', '/index'); // Перенаправление на страницу входа после успешной регистрации
        res.end();
    });
}

    // Обслуживание статичных файлов (css, js, изображения)
    else {
        const staticFilePath = path.join(__dirname, '..', 'client', 'public', pathname);
        fs.readFile(staticFilePath, (err, data) => {
            if (err) {
                console.log("Ошибка при чтении статического файла:", err); // Логирование ошибок
                res.statusCode = 404;
                res.end('Не найдено');
            } else {
                res.statusCode = 200;
                const extname = path.extname(pathname);
                let contentType = 'text/plain';

                if (extname === '.html') contentType = 'text/html; charset=UTF-8';
                if (extname === '.css') contentType = 'text/css';
                if (extname === '.js') contentType = 'application/javascript';
                if (extname === '.png') contentType = 'image/png';
                if (extname === '.jpg' || extname === '.jpeg') contentType = 'image/jpeg';
                if (extname === '.gif') contentType = 'image/gif';

                res.setHeader('Content-Type', contentType);
                res.end(data);
            }
        });
    }
});

// Запуск сервера на порту 3000
const port = 3000;
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
