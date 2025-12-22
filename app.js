// server.js - ĐÃ SẴN SÀNG CHO CPANEL

const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000; 

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Ứng dụng đã khởi động trên cổng nội bộ: ${PORT}`);
});