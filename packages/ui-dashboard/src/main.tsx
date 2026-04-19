import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell';
import { AppProvider } from './components/AppContext';
import Overview from './pages/Overview';
import Executions from './pages/Executions';
import Sessions from './pages/Sessions';
import Traces from './pages/Traces';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Overview />} />
            <Route path="executions" element={<Executions />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="traces" element={<Traces />} />
            <Route path="settings" element={<div className="p-4">Settings (Coming soon)</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  </React.StrictMode>
);