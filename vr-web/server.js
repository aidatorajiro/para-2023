//expressモジュールの読み込み
const express = require('express')
const path = require('path')

//expressのインスタンス化
const app = express()

app.use(express.json())


//8080番ポートでサーバーを待ちの状態にする。
//またサーバーが起動したことがわかるようにログを出力する
app.listen(7677, () => {
  console.log("サーバー起動中");
});

app.post('/api/log', function (req, res) {
  console.log(req.body)
  res.json({ok: 'ok'})
})
