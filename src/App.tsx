import { useReducer } from 'react';
import { LiveView } from './components/LiveView';
import { AppConfigContext, appConfigReducer, copyConfig, defaultConfig } from './context/config';
import { LiveChatProvider } from './context/liveChat';
import './styles/main.scss';
function App() {
  const [state, dispatch] = useReducer(appConfigReducer, copyConfig(defaultConfig));
  return (
    <AppConfigContext.Provider value={{state, dispatch}}>
      <LiveChatProvider>
        <LiveView />
      </LiveChatProvider>
    </AppConfigContext.Provider>
  );
}
export default App;
