var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var cybersourceRestApi = require('cybersource-rest-client');

var querystring = require('querystring');
var https = require('https');
var fs = require('fs');

var host = 'api-matest.cybersource.com';
var tokenResource = '/oauth2/v3/token';
var invoiceResource = '/invoicing/v2/invoices'


// common parameters
const AuthenticationType = 'http_signature';
const RunEnvironment = 'cybersource.environment.SANDBOX';
const MerchantId = 'testrest';

// http_signature parameters
const MerchantKeyId = '08c94330-f618-42a3-b09d-e1e43be5efda';
const MerchantSecretKey = 'yBJxy6LjM2TmcPGu+GaJrHtkke25fPpUX+UY6/L/1tE=';

// jwt parameters
const KeysDirectory = 'Resource';
const KeyFileName = 'testrest';
const KeyAlias = 'testrest';
const KeyPass = 'testrest';

// logging parameters
const EnableLog = true;
const LogFileName = 'cybs';
const LogDirectory = '../log';
const LogfileMaxSize = '5242880'; //10 MB In Bytes



var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// THIS IS THE SERVER-SIDE REQUEST TO RETRIEVE THE ACCESS TOKEN
// USING THE AUTH CODE AND THE CLIENT CREDENTIALS
app.get('/authorize', function (req, res) {

        try {
                var authCode = req.query.code;

                console.log('Authorization Code : ' + authCode);

                // This is where we will call /oauth2/v3/token
                var accesstoken = "";

                // THIS CLIENT SECRET SHOULD BE MANAGED LIKE ANY OTHER SHARED SECRET AND NOT SHARED IN BROWSER,
                // MOBILE DEVICE OR ANY OTHER CLIENT SIDE CODE 
                // (READ PUBLIC FOR MOBILE DEVICE REGARDLESS OF WHAT PHONE MANUFACTURERS TELL YOU)
                var clientSecret = process.env.CLIENT_SECRET;

                // The CLient ID is a public shareable value
                var clientId = "cEhiMuZpFB";

                var dataString = "client_id="+clientId+"&grant_type=authorization_code&code="+authCode+"&client_secret="+clientSecret;
                var method = "POST";

                var headers = {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Content-Length': dataString.length
                };

                var options = {
                    host: host,
                    path: tokenResource,
                    method: 'POST',
                    headers: headers,
                    key: fs.readFileSync('./pnrstage.ic3.com.pem'), 
                    cert: fs.readFileSync('./pnrstage.crt')
                  };

                var responseString = '';
                
                var req = https.request(options, function(resp) {
                resp.setEncoding('utf-8');


                resp.on('data', function(data) {
                    console.log("Got data back : "+data);
                  responseString += data;
                });

                resp.on('end', function() {
                  console.log("Done with request");
                  console.log("Response String : " + responseString);
                  var responseJSON = JSON.parse(responseString);
                  console.log("Access Token : " + responseJSON.access_token);
              
                  console.log("Redirecting to display page with access token : "+responseJSON.access_token);
                  res.render('accesstoken', { accesstoken: JSON.stringify(responseJSON.access_token) } );

                });
              });

              console.log("Making request" + dataString);
              req.write(dataString);
              req.end();
                    
            } catch (error) {
                console.log(error);
            }
          
});


// THIS REPRESENTS THE SERVER-SIDE REQUEST TO MAKE A PAYMENT WITH THE TRANSIENT
// TOKEN
app.post('/apicall', function (req, res) {

        var accessToken = JSON.parse(req.body.accesstoken)
        console.log('Access token for API call is: ' + JSON.stringify(accessToken));

         try {
                

                var method = "GET";

                var headers = {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer '+accessToken
                };

                var options = {
                    host: host,
                    path: invoiceResource,
                    method: method,
                    headers: headers,
                    key: fs.readFileSync('./pnrstage.ic3.com.pem'), 
                    cert: fs.readFileSync('./pnrstage.crt')
                  };

                var responseString = '';
                
                var req = https.request(options, function(resp) {
                resp.setEncoding('utf-8');


                resp.on('data', function(data) {
                    console.log("Got data back : "+data);
                  responseString += data;
                });

                resp.on('end', function() {
                  console.log("Done with request");
                  console.log("Response String : " + responseString);

                  // Create a datatable object from the JSON Response
                  var responseObj = JSON.parse(responseString);
                  var totalInvoices = responseObj.totalInvoices;

                  var invoiceData = {"cols": [{"id": "","label": "Status","pattern": "","type": "string"},
        {"id": "","label": "Number","pattern": "","type": "number"}],
    "rows": [
        {"c":[{"v":"Paid","f":null},{"v":50,"f":null}]},
        {"c":[{"v":"Sent","f":null},{"v":20,"f":null}]},
        {"c":[{"v":"Draft","f":null},{"v":30,"f":null}]},
        {"c":[{"v":"Partial","f":null},{"v":25,"f":null}]},
        {"c":[{"v":"Canceled","f":null},{"v":25,"f":null}]}
    ]
};
                var paidCount = 0;
                var sentCount = 0;
                var draftCount = 0;
                var partialCount = 0;
                var canceledCount = 0;

                var invoicesArr = invObj.invoices;

                for(i=0;i<invoicesArr.length;i++){
                    var currentObj = invoicesArr[i];
                    if(currentObj.status == 'PAID'){ paidCount++;};
                    if(currentObj.status == 'SENT'){ sentCount++;};
                    if((currentObj.status == 'CREATED')||(currentObj.status == 'DRAFT')){ draftCount++;};
                    if(currentObj.status == 'PARTIAL'){ partialCount++;};
                    if(currentObj.status == 'CANCELED'){ canceledCount++;};
                }

                invoiceData.rows[0].c[1].v = paidCount;
                invoiceData.rows[1].c[1].v = sentCount;
                invoiceData.rows[2].c[1].v = draftCount;
                invoiceData.rows[3].c[1].v = partialCount;
                invoiceData.rows[4].c[1].v = canceledCount;


                  console.log("Redirecting to display page with invoices : ");
                  res.render('apicall', { totalInvoices: totalInvoices, invoicelist: JSON.stringify(invoiceData) } );

                });
              });

              console.log("Making request");

              req.end();
                
                
            } catch (error) {
                console.log(error);
            }

});

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

module.exports = app;
