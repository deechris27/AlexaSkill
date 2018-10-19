let bcrypt = require('bcryptjs');
let AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-1",
});
let alexa = require('ask-sdk');
let dbclient = new AWS.DynamoDB.DocumentClient();

'use strict';

var intentions = {};

intentions.CheckClaimStatus = function(request,session,response,slots) {
    
    //let passcode = slots.passcode;
         readPasscode(session.user.userId, (resp, err)=>{
             if(err){
                 response.fail(err);
             }else if(!resp){
                 response.outputSpeech = `Passcode not set, please set a 6 digit passcode <break time="2s"/>`;
                 response.repromptSpeech = `For example, you could say <say-as interpret-as="digits">123456</say-as> or <say-as interpret-as="ordinal">123456</say-as>`;
             }else{
                 response.outputSpeech = `Please tell me your passcode for authentication <break time="2s"/>`;
                 response.repromptSpeech = `For example, you could say <say-as interpret-as="digits">123456</say-as> or <say-as interpret-as="ordinal">123456</say-as>`;
                 session.attributes.CheckClaimStatus = true;
                 session.attributes.passcode = resp.Item.passcode;
             }
             response.shouldEndSession = false;
             response.done();
         });

         if(session.attributes.passcode!=""){
              authenticateUser(request, session, response, slots);
         }
 
}

function authenticateUser(request,session,response,slots) {
  var utteredPasscode = slots.utteredPasscode;
  var savedPasscode = session.attributes.savedPasscode;

   if(savedPasscode) {
      bcrypt.compare(utteredPasscode, session.attributes.passcode, function(err, res) {

        if(!res) {
          response.outputSpeech = `Wrong secret pin <say-as interpret-as="digits">${utteredPasscode}</say-as>`;
          response.shouldEndSession = true;
          response.done();
        } else {
          updatePin(session.user.userId, savedPasscode, function(updateRes,err) { 
            if(updateRes) {
              response.outputSpeech = `Successfully updated pin to  <say-as interpret-as="digits">${savedPasscode}</say-as>. `;
              response.shouldEndSession = true;
              response.done();
            } else {
              response.fail(err);
            }
          });

        }

      });

   } else if(session.attributes.CheckClaimStatus) {

      bcrypt.compare(utteredPasscode, session.attributes.savedPasscode, function(err, res) {

        if(!res) {
          response.outputSpeech = "Wrong secret pin "+utteredPasscode;
          response.shouldEndSession = true;
          response.done();
        } else {
          getMessages(response,session);
        }

      });

     }
   else {
      response.outputSpeech = "Wrong invocation of this intent";
      response.shouldEndSession = true;
      response.done();
   }
}

intentions.SetPasscode = function(request,session,response,slots) {
  let setPasscode = slots.passcode;
  readPasscode(session.user.userId, function(rPasscode,err) {
    if(err) {
      response.fail(err);
    } else if(!rPasscode) {
      createPasscode(session.user.userId, setPasscode, function(res,err) {
        if(res) {
          response.outputSpeech = `Succefully updated passcode to <say-as interpret-as="digits">${setPasscode}</say-as>`;
          response.shouldEndSession = true;
          response.done();
        } else {
          response.fail(err);
        }
      });

    } else {
      response.outputSpeech = `Please tell your current pin to change the pin. `;
      response.repromptText = `For example, you can say, my secret pin is 1234. `;
      response.shouldEndSession = false;
      session.attributes.savedPasscode = setPasscode; 
      session.attributes.passcode = rPasscode.Item.passcode
      response.done();
    }

  });

}


intentions['AMAZON.YesIntent'] = function(request,session,response) {
  var messages;

  if(d=0) {


  } else {
    response.outputSpeech = "Wrong invocation";
    response.shouldEndSession = true;
    response.done();
  }
}

intentions.ForgotPinIntent = function(request,session,response,slots) {
  

}


intentions['AMAZON.StopIntent'] = function(request,session,response,slots) {
  response.outputSpeech  = `Good bye, Have a good day!`;
  response.shouldEndSession = true;
  response.done();
};

