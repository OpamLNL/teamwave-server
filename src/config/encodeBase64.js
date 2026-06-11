const fs = require('fs');

const filePath = 'ca.pem';
const outputFilePath = 'base64.txt';

const fileContent = fs.readFileSync(filePath);
const base64Content = Buffer.from(fileContent).toString('base64');

fs.writeFileSync(outputFilePath, base64Content);
console.log(`Base64 encoded content written to ${outputFilePath}`);