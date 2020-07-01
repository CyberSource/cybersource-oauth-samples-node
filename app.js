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
                
                var req = https.request(options, function(res) {
                res.setEncoding('utf-8');


                res.on('data', function(data) {
                    console.log("Got data back : "+data);
                  responseString += data;
                });

                res.on('end', function() {
                  console.log("Done with request");
                  console.log("Response String : " + responseString);
                  console.log("Access Token : " + responseString.access_token);
              
                  console.log("Redirecting to display page with access token : "+responseString.access_token);
                  res.render('accesstoken', { accesstoken: JSON.stringify(responseString) } );
                  
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

        var accessToken = JSON.parse(req.body.flexresponse)
        console.log('Transient token for payment is: ' + JSON.stringify(tokenResponse));

         try {
                
                var instance = new cybersourceRestApi.PaymentsApi(configObj);

                var clientReferenceInformation = new cybersourceRestApi.Ptsv2paymentsClientReferenceInformation();
                clientReferenceInformation.code = 'test_flex_payment';

                var processingInformation = new cybersourceRestApi.Ptsv2paymentsProcessingInformation();
                processingInformation.commerceIndicator = 'internet';

                var amountDetails = new cybersourceRestApi.Ptsv2paymentsOrderInformationAmountDetails();
                amountDetails.totalAmount = '102.21';
                amountDetails.currency = 'USD';

                var billTo = new cybersourceRestApi.Ptsv2paymentsOrderInformationBillTo();
                billTo.country = 'US';
                billTo.firstName = 'John';
                billTo.lastName = 'Deo';
                billTo.phoneNumber = '4158880000';
                billTo.address1 = 'test';
                billTo.postalCode = '94105';
                billTo.locality = 'San Francisco';
                billTo.administrativeArea = 'MI';
                billTo.email = 'test@cybs.com';
                billTo.address2 = 'Address 2';
                billTo.district = 'MI';
                billTo.buildingNumber = '123';

                var orderInformation = new cybersourceRestApi.Ptsv2paymentsOrderInformation();
                orderInformation.amountDetails = amountDetails;
                orderInformation.billTo = billTo;

                // EVERYTHING ABOVE IS JUST NORMAL PAYMENT INFORMATION
                // THIS IS WHERE YOU PLUG IN THE MICROFORM TRANSIENT TOKEN
                var tokenInformation = new cybersourceRestApi.Ptsv2paymentsTokenInformation();
                tokenInformation.transientTokenJwt = tokenResponse;

                var request = new cybersourceRestApi.CreatePaymentRequest();
                request.clientReferenceInformation = clientReferenceInformation;
                request.processingInformation = processingInformation;
                request.orderInformation = orderInformation;
                request.tokenInformation = tokenInformation;

                console.log('\n*************** Process Payment ********************* ');

                instance.createPayment(request, function (error, data, response) {
                    if (error) {
                        console.log('\nError in process a payment : ' + JSON.stringify(error));
                    }
                    else if (data) {
                        console.log('\nData of process a payment : ' + JSON.stringify(data));
                        res.render('receipt', { paymentResponse:  JSON.stringify(data)} );
                
                    }
                    console.log('\nResponse of process a payment : ' + JSON.stringify(response));
                    console.log('\nResponse Code of process a payment : ' + JSON.stringify(response['status']));
                    callback(error, data);
                });
                
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
