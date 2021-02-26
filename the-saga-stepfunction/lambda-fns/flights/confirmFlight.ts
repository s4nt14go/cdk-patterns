import { save } from "../lib";

exports.handler = async function(event:any) {
  console.log("event", event);

  // If we passed the parameter to fail this step
  if(event.run_type === 'failFlightsConfirmation'){
      throw new Error('Error while confirming flight');
  }

  await save({
    trip_id: event.trip_id,
    step: 'FLIGHT',
    action: 'UPDATE',
    status: 'CONFIRMED',
  });

  return {
    status: "ok",
  }
};

export {}
