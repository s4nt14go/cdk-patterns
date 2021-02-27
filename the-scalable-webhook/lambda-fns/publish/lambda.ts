var AWS = require('aws-sdk');

exports.handler = async function(event:any) {
  console.log("event", event);

  // Create an SQS service object
  var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

  var params = {
    DelaySeconds: 10,
    MessageAttributes: {
      MessageDeduplicationId: {
        DataType: "String",
        StringValue: event.path + new Date().getTime()
      }
    },
    MessageBody: "hello from "+event.path,
    QueueUrl: process.env.queueURL,
  };

    const resp = await sqs.sendMessage(params).promise();

    console.log('resp', resp);
    return {
      statusCode: 200,
      body: 'You have added a message to the queue! Message ID is ' + resp.MessageId,
    }

};
