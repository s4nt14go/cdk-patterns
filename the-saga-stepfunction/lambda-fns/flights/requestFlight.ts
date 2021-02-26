import { save } from "../lib";
const chance = require('chance').Chance();

exports.handler = async function(event:any) {
  console.log("event", event);

  const step_id = chance.hash({length: 6});

  await save({
    trip_id: event.trip_id,
    step: 'FLIGHT',
    step_id,
    action: 'PUT',
    status: 'PENDING',
  });

  // If we passed the parameter to fail this step
  if(event.run_type === 'failFlightsReservation'){
    throw new Error("Error while requesting flight");
  }

  return {
    status: "ok",
    booking_id: step_id,
  }
};
