let config;
switch (process.env.REACT_APP_STAGE) {

  case 'prod':
    if (!process.env.REACT_APP_prod_API) {
      console.log('process.env', process.env);
      throw Error('process.env.REACT_APP_prod_API is not set');
    }
    config = {
      API: process.env.REACT_APP_prod_API,
    }
    break;

  case 'dev':
    if (!process.env.REACT_APP_dev_API) {
      console.log('process.env', process.env);
      throw Error('process.env.REACT_APP_dev_API is not set');
    }
    config = {
      API: process.env.REACT_APP_dev_API,
    };
    break;

  default:
    console.log('process.env', process.env);
    throw Error(`process.env.REACT_APP_STAGE equals ${process.env.REACT_APP_STAGE}, which is not supported.`);
}

// eslint-disable-next-line
export default {
  // Add common config values here
  ...config
};
