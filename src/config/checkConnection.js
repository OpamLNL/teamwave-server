const https = require('https');

https.get('https://scep-db-epic-saga.k.aivencloud.com:10265', (res) => {
    console.log('statusCode:', res.statusCode);
    console.log('headers:', res.headers);

    res.on('data', (d) => {
        process.stdout.write(d);
    });
}).on('error', (e) => {
    console.error(e);
});