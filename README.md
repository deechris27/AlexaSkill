                                Amazon Alexa voice-over authentication POC

Create an Alexa skill with an invocation ex: claim status, order status, invoice etc.

Add best matching utterances that could invoke this skill. 

Refer the sample Alexa request JSON below. You should see your Intent of the respective invocation and the slots (ex: - username, phone number etc) in the request object.

Create lambda functions individually or use serverless framework to deploy using the serverless.yaml file

Edit the account id and the resource id, name as per your preference in the serverless.yml

Copy the ARN of lambda function and paste into your Alexa skill and the skill id of your Alexa skill into the trigger of lambda

Clone the project and run ‘npm install’ to install the dependencies(optional) and serverless deploy –v

You could test the skill through reverb.ai or echoism.io

Request response example flow:
1.	User: Alexa, check claim status (Intent Invocation) for {9885647836} (slot) 
2.	Alexa: Hello Deepak, Good Morning! Please tell me your pass code.
<break time="2s"/>
3.	Alexa Re-prompt: You could say ‘Create new pass code’ or ‘Forgot pass code’ 
4.	User: My pass code is {12345} (slot)
5.	Alexa: Your claim is pending approval from the relationship officer
                                                           (Or)
6.	Alexa: That’s an incorrect pin. Re-prompt: You could say <emphasis level=”strong”>‘Forgot pass code’</emphasis> if you’ve forgotten your pass code.

Create New Pass code flow:
 
1.	User: Alexa, create new pass code (Intent Invocation) 
2.	Alexa: Tell me the 5 digit pass code to be set
3.	User: 12345
4.	Alexa: Reconfirm your pass code.
5.	User: 12345
6.	Alexa: Your pin has been set successfully. Re-prompt: Do you want to continue?
7.	User: Yes/ No.........

               Forgot Pass code flow:
1.	User: Alexa, I forgot (Intent Invocation) my pass code.
2.	Alexa: I’ve sent you a recovery pass code to your email, please use that to login
3.	User: The recovery pass code is 123456.
4.	Alexa: Great! What can I do for you? re-prompt: You could say ‘set a new pin’ 

Lambda handles:
1.	RequestService   : Query the DB for pass code verification, Claim status etc. 
2.	ForgotPassword  :
         POST:  ‘/recoveryEmail’ send a random 6 digit recovery pass code to user’s             
                                                   registered email id and update the same in user record.


                                                     
Alexa Request JSON structure:
{
    "version": "1.0",
    "session": {
        "new": true,
        "sessionId": "amzn1.echo-api.session.****",
        "application": {
            "applicationId": "amzn1.ask.skill.3dbe0755-****"
        },
        "user": {
            "userId": "amzn1.ask.account.***** ",
            "accessToken": "********"
        }
    },
    "context": {
        "System": {
            "application": {
                "applicationId": "amzn1.ask.skill.**** "
            },
            "user": {
                "userId": "amzn1.ask.account.****",
                "accessToken": "****"
            },
            "device": {
                "deviceId": "amzn1.ask.device.*****",
                "supportedInterfaces": {}
            },
            "apiEndpoint": "https://api.eu.amazonalexa.com",
            "apiAccessToken": "*******"
        }
    },
    "request": {
        "type": "IntentRequest",
        "requestId": "amzn1.echo-api.request.****",
        "timestamp": "2018-10-09T08:14:45Z",
        "locale": "en-US",
        "intent": {
            "name": "GetClaimStatus",
            "confirmationStatus": "NONE"
        }
    }
}



Alexa Response JSON structure:
{
    "version": "string",
    "sessionAttributes": {
      "key": "value"
    },
    "response": {
      "outputSpeech": {
        "type":"SSML",
        "ssml": "<speak>Please tell me your <say-as interpret-as="digits">5</say-as> digit pin</speak>"      
      }
    },
    "reprompt": {
      "outputSpeech": {
        "type": "SSML",
        "ssml": "<speak>You could say forgot pin, if you don't remember the passcode</speak>"            
      }
    },
    "shouldEndSession": false
}



References:
https://docs.aws.amazon.com/polly/latest/dg/ssml-to-speech-console.html
https://serverless.com/framework/docs/providers/aws/guide/serverless.yml/
https://medium.com/the-reading-room/how-to-create-a-simple-rest-web-service-with-node-aws-lambda-and-the-serverless-framework-4730c88cd39a
https://developer.amazon.com/blogs/alexa/post/30b0bb55-e516-4236-b1b8-5011e78188ed/makers-academy-s-alexa-series-how-to-authenticate-skill-users-with-oauth
https://auth0.com/blog/interaction-based-auth-for-alexa-with-auth0/

