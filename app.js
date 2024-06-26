var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require("body-parser");
var config = require('./config/config');
const hostname = config.host;
const port = parseInt(config.port);

var monk = require('monk');
var db = monk(`${config.mongo_uri}/${config.daq_db}`, {authSource: 'admin'});
var runs_db = monk(`${config.mongo_uri}/${config.runs_db}`, {authSource: 'admin'});

// Routers for all the sub-sites
var indexRouter = require('./routes/index');
var optionsRouter = require('./routes/options');
var runsRouter = require('./routes/runsui');
var logRouter = require('./routes/logui');
var statusRouter = require('./routes/status');
var authRouter = require('./routes/auth');
var controlRouter = require('./routes/control');

// Using express!
var app = express();
app.use('/modules', express.static(path.join(__dirname, 'node_modules')));

// For parsing POST data from request body
app.use(bodyParser.urlencoded({extended: true}));
const sessions = require('express-session');

app.use(sessions({
  secret: 'secret-key', //process.env.EXPRESS_SESSION,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week in ms
  },
  resave: true,
  saveUninitialized: false
}));

// Passport Auth
var passport = require("passport");
require("./config/passport");
app.use(passport.initialize());
app.use(passport.session());

// End auth
// End long stuff
//require("./mongo_session_cache.js")
//require("./passport_session.js")

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Favicon
var favicon = require('serve-favicon');
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

// Make our db accessible to our router
app.use(function(req,res,next){
    req.db = db;
    req.runs_coll = runs_db.get('runs');
    next();
});


app.use(function(req, res, next) {
    res.locals.user = req.user;
    req.template_info_base = {
      pagetitle: 'Pancake DAQ',
      detectors: [['tpc', 'PMT array']],
  }
  next();
});

app.use('/', indexRouter);
app.use('/options', optionsRouter);
app.use('/runsui', runsRouter);
app.use('/logui', logRouter);
app.use('/status', statusRouter);
app.use('/auth', authRouter);
app.use('/control', controlRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(port, hostname, () => {console.log(`Server running on ${hostname}:${port}`);});


module.exports = app;
