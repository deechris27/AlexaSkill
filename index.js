var bcrypt = require('bcryptjs');
var AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-1",
});
const dynamodb = new AWS.DynamoDB.DocumentClient();

var intentHandlers = {};

exports.handler = async (event) => {

    // let request = event.request;
    // let ph = parseInt(request.intent.slots.phoneNumber.value);
    // let session = event.session;
    //var response;

    try{

        if (event.session.new) {
            
        }
        //session.attributes.passcode = (!session.attributes.passcode) ?  "" : session.attributes.passcode;

        if(request.type === "LaunchRequest"){
            let answer = "";
            let params = {
                TableName: 'UserData',
                Key:{
                  userId: ph
                }     
              }
            
            let readin = await dynamodb.get(params).promise()
                                    .then(data=>data.Item)
                                    .catch(error=>error);
            if(readin.passcode===""){
                answer = "You have not set your passcode, please set a six digit passcode";  
                
                let response = {
                    version: "1.0",
                    response: {
                    outputSpeech: {
                      type: "SSML",
                      ssml: `<speak>Hello ${username} ${greet()} ${answer}</speak>`
                   },
                   repromptSpeech:{
                    type: "SSML",
                    ssml: `<speak>Hello ${username} ${greet()} ${answer}</speak>`
                   }
               }
            } 

            return response;
        }else if(session.attributes.passcode === ""){
            let response = {
                version: "1.0",
                response: {
                outputSpeech: {
                  type: "SSML",
                  ssml: `<speak>Hello ${username} ${greet()} ${answer}</speak>`
               }
           }
        } 
        }
            
            
      }

    }catch(e){
        return {"exception occurred": e}
    }

     

    const response = {
        version: "1.0",
        response: {
        outputSpeech: {
          type: "SSML",
          ssml: `<speak>Hello ${readin} ${greet()} </speak>`
       }
   }
}
    return response;
};


function onLaunch(launchRequest, session, response) {
    response.speechText = "Welcome to blah blah. You can use this skill to check your gmail unread messages. You can say, whats new?";
    response.repromptText = "What you want to do? You can say, whats new to check your unread messages.";
    response.shouldEndSession = false;
    response.done();
  }


intentHandlers['CheckClaimIntent'] = function(request,session,response,slots) {
    //Intent logic
    readPin(session.user.userId, function(res,err){
      if(err) {
        response.fail(err);
      } else if(!res) {
        response.speechText = "You haven't set the pin. Please set the pin. You can set it to any number";
        response.repromptText = `For example, you can say set my pin to <say-as interpret-as="digits">1234</say-as>.`;
      } else {
        response.speechText = `Please tell your secret pin. For example, you can say, my secret pin is <say-as interpret-as="digits">1234</say-as>. `;
        response.repromptText = `whats your pin? For example, you can say, my secret pin is <say-as interpret-as="digits">3456</say-as>. `;
        session.attributes.EmailCheckIntent = true;
        session.attributes.pin = res.Item.pin
      }
  
      response.shouldEndSession = false;
      response.done();
    });
  }

  intentHandlers['ClaimAuthIntent'] = function(request,session,response,slots) {
    var cPin = slots.CPin;
    var sPin = session.attributes.setPin;
  
     if(sPin) {
        bcrypt.compare(cPin, session.attributes.pin, function(err, res) {
  
          if(!res) {
            response.speechText = `Wrong secret pin <say-as interpret-as="digits">${cPin}</say-as>`;
            response.shouldEndSession = true;
            response.done();
          } else {
            updatePin(session.user.userId, sPin, function(updateRes,err) { 
              if(updateRes) {
                response.speechText = `Successfully updated pin to  <say-as interpret-as="digits">${sPin}</say-as>. `;
                response.shouldEndSession = true;
                response.done();
              } else {
                response.fail(err);
              }
            });
  
          }
  
        });
  
     } else if(session.attributes.CheckClaimIntent) {
  
       if(!session.user.accessToken) {
        response.speechText = ""; 
        response.done();
       } else {
  
        bcrypt.compare(cPin, session.attributes.pin, function(err, res) {
  
          if(!res) {
            response.speechText = "Wrong secret pin "+cPin;
            response.shouldEndSession = true;
            response.done();
          } else {
            getMessages(response,session);
          }
  
        });
  
       }
     } else {
        response.speechText = "Wrong invocation of this intent";
        response.shouldEndSession = true;
        response.done();
     }
  }

  intentHandlers['SetPinIntent'] = function(request,session,response,slots) {
    var setPin = slots.SPin;
    readPin(session.user.userId, function(rPin,err) {
      if(err) {
        response.fail(err);
      } else if(!rPin) {
        createPin(session.user.userId, setPin, function(res,err) {
          if(res) {
            response.speechText = `Succefully updated pin to <say-as interpret-as="digits">${setPin}</say-as>`;
            response.shouldEndSession = true;
            response.done();
          } else {
            response.fail(err);
          }
        });
  
      } else {
        response.speechText = `Please tell your current pin to change the pin. `;
        response.repromptText = `For example, you can say, my secret pin is 1234. `;
        response.shouldEndSession = false;
        session.attributes.setPin = setPin; 
        session.attributes.pin = rPin.Item.pin
        response.done();
      }
  
    });
  
  }

