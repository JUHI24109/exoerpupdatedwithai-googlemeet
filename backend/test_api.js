const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign({ id: 3, employeeId: 'EXO-201', role: 'HR' }, 'exo_global_secret_2026', { expiresIn: '1d' });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/stats',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`BODY: ${data}`);
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
