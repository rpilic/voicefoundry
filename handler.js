"use strict";

const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();
const S3 = new AWS.S3();
const polly = new AWS.Polly();

const outputFormat = "mp3";

module.exports.saveVoiceData = async event => {
    console.log("event:", JSON.stringify(event));

    // the payload comes in as an array of file paths, so support n number - this obviously doesn't scale past more than a few files
    try {
        const files = await Promise.all(
            event.map(e =>
                S3.getObject({
                    Bucket: e.s3Bucket,
                    Key: e.fileName
                }).promise()
            )
        );

        // TODO: validate against json schema

        const recs = files.reduce((acc, file) => {
            const data = JSON.parse(file.Body.toString());
            data.languages.forEach(lang => {
                const language = Object.keys(lang)[0];
                acc.push({
                    id: data.id,
                    language,
                    text: lang[language]
                });
            });
            return acc;
        }, []);
        console.log("recs:", recs);

        await Promise.all(
            recs.map(rec =>
                dynamo
                    .put({
                        TableName: process.env.TABLE_NAME,
                        Item: rec
                    })
                    .promise()
            )
        );
    } catch (err) {
        console.error(err);
        // TODO: log to external bug tracker
        throw err;
    }
};

module.exports.synthesize = async event => {
    console.log("event:", JSON.stringify(event));

    for (const record of event.Records) {
        const dynamoData = record.dynamodb.NewImage || record.dynamodb.OldImage;
        const data = AWS.DynamoDB.Converter.unmarshall(dynamoData);

        try {
            const voicesResult = await polly
                .describeVoices({
                    LanguageCode: data.language
                })
                .promise();

            if (
                voicesResult.hasOwnProperty("Voices") &&
                Array.isArray(voicesResult.Voices) &&
                voicesResult.Voices.length !== 0
            ) {
                // let's just use the first one
                const VoiceId = voicesResult.Voices[0].Id;
                const synthesizeResult = await polly
                    .synthesizeSpeech({
                        OutputFormat: outputFormat,
                        Text: data.text,
                        TextType: "text",
                        VoiceId
                    })
                    .promise();

                console.log("synthesizeResult:", synthesizeResult);

                // drop object on to s3
                await S3.putObject({
                    Bucket: process.env.S3_BUCKET,
                    Key: `synthesized/${data.id}/${data.language}.${outputFormat}`,
                    Body: synthesizeResult.AudioStream
                }).promise();
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    }
};
