'use strict'
const AWS = require('aws-sdk')
const circuitBreakerTable = process.env.CIRCUITBREAKER_TABLE
const lambdaFunctionName = process.env.AWS_LAMBDA_FUNCTION_NAME
const dynamoDb = new AWS.DynamoDB.DocumentClient()

module.exports = (function () {
  function CircuitBreaker (this: any, request:any, options:any) {
    if (options === undefined) {
      options = {}
    }
    const defaults = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 10000,
      fallback: null
    }
    Object.assign(this, defaults, options, {
      request: request,
      state: 'CLOSED',
      failureCount: 0,
      successCount: 0,
      nextAttempt: Date.now()
    })
  }

  var _proto = CircuitBreaker.prototype

  _proto.fire = async function fire () {
    const data = await this.getState()
    const itemData = data.Item
    if (itemData !== undefined) {
      console.log('Data got from table', itemData);
      this.state = itemData.circuitState
      this.failureCount = itemData.failureCount
      this.successCount = itemData.successCount
      this.nextAttempt = itemData.nextAttempt

    } else {
      console.log('No data in table');
    }

    if (this.state === 'OPEN') {
      if (this.nextAttempt > Date.now()) {
        console.log('Time for nextAttempt not elapsed yet, so it will check if fallback exists');
        if (this.fallback) {
          console.log('Will call fallback and return without calling the unreliable request');
          return this.tryFallback()
        }
        console.log('No callback set, throw error without calling the unreliable request')
        throw new Error('CircuitBreaker state: OPEN')
      }
    }
    try {
      console.log('Will try the unreliable request');
      const response = await this.request()
      return this.success(response)
    } catch (err) {
      return this.fail(err)
    }
  }

  _proto.success = async function success (response:any) {
    console.log('Unreliable request successful');
    this.successCount++
    if (this.successCount > this.successThreshold) {
      console.log(`successCount(${this.successCount}) reached to set circuit as CLOSED`);
      this.state = 'CLOSED';
    } else {
      console.log(`successCount(${this.successCount}) still not enough to overwrite circuit as CLOSED`);
    }
    this.failureCount = 0
    await this.updateState('Success')
    return response
  }

  _proto.fail = async function fail (err:any) {
    console.log('Unreliable request failure');
    this.failureCount++
    if (this.failureCount >= this.failureThreshold) {
      console.log(`Many errors received (${this.failureCount}) will set to OPEN`);
      this.state = 'OPEN'
      this.nextAttempt = Date.now() + this.timeout
    } else {
      console.log(`Just ${this.failureCount} errors received, still don't set to OPEN`);
    }
    this.successCount = 0
    await this.updateState('Failure');
    console.log('Unreliable request failed, so it will check if fallback exists');
    if (this.fallback) {
      console.log('Call fallback after failing');
      return this.tryFallback()
    }
    return err
  }

  _proto.tryFallback = async function tryFallback () {
    console.log('CircuitBreaker Fallback request')
    try {
      return await this.fallback()
    } catch (err) {
      return err
    }
  }

  _proto.getState = async function getState () {
    try {
      const ddbParams = {
        TableName: circuitBreakerTable,
        Key: {
          id: lambdaFunctionName
        }
      }
      return await dynamoDb.get(ddbParams).promise()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  _proto.updateState = async function updateState (_action:any) {
    try {
      const ExpressionAttributeValues = {
        ':circuitState': this.state,
        ':failureCount': this.failureCount,
        ':successCount': this.successCount,
        ':nextAttempt': this.nextAttempt,
        ':stateTimestamp': Date.now()
      };
      console.log('update table', ExpressionAttributeValues);

      const ddbParams = {
        TableName: circuitBreakerTable,
        Key: {
          id: lambdaFunctionName
        },
        UpdateExpression:
          'set circuitState=:circuitState, failureCount=:failureCount, successCount=:successCount, nextAttempt=:nextAttempt, stateTimestamp=:stateTimestamp',
        ExpressionAttributeValues,
        ReturnValues: 'UPDATED_NEW'
      }
      return await dynamoDb.update(ddbParams).promise()
    } catch (err) {
      console.log(err)
      return err
    }
  }
  return CircuitBreaker
})()
