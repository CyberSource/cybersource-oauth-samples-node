# Sample OAuth Application for CyberSource

This repository provides a simple sample application demonstrating OAuth authentication to CyberSource.

While you can see a running example of this sample code at https://cybsoauthsample.azurewebsites.net/, in order to run this sample yourself you will need to request a new CyberSource test partner application credential.  You can request this test client ID & client secret from mailto:developer@cybersource.com When you request the new test client application you will need to provide a redirect URL so that it can be registered against your test application.

## Usage
* Clone this sample
* Update the sample with your test partner application credential
* Deploy the sample to your test site and register your redirect URL
* Test the flow by confirming the merchant experience below.

## Requirements
* Node
* Express
* NPM

## Who Should Use This Sample
Software partners with a cloud-based SAAS application, such as an e-commerce application, invoicing application, any software which requires payments, can use this sample to connect their customers accounts to their CyberSource account.  Using OAuth you can remove all the manual steps required to guide your users through the generation, retrieval and input of API keys.  All your users need to do is validate their CyberSource account, approve the connection of your software with their CyberSource account and they're ready to go.


## How To Use This Sample
This sample is based on a very simple node application and effectively demonstrates 3 key steps which could easily be implemented from any web-based application:

### Step 1. Redirect the user to validate their CyberSource account, with a "Connect to CyberSource" button.
In your application link to the CyberSource OAuth URL, including the required URL parameters.

![OAuth Screenshots](screenshots/oauth-sample-step1.png "Screenshot showing the Initation of the OAuth flow.")

### Merchant Authentication & Authorization

The merchant will authenticate and the authorize your application to connect with their CyberSource account.

![OAuth Screenshots](screenshots/oauth-sample-authenticate.png "Screenshot showing the merchant interaction of the OAuth flow.")
![OAuth Screenshots](screenshots/oauth-sample-authorize.png "Screenshot showing the merchant interaction of the OAuth flow.")


### Step 2. Retrieve an access token
Call the CyberSource /tokens endpoint with your credentials, plus the authorization code returned from Step 1.

![OAuth Screenshots](screenshots/oauth-sample-step2.png "Screenshot showing the OAuth access token.")

### Step 3. Call any of the approved APIs on behalf of your user, with the CyberSource access token.

![OAuth Screenshots](screenshots/oauth-sample-step3.png "Screenshot showing the OAuth access token.")

__NOTE:  A refresh token, returned in step 2 can be used at any time to revalidate your connection and retrieve a fresh access token__

## Becoming a CyberSource Partner
Once you have successfully tried the sample application you can contact CyberSource to become a registered software partner and retrieve your partner credentials.
