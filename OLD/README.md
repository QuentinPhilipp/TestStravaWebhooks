# Test of Strava webhooks API 

Small test of the webhook API from Strava to detect new activities made/updated by users without polling.

Based on Strava example: 
https://developers.strava.com/docs/webhookexample/


You need to setup an Ngrok account to tunnel your localhost to a public IP address otherwise Strava won't be able to send you request

## Setup

"npm install" all dependencies
Set a random key in a .env file (use .env.example to create .env)
"npm run dev" to start the server

In Postman or other, create a webhook subscription 

curl -X POST \
  https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=12345 \
  -F client_secret=1234567abcdefg \
  -F callback_url=https://1234abcd.ngrok.io/webhook \
  -F verify_token=VERIFY_TOKEN
  
 Modify the client id and secret with your values in strava.com/settings/api and set the VERIFY_TOKEN from the .env file.
 When an athlete that has authorized your application publish or update an activity you will receive a POST request at /api/webhook
 
 ## Testing
 
 Test if the subscription is registered:
 GET https://www.strava.com/api/v3/push_subscriptions?client_id={{DEV_CLIENT_ID}}&client_secret={{DEV_CLIENT_SECRET}}
 
 Delete the subscription:
 DELETE https://www.strava.com/api/v3/push_subscriptions/{{SUBSCRIPTION_ID}}?client_id={{DEV_CLIENT_ID}}&client_secret={{DEV_CLIENT_SECRET}}
 
 Authenticate an athlete after the OAuth page:
 POST https://www.strava.com/api/v3/oauth/token?client_id={{DEV_CLIENT_ID}}&client_secret={{DEV_CLIENT_SECRET}}&code={{CODE_RECEIVED_DURING_OAUTH}}&grant_type=authorization_code
 
 PS: It seems that the athlete token must be refreshed for this to work (even if the token is not needed), I managed to receive update during the first few hours, then not anymore and after registering again the athlete it worked again.