function fetchSlots(reqObj){
    let slots = {};
    for(let key in reqObj.intent.slots){
        Object.defineProperty(slots, key, {
            value: reqObj.intent.slots[key].value
        });
    }
 }

 function forLaunchReq(launchRequest, session, response, slots) {
    let phoneNumber = slots.phoneNumber;
            findUser(phoneNumber, (res, err)=>{
                if(err){
                    response.fail(err);
                }else if(!res){
                    response.outputSpeech = `User does not exist <break time="2s"/>`;
                    response.repromptSpeech = "Please check your mobile number and try again";
                    response.shouldEndSession = true;
                    response.done();
                }else{
                    response.outputSpeech = `Hello ${res.userName}! <emphasis level="strong"> ${greet()} </emphasis>welcome to ****** voice assitant. <break time="2s"/>`;
                    response.repromptSpeech = `What can I do for you? You could say check claim status`;
                    response.shouldEndSession = false;
                    session.attributes.userName = res.userName;
                    response.done();
                }
            });
}


let forAlexa = function(context, session){
  this.outputSpeech = "";
  this.repromptSpeech = "";
  this.shouldEndSession = true;
  this.ssml = true;
  this._context = context;
  this._session = session;

  this.done = function(params){
      if(params && params.outputSpeech){
          this.outputSpeech = params.outputSpeech;
      }

      if(params && params.repromptSpeech){
          this.repromptSpeech = params.repromptSpeech;
      }

      if(params && params.ssml){
          this.ssml = params.ssml;
      }

      if(params && params.shouldEndSession){
          this.shouldEndSession = params.shouldEndSession;
      }

      this._context.succeed(createFinalResponse(this));
  }

  this.fail = function(err){
      this._context.fail(err);
  }
};

function createFinalResponse(paramsObj){
   let finalResponse = {
       version: '1.0',
       response: {
           outputSpeech: {
               type: 'SSML',
               ssml: 'paramsObj.outputSpeech'
           },
           shouldEndSession: paramsObj.shouldEndSession
       }
   };

   if(paramsObj.repromptSpeech){
       finalResponse.response.repromptSpeech = {
           outputSpeech: {
               type: 'SSML',
               ssml: `${paramsObj.repromptSpeech}`
           }
       };
   }
}


function readPasscode(userId, callback){
    let forDB = {
        TableName = "UserData",
        Key: {
            "phoneNumber": userId
        }
    };

    dbclient.get(forDB, (err, data)=>{
        if(err){
            callback(false, err);
        }else if(Object.keys(data).length === 0){
            callback(false);
        }else{
            callback(data);
        }
    });
}

function createPasscode(userId, pin, callback){
  let passcodeHash = bcrypt.hashSync(pin, 10); //salt value 10

  let forDB = {
      TableName: "UserData",
      Key: {
          "phoneNumber": userId,
          "passcode": passcodeHash
      }
  };

  dbclient.put(forDB, (err, data)=>{
      if(err){
        callback(false, err);
      }else{
        callback(true);
      } 
  });
}

async function updatePasscode(userId, pin){

  let newPasscode = bcrypt.hashSync(pin, 10);

  let forDB = {
      TableName: "UserData",
      Key: {
          "phoneNumber": userId,
          "passcode": newPasscode
      },
      ReturnValue: "UpdatedPasscode"
  };

  await dbclient.update(forDB).promise()
         return "success";
}

function greet(){
   let myDate = new Date();
   let hours = myDate.getUTCHours();
   hours = hours+5.5; 
   if(hours<12 && hours>=5){
       return "Good Morning";
   }else if(hours>=12 && hours<=15){
       return "Good Afternoon";
   }else if(hours>15 && hours<=19){
       return "Good Evening";
   }else{
       return "Good Day";
   }
}

async function findUser(userId){
  
    let forDB = {
        TableName: "UserData",
        Key: {
            phoneNumber: userId
        }
    };

    let dbdata = await dbclient.get(forDB).promise()
                .then(data=>data)
                .catch(err=>error);
                
        return dbdata;
}

exports.handler = (event, context) =>{
    try{
       if(event.request.type === 'LaunchRequest'){
          forLaunchReq(event.request, event.session, new forAlexa(context, event.session), fetchSlots(event.request));
       }else if(event.request.type === 'IntentRequest'){
           let res = new forAlexa(context, event.session);
           if(event.request.intent.name in intentions){
               intentions[event.request.intent.name](event.request, event.session, response, fetchSlots(event.request));
           }else{
               res.outputSpeech = "Intent does not exist";
               res.shouldEndSession = true;
               res.done();
           }
       }
    
      }catch(e){
          context.fail("Exception occurred");
      }
       
    }