'use strict'
const CircuitBreaker = require('./circuitbreaker')
let message:string

const options = {
  fallback: fallbackFunction,
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 10000
}

function unreliableFunction () {
  return new Promise((resolve, reject) => {
    if (Math.random() < 0.6) {
      resolve({ data: 'Success' })
      message = 'Success'
    } else {
      reject({ data: 'Failed' })
      message = 'Failed'
    }
  })
}
function fallbackFunction () {
  return new Promise((resolve, _reject) => {
    resolve({ data: 'Expensive Fallback Successful' })
    message = 'Fallback'
  })
}

exports.handler = async (_event:any) => {
  const circuitBreaker = new CircuitBreaker(unreliableFunction, options)
  await circuitBreaker.fire()
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: message
    })
  }
}
