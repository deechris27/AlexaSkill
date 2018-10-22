// const aws = require('aws-sdk');
// const dbclient = aws.DynamoDB.DocumentClient();

//connection URL = mySql://db.deeps.godaddy.com:3306;databaseName=userData;user=env.uName;password=env.pwd"

exports.handler = async (event) => {
    let request = event.request;
    let ph = request.intent.slots.phoneNumber.value;
    const response = {
     version: "1.0",
     response: {
     outputSpeech: {
       type: "SSML",
       ssml: `<speak>Hello <say-as interpret-as="digits"> ${fetchUser(ph)} </say-as> ${greet()} </speak>`
    }
}
}

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

 function fetchUser(param){
     return param;
 }

    return response;
};