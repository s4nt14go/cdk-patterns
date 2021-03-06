const { save } = require('../lib');

exports.handler = async function(event:any) {
  console.log("event", event);

  // If we passed the parameter to fail this step
  if(event.run_type === 'failHotelConfirmation'){
    throw new Error('Error while confirming hotel');
  }

  await save({
    trip_id: event.trip_id,
    step: 'HOTEL',
    action: 'UPDATE',
    status: 'CONFIRMED',
  });

  return {
    status: "ok",
  }
};

export {}
