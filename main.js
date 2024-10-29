const mysql = require('mysql2');
const xlsx = require('xlsx');
const path = require('path');

const createDatabaseConnection = () => {
  const db = mysql.createConnection({
    host: '127.0.0.1',  
    user: 'username',   
    password: 'password', 
    database: 'database',      
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

const readExcelFile = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet, { header: 1 });
};

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

const processAndUploadFile = async (filePath) => {
  const db = createDatabaseConnection();

  try {
    const data = readExcelFile(filePath);
    console.log("Excel fayli tarkibi:", data);

    for (const row of data.slice(1)) { 
      const record = {
        name: row[0],           
        description: row[1],    
        lat: row[3],            
        lng: row[4]             
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
    db.end();  
  }
};

const filePath = path.join(__dirname, './uploads/координаталар.xlsx');
processAndUploadFile(filePath);
