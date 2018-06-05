var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', { title: 'Express' });
});

router.get('/arm', function(req,res){
    var db = req.db;
    var collection = db.get('control');
    console.log("ARM");
    var idoc = {
	mode: 'test',
	command: 'arm',
	host: 'fdaq00',
	user: 'web'
    };
    collection.insert(idoc);
    return res.redirect('/status');
});

router.get('/start', function(req, res){
    var db = req.db;
    var collection = db.get('control');
    var idoc = {
	command: 'start',
	host: 'fdaq00',
	user: 'web'
    };
    collection.insert(idoc);
    return res.redirect('/status');
});

router.get('/stop', function(req, res){
    var db = req.db;
    var collection = db.get('control');
    var idoc = {
	command: 'stop',
	host: 'fdaq00',
	user: 'web'
    };
    collection.insert(idoc);
    return res.redirect('/status');
});

router.get('/status_update', function(req, res){
    var db = req.db;
    var statuses = {
	0: "Idle",
	1: "Arming",
	2: "Armed",
	3: "Running",
	4: "Error"
    };
    var collection = db.get('status');
    var clients = {
	fdaq00: { status: 'none', rate: 0, buffer_length: 0}
    };
    for (var client in clients){
	docs = collection.find({"host": client},
			       { "sort": {"_id": -1}, "limit" : 1 },
			       function(e,docs){
				   darr = docs;
				   console.log(darr[0]);
				   console.log("This one");
				   clients[client]['status'] = statuses[darr[0].status];
				   clients[client]['rate'] = darr[0].rate;
				   clients[client]['buffer_length'] = darr[0].buffer_length;

				   return res.send(JSON.stringify(clients));
			       });
    }

    //    res.render('index', { clients: clients });
});

    
router.get('/status', function(req, res) {
    var clients = {
	fdaq00: { status: 'none', rate: 0, buffer_length: 0}
    };
    res.render('index', { clients: clients});
//    res.render('index', { clients: clients });
});

router.get('/helloworld', function(req, res){
    res.render('helloworld', {title: 'Hello, World!'});
});

module.exports = router;
