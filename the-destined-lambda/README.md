# The Destined Lambda

This project combines [Lambda Destinations](https://aws.amazon.com/blogs/compute/introducing-aws-lambda-destinations/) with [Amazon EventBridge](https://aws.amazon.com/eventbridge/) to show you that with EventBridge rules you can decouple your components in an event driven architecture and by combining it with lambda destinations you can strip out EventBridge specific code from your lambda functions themselves and decouple further.

An important point about Lambda Destinations is that they have to be executed asynchronously which is why the lambda is invoked via SNS in this pattern. To reduce custom code, I have integrated the SNS directly with API Gateway using [Apache VTL](https://velocity.apache.org/engine/1.7/vtl-reference.html).

## Architecture

![arch](img/arch.png)

### Architecture Notes

At time of writing there are 4 available destinations targets but I have chosen EventBridge as to be honest this is the most complicated and powerful of the 4:

![destinations](img/destinations.png)

The destined lambda sends some extra parameters in its response json. This is because we don't manually create the EventBridge envelope like normal so we need the ability to control how our events are processed:

```typescript
{
    source: 'cdkpatterns.the-destined-lambda',
    action: 'message',
    message: 'hello world'
}
```

by adding in the source and action fields this means that I could have multiple rules in eventbridge going to different targets based on the successful result of this function rather than the simple success/failure split you see today.   

```typescript
const successRule = new events.Rule(this, 'successRule', {
      eventBus: bus,
      description: 'all success events are caught here and logged centrally',
      eventPattern:
      {
        "detail": {
          "requestContext": {
            "condition": ["Success"]
          },
          "responsePayload": {
            "source": ["cdkpatterns.the-destined-lambda"],
            "action": ["message"]
          }
        }
      }
    });
```

On the other hand, this is how it looks like the `failureRule`:

```typescript
const failureRule = new events.Rule(this, 'failureRule', {
      eventBus: bus,
      description: 'all failure events are caught here and logged centrally',
      eventPattern:
      {
        "detail": {
          "responsePayload": {
            "errorType": ["Error"]
          }
        }
      }
    });
```

These are the relevant parts of the EventBridge event that arrives to `successLambda`:

```json
{
    "detail-type": "Lambda Function Invocation Result - Success",
    "detail": {
        "requestContext": {
            "condition": "Success",
        },
        "requestPayload": {
            "Records": [
                {
                    "Sns": {
                        "Message": "please ",
                    }
                }
            ]
        },
        "responsePayload": {
            "source": "cdkpatterns.the-destined-lambda",
            "action": "message",
            "message": "hello world"
        }
    }
}
```

The `failureLambda` counterpart:

```json
{
    "detail-type": "Lambda Function Invocation Result - Failure",
    "detail": {
        "requestContext": {
            "condition": "RetriesExhausted",
        },
        "requestPayload": {
            "Records": [
                {
                    "Sns": {
                        "Message": "please fail",
                    }
                }
            ]
        },
        "responsePayload": {
            "errorType": "Error",
            "errorMessage": "test",
            "trace": [
                "Error: test",
                "    at Runtime.exports.handler (/var/task/destinedLambda.js:15:19)",
                "    at Runtime.handleOnce (/var/runtime/Runtime.js:66:25)"
            ]
        }
    }
}
```

Just for reference these are the full EventBridge events for `successLambda`:

```json
{
    "version": "0",
    "id": "f2b6915a-2861-504b-f192-75a18a66f00c",
    "detail-type": "Lambda Function Invocation Result - Success",
    "source": "lambda",
    "account": "<ACCOUNT>",
    "time": "2021-01-09T10:29:21Z",
    "region": "us-east-1",
    "resources": [
        "arn:aws:events:us-east-1:<ACCOUNT>:event-bus/the-destined-lambda",
        "arn:aws:lambda:us-east-1:<ACCOUNT>:function:TheDestinedLambdaStack-destinedLambda8DF776BB-1XRQIXBXFSHRS:$LATEST"
    ],
    "detail": {
        "version": "1.0",
        "timestamp": "2021-01-09T10:29:21.133Z",
        "requestContext": {
            "requestId": "2e4168ac-6504-4c63-8200-c5c86f36a314",
            "functionArn": "arn:aws:lambda:us-east-1:<ACCOUNT>:function:TheDestinedLambdaStack-destinedLambda8DF776BB-1XRQIXBXFSHRS:$LATEST",
            "condition": "Success",
            "approximateInvokeCount": 1
        },
        "requestPayload": {
            "Records": [
                {
                    "EventSource": "aws:sns",
                    "EventVersion": "1.0",
                    "EventSubscriptionArn": "arn:aws:sns:us-east-1:<ACCOUNT>:TheDestinedLambdaStack-theDestinedLambdaTopic8F2C8FB6-4MCA8J447I5T:f2bc1d3d-a6fa-4957-b8c7-487eca5462f9",
                    "Sns": {
                        "Type": "Notification",
                        "MessageId": "09675f05-43ec-5cc2-901e-0776c42c5677",
                        "TopicArn": "arn:aws:sns:us-east-1:<ACCOUNT>:TheDestinedLambdaStack-theDestinedLambdaTopic8F2C8FB6-4MCA8J447I5T",
                        "Subject": null,
                        "Message": "please ",
                        "Timestamp": "2021-01-09T10:29:20.870Z",
                        "SignatureVersion": "1",
                        "Signature": "m9IKvTAeSWOU0yPo8IySqJawUDk6+2o7JKavQcVHsfIhWkFWEno+kdqb+xni21FxO9GV+678QMJzXbR6O8iFAGkuTp4bJ29/XQMNFoBr6IJnV6sLhTasqepUC1J695jiRUNi2xNsaWwbI5pHa26IriHSQLV9z8EbQONh8dAu0HkVTZphFt70TBQTFeyw/GKRomlpGikxYzoMGhXiT+ZqvuvQFcCSpbKAJGZJoRsTPnFQXiZH0xWQdeFB13mx2B/Hluy4gtbIChFVR42hbO12g+KBC38JfT3+SjqKTq01kZP2D/H9hMnui6nMyrsfpzphuGe3BSVdjSRDiWycjFc3UA==",
                        "SigningCertUrl": "https://sns.us-east-1.amazonaws.com/SimpleNotificationService-010a507c1833636cd94bdb98bd93083a.pem",
                        "UnsubscribeUrl": "https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:<ACCOUNT>:TheDestinedLambdaStack-theDestinedLambdaTopic8F2C8FB6-4MCA8J447I5T:f2bc1d3d-a6fa-4957-b8c7-487eca5462f9",
                        "MessageAttributes": {}
                    }
                }
            ]
        },
        "responseContext": {
            "statusCode": 200,
            "executedVersion": "$LATEST"
        },
        "responsePayload": {
            "source": "cdkpatterns.the-destined-lambda",
            "action": "message",
            "message": "hello world"
        }
    }
}
``` 

...and `failureLambda`:

```json
{
    "version": "0",
    "id": "62091a08-3570-a3ed-3143-8a073996a1c2",
    "detail-type": "Lambda Function Invocation Result - Failure",
    "source": "lambda",
    "account": "<ACCOUNT>",
    "time": "2021-01-09T10:44:15Z",
    "region": "us-east-1",
    "resources": [
        "arn:aws:events:us-east-1:<ACCOUNT>:event-bus/the-destined-lambda",
        "arn:aws:lambda:us-east-1:<ACCOUNT>:function:TheDestinedLambdaStack-destinedLambda8DF776BB-1XRQIXBXFSHRS:$LATEST"
    ],
    "detail": {
        "version": "1.0",
        "timestamp": "2021-01-09T10:44:15.341Z",
        "requestContext": {
            "requestId": "ed6b4efd-57fb-43e2-9e95-28e606a45535",
            "functionArn": "arn:aws:lambda:us-east-1:<ACCOUNT>:function:TheDestinedLambdaStack-destinedLambda8DF776BB-1XRQIXBXFSHRS:$LATEST",
            "condition": "RetriesExhausted",
            "approximateInvokeCount": 1
        },
        "requestPayload": {
            "Records": [
                {
                    "EventSource": "aws:sns",
                    "EventVersion": "1.0",
                    "EventSubscriptionArn": "arn:aws:sns:us-east-1:<ACCOUNT>:TheDestinedLambdaStack-theDestinedLambdaTopic8F2C8FB6-4MCA8J447I5T:f2bc1d3d-a6fa-4957-b8c7-487eca5462f9",
                    "Sns": {
                        "Type": "Notification",
                        "MessageId": "6a1fe8b5-fc0e-5768-8137-b0c67730996b",
                        "TopicArn": "arn:aws:sns:us-east-1:<ACCOUNT>:TheDestinedLambdaStack-theDestinedLambdaTopic8F2C8FB6-4MCA8J447I5T",
                        "Subject": null,
                        "Message": "please fail",
                        "Timestamp": "2021-01-09T10:44:14.791Z",
                        "SignatureVersion": "1",
                        "Signature": "QWQNiaIJ8uU4HuEw4+akIfnkSmhTET741VtPBwxURXjCvmok67Swu08VkN/gGlxfIP/xVjENEsWMeSFxJdQ3CK+jhQPdSq2GNLgxv1EWGlmLrs+F+h2WB6FT99vQEXgtdiK/yAqmYwOCqc9C4q+Wd7uUpQkOzW2sSqawjqNc03JPZp0FbiDoaCUr3LL54ihECeUF5Hk5jeCMXlOb/ZFcWTSXnTPnnN1UhWWBVYvCdvXGWtnrCejrxNkU6gmFNwX8AWqIiBjprDmkdoq/6UODdbhtY/nN1fX9y+wSWz6fhONiO1l4VVwdWILuCPpBcpwTWlYK6gOhXUrAuQ0Xu5ogKg==",
                        "SigningCertUrl": "https://sns.us-east-1.amazonaws.com/SimpleNotificationService-010a507c1833636cd94bdb98bd93083a.pem",
                        "UnsubscribeUrl": "https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:<ACCOUNT>:TheDestinedLambdaStack-theDestinedLambdaTopic8F2C8FB6-4MCA8J447I5T:f2bc1d3d-a6fa-4957-b8c7-487eca5462f9",
                        "MessageAttributes": {}
                    }
                }
            ]
        },
        "responseContext": {
            "statusCode": 200,
            "executedVersion": "$LATEST",
            "functionError": "Unhandled"
        },
        "responsePayload": {
            "errorType": "Error",
            "errorMessage": "test",
            "trace": [
                "Error: test",
                "    at Runtime.exports.handler (/var/task/destinedLambda.js:15:19)",
                "    at Runtime.handleOnce (/var/runtime/Runtime.js:66:25)"
            ]
        }
    }
}
```

For a complete version of routing flow based on the json payload see [The EventBridge ETL Pattern](https://github.com/cdk-patterns/serverless/tree/master/the-eventbridge-etl)


## When You Would Use This Pattern
If you are building an asyncronous, event driven flow but step functions seem too heavy weight for your current needs. 

Alternatively As illustrated in this implementation, you can use it to strip custom logic for sending events to EventBridge from your Lambdas

## Desconstructing The Destined Lambda
If you want a walkthrough of the theory, the code and finally a demo of the deployed implementation check out:
[![Alt text](https://img.youtube.com/vi/DQgq_p6Q03M/0.jpg)](https://www.youtube.com/watch?v=DQgq_p6Q03M)

## How To Test Pattern
After you deploy this pattern you will have an API Gateway with one endpoint "SendEvent" that accepts GET requests.

You will get the base url for your deployed api from the deploy logs.

To send a message that triggers the onSuccess flow just open the endpoint in a browser.

```https://{{API ID}}.execute-api.us-east-1.amazonaws.com/prod/SendEvent```

To send a message that triggers the onFailure flow add ?mode=fail onto the url.

```https://{{API ID}}.execute-api.us-east-1.amazonaws.com/prod/SendEvent?mode=fail```

What you are looking for in both flows is inside the cloudwatch logs for the Success and Failure Lambda functions. You will see that in the logs for failure, not only do you get the actual error that was thrown but it also includes the event details that came into the function to cause the error. This means you have everything you need to replay it at your leisure.


## Useful commands

 * `npx cdkp init the-destined-lambda` installs this pattern
 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `npm run deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
