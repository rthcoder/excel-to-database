const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');

const app = express();

const db = mysql.createConnection({
  host: '194.93.25.234',  // Masofaviy serverning IP-manzili
  user: 'fvv_user',           // Masofaviy MySQL foydalanuvchisi
  password: 'fvv_!@#$%', // MySQL root foydalanuvchi paroli
  database: 'fvv',      // Ma'lumotlar bazasi nomi
  port: 3306              // MySQL odatiy porti
});

db.connect((err) => {
  if (err) {
    console.error('MySQLga ulanishda xatolik:', err);
  } else {
    console.log('Masofaviy MySQL serverga muvaffaqiyatli ulandi');
  }
});
// Multer bilan fayl yuklash sozlamalari
const upload = multer({ dest: 'uploads/' });

// Excel faylni o'qib, JSON formatiga aylantiruvchi yordamchi funksiya
const readExcelFile = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet, { header: 1 });
};

// Ma'lumotlarni MySQL bazasiga yozuvchi yordamchi funksiya
const insertRecord = async (record) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO attributes (name, description, lat, lng)
      VALUES (?, ?, ?, ?)
    `;
    const values = [record.name, record.description, record.lat, record.lng];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Ma`lumotni yozishda xatolik:', err);
        reject(err);
      } else {
        console.log(`Ma'lumot bazaga yozildi: ID ${result.insertId}`);
        resolve(result.insertId);
      }
    });
  });
};

// Excel faylni yuklash va MySQL bazasiga yozish uchun endpoint
app.get('/upload', async (req, res) => {
  const filePath = path.join(__dirname, 'uploads', 'координаталар.xlsx');

  try {
    // Excel faylni o'qish
    const data = readExcelFile(filePath);
    console.log("Excel fayli tarkibi:", data);

    // Fayldagi ustunlarni tekshirish va MySQLga yozish
    for (const row of data.slice(1)) {  // Birinchi qatorni o'tkazib yuboramiz (ustun sarlavhalari)
      const record = {
        name: row[0],           // RU ustunidagi qiymat
        description: row[1],    // Unnamed: 1 qiymatlari
        lat: row[3],            // Unnamed: 3 (широта)
        lng: row[4]             // Unnamed: 4 (долгата)
      };

      // Konsolda yozuvni va maydonlarni tekshirish
      console.log(`Yozuv: `, record);

      // Maydonlar to'liq bo'lmasa, o'tkazib yuborish
      if (!record.name || !record.lat || !record.lng) {
        console.warn('Yuklanmagan yozuv, maydonlar to`liq emas:', record);
        continue;
      }

      // Ma'lumotlarni MySQLga yozish
      try {
        await insertRecord(record);  // MySQLga yozish
        console.log(`Yozuv muvaffaqiyatli yuklandi: `, record);
      } catch (err) {
        console.error('Yozuvni yuklashda xatolik yuz berdi:', err);
      }
    }

    res.send('Fayl muvaffaqiyatli yuklandi va bazaga yozildi');
  } catch (error) {
    console.error('Fayl yuklashda yoki yozishda xatolik:', error);
    res.status(500).send('Fayl yuklashda yoki yozishda xatolik');
  }
});

// Serverni ishga tushirish
app.listen(3000, () => {
  console.log('Server 3000-portda ishlamoqda');
});