intentHandlers['AMAZON.StopIntent'] = function(request,session,response,slots) {
    response.speechText  = `Good Bye. `;
    response.shouldEndSession = true;
    response.done();
  };

//function to greet the user based on their timeZone
  function greet(){
    let myDate = new Date();
    let hours = myDate.getUTCHours()-10;
     
    let val = (hours>=12 && hours<16) ? "Good Afternoon!" : (hours<12 && hours>5) ? "Good Morning" : (hours>=16 && hours<=19) ? "Good Evening" : "Good Day";

    return val;
}

function readPin(usrId, callback) {

    var params = {
        TableName: "UsrPins",
        Key:{
            "UsrId": usrId
        }
    };
  
    docClient.get(params, function(err, data) {
        if (err) {
            callback(false,err);
        } else {
          logger.debug(data);
          if(Object.keys(data).length === 0) {
            callback(false);
          } else {
            callback(data);
          }
  
        }
    });
  }

  function createPin(usrId, pin, callback) {
    var hash = bcrypt.hashSync(pin,10);
  
    var params = {
      TableName:"UsrPins",
      Item:{
          "UsrId": usrId,
          "pin": hash
      }
    };
  
    docClient.put(params, function(err, data) {
        if (err) {
            callback(false,err);
        } else {
            callback(true);
        }
    });
  }

  function updatePin(usrId, pin, callback) {
    var hash = bcrypt.hashSync(pin,10);
  
    var params = {
      TableName:"UsrPins",
      Key:{
          "UsrId": usrId
      },
      UpdateExpression: "set pin = :p",
      ExpressionAttributeValues:{
          ":p":hash
      },
      ReturnValues:"UPDATED_NEW"
    };
  
    logger.debug("Updating the item...");
    docClient.update(params, function(err, data) {
        if (err) {
            callback(false,err);
        } else {
            callback(true);
        }
    });
  
  }

function getSlots(req) {
    var slots = {}
    for(var key in req.intent.slots) {
      slots[key] = req.intent.slots[key].value;
    }
    return slots;
  }

function createSpeechObject(text,ssmlEn) {
    if(ssmlEn) {
      return {
        type: 'SSML',
        ssml: '<speak>'+text+'</speak>'
      }
    } else {
      return {
        type: 'PlainText',
        text: text
      }
    }
  }

var Response = function (context,session) {
    this.speechText = '';
    this.shouldEndSession = true;
    this.ssmlEn = true;
    this._context = context;
    this._session = session;
  
    this.done = function(options) {
  
      if(options && options.speechText) {
        this.speechText = options.speechText;
      }
  
      if(options && options.repromptText) {
        this.repromptText = options.repromptText;
      }
  
      if(options && options.ssmlEn) {
        this.ssmlEn = options.ssmlEn;
      }
  
      if(options && options.shouldEndSession) {
        this.shouldEndSession = options.shouldEndSession;
      }
  
      this._context.succeed(buildAlexaResponse(this));
    }
  
    this.fail = function(msg) {
      this._context.fail(msg);
    }
  
  };


  function buildAlexaResponse(response) {
    var alexaResponse = {
      version: '1.0',
      response: {
        outputSpeech: createSpeechObject(response.speechText,response.ssmlEn),
        shouldEndSession: response.shouldEndSession
      }
    };
  
    if(response.repromptText) {
      alexaResponse.response.reprompt = {
        outputSpeech: createSpeechObject(response.repromptText,response.ssmlEn)
      };
    }
  
    if(response.cardTitle) {
      alexaResponse.response.card = {
        type: 'Simple',
        title: response.cardTitle
      };
  
      if(response.imageUrl) {
        alexaResponse.response.card.type = 'Standard';
        alexaResponse.response.card.text = response.cardContent;
        alexaResponse.response.card.image = {
          smallImageUrl: response.imageUrl,
          largeImageUrl: response.imageUrl
        };
      } else {
        alexaResponse.response.card.content = response.cardContent;
      }
    }
  
    if (!response.shouldEndSession && response._session && response._session.attributes) {
      alexaResponse.sessionAttributes = response._session.attributes;
    }
    return alexaResponse;
  }