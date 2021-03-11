const AWS = require('aws-sdk')
AWS.config.region = process.env.AWS_REGION || 'us-east-1'
const eventbridge = new AWS.EventBridge()

exports.lambdaHandler = async (event, context) => {

  const { params } = require('./events.js')

  console.log('--- Params ---')
  console.log(params)
  const result = await eventbridge.putEvents(params).promise()

  console.log('--- Response ---')
  console.log(result)

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html"
    },
    body: 'You have sent the events to EventBridge!'
  };
}
