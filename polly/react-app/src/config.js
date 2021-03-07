const dev = {
  API: process.env.REACT_APP_dev_API,
};

const prod = {
  API: process.env.REACT_APP_prod_API,
};

const config = process.env.REACT_APP_STAGE === 'prod'
  ? prod
  : dev;

// eslint-disable-next-line
export default {
  // Add common config values here
  ...config
};
