import { expect as expectCDK, haveResourceLike, countResourcesLike } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import TheSagaStepfunction = require('../lib/the-saga-stepfunction-single-table-stack');

describe('Stack resources exist', () => {
  test('API Gateway Proxy Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new TheSagaStepfunction.TheSagaStepfunctionSingleTableStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(haveResourceLike("AWS::ApiGateway::Resource", {
        "PathPart": "{proxy+}"
      }
    ));
  });

  test('Saga Lambda Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new TheSagaStepfunction.TheSagaStepfunctionSingleTableStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(haveResourceLike("AWS::Lambda::Function", {
        "Handler": "sagaLambda.handler"
      }
    ));
  });

  test('Saga Lambda Permissions To Execute StepFunction', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new TheSagaStepfunction.TheSagaStepfunctionSingleTableStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(haveResourceLike("AWS::IAM::Policy", {
        "PolicyDocument": {
          "Statement": [{
            "Action": "states:StartExecution",
            "Effect": "Allow"
          }]
        }
      }
    ));
  });

  test('Saga State Machine Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new TheSagaStepfunction.TheSagaStepfunctionSingleTableStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(haveResourceLike("AWS::StepFunctions::StateMachine"));
  });

  test('9 Separate DynamoDB Read/Write IAM Policies Created, for lambdas: ' +
    'cancelPayment, confirmPayment, requestPayment, ' +
    'cancelHotel, confirmHotel, requestHotel, ' +
    'cancelFlight, confirmFlight, requestFlight', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new TheSagaStepfunction.TheSagaStepfunctionSingleTableStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(countResourcesLike("AWS::IAM::Policy", 9, {
        "PolicyDocument": {
          "Statement": [
            {
              "Action": [
                "dynamodb:BatchGetItem",
                "dynamodb:GetRecords",
                "dynamodb:GetShardIterator",
                "dynamodb:Query",
                "dynamodb:GetItem",
                "dynamodb:Scan",
                "dynamodb:BatchWriteItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem"
              ],
              "Effect": "Allow"
            }]
        }
      }
    ));
  });

  test('1 DynamoDB Table Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new TheSagaStepfunction.TheSagaStepfunctionSingleTableStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(countResourcesLike("AWS::DynamoDB::Table", 1, {
        "KeySchema": [
          {
            "AttributeName": "pk",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "sk",
            "KeyType": "RANGE"
          }
        ],
        "AttributeDefinitions": [
          {
            "AttributeName": "pk",
            "AttributeType": "S"
          },
          {
            "AttributeName": "sk",
            "AttributeType": "S"
          }
        ]
      }
    ));
  });

  test('Hotel Reservation Lambda Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new TheSagaStepfunction.TheSagaStepfunctionSingleTableStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(haveResourceLike("AWS::Lambda::Function", {
        "Handler": "hotel/requestHotel.handler",
        "Runtime": "nodejs12.x"
      }
    ));
  });

  test('Confirm Hotel Reservation Lambda Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new TheSagaStepfunction.TheSagaStepfunctionSingleTableStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(haveResourceLike("AWS::Lambda::Function", {
        "Handler": "hotel/confirmHotel.handler",
        "Runtime": "nodejs12.x"
      }
    ));
  });

  test('Cancel Hotel Booking Lambda Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new TheSagaStepfunction.TheSagaStepfunctionSingleTableStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(haveResourceLike("AWS::Lambda::Function", {
        "Handler": "hotel/cancelHotel.handler",
        "Runtime": "nodejs12.x"
      }
    ));
  });

  test('Flight Reservation Lambda Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new TheSagaStepfunction.TheSagaStepfunctionSingleTableStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(haveResourceLike("AWS::Lambda::Function", {
        "Handler": "flights/requestFlight.handler",
        "Runtime": "nodejs12.x"
      }
    ));
  });

  test('Confirm Flight Reservation Lambda Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new TheSagaStepfunction.TheSagaStepfunctionSingleTableStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(haveResourceLike("AWS::Lambda::Function", {
        "Handler": "flights/confirmFlight.handler",
        "Runtime": "nodejs12.x"
      }
    ));
  });

  test('Cancel Flight Booking Lambda Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new TheSagaStepfunction.TheSagaStepfunctionSingleTableStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(haveResourceLike("AWS::Lambda::Function", {
        "Handler": "flights/cancelFlight.handler",
        "Runtime": "nodejs12.x"
      }
    ));
  });

  test('Payment Lambda Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new TheSagaStepfunction.TheSagaStepfunctionSingleTableStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(haveResourceLike("AWS::Lambda::Function", {
        "Handler": "payment/confirmPayment.handler",
        "Runtime": "nodejs12.x"
      }
    ));
  });

  test('Cancel Payment Lambda Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new TheSagaStepfunction.TheSagaStepfunctionSingleTableStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(haveResourceLike("AWS::Lambda::Function", {
        "Handler": "payment/cancelPayment.handler",
        "Runtime": "nodejs12.x"
      }
    ));
  });
});
