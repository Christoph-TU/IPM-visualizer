import { h, render } from 'preact';
import { createAppState } from './state/createAppState.js';
import { AppStateContext } from './state/AppStateContext.js';
import { App } from './pages/app/App.js';
import './styles/Global.css';

render(
  <AppStateContext.Provider value={createAppState()}>
    <App />
  </AppStateContext.Provider>,
  document.body
);
