const AWS = require('aws-sdk');
var client = new AWS.SecretsManager();
var mysql = require('mysql');
const fs = require('fs');

let connection:any, created = false;

exports.handler = async function(event:any) {
  console.log('event', event);

  if (!created) {
    console.log('Will CREATE DATABASE & TABLE IF NOT EXISTS')

    console.log(`Getting secret for ${process.env.RDS_SECRET_NAME}`);

    // retrieve the username and password for MySQL from secrets manager
    const secret = await client.getSecretValue({SecretId: process.env.RDS_SECRET_NAME}).promise();
    let { username, password } = JSON.parse(secret.SecretString);

    // Important to note that the ssl cert is not the standard RDS cert.
    // https://www.amazontrust.com/repository/AmazonRootCA1.pem
    connection = mysql.createConnection({
      host     :  process.env.PROXY_ENDPOINT,
      user     :  username,
      password :  password,
      ssl  : {
        ca : fs.readFileSync(__dirname + '/AmazonRootCA1.pem')
      }
    });

    // This may be our first time running this function, setup a MySQL Database
    await new Promise( (resolve,_reject) => {
      connection.query('CREATE DATABASE IF NOT EXISTS cdkpatterns', function (error:any, results:any, fields:any) {
        if (error) throw error;
        // connected!
        resolve('CREATE DATABASES query returned '+JSON.stringify(results));
      });
    }).catch(error =>{
      throw Error(JSON.stringify(error));
    });

    connection.destroy();

    // re-establish a connection to our created cdkpatterns DB
    connection = mysql.createConnection({
      host     :  process.env.PROXY_ENDPOINT,
      user     :  username,
      password :  password,
      database: 'cdkpatterns',
      ssl  : {
        ca : fs.readFileSync(__dirname + '/AmazonRootCA1.pem')
      }
    });

    // If this is our first execution, create our rds_proxy table inside cdkpatterns
    await new Promise( (resolve,_reject) => {
      connection.query('CREATE TABLE IF NOT EXISTS rds_proxy (id INT AUTO_INCREMENT PRIMARY KEY, url VARCHAR(20))', function (error:any, results:any, fields:any) {
        if (error) throw error;
        // connected!
        resolve('CREATE Table query returned '+JSON.stringify(results));
      });
    }).catch(error =>{
      throw Error(JSON.stringify(error));
    });
    created = true;

  } else console.log('DB already created, will INSERT directly');

  // Insert a new record with an auto generated ID and the url you hit on the API Gateway
  await new Promise( (resolve,_reject) => {
    connection.query(`INSERT INTO rds_proxy(url) VALUES ('${event.rawPath}')`, function (error:any, results:any, fields:any) {
      if (error) throw error;
      // connected!
      resolve('INSERT query returned '+JSON.stringify(results));
    });
  }).catch(error =>{
    throw Error(JSON.stringify(error));
  });

  // Query for all records in the DB and build up an HTML Table of results
  let queryResult = await new Promise( (resolve,_reject) => {
    connection.query(`SELECT * FROM rds_proxy`, function (error:any, results:any, fields:any) {
      if (error) throw error;
      // connected!
      let tableString = "<table><tr><th>ID</th><th>URL</th></tr>";
      for(let value of results) {
        tableString += `<tr><td>${value.id}</td><td>${value.url}</td></tr>`;
      }
      tableString += "</table>";

      resolve('All Current Data in rds_proxy Table (url is whatever url you hit on the HTTP API, try another random url like /hello) '+tableString);
    });
  }).catch(error =>{
    return JSON.stringify(error);
  });

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html"
    },
    body: `You have connected with the RDS Proxy! <br /><br /> ${queryResult}`
  }
};
