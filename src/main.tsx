import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {createHashRouter, RouterProvider} from "react-router-dom";
import { LoadingSpinner } from './components/LoadingSpinner.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Lazy load components for better performance
const InteractiveVoiceResponse = lazy(() => import('./components/terms/InteractiveVoiceResponse.tsx').then(module => ({default: module.InteractiveVoiceResponse})));
const CodeceptJS = lazy(() => import('./components/hints/CodeceptJS.tsx').then(module => ({default: module.CodeceptJS})));
const BusyLampField = lazy(() => import('./components/terms/BusyLampField.tsx').then(module => ({default: module.BusyLampField})));
const SIP = lazy(() => import('./components/terms/SIP.tsx').then(module => ({default: module.SIP})));
const JWTDebugger = lazy(() => import('./components/utils/JWTDebugger.tsx').then(module => ({default: module.JWTDebugger})));
const Base64 = lazy(() => import('./components/utils/Base64.tsx').then(module => ({default: module.Base64})));
const UnixTimestamp = lazy(() => import('./components/utils/UnixTimestamp.tsx').then(module => ({default: module.UnixTimestamp})));
const JSONFormatter = lazy(() => import('./components/utils/JSONFormatter.tsx').then(module => ({default: module.JSONFormatter})));
const UuidGenerator = lazy(() => import('./components/utils/UuidGenerator.tsx').then(module => ({default: module.UuidGenerator})));
const JiraComment = lazy(() => import('./components/utils/JiraComment.tsx').then(module => ({default: module.JiraComment})));
const OtpGenerator = lazy(() => import('./components/utils/OtpGenerator.tsx').then(module => ({default: module.OtpGenerator})));
const PlaywrightToCodeceptjs = lazy(() => import('./components/utils/PlaywrightToCodeceptjs.tsx'));
const EncryptionTool = lazy(() => import('./components/utils/EncryptionTool.tsx').then(module => ({default: module.EncryptionTool})));
const WorkflowGenerator = lazy(() => import('./components/utils/WorkflowGenerator.tsx').then(module => ({default: module.WorkflowGenerator})));
const Ctfl = lazy(() => import('./components/istqb/ctfl.tsx').then(module => ({default: module.Ctfl})));

// Component wrapper with error boundary and suspense
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

const router = createHashRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: 'codeceptjs',
    element: <RouteWrapper><CodeceptJS /></RouteWrapper>
  },
  {
    path: 'ivr',
    element: <RouteWrapper><InteractiveVoiceResponse /></RouteWrapper>
  },
  {
    path: 'blf',
    element: <RouteWrapper><BusyLampField /></RouteWrapper>
  },
  {
    path: 'sip',
    element: <RouteWrapper><SIP /></RouteWrapper>
  },
  {
    path: 'jwtDebugger',
    element: <RouteWrapper><JWTDebugger /></RouteWrapper>
  },
  {
    path: 'base64',
    element: <RouteWrapper><Base64 /></RouteWrapper>
  },
  {
    path: 'timestamp',
    element: <RouteWrapper><UnixTimestamp /></RouteWrapper>
  },
  {
    path: 'jsonFormatter',
    element: <RouteWrapper><JSONFormatter /></RouteWrapper>
  },
  {
    path: 'uuid',
    element: <RouteWrapper><UuidGenerator /></RouteWrapper>
  },
  {
    path: 'jiraComment',
    element: <RouteWrapper><JiraComment /></RouteWrapper>
  },
  {
    path: 'otp',
    element: <RouteWrapper><OtpGenerator /></RouteWrapper>
  },
  {
    path: 'playwright2codecept',
    element: <RouteWrapper><PlaywrightToCodeceptjs /></RouteWrapper>
  },
  {
    path: 'encryption',
    element: <RouteWrapper><EncryptionTool /></RouteWrapper>
  },
  {
    path: 'workflow-generator',
    element: <RouteWrapper><WorkflowGenerator /></RouteWrapper>
  },
  {
    path: 'ctfl',
    element: <RouteWrapper><Ctfl /></RouteWrapper>
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
