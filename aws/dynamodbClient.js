// aws/dynamodbClient.js

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

export default dynamoDbClient;
