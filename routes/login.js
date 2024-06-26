var express = require("express");
var router = express.Router();
var common = require('./common');

router.get('/', function(req, res) {
    let config = common.GetRenderConfig(req);
    res.render('login', config);
});

module.exports = router;
