const { save } = require('../lib');

exports.handler = async function(event:any) {
  console.log("event", event);

  if(event.run_type === 'failPaymentConfirmation'){
    throw new Error('Error while confirming payment');
  }

  await save({
    trip_id: event.trip_id,
    step: 'PAYMENT',
    action: 'UPDATE',
    status: 'CONFIRMED',
  });

  return {
    status: "ok"
  }
};

export {};
