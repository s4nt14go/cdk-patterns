const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient();

type Status = 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'CANCEL_ERROR';

type Arg = {
  trip_id: string;
  step: string;
  step_id?: string;
  action: string;
  status?: Status;
  requestError?: string;
  confirmError?: string;
  cancelError?: string;
};

async function save(arg: Arg) {
  console.log(`save`, arg);

  const { trip_id, step, step_id, action, status, requestError, confirmError, cancelError } = arg;

  let params, result;
  switch (action) {
    case 'PUT':
      params = {
        TableName: process.env.TABLE_NAME,
        Item: {
          'pk' : trip_id,
          'sk' : `${step}#${step_id}`,
          status,
          'updatedAt': new Date().toJSON(),
        }
      };
      result = await DocumentClient.put(params).promise();
      console.log(`${step}#${step_id} put to ${status} for trip ${trip_id}`, result);
      break;
    case 'UPDATE':
      params = {
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: 'pk = :pass1 AND begins_with ( sk , :pass2 )',
        ExpressionAttributeValues: {
          ':pass1': trip_id,
          ':pass2': `${step}`
        },
      };
      const { Items } = await DocumentClient.query(params).promise();
      console.log('Items', Items);

      const item0 = Items[0];

      if (item0) {
        params = {
          TableName: process.env.TABLE_NAME,
          Key: {
            pk: item0.pk,
            sk: item0.sk
          }
        };
        const updateExpresion = getUpdateExpresion({ requestError, confirmError, cancelError, status, updatedAt: new Date().toJSON()});
        const updateResult = await DocumentClient.update({
          TableName: process.env.TABLE_NAME,
          Key: {
            pk: item0.pk,
            sk: item0.sk
          },
          ...updateExpresion
        }).promise();
        console.log(`${item0.sk} updated to ${status} for trip ${trip_id}`, updateResult);
      } else {
        console.log(`As ${step} wasn't found for trip ${trip_id}, there is no update`);
      }
      break;
    default:
      console.log(`Action unknown: ${action}`);
  }
}

function getUpdateExpresion(update:any) {
  let prefix = "set ", updateExpresion:any = {
    UpdateExpression: '',
    ExpressionAttributeValues: {},
    ExpressionAttributeNames: {}
  };
  let attributes = Object.keys(update)
  for (let i=0; i<attributes.length; i++) {
    let attribute = attributes[i]
    // if (attribute !== "id") {
    if (update[attribute] !== undefined) {
      updateExpresion["UpdateExpression"] += prefix + "#" + attribute + " = :" + attribute
      updateExpresion["ExpressionAttributeValues"][":" + attribute] = update[attribute]
      updateExpresion["ExpressionAttributeNames"]["#" + attribute] = attribute
      prefix = ", "
    }
  }
  return updateExpresion;
}

export {
  save,
}
