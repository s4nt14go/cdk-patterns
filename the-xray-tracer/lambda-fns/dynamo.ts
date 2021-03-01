const AWSXRay = require('aws-xray-sdk');
const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient()
AWSXRay.captureAWSClient(DocumentClient.service);

exports.handler = async function(event:any) {
  const segment = AWSXRay.getSegment(); //returns the facade segment
  console.log("event", JSON.stringify(event, undefined, 2));

  const dynamoSegment = segment.addNewSubsegment('DynamoDB Query');
  // create AWS SDK clients
  let path = event.Records[0].Sns.Message;

  dynamoSegment.addAnnotation("path", path);
  dynamoSegment.addMetadata("event", event)

  // update dynamo entry for "path" with hits++
  await DocumentClient.update({
    TableName: process.env.HITS_TABLE_NAME,
    Key: {
      path
    },
    UpdateExpression: 'ADD hits :one',
    ExpressionAttributeValues: {
      ':one': 1
    },
  }).promise();

  console.log('inserted counter for '+ path);

  dynamoSegment.close();

  // return response back to upstream caller
  return {"status": "success"};
};
