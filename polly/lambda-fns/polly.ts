const { Polly, Translate } = require('aws-sdk');
import wrapper from "./wrapper";

exports.handler = wrapper(async (event:any) => {
  console.log('event', event);

  // Default text
  let text = "To hear your own script, you need to include text in the message body of your restful request to the API Gateway";
  try {
    text = JSON.parse(event.body).text.slice(0,100);
  } catch (e) {
    console.log(e);
  }
  console.log('text after try-catch', text);
  if (text === 'force error') throw Error('Lambda error forced!');

  // Default voices, style and translation
  let textLanguage = event?.queryStringParameters?.translateFrom ?? "en";
  let targetLanguage = event?.queryStringParameters?.translateTo ?? textLanguage;
  let gender = event?.queryStringParameters?.gender ?? "male";

  // If we passed in a translation language, use translate to do the translation
  let translated;
  if(textLanguage !== targetLanguage){
    const translate = new Translate();

    const translateParams = {
      Text: text,
      SourceLanguageCode: textLanguage,
      TargetLanguageCode: targetLanguage
    };

    let rawTranslation = await translate.translateText(translateParams).promise();
    text = translated = rawTranslation.TranslatedText;
    console.log('translated', translated);
  }

  // Use Polly to translate text into speech

  const polly = new Polly();

  const params:any = {
    OutputFormat: 'mp3',
    Text: text,
  };
  if (gender === 'male') {
    switch (targetLanguage) {
      case 'en':
        params.VoiceId = 'Matthew'; // English (US) (en-US)
        params.Engine = 'neural';
        params.TextType = 'ssml';
        params.Text = `<speak><amazon:domain name="conversational">${text}</amazon:domain></speak>`;
        break;
      case 'es':
        params.VoiceId = 'Miguel'; // US Spanish (es-US)
        break;
      case 'it':
        params.VoiceId = 'Giorgio'; // Italian (it-IT)
        break;
    }
  }
  else {
    switch (targetLanguage) {
      case 'en':
        params.VoiceId = 'Joanna'; // English (US) (en-US)
        params.Engine = 'neural';
        params.TextType = 'ssml';
        params.Text = `<speak><amazon:domain name="conversational">${text}</amazon:domain></speak>`;
        break;
      case 'es':
        params.VoiceId = 'Lupe'; // US Spanish (es-US)
        params.Engine = 'neural';
        params.TextType = 'ssml';
        params.Text = `<speak><amazon:domain name="conversational">${text}</amazon:domain></speak>`;
        break;
      case 'it':
        params.VoiceId = 'Bianca'; // Italian (it-IT)
        break;
    }
  }
  console.log('Text markup', params.Text);

  let synthesis = await polly.synthesizeSpeech(params).promise();
  let audioStreamBuffer = Buffer.from(synthesis.AudioStream);

  const base64 = audioStreamBuffer.toString('base64');
  console.log('base64', base64);

  return {
    base64,
    translated
  }
});
