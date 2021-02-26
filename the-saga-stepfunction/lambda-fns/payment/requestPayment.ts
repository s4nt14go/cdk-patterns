const chance = require('chance').Chance();
const { save } = require('../lib');

exports.handler = async function(event:any) {
  console.log("event", event);

  const step_id = chance.hash({length: 6});

  await save({
    trip_id: event.trip_id,
    step: 'PAYMENT',
    step_id,
    action: 'PUT',
    status: 'PENDING',
  });

  // If we passed the parameter to fail this step
  if(event.run_type === 'failPaymentRequest'){
    throw new Error("Error while requesting payment");
  }

  return {
    status: "ok",
    booking_id: step_id,
  }
};

export {}
