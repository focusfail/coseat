import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import logo from './logo.svg'
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <header className="header">
      <div className="headerElements">
        <img src={logo} className="logo" />
        <span className="headerElement">Flüge</span>
        <span className="headerElement">Flugzeuge</span>
        <span className="headerElement">Einstellungen</span>
      </div>
    </header>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
