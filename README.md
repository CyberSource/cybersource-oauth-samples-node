# Sample OAuth Application for CyberSource

This repository provides a simple sample application demonstrating OAuth authentication to CyberSource.

## Usage

1. Clone or download this repository.
2. cd into the express-oauth directory
3. Update app.js with your [CyberSource sandbox credentials](https://ebc2test.cybersource.com). 
4. Run ```npm install```
5. Run ```DEBUG=express-oauth:* npm start```
6. Browse to http://localhost:3000/ in your browser

## Requirements
* Node
* Express
* NPM

## Who Should Use This Sample
Software partners with a cloud-based SAAS application, such as an e-commerce application, invoicing application, any software which requires payments, can use this sample to connect their customers accounts to their CyberSource account.  Using OAuth you can remove all the manual steps required to guide your users through the generation, retrieval and input of API keys.  All your users need to do is validate their CyberSource account, approve the connection of your software with their CyberSource account and they're ready to go.


## How To Use This Sample
This sample is based on a very simple node application and effectively demonstrates 3 key steps which could easily be implemented from any web-based application:
1. Redirect the user to validate their CyberSource account, with a "Connect to CyberSource" button.
2. Retrieve an access token for that user by calling CyberSource with your credentials, plus the authorization code returned from Step 1.
3. Call any of the approved APIs on behalf of your user, with the CyberSource access token.

NOTE:  A refresh token, returned in step 2 can be used at any time to revalidate your connection and retrieve a fresh access token

## Becoming a CyberSource Partner
Once you have successfully tried the sample application you can contact CyberSource to become a registered software partner and retrieve your partner credentials.
