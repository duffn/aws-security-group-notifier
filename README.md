# AWS Security Group Utility
A small utility to list AWS security groups that have `0.0.0.0/0` CIDR ranges.

## Why?
You may have applications that are internal to a company that you don't want exposed publically. And sometimes too broad IP addresses may get added to security groups. You can use this to check security groups automatically and send a Slack message when violations are found.

## Running
- Install the webtasks CLI.
- Create a `webtask-secrets` file and set the following secrets.
```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
MONGO_URL=
SLACK_TOKEN=
SLACK_CHANNEL=
```
- Create the webtask
```
wt create aws-security-group.js --secrets-file webtask-secrets
```
- Ping the URL periodically or on a schedule to receive Slack notifications about security groups with `0.0.0.0/0` CIDR ranges.
