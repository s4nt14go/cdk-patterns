# The EventBridge ETL

This is an example stack showing how you can use EventBridge to orchestrate events through an ETL process. This pattern was insired by [Vyas Sarangapani](https://twitter.com/madladvyas) and [Hervé Nivon](https://twitter.com/hervenivon) as you can see at the bottom of this page.

Note - This is a learning pattern, if I was implementing this in a production system I would make a couple of changes:

* KMS Encryption of sensitive data in events
* SQS between EventBridge and the Lambdas for resiliency
* Add in error events to EventBridge and error event rules

### Architecture:
![Architecture](img/arch.png)

#### Architecture Notes

##### Fargate ECS Task
I chose to use a Fargate container to download the file from s3 rather than using Lambda. For the small bundled test data csv Lambda would have worked but I felt it would be misleading and suggestive that you could pull larger files down onto a Lambda function. Lambda functions have a few limitations around memory, storage and runtime. You can do things like partially stream files from s3 to Lambda (if they happen to be in the right format) and then store state somewhere between timeouts but I felt that having an ECS Task that you can define CPU, RAM and Disk Space was the much more flexible way to go and being Fargate you are still on the serverless spectrum. You can see how cheap Fargate is if you go into the cost breakdown in Hervé's GitHub repo.

##### Throttling The Lambda Functions
Without throttling, if you put every row in a huge csv file onto EventBridge with a subscriber lambda; That lambda can scale up until it uses all the concurrency on your account. This may be what you want (probably not though). That is why I limited all the concurrency of the lambdas, you can remove this limit or tweak as much as you want but you always need to think about what else is running in that account. Isolate your stack into its own account if possible.

##### Observer Lambda
In the current format this is more of a technical demo to show what is possible with event driven architectures. Everything that it logs is already in the logs of all the individual components. You could probably use this to keep a tally for every record that gets pulled from the csv to make sure it gets inserted into DynamoDB by pulling the ids from the extraction and load events.


## When You Would Use This Pattern

If you need to create a process where a user uploads a csv and it gets transformed and inserted into DynamoDB

## Desconstructing The EventBridge ETL
If you want a walkthrough of the theory, the code and finally a demo of the deployed implementation check out:
[![Alt text](https://img.youtube.com/vi/8kg5bYsdem4/0.jpg)](https://www.youtube.com/watch?v=8kg5bYsdem4)

## How to test pattern 

After deployment you will have an s3 bucket where if you go into the aws console for that bucket and upload the file [test_data.csv](data-to-upload/test_data.csv) found in the data-to-upload folder you will kick everything off.

After you upload that file everything should automatically start working. You should be able to watch the process by looking in the cloudwatch logs for your observer lambda. Note this is a multi-threaded, concurrent process so the order of the events in the observer logs may not be what you were expecting!

Finally all of the data ends up in your DynamoDB table so you should be able to open it in the console and view the data after transform.

After setting your bucket name in `BUCKET`, you can upload it with:
```shell script
aws s3 cp data-to-upload/test_data.csv s3://$BUCKET
```

## Events walk-through

test_data.csv:
```text
ID,HouseNum,Street,Town,Zip
1,12,Main Street,Antrim,22876
2,23,2nd Street,Glengormley,73495
3,45,Church Way,Ballymena,18649
4,67,Bangor Road,Carrickfergus,86492
5,89,Dublin Boulevard,Swords,72648
```
`event` received by `s3SqsEventConsumer.ts` from SQS
```json
{
    "Records": [
        {
            "messageId": "...",
            "receiptHandle": "...",
            "body": "{\"Records\":[{...}]}",
            "attributes": {
                "ApproximateReceiveCount": "1",
                "SentTimestamp": "1610898039495",
                "SenderId": "...",
                "ApproximateFirstReceiveTimestamp": "1610898039506"
            },
            "messageAttributes": {},
            "md5OfBody": "...",
            "eventSource": "aws:sqs",
            "eventSourceARN": "arn:aws:sqs:us-east-1:..."
        }
    ]
}
```
`event.Records[i].body.Records`:

```json5
[
  {
    eventVersion: '2.1',
    eventSource: 'aws:s3',
    awsRegion: 'us-east-1',
    eventTime: '2021-01-17T15:40:34.743Z',
    eventName: 'ObjectCreated:Put',
    userIdentity: { principalId: 'AWS:...' },
    requestParameters: { sourceIPAddress: '190.229.77.50' },
    responseElements: {
      'x-amz-request-id': '...',
      'x-amz-id-2': '...'
    },
    s3: {
      s3SchemaVersion: '1.0',
      configurationId: '...',
      bucket: {
        name: 'theeventbridgeetlstack-landingbucket...',
        ownerIdentity: [Object],
        arn: 'arn:aws:s3:::theeventbridgeetlstack-landingbucket...'
      },
      object: {
        key: 'test_data.csv',
        size: 200,
        eTag: '...',
        sequencer: '...'
      }
    }
  }
]
```
`s3SqsEventConsumer.ts` runs ECS task overriding environment variables `S3_BUCKET_NAME` and `S3_OBJECT_KEY` with the former data.

The task download the file uploaded to S3 and put an event in EventBridge for each row in the csv, this is how it looks like for the first row:
```json5
[
    {
        'DetailType': 's3RecordExtraction',
        'EventBusName': 'default',
        'Source': 'cdkpatterns.the-eventbridge-etl',
        'Time': datetime.now(),
        'Detail': {
            'status': 'extracted',
            'headers': 'ID, HouseNum, Street, Town, Zip',
            'data': '1, 12, Main Street, Antrim, 22876'
        }
        
    },
]
```
As lambda `transform.ts` is the target for this EventBridge rule:
```json5
{
  description: 'Data extracted from S3, Needs transformed',
  eventPattern: {
    source: ['cdkpatterns.the-eventbridge-etl'],
    detailType: ['s3RecordExtraction'],
    detail: {
      status: ["extracted"]
    }
  }
}
``` 
...it picks the event:
```json5
{
    "version": "0",
    "id": "...",
    "detail-type": "s3RecordExtraction",
    "source": "cdkpatterns.the-eventbridge-etl",
    "time": "...",
    "region": "us-east-1",
    "resources": [],
    "detail": {
        "status": "extracted",
        "headers": "ID,HouseNum,Street,Town,Zip",
        "data": "1,12,Main Street,Antrim,22876"
    }
}
```
...and puts this event in EventBridge:
```json5
[
  {
    DetailType: 'transform',
    EventBusName: 'default',
    Source: 'cdkpatterns.the-eventbridge-etl',
    Time: new Date(),
    // Main event body
    Detail: JSON.stringify({
      status: 'transformed',
      data: {
        "ID": "1",
        "HouseNum": "12",
        "Street": "Main Street",
        "Town": "Antrim",
        "Zip": "22876"
      }
    })
  }
]
```
Similary, as lambda `load.ts` is the target for this EventBridge rule:
```json5
{
  description: 'Data transformed, Needs loaded into dynamodb',
  eventPattern: {
    source: ['cdkpatterns.the-eventbridge-etl'],
    detailType: ['transform'],
    detail: {
      status: ["transformed"]
    }
  }
}
```
...it picks the event:
```json5
{
    "version": "0",
    "id": "...",
    "detail-type": "transform",
    "source": "cdkpatterns.the-eventbridge-etl",
    "time": "...",
    "region": "us-east-1",
    "resources": [],
    "detail": {
        "status": "transformed",
        "data": {
            "ID": "1",
            "HouseNum": "12",
            "Street": "Main Street",
            "Town": "Antrim",
            "Zip": "22876"
        }
    }
}
```
The whole process once the csv file was uploaded to S3 until the values are written in the DynamoDB takes around 50s.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `npm run deploy`  deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template

## Pattern Origins

This pattern was insired by two people:

### Vyas Sarangapani
Twitter - [link](https://twitter.com/madladvyas) <br />
Full Article explaining architecture on [medium](https://medium.com/@svyasrao22/how-to-build-a-scalable-cost-effective-event-driven-etl-solution-using-serverless-b407c14d4093)

#### Architecture
![Architecture](img/vyas_arch.png)

### Hervé Nivon
Twitter - [link](https://twitter.com/hervenivon) <br />
Github - [repo](https://github.com/hervenivon/aws-experiments-data-ingestion-and-analytics)

#### Architecture
![Architecture](img/herve_arch.png)
