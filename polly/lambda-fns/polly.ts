const { Polly, Translate } = require('aws-sdk');

exports.handler = async function(event:any) {
  console.log('event', event);

  // Default text
  let text = "To hear your own script, you need to include text in the message body of your restful request to the API Gateway";
  try {
    text = JSON.parse(event.body).text.slice(0,100);
  } catch (e) {
    console.log(e);
  }
  console.log('text after try-catch', text);

  // Default voices, style and translation
  let voice = event?.queryStringParameters?.voice ?? "Matthew";
  let style = event?.queryStringParameters?.style ?? "conversational";
  let translateFrom = event?.queryStringParameters?.translateFrom ?? "en";
  let translateTo = event?.queryStringParameters?.translateTo ?? "en";


  // Depending on the language and style combination, some voices are supported, check it out in your project
  let validVoices = ['Joanna', 'Matthew'];
  if (style === "news") validVoices.push('Lupe', 'Amy');
  const msg = `Valid voices for style ${style}: ${validVoices.join(', ')}`
  console.log(msg)

  if(!validVoices.includes(voice)){
    return {
      statusCode: 400,
      body: msg
    }
  }

  // If we passed in a translation language, use translate to do the translation
  if(translateTo !== translateFrom){
    const translate = new Translate();

    var translateParams = {
      Text: text,
      SourceLanguageCode: translateFrom,
      TargetLanguageCode: translateTo
    };

    let rawTranslation = await translate.translateText(translateParams).promise();
    text = rawTranslation.TranslatedText;
    console.log('translated text', text);
  }

  // Use Polly to translate text into speech

  const polly = new Polly();

  const params = {
    OutputFormat: 'mp3',
    Engine:'neural',
    TextType:'ssml',
    Text: `<speak><amazon:domain name="${style}">${text}</amazon:domain></speak>`,
    VoiceId: voice,
  };
  console.log('Text markup', params.Text);

  let synthesis = await polly.synthesizeSpeech(params).promise();
  let audioStreamBuffer = Buffer.from(synthesis.AudioStream);

  const base64 = audioStreamBuffer.toString('base64');
  console.log('base64', base64);

  return {
    statusCode: 200,
    body: base64,
  };
};
