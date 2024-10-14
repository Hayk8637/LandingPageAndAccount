const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

const databaseUrl = 'https://menubyqr-default-rtdb.firebaseio.com/LANDING';
const languages = ['en', 'ru', 'am'];
const translationDir = path.join(__dirname, './');

async function fetchAndUpdateTranslations() {
  console.log("Starting translation update...");
  for (const lang of languages) {
    try {
      console.log(`Fetching translations for language: ${lang}`);
      const response = await axios.get(`${databaseUrl}/${lang}.json`);
      const data = response.data;

      if (data) {
        const localFilePath = path.join(translationDir, lang, 'common.json');
        fs.mkdirSync(path.dirname(localFilePath), { recursive: true });
        fs.writeFileSync(localFilePath, JSON.stringify(data, null, 2));
        console.log(`Updated translations for ${lang}:`, new Date().toLocaleString());
      } else {
        console.error(`No data found for language: ${lang}`);
      }
    } catch (error) {
      console.error(`Error fetching translations for ${lang}:`, error.message);
    }
  }
}

fetchAndUpdateTranslations();
setInterval(fetchAndUpdateTranslations, 3600000);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
