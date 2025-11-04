import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'react-datepicker/dist/react-datepicker.css';
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap本体のCSS
import 'bootstrap-icons/font/bootstrap-icons.css'; // ★★★ Bootstrap IconsのCSSを追加 ★★★

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>,
)
