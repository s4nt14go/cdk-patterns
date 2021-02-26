const AWS = require('aws-sdk');
const chance = require('chance').Chance();

const stepFunctions = new AWS.StepFunctions({
region: 'us-east-1'
});

module.exports.handler = (event:any, context:any, callback:any) => {
    let runType = 'success';
    let tripID =  chance.hash({length: 6});

    if(null != event.queryStringParameters){
        if(typeof event.queryStringParameters.runType != 'undefined') {
            runType = event.queryStringParameters.runType;
        }
    }

    const params = {
        stateMachineArn: process.env.statemachine_arn,
        input: JSON.stringify({
          trip_id: tripID,
          run_type: runType,
        }),
    };

    stepFunctions.startExecution(params, (err:any, data:any) => {
        if (err) {
            console.log(err);
            const response = {
                statusCode: 500,
                body: JSON.stringify({
                message: `There was an error: ${err}`
                })
            };
            callback(null, response);
        } else {
            console.log(data);
            const response = {
                statusCode: 200,
                body: JSON.stringify({
                    message: `The holiday booking system is processing your order: tripID:${tripID} executionArn:${data.executionArn}`
                })
            };
            callback(null, response);
        }
    });
};

export {}
