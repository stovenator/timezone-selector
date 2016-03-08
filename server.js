var express       = require('express');
var path          = require('path');
var http          = require('http');
var fs            = require('fs');
var cookieParser  = require('cookie-parser');
var cookieSession = require('cookie-session');
var cookie        = require('cookie');
var bodyParser    = require('body-parser');
var moment        = require('moment-timezone');
var _             = require('lodash');
var start         = moment().format('hh:m:ss');

var browserify    = require('browserify-middleware');
var app           = express();

var SELECTABLES = require('./output.json');

var Bloodhound = require('bloodhound-js');
var englishSearch = new Bloodhound({
    limit: 10,
    local: SELECTABLES.selectables,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace("T")
});


var polySearch = new Bloodhound({
    limit: 10,
    local: SELECTABLES.selectables,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace("P")
});

englishSearch.initialize();
polySearch.initialize();

app.set('views', __dirname + '/views');
app.set('public', path.join(__dirname, 'public'));
app.set('port', process.argv[2] || process.env.PORT || 8888);

// The client app bundles.
var commonAppLibs = [
    'angular',
    'angular-route',
    'angular-animate',
    'angular-cookies',
    'angular-cache',
    'angular-sanitize',
    'angular-touch',
    'moment-timezone',
    'jstimezonedetect',
    'lodash'
];

app.get('/scripts/common.js', browserify(commonAppLibs, {
    basedir: './app/js'
}));

app.get('/scripts/bundle.js', browserify(path.join(__dirname, 'app/js/main.js'), {
    transform: ['envify', 'browserify-ngannotate'],
    external: commonAppLibs
}));


// Static file middleware
app.use(express.static(app.get('public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(cookieParser('cookies!'));
app.use(cookieSession({
    secret: 'i_<3_t1m3z0n3z',
    cookie: { path: '/', httpOnly: true, maxAge: 60*60*1000}
}));

var router = express.Router();

router.get('/diagnostic', function(req, res) {
    res.status(200).send('ok');
});

router.get('/api', function(req, res){
    var query = req.query.q;
    var response = {};
    console.log("ParseInt: ", parseInt(req.query.poly));
    if (req.query.hasOwnProperty('poly') && parseInt(req.query.poly) === 1){
        polySearch.search(query, function(d) {
            if (d.length > 0){
                response = d.splice(0,10);
            }
            res.status(200).send(response);
        }, function(d) {
            res.status(500).send("Failed: " + d);
        });
    }
    else{
        englishSearch.search(query, function(d) {
            if (d.length > 0){
                response = d.splice(0,10);
            }
            res.status(200).send(response);
        }, function(d) {
            res.status(500).send("Failed: " + d);
        });
    }
});

router.get('/', function(req, res) {
    return res.redirect('app');
});

// index page
router.get('/app', function(req, res) {
    var route = req.path || '';
    if (route.indexOf(path.sep, route.length - path.sep.length) !== -1) {
        return res.redirect('../');
    }
    res.render('index.html');
});


app.use('/', router);

http.createServer(app).listen(app.get('port'));
console.log('Timezone Selector is running from port ...', app.get('port') + ' in ' + process.env.NODE_ENV + ' mode');
