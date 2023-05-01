const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

const uploadDirectory = './uploads';
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    let filename = file.originalname;
    const basename = path.basename(filename, path.extname(filename));
    let index = '';
    while (fs.existsSync(uploadDirectory + filename)) {
      index = index === '' ? 1 : index + 1;
      filename = `${basename}(${index})${path.extname(filename)}`;
    }
    cb(null, filename);
  }
});



const upload = multer({ storage: storage });

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const downloadUrl = 'http://localhost:3000/download/' + file.filename;
  res.send(downloadUrl);
});

app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = uploadDirectory + '/' + filename;
  res.setHeader('Content-Type', 'text/html');
  res.write(`<p>File Name: ${filename}</p>`);
  res.write(`<form method="GET" action="/files/${filename}"><button type="submit">Download</button></form>`);
  res.end();
});


app.get('/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = uploadDirectory + '/' + filename;
  
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.status(404).send('File not found');
      return;
    }

    res.download(filePath, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send('Server error');
      }
    });
  });
});


app.listen(port, () => {
  console.log(`File sharing server listening at http://localhost:${port}`);
});
