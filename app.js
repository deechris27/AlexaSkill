const alexa = require('ask-sdk');
const aws = require('aws-sdk');
const bcrypt = require('bcryptjs');
aws.config.update({
   region: 'us-west-1'
});
const dbclient = aws.DynamoDB.DocumentClient();
const buildSkill = alexa.SkillBuilders.standard();

const SayHelloHandler = {
    
       canHandle(input){
           const request = input.requestEnvelope.request;
           return (request.type === IntentRequest && request.intent.name === SayHelloIntent);
       },

       handle(input){
           const outputSpeech = `Hello Deepak ${greet()}`;
            return input.responseBuilder.speak(outputSpeech)
                   .getResponse();
       }
};

// const SayHelloHandler = {
    
//     canHandle(input){

//     },

//     handle(input){

//     }
// };

const ErrorHandler = {

}


buildSkill.addRequestHandlers(
    SayHelloHandler
).addErrorHandlers(ErrorHandler).lambda();


function greet(){
    let myDate = new Date();
    let hours = myDate.getUTCHours()+5.5;
    switch(hours)
    {
         case (hours>=12 && hours <16):
            return "Good Afternoon!";

        case (hours<12 && hours>5):
            return "Good Morning!";

        case (hours>=16 && hours<=19):
            return "Good Evening";

        default:
            return "Good Day!";
    }
}