const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Create an Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Firebase Realtime Database URL
const databaseUrl = 'https://menubyqr-default-rtdb.firebaseio.com/LANDING';
const languages = ['en', 'ru', 'am'];

// Directory to store the translation files
const translationDir = path.join(__dirname, './');

// Function to fetch and update translations
async function fetchAndUpdateTranslations() {
  console.log('Starting translation update...');
  for (const lang of languages) {
    try {
      console.log(`Fetching translations for language: ${lang}`);
      const response = await axios.get(`${databaseUrl}/${lang}.json`);
      const data = response.data;

      if (data) {
        // Construct the path for the language's common.json file
        const localFilePath = path.join(translationDir, lang, 'common.json');

        // Create the directory if it doesn't exist
        fs.mkdirSync(path.dirname(localFilePath), { recursive: true });

        // Write the fetched data to common.json
        fs.writeFileSync(localFilePath, JSON.stringify(data, null, 2));
        console.log(`Updated translations for ${lang} at`, new Date().toLocaleString());
      } else {
        console.error(`No data found for language: ${lang}`);
      }
    } catch (error) {
      console.error(`Error fetching translations for ${lang}:`, error.message);
    }
  }
}

// Immediately update translations on startup
fetchAndUpdateTranslations();

// Schedule the translation update every hour (3600000 milliseconds)
setInterval(fetchAndUpdateTranslations, 36000000);
// Serve static files from a 'build' directory if you have a React build
app.use(express.static(path.join(__dirname, 'build')));

// Default route to serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
