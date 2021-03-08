import React, {ChangeEvent, useEffect, useState} from 'react';
import './App.css';
import quotes from './scripts/quotes-array.json';
import polly from './polly.png';
import config from './config';

function App() {

  const [text, setText] = useState(quotes[Math.floor(Math.random()*101)]);
  const [textLanguage, setTextLanguage] = useState('en');
  const [translateTarget, setTranslateTarget] = useState('es');
  const [fetching, setFetching] = useState(false);
  const [translated, setTranslated] = useState('');
  const [noTranslation, setNoTranslation] = useState(false);
  const [gender, setGender] = useState('male');

  function speak() {
    setFetching(true);
    fetch(`${config.API}?textLanguage=${textLanguage}&translateTo=${translateTarget}&gender=${gender}`,
      {
        method: 'POST',
        body: JSON.stringify({text}),
      }).then(response => {
        return response.json();
      }).then(json => {
        console.log(json);
        if (json.error) throw Error(json.error);
        setTranslated(json.translated);
        console.log('Try to play audio');
        return new Audio(`data:audio/mpeg;base64,${json.base64}`).play();
      }).catch(error => {
        console.log(error);
        alert(error);
      }).finally(() => setFetching(false));
  }

  useEffect(() => {
    setTranslated('');
  }, [text]);

  function onChangeSource(event:ChangeEvent<HTMLSelectElement>){
    setTextLanguage(event.target.value);
    setTranslated('');
  }

  function onChangeTarget(event:ChangeEvent<HTMLSelectElement>){
    setTranslateTarget(event.target.value);
    setTranslated('');
  }

  useEffect(() => {
    if (textLanguage === translateTarget) {
      setNoTranslation(true);
    } else {
      setNoTranslation(false);
    }
  }, [translateTarget, textLanguage]);

  const textClasses = 'flex lg:w-2/3 w-full sm:flex-row flex-col mx-auto px-8 sm:space-x-4 sm:space-y-0 space-y-4 sm:px-0 items-end';
  const configClasses = 'flex flex-col items-end lg:w-2/3 mx-auto px-8 sm:flex-row sm:px-0 sm:space-x-4 sm:space-y-0 space-y-4 w-full';

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
            className={configClasses}>
            <div className="w-full flex py-3">
              <span>Text language</span>
            </div>
            <div className="w-full">
              <select
                value={textLanguage}
                onChange={onChangeSource}
                className={`w-full border bg-white rounded px-3 py-2 outline-none`}
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
            className={`${configClasses} ${noTranslation? 'text-gray-400': ''}`}>
            <div className="w-full flex py-3">
              <span>Translate language target</span>
            </div>
            <div className="w-full">
              <select
                value={translateTarget}
                onChange={onChangeTarget}
                className={`w-full border bg-white rounded px-3 py-2 outline-none ${noTranslation? 'text-gray-400': ''}`}
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
              <span>Gender</span>
            </div>
            <div className="w-full">
              <select
                value={gender}
                onChange={event => setGender(event.target.value)}
                className={`w-full border bg-white rounded px-3 py-2 outline-none`}
              >
                <option value='male'>
                  Male
                </option>
                <option value='female'>
                  Female
                </option>
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
