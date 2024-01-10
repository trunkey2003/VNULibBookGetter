const fs = require("fs");
const axios = require("axios");
const https = require("https");
const PDFDocument = require("pdfkit");

// Disable certificate validation (use with caution)
const agent = new https.Agent({
  rejectUnauthorized: false,
});

const bookPath =
  "https://ir.vnulib.edu.vn/flowpaper/services/view.php?doc=86442495821617089205171790955044825376&format=jpg&page=1&subfolder=86/44/24/";
const fromPage = 1;
const toPage = 286;

const download = async ({ bookPath, fromPage, toPage }) => {
  return new Promise((resolve, reject) => {
    if (toPage === null) reject("Please specify toPage");

    const downloadPromises = [];

    for (let i = fromPage; i <= toPage; i++) {
      let downloadPath = bookPath.replace("page=1", `page=${i}`);

      const downloadPromise = axios
        .get(downloadPath, { httpsAgent: agent, responseType: "arraybuffer" })
        .then((response) => {
          fs.writeFileSync(__dirname + "/book/" + i + ".png", response.data);
          console.log("Downloaded page " + i + " of " + toPage + "...");
        })
        .catch((error) => {
          if (toPage === Infinity && i > 1) {
            resolve(`Downloaded ${i - 1} pages`);
          } else {
            reject({
              message: "Error at page " + i + ": " + error.message,
              error: error,
            });
          }
        });

      downloadPromises.push(downloadPromise);
    }

    // Use Promise.all to wait for all download promises to resolve
    Promise.all(downloadPromises)
      .then(() => {
        if (toPage !== Infinity) {
          resolve(`Downloaded ${toPage - fromPage + 1} pages`);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};

const makebook = async ({ fromPage, toPage }) => {
  return new Promise((resolve, reject) => {
    const pages = [...Array(toPage - fromPage + 1).keys()].map(
      (i) => __dirname + "/book/" + (i + fromPage) + ".jpg"
    );
    try {
      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream("book.pdf"));
      pages.forEach((page, index) => {
        doc.image(page, 0, 0, { width: 595 });
        doc.addPage();
        console.log(
          "Generating pdf page " + (index + 1) + " of " + pages.length + "..."
        );
      });
      doc.end();
      resolve("Done");
    } catch (error) {
      reject(error);
    }
  });
};

download({ bookPath, fromPage, toPage })
  .then(() => {
    makebook({ fromPage, toPage })
      .then((message) => {
        console.log(message);
      })
      .catch((error) => {
        console.error(error);
      });
  })
  .catch((error) => {
    console.error(error);
  });
