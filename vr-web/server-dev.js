//expressモジュールの読み込み
const express = require('express')
const expressFormData = require('express-form-data');
const path = require('path')

const PORTNUM = 7677

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

app.use('/api/upload_glb', expressFormData.parse({uploadDir: __dirname + '/uploads'}));

app.post('/api/upload_glb', function (req, res) {
  if (req.files.glbfile) {
    const zip = new AdmZip(req.files.glbfile.path)
    const data = zip.getEntries().filter(x=>x.entryName.match(/\.glb$/))[0].getData()
    fs.writeFileSync(__dirname + '/dist/model.glb', data)
  }
  res.sendFile(__dirname + '/api_interface/success.html')
})

app.use('/api/interface', express.static(__dirname + '/api_interface'))