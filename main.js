const mysql = require('mysql2');
const xlsx = require('xlsx');
const path = require('path');

// MySQL ulanishini o‘rnatish funksiyasi
const createDatabaseConnection = () => {
  const db = mysql.createConnection({
    host: '127.0.0.1',  // Masofaviy yoki lokal server IP manzili
    user: 'fvv_user',           // MySQL foydalanuvchi nomi
    password: 'fvv_!@#$%', // Foydalanuvchi paroli
    database: 'fvv',      // Ma'lumotlar bazasi nomi
  });

  db.connect((err) => {
    if (err) {
      console.error('MySQLga ulanishda xatolik:', err);
    } else {
      console.log('MySQLga muvaffaqiyatli ulandi');
    }
  });

  return db;
};

// Excel faylni o'qish va JSON formatiga aylantirish funksiyasi
const readExcelFile = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet, { header: 1 });
};

// Ma'lumotlarni MySQL bazasiga yozish funksiyasi
const insertRecord = (db, record) => {
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

// Excel faylni o‘qib, MySQLga yozish jarayonini boshqaruvchi asosiy funksiya
const processAndUploadFile = async (filePath) => {
  const db = createDatabaseConnection();

  try {
    const data = readExcelFile(filePath);
    console.log("Excel fayli tarkibi:", data);

    for (const row of data.slice(1)) {  // Birinchi qatorni o'tkazib yuboramiz (ustun sarlavhalari)
      const record = {
        name: row[0],           // RU ustunidagi qiymat
        description: row[1],    // Unnamed: 1 qiymatlari
        lat: row[3],            // Unnamed: 3 (широта)
        lng: row[4]             // Unnamed: 4 (долгата)
      };

      console.log(`Yozuv: `, record);

      if (!record.name || !record.lat || !record.lng) {
        console.warn('Yuklanmagan yozuv, maydonlar to`liq emas:', record);
        continue;
      }

      try {
        await insertRecord(db, record);
        console.log(`Yozuv muvaffaqiyatli yuklandi: `, record);
      } catch (err) {
        console.error('Yozuvni yuklashda xatolik yuz berdi:', err);
      }
    }
    console.log('Fayl muvaffaqiyatli yuklandi va bazaga yozildi');
  } catch (error) {
    console.error('Fayl yuklashda yoki yozishda xatolik:', error);
  } finally {
    db.end();  // MySQL ulanishini yopish
  }
};

// Faylni yuklash jarayonini ishga tushirish
const filePath = path.join(__dirname, './uploads/координаталар.xlsx');
processAndUploadFile(filePath);
