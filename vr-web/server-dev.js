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

app.use('/api/upload_glb', expressFormData.parse({uploadDir: __dirname + '/uploads', autoClean: true}));

app.post('/api/upload_glb', function (req, res) {
  if (req.files.glbfile) {
    fs.copyFileSync(req.files.glbfile.path, __dirname + '/dist/model.glb')
  }
  res.json({ok: 'ok'})
})

app.use('/api/interface', express.static(__dirname + '/api_interface'))