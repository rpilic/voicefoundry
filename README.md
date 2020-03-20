# VoiceFoundy Code Project - Rob Pilic

This application does the following:

1. Deploys the CloudFormation template using the values specified in the `config.json` file
2. Uploads the `voice_data.json` file in the `data` directory
3. Invokes the `dataSaveVoice-dev` Lambda function to save the uploaded S3 file data to DynamoDB
4. The DynamoDB stream from the above step invokes the `synthesize-dev` Lambda function, which:
    - Iterates through the stream records
    - Calls Polly->DescribeVoices for the current record's language
    - Uses the first voice returned to synthesize the text to audio
    - Drops the resulting audio file on S3 in the `synthesized` folder

## Running the project

1. Edit the `config.json` with any appropriate changes to the configuration properties:

```
alarmEmail: email to send notification to when a CloudWatch alarm is triggered
awsProfile: the profile in .aws/credentials to use to launch AWS services
logRetentionDays: the number of days to keep data for in the Lambda functions' Cloudwatch Logs streams
s3Bucket: the name of the S3 bucket to create
```

2. Open a terminal window and type `npm run deploy`.
