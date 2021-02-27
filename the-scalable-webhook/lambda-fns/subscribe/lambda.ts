const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient();

exports.handler = async function(event:any) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  let records: any[] = event.Records;

  for(let index in records) {
    const params = {
      TableName: process.env.tableName,
      Item: {
        id: records[index].messageAttributes.MessageDeduplicationId.stringValue,
        body: records[index].body,
      }
    };

    // Call DynamoDB to add the item to the table
    const r = await DocumentClient.put(params).promise();
    console.log(r);
  }
};
