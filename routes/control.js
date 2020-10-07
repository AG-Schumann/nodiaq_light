var express = require("express");
var url = require("url");
var router = express.Router();
var gp='';
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    return res.redirect(gp+'/login');
}

router.get('/', ensureAuthenticated, function(req, res) {
    res.render('control', { title: 'Control', user:req.user });
});

router.get('/modes', ensureAuthenticated, function(req, res){
    var db = req.db;
    var collection = db.get("options");
    var q = url.parse(req.url, true).query;
    var detector = q.detector;
    collection.find({"detector": detector},
		    {"sort": {"name": 1}},
		    function(e, docs){
			var ret = [];
			for(var i=0; i<docs.length; i++){
			    var rs = docs[i]["name"];
			    var rd = "";
			    if(typeof docs[i]['description'] != 'undefined')
				rd = docs[i]['description'];
			    ret.push([rs, rd]);
			}
			return res.json(ret);
		    });
});

function GetControlDocs(collection) {
  return collection.aggregate([
    {$sort: {_id: -1}},
    {$group: {
      _id: {$concat: ['$detector', '.', '$field']},
      value: {$first: '$value'},
      user: {$first: '$user'},
      time: {$first: '$time'},
      detector: {$first: '$detector'},
      key: {$first: '$field'}
    }},
    {$group: {
      _id: '$detector',
      keys: {$push: '$key'},
      values: {$push: '$value'},
      users: {$push: '$user'},
      times: {$push: '$time'}
    }},
    {$project: {
      detector: '$_id',
      _id: 0,
      state: {$arrayToObject: {$zip: {inputs: ['$keys','$values']}}},
      user: {$arrayElemAt: ['$users', {$indexOfArray: ['$times', {$max: '$times'}]}]}
    }}
  ]);
}

router.get("/get_control_docs", ensureAuthenticated, function(req, res){
    var db = req.db;
    var collection = db.get("detector_control");
    GetControlDocs(collection)
    .then((docs) => {return res.json(docs);})
    .catch((err) => {console.log(err.message); return res.json({});});
});

router.post('/set_control_docs', ensureAuthenticated, function(req, res){
    var db = req.db;
    var collection = db.get("detector_control");

    var data = req.body.data;
    console.log('INPUT');
    console.log(data);
    GetControlDocs(collection).then((docs) => {
      console.log(docs);
      var updates = [];
      for (var i in docs) {
        var olddoc = docs[i];
        var newdoc = data[olddoc['detector']];
        for (var key in olddoc.state)
          if (newdoc[key] != olddoc.state[key])
            updates.push({detector: olddoc['detector'], field: key, value: newdoc[key], user: req.user, time: new Date()});
      }
      if (updates.length > 0)
        return collection.insert(updates);
      return 0;
    }).then( () => { return res.SendStatus(200);
    }).catch((err) => {
      console.log(err.message);
      return res.sendStatus(418);
    });
});

module.exports = router;
