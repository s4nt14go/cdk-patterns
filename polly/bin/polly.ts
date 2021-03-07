#!/usr/bin/env node
require('dotenv').config({ path: __dirname+'/../.env' });
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PollyStack } from '../lib/polly-stack';

const app = new cdk.App();
const stage = process.env.STAGE || "dev";
new PollyStack(app, `PollyStack-${stage}`);
