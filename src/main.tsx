import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {createHashRouter, RouterProvider} from "react-router-dom";
import {InteractiveVoiceResponse} from "./components/terms/InteractiveVoiceResponse.tsx";
import {CodeceptJS} from "./components/hints/CodeceptJS.tsx";
import { BusyLampField } from './components/terms/BusyLampField.tsx';
import { SIP } from './components/terms/SIP.tsx';
import { JWTDebugger } from './components/utils/JWTDebugger.tsx';
import { Base64 } from './components/utils/Base64.tsx';
import { UnixTimestamp } from './components/utils/UnixTimestamp.tsx';
import { JSONFormatter } from './components/utils/JSONFormatter.tsx';
import { UuidGenerator } from './components/utils/UuidGenerator.tsx';
import { JiraComment } from './components/utils/JiraComment.tsx';
import { OtpGenerator } from './components/utils/OtpGenerator.tsx';

const router = createHashRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: 'codeceptjs',
    element: <CodeceptJS></CodeceptJS>
  },
  {
    path: 'ivr',
    element: <InteractiveVoiceResponse></InteractiveVoiceResponse>
  },
  {
    path: 'blf',
    element: <BusyLampField></BusyLampField>
  },
  {
    path: 'sip',
    element: <SIP></SIP>
  },
  {
    path: 'jwtDebugger',
    element: <JWTDebugger></JWTDebugger>
  },
  {
    path: 'base64',
    element: <Base64></Base64>
  },
  {
    path: 'timestamp',
    element: <UnixTimestamp></UnixTimestamp>
  },
  {
    path: 'jsonFormatter',
    element: <JSONFormatter></JSONFormatter>
  },
  {
    path: 'uuid',
    element: <UuidGenerator></UuidGenerator>
  },
  {
    path: 'jiraComment',
    element: <JiraComment></JiraComment>
  },
  {
    path: 'otp',
    element: <OtpGenerator></OtpGenerator>
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
