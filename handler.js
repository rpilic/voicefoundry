"use strict";

const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();
const S3 = new AWS.S3();

module.exports.save = async event => {
    console.log("event:", JSON.stringify(event));
    try {
        const recs = await Promise.all(
            event.map(e =>
                S3.getObject({
                    Bucket: e.s3Bucket,
                    Key: e.fileName
                }).promise()
            )
        );

        await Promise.all(
            recs.map(rec =>
                dynamo
                    .put({
                        TableName: process.env.TABLE_NAME,
                        Item: JSON.parse(rec.Body.toString())
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
