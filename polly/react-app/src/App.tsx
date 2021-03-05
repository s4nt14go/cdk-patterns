import React, {useState} from 'react';
import './App.css';

type Styles = 'conversational' | 'news';

function App() {

  const voicesAlways = ['Joanna', 'Matthew'];
  const voicesOnlyNews = ['Lupe', 'Amy'];
  const [text, setText] = useState("");
  const [translateSource, setTranslateSource] = useState('en');
  const [translateTarget, setTranslateTarget] = useState('en');
  const [style, setStyle] = useState('conversational');
  const [possibleVoices, setPossibleVoices] = useState(voicesAlways);
  const [voice, setVoice] = useState(voicesAlways[0]);

  function speak() {
    console.log(text);
  }

  function settingStyle(style:Styles) {
    console.log('settingStyle', style);

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

  const textClasses = 'flex lg:w-2/3 w-full sm:flex-row flex-col mx-auto px-8 sm:space-x-4 sm:space-y-0 space-y-4 sm:px-0 items-end';
  const configClasses = 'flex flex-col items-end lg:w-2/3 mx-auto px-8 sm:flex-row sm:px-0 sm:space-x-4 sm:space-y-0 space-y-4 w-full';

  return (
    <div className="App">
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-12 mx-auto">


          <div className="flex flex-col text-center w-full mb-4">
            <h1 className="sm:text-3xl text-2xl font-medium title-font mb-4 text-gray-900">Make Polly speak!</h1>
            <p className="lg:w-2/3 mx-auto leading-relaxed text-base">Try this CDK pattern with Polly and Translate</p>
          </div>

          <div
            className={textClasses}>
            <div className="relative flex-grow w-full">
              <label htmlFor="full-name" className="leading-7 text-sm text-gray-600">Text</label>
              <input type="text" id="full-name" name="full-name" value={text} maxLength={100}
                     onChange={event => setText(event.target.value)}
                     className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-transparent focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
            </div>
          </div>

          <div
            className={configClasses}>
            <div className="w-full flex py-3">
              <span>Translate language source</span>
            </div>
            <div className="w-full">
              <select
                value={translateSource}
                onChange={(event) => setTranslateSource(event.target.value)}
                className="w-full border bg-white rounded px-3 py-2 outline-none"
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
              <span>Translate language target</span>
            </div>
            <div className="w-full">
              <select
                value={translateTarget}
                onChange={(event) => setTranslateTarget(event.target.value)}
                className="w-full border bg-white rounded px-3 py-2 outline-none"
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
                  console.log('event', event);
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
                  className="text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg mx-auto my-4">Let's speak!
          </button>
          </div>


        </div>
      </section>
    </div>
  );
}

export default App;
