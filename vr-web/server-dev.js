//expressモジュールの読み込み
const express = require('express')
const expressFormData = require('express-form-data');
const path = require('path')

let PORTNUM;
if (process.env.NODE_ENV === 'development') {
  PORTNUM = 7677
} else if (process.env.NODE_ENV === 'production') {
  PORTNUM = 7676
}

//expressのインスタンス化
const app = express()

app.listen(PORTNUM, () => {
  console.log("サーバー起動中");
});

app.use('/api/log', express.json())

app.post('/api/log', function (req, res) {
  console.log(req.body)
  res.json({ok: 'ok'})
})

const fs = require('fs')

const AdmZip = require("adm-zip");

const crypto = require('crypto')

let modelFileName;
if (fs.existsSync(__dirname + '/dist/latest.txt')) {
  modelFileName = fs.readFileSync(__dirname + '/dist/latest.txt')
}

app.use('/api/upload_glb', expressFormData.parse({uploadDir: __dirname + '/uploads'}));

app.post('/api/upload_glb', function (req, res) {
  if (req.files.glbfile) {
    const zip = new AdmZip(req.files.glbfile.path)
    const data = zip.getEntries().filter(x=>x.entryName.match(/\.glb$/))[0].getData()
    const filename = Math.floor((new Date()).getTime().toString() / 1000) + '_' + crypto.createHash('sha256').update(data).digest('hex').substring(0, 6) + '.glb'
    fs.writeFileSync(__dirname + '/dist/' + filename, data)
    fs.writeFileSync(__dirname + '/dist/latest.txt', filename)
  }
  res.redirect('/api/interface/success.html')
})

app.use('/api/interface', express.static(__dirname + '/api_interface'))

app.get('/api/get_glb_filename', function (req, res) {
  res.send({filename: fs.readFileSync(__dirname + '/dist/latest.txt').toString()})
})

app.use('/', express.static(__dirname + '/dist'))
