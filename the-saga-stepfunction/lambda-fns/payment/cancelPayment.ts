const { save } = require('../lib');

exports.handler = async function(event:any) {
  console.log("event", event);

  const requestError = event.RequestPaymentError && JSON.parse(event.RequestPaymentError.Cause).errorMessage;
  const confirmError = event.ConfirmPaymentError && JSON.parse(event.ConfirmPaymentError.Cause).errorMessage;

  let update = {
    trip_id: event.trip_id,
    step: 'PAYMENT',
    action: 'UPDATE',
  };

  if (requestError || confirmError) await save({
    ...update,
    requestError,
    confirmError,
  });

  try {
    if (Math.random() < 0.4) {
      throw new Error("Error while canceling payment");
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


  return {
    status: "ok",
  }
};

export {};
