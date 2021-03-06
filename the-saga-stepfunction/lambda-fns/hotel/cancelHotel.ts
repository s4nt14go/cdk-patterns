const { save } = require('../lib');

exports.handler = async function(event:any) {
  console.log("event", event);

  const requestError = event.RequestHotelError && JSON.parse(event.RequestHotelError.Cause).errorMessage;
  const confirmError = event.ConfirmHotelError && JSON.parse(event.ConfirmHotelError.Cause).errorMessage;

  let update = {
    trip_id: event.trip_id,
    step: 'HOTEL',
    action: 'UPDATE',
  };

  if (requestError || confirmError) await save({
    ...update,
    requestError,
    confirmError,
  });

  try {
    if (Math.random() < 0.4) {
      throw new Error("Error while canceling hotel");
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
