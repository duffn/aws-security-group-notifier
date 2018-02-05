'use strict';

const express = require('express');
const WebClient = require('@slack/client').WebClient;
const Webtask = require('webtask-tools');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');

const app = express();
app.use(bodyParser.json());

const collection = 'aws-security-groups';


app.get('/', (req, res) => {
  const secrets = req.webtaskContext.secrets;

  const token = secrets.SLACK_TOKEN;
  const web = new WebClient(token);
  const channelId = secrets.SLACK_CHANNEL;

  AWS.config.update({
    region: secrets.AWS_REGION,
    accessKeyId: secrets.AWS_ACCESS_KEY_ID,
    secretAccessKey: secrets.AWS_SECRET_ACCESS_KEY
  });

  let ec2 = new AWS.EC2();

  // Get security groups from AWS that meet our criteria.
  let params = {
    'Filters': [
      {
        Name: 'ip-permission.cidr',
        Values: ['0.0.0.0/0']
      }
    ]
  }

  let ec2Promise = ec2.describeSecurityGroups(params).promise();

  ec2Promise.then(data => {
    web.chat.postMessage(channelId, `Found ${data.SecurityGroups.length} security groups with \`0.0.0.0/0\` CIDR ranges. You should look into that.`)
      .then((res) => {
        // Add the timestamp that the Slack message was sent.
        data.SecurityGroups.forEach(e => e.MessageSent = res.ts);
      })
      .catch(err => res.status(500).json({ 'error': err }));

    // Log the security group in MongoDB for posterity.
    MongoClient.connect(secrets.MONGO_URL)
      .then(database => {
        const db = database.db('auth0');
        db.collection(collection).insertMany(data.SecurityGroups)
          .then(result => {
            database.close();
            res.status(201).send(result);
          })
          .catch(err => {
            database.close();
            res.status(500).json({ 'error': err })
          });
      })
  })
    .catch(err => res.status(500).json({ 'error': err }));
});

module.exports = Webtask.fromExpress(app);
