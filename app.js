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
var searchResource = '/tss/v2/searches'


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
                var clientId = "XrcQ1XZU5p";

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
                    key : fs.readFileSync('./paymentsdemo.pem'),
                    cert: fs.readFileSync('./paymentsdemo.crt')
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
                

                var method = "POST";

                var headers = {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer '+accessToken
                };

                var dataString = 
                {
                  "save": "false",
                  "name": "MRN",
                  "timezone": "America/Chicago",
                  "query": "submitTimeUtc:[NOW/DAY-7DAYS TO NOW/DAY+1DAY}",
                  "offset": "0",
                  "limit": "100",
                  "sort": "id:asc,submitTimeUtc:asc"
                };


                var options = {
                    host: host,
                    path: searchResource,
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
                  var totalTransactions = responseObj.totalCount;

                  var transactionData = {
                        "cols": [
                                    {"id": "","label": "ID","pattern": "","type": "string"},
                                    {"id": "","label": "Name","pattern": "","type": "string"},
                                    {"id": "","label": "Amount","pattern": "","type": "string"},
                                    {"id": "","label": "Last 4","pattern": "","type": "string"},
                                    {"id": "","label": "Date/Time","pattern": "","type": "string"}
                                    ],
                        "rows": []
                    };

                var transactionsArr = responseObj._embedded.transactionSummaries;

                for(i=0;i<transactionsArr.length;i++){
                    var currentObj = transactionsArr[i];
                    var newRow = {"c":[{"v":currentObj.id,"f":null},{"v":currentObj.orderInformation.billTo.firstName+" "+currentObj.orderInformation.billTo.lastName,"f":null},{"v":currentObj.orderInformation.amountDetails.totalAmount,"f":null},{"v":currentObj.paymentInformation.card.suffix,"f":null},{"v":currentObj.submitTimeUtc,"f":null}]};
                    transactionData.rows.push(newRow);
                }



                  console.log("Redirecting to display page with transactions : ");
                  res.render('apicall', { totalTransactions: totalTransactions, transactionlist: JSON.stringify(transactionData) } );

                });
              });

              console.log("Making request");

              req.write(JSON.stringify(dataString));
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
