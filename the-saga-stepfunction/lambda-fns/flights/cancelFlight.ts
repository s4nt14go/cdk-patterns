import { save } from "../lib";

exports.handler = async function(event:any) {
  console.log("event", event);

  const requestError = event.RequestFlightError && JSON.parse(event.RequestFlightError.Cause).errorMessage;
  const confirmError = event.ConfirmFlightError && JSON.parse(event.ConfirmFlightError.Cause).errorMessage;

  let update = {
    trip_id: event.trip_id,
    step: 'FLIGHT',
    action: 'UPDATE',
  };

  if (requestError || confirmError) await save({
    ...update,
    requestError,
    confirmError,
  });

  try {
    if (Math.random() < 0.4) {
      throw new Error("Error while canceling flight");
    }

    await save({
      ...update,
      status: 'CANCELED',
    });
  } catch (e) {
    console.log('e', e);
    await save({
      ...update,
      status: 'CANCEL_ERROR',
      cancelError: e.toString(),
    });
  }

  return {status: "ok"}
};

export {}
