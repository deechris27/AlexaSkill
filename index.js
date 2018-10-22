const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {

    let request = event.request;
    let ph = parseInt(request.intent.slots.phoneNumber.value);
    let answer = "You have not set your passcode";
    let params = {

        TableName: 'UserData',
        Key:{
          userId: ph
        }
            
      }
    
      let readin = await dynamodb.get(params).promise()
                            .then(data=>data.Item)
                            .catch(error=>error); 

       let response = {
                version: "1.0",
                response: {
                outputSpeech: {
                  type: "SSML",
                  ssml: `<speak>Hello ${readin.name} ${greet()} <break time="0.5s"/> ${answer}</speak>`
               }
           }
        }

    return response;
   
};

//function to greet the user based on their timeZone
  function greet(){
    let myDate = new Date();
    let hours = myDate.getUTCHours()-10;
     
    let val = (hours>=12 && hours<16) ? "Good Afternoon!" : (hours<12 && hours>5) ? "Good Morning" : (hours>=16 && hours<=19) ? "Good Evening" : "Good Day";
     
    // switch(hours)
    // {
    //      case(hours>=12 && hours <16):
    //         val = "Good Afternoon!";
    //         break;

    //     case(hours<12 && hours>5):
    //         val = "Good Morning!";
    //         break;

    //     case(hours>=16 && hours<=19):
    //         val = "Good Evening";
    //         break;

    //     default:
    //         val = `Good Day!${hours}`;
    // }

    return val;
}

//function to fetch the user from dynamoDB