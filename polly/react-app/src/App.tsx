import React, {ChangeEvent, useEffect, useState} from 'react';
import './App.css';
import quotes from './scripts/best100-array.json';
import polly from './polly.png';

type Styles = 'conversational' | 'news';

function App() {

  const voicesAlways = ['Joanna', 'Matthew'];
  const voicesOnlyNews = ['Lupe', 'Amy'];
  const [text, setText] = useState(quotes[Math.floor(Math.random()*100)]);
  const [translateSource, setTranslateSource] = useState('en');
  const [translateTarget, setTranslateTarget] = useState('es');
  const [style, setStyle] = useState('conversational');
  const [possibleVoices, setPossibleVoices] = useState(voicesAlways);
  const [voice, setVoice] = useState(voicesAlways[0]);
  const [fetching, setFetching] = useState(false);
  const [translated, setTranslated] = useState('');
  const [noTranslation, setNoTranslation] = useState(false);

  function speak() {
    setFetching(true);
    fetch(`https://df6hqbn7dh.execute-api.us-east-1.amazonaws.com/prod?translateFrom=${translateSource}&translateTo=${translateTarget}&style=${style}&voice=${voice}`,
      {
        method: 'POST',
        body: JSON.stringify({text}),
      }).then(response => {
        return response.text();
      }).then(result => {
        const parsed = JSON.parse(result);
        setTranslated(parsed.translated);
        return new Audio(`data:audio/mpeg;base64,${parsed.base64}`).play();
      }).then(result => {
          setFetching(false);
      }).catch(error => {
        console.error(error);
        setFetching(false);
      });
  }

  function settingStyle(style:Styles) {
    switch (style) {
      case 'conversational':
        setPossibleVoices(voicesAlways);
        if (voicesOnlyNews.includes(voice)) {
          setVoice(voicesAlways[0]);
        }
        break;
      case 'news':
        setPossibleVoices(voicesAlways.concat(voicesOnlyNews));
        break;
      default:
        console.error(`Unrecognized style: ${style}`);
    }
    setStyle(style);
  }

  useEffect(() => {
    setTranslated('');
  }, [text]);

  function onChangeSource(event:ChangeEvent<HTMLSelectElement>){
    setTranslateSource(event.target.value);
    setTranslated('');
  }

  function onChangeTarget(event:ChangeEvent<HTMLSelectElement>){
    setTranslateTarget(event.target.value);
    setTranslated('');
  }

  useEffect(() => {
    if (translateSource === translateTarget) {
      setNoTranslation(true);
    } else {
      setNoTranslation(false);
    }
  }, [translateTarget, translateSource]);

  const textClasses = 'flex lg:w-2/3 w-full sm:flex-row flex-col mx-auto px-8 sm:space-x-4 sm:space-y-0 space-y-4 sm:px-0 items-end';
  const configClasses = 'flex flex-col items-end lg:w-2/3 mx-auto px-8 sm:flex-row sm:px-0 sm:space-x-4 sm:space-y-0 space-y-4 w-full';
  const noTranslationClasses = 'line-through text-gray-400';

  return (
    <div className="App">
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-12 mx-auto">


          <div className="flex flex-col text-center w-full mb-4">
            <img src={polly} alt="Polly" className='mx-auto w-40' />
            <h1 className="sm:text-3xl text-2xl font-medium title-font mb-4 text-gray-900">Make Polly speak!</h1>
            <p className="lg:w-2/3 mx-auto leading-relaxed text-base">Try this <a href="https://github.com/s4nt14go/cdk-patterns/tree/master/polly" target='_blank' rel="noreferrer" className='underline text-blue-600 hover:text-blue-800 visited:text-purple-600'>CDK pattern</a> with Polly and Translate</p>
          </div>

          <div
            className={textClasses}>
            <div className="relative flex-grow w-full">
              <label htmlFor="full-name" className="leading-7 text-sm text-gray-600">Text</label>
              <input type="text" value={text} maxLength={100}
                     onChange={event => setText(event.target.value)}
                     className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-transparent focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
            </div>
          </div>

          <div
            className={`${textClasses} ${translated? '': 'text-transparent'}`}>
            <div className="relative flex-grow w-full mb-5 mt-2">
              <label className={`leading-7 text-sm ${translated? 'text-gray-600': 'text-transparent'}`}>Translation</label>
              <p>{translated || '&nbsp'}</p>
            </div>
          </div>

          <div
            className={`${configClasses} ${noTranslation? noTranslationClasses: ''}`}>
            <div className="w-full flex py-3">
              <span>Translate language source</span>
            </div>
            <div className="w-full">
              <select
                value={translateSource}
                onChange={onChangeSource}
                className={`w-full border bg-white rounded px-3 py-2 outline-none ${noTranslation? noTranslationClasses: ''}`}
              >
                <option value='en'>
                  English
                </option>
                <option value='es'>
                  Spanish
                </option>
                <option value='it'>
                  Italian
                </option>
              </select>
            </div>
          </div>

          <div
            className={`${configClasses} ${noTranslation? noTranslationClasses: ''}`}>
            <div className="w-full flex py-3">
              <span>Translate language target</span>
            </div>
            <div className="w-full">
              <select
                value={translateTarget}
                onChange={onChangeTarget}
                className={`w-full border bg-white rounded px-3 py-2 outline-none ${noTranslation? noTranslationClasses: ''}`}
              >
                <option value='en'>
                  English
                </option>
                <option value='es'>
                  Spanish
                </option>
                <option value='it'>
                  Italian
                </option>
              </select>
            </div>
          </div>

          <div
            className={configClasses}>
            <div className="w-full flex py-3">
              <span>Style</span>
            </div>
            <div className="w-full">
              <select
                value={style}
                onChange={(event) => {
                  settingStyle(event.target.value as Styles)
                }}
                className="w-full border bg-white rounded px-3 py-2 outline-none"
              >
                <option value='conversational'>
                  conversational
                </option>
                <option value='news'>
                  news
                </option>
              </select>
            </div>
          </div>


          <div
            className={configClasses}>
            <div className="w-full flex py-3">
              <span>Voice</span>
            </div>
            <div className="w-full">
              <select
                value={voice}
                onChange={(event) => {
                  console.log('event', event);
                  setVoice(event.target.value)
                }}
                className="w-full border bg-white rounded px-3 py-2 outline-none"
              >

                {possibleVoices.map(voice =>
                  <option key={voice} value={voice}>{voice}</option>
                )}

              </select>
            </div>
          </div>


          <div
            className={`${configClasses} py-3`}>
          <button type="button" onClick={speak}
                  className="text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg mx-auto mt-4 disabled:cursor-wait disabled:opacity-50" disabled={fetching}>
            <span>Let's speak!</span>
          </button>
          </div>
          <div className={`flex mx-auto border-gray-200 ease-linear h-5 inline-block loader rounded-full w-5 align-text-bottom ${fetching? 'border-4 border-t-4':''}`}></div>


        </div>
      </section>
    </div>
  );
}

export default App;
