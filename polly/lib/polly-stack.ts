import * as cdk from '@aws-cdk/core';
import lambda = require('@aws-cdk/aws-lambda');
import apigateway = require('@aws-cdk/aws-apigateway');
import iam = require('@aws-cdk/aws-iam');
import { SPADeploy } from 'cdk-spa-deploy';

export class PollyStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda Function that takes in text and returns a polly voice synthesis
    const pollyLambda = new lambda.Function(this, 'PollyHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('lambda-fns'),
      handler: 'polly.handler'
    });

    // https://docs.aws.amazon.com/polly/latest/dg/api-permissions-reference.html
    // https://docs.aws.amazon.com/translate/latest/dg/translate-api-permissions-ref.html
    const pollyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: [
        "translate:TranslateText",
        "polly:SynthesizeSpeech"
      ],
    });
    pollyLambda.addToRolePolicy(pollyStatement);

    const api = new apigateway.RestApi(this, id, {
      deployOptions: {
        methodOptions: {
          '/*/*': {  // This special path applies to all resource paths and all HTTP methods
            throttlingRateLimit: 5,
            throttlingBurstLimit: 5
          }
        }
      }
    });

    api.root.addMethod('POST', new apigateway.LambdaIntegration(pollyLambda));

    new SPADeploy(this, 'websiteDeploy')
      .createBasicSite({
        indexDoc: 'index.html',
        websiteFolder: 'react-app/build'
      })

    new cdk.CfnOutput(this, 'restApiId', {
      value: api.restApiId ?? 'Something went wrong with the deploy'
    });

    new cdk.CfnOutput(this, 'api.url', {
      value: api.url ?? 'Something went wrong with the deploy'
    });

    cdk.Tags.of(this).add("project", "polly");
  }
}
