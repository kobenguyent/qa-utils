import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { createHashRouter, RouterProvider } from "react-router-dom";
import { LoadingSpinner } from './components/LoadingSpinner.tsx';
import { Layout } from './components/Layout.tsx';

// Lazy load components for better performance
const InteractiveVoiceResponse = lazy(() => import('./components/terms/InteractiveVoiceResponse.tsx').then(module => ({ default: module.InteractiveVoiceResponse })));
const CodeceptJS = lazy(() => import('./components/hints/CodeceptJS.tsx').then(module => ({ default: module.CodeceptJS })));
const BusyLampField = lazy(() => import('./components/terms/BusyLampField.tsx').then(module => ({ default: module.BusyLampField })));
const SIP = lazy(() => import('./components/terms/SIP.tsx').then(module => ({ default: module.SIP })));
const JWTDebugger = lazy(() => import('./components/utils/JWTDebugger.tsx').then(module => ({ default: module.JWTDebugger })));
const Base64 = lazy(() => import('./components/utils/Base64.tsx').then(module => ({ default: module.Base64 })));
const UnixTimestamp = lazy(() => import('./components/utils/UnixTimestamp.tsx').then(module => ({ default: module.UnixTimestamp })));
const JSONFormatter = lazy(() => import('./components/utils/JSONFormatter.tsx').then(module => ({ default: module.JSONFormatter })));
const UuidGenerator = lazy(() => import('./components/utils/UuidGenerator.tsx').then(module => ({ default: module.UuidGenerator })));
const JiraComment = lazy(() => import('./components/utils/JiraComment.tsx').then(module => ({ default: module.JiraComment })));
const OtpGenerator = lazy(() => import('./components/utils/OtpGenerator.tsx').then(module => ({ default: module.OtpGenerator })));
const PasswordGenerator = lazy(() => import('./components/utils/PasswordGenerator.tsx').then(module => ({ default: module.PasswordGenerator })));
const LoremIpsumGenerator = lazy(() => import('./components/utils/LoremIpsumGenerator.tsx').then(module => ({ default: module.LoremIpsumGenerator })));
const HashGenerator = lazy(() => import('./components/utils/HashGenerator.tsx').then(module => ({ default: module.HashGenerator })));
const HTPasswdGenerator = lazy(() => import('./components/utils/HTPasswdGenerator.tsx').then(module => ({ default: module.HTPasswdGenerator })));
const PlaywrightToCodeceptjs = lazy(() => import('./components/utils/PlaywrightToCodeceptjs.tsx'));
const EncryptionTool = lazy(() => import('./components/utils/EncryptionTool.tsx').then(module => ({ default: module.EncryptionTool })));
const WorkflowGenerator = lazy(() => import('./components/utils/WorkflowGenerator.tsx').then(module => ({ default: module.WorkflowGenerator })));
const RestClient = lazy(() => import('./components/utils/RestClient.tsx').then(module => ({ default: module.RestClient })));
const WebSocketClient = lazy(() => import('./components/utils/WebSocketClient.tsx').then(module => ({ default: module.WebSocketClientComponent })));
const GrpcClient = lazy(() => import('./components/utils/GrpcClient.tsx').then(module => ({ default: module.GrpcClientComponent })));
const Ctfl = lazy(() => import('./components/istqb/ctfl.tsx').then(module => ({ default: module.Ctfl })));
const CharacterCounter = lazy(() => import('./components/utils/CharacterCounter.tsx').then(module => ({ default: module.CharacterCounter })));
const AIChat = lazy(() => import('./components/utils/AIChat.tsx').then(module => ({ default: module.AIChat })));
const TestFileGenerator = lazy(() => import('./components/utils/TestFileGenerator.tsx').then(module => ({ default: module.TestFileGenerator })));
const WebTestingChecklist = lazy(() => import('./components/hints/WebTestingChecklist.tsx').then(module => ({ default: module.WebTestingChecklist })));
const ApiTestingChecklist = lazy(() => import('./components/hints/ApiTestingChecklist.tsx').then(module => ({ default: module.ApiTestingChecklist })));
const MobileTestingChecklist = lazy(() => import('./components/hints/MobileTestingChecklist.tsx').then(module => ({ default: module.MobileTestingChecklist })));
const CiCdInfographic = lazy(() => import('./components/hints/CiCdInfographic.tsx').then(module => ({ default: module.CiCdInfographic })));
const AiAgentsInfographic = lazy(() => import('./components/hints/AiAgentsInfographic.tsx').then(module => ({ default: module.AiAgentsInfographic })));
const TestFrameworksComparison = lazy(() => import('./components/hints/TestFrameworksComparison.tsx').then(module => ({ default: module.TestFrameworksComparison })));
const SqlGenerator = lazy(() => import('./components/utils/SqlGenerator.tsx').then(module => ({ default: module.SqlGenerator })));
const HtmlRenderer = lazy(() => import('./components/utils/HtmlRenderer.tsx').then(module => ({ default: module.HtmlRenderer })));
const GithubPrScriptGenerator = lazy(() => import('./components/utils/GithubPrScriptGenerator.tsx').then(module => ({ default: module.GithubPrScriptGenerator })));
const ColorConverter = lazy(() => import('./components/utils/ColorConverter.tsx').then(module => ({ default: module.ColorConverter })));
const WebsiteScanner = lazy(() => import('./components/utils/WebsiteScanner.tsx').then(module => ({ default: module.WebsiteScanner })));
const AIWebsiteTester = lazy(() => import('./components/utils/AIWebsiteTester.tsx').then(module => ({ default: module.AIWebsiteTester })));
const FileProcessor = lazy(() => import('./components/utils/FileProcessor.tsx'));
const CollectionManager = lazy(() => import('./components/utils/CollectionManager.tsx'));
const PromptEnhancer = lazy(() => import('./components/utils/PromptEnhancer.tsx').then(module => ({ default: module.PromptEnhancer })));
const MediaConverter = lazy(() => import('./components/utils/MediaConverter.tsx'));
const QRCodeGenerator = lazy(() => import('./components/utils/QRCodeGenerator.tsx'));
const DummyDataGenerator = lazy(() => import('./components/utils/DummyDataGenerator.tsx').then(module => ({ default: module.DummyDataGenerator })));
const KanbanBoard = lazy(() => import('./components/utils/KanbanBoard.tsx').then(module => ({ default: module.KanbanBoard })));
const CommandBook = lazy(() => import('./components/utils/CommandBook.tsx').then(module => ({ default: module.CommandBook })));
const JarvisAssistant = lazy(() => import('./components/utils/JarvisAssistant.tsx').then(module => ({ default: module.JarvisAssistant })));

// Component wrapper with suspense for lazy loaded routes
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Layout>
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  </Layout>
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
    path: 'password',
    element: <RouteWrapper><PasswordGenerator /></RouteWrapper>
  },
  {
    path: 'lorem-ipsum',
    element: <RouteWrapper><LoremIpsumGenerator /></RouteWrapper>
  },
  {
    path: 'hash',
    element: <RouteWrapper><HashGenerator /></RouteWrapper>
  },
  {
    path: 'htpasswd',
    element: <RouteWrapper><HTPasswdGenerator /></RouteWrapper>
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
    path: 'rest-client',
    element: <RouteWrapper><RestClient /></RouteWrapper>
  },
  {
    path: 'websocket-client',
    element: <RouteWrapper><WebSocketClient /></RouteWrapper>
  },
  {
    path: 'grpc-client',
    element: <RouteWrapper><GrpcClient /></RouteWrapper>
  },
  {
    path: 'ctfl',
    element: <RouteWrapper><Ctfl /></RouteWrapper>
  },
  {
    path: 'character-counter',
    element: <RouteWrapper><CharacterCounter /></RouteWrapper>
  },
  {
    path: 'ai-chat',
    element: <RouteWrapper><AIChat /></RouteWrapper>
  },
  {
    path: 'test-file-generator',
    element: <RouteWrapper><TestFileGenerator /></RouteWrapper>
  },
  {
    path: 'web-testing-checklist',
    element: <RouteWrapper><WebTestingChecklist /></RouteWrapper>
  },
  {
    path: 'api-testing-checklist',
    element: <RouteWrapper><ApiTestingChecklist /></RouteWrapper>
  },
  {
    path: 'mobile-testing-checklist',
    element: <RouteWrapper><MobileTestingChecklist /></RouteWrapper>
  },
  {
    path: 'cicd-infographic',
    element: <RouteWrapper><CiCdInfographic /></RouteWrapper>
  },
  {
    path: 'ai-agents-infographic',
    element: <RouteWrapper><AiAgentsInfographic /></RouteWrapper>
  },
  {
    path: 'test-frameworks-comparison',
    element: <RouteWrapper><TestFrameworksComparison /></RouteWrapper>
  },
  {
    path: 'sql-generator',
    element: <RouteWrapper><SqlGenerator /></RouteWrapper>
  },
  {
    path: 'html-renderer',
    element: <RouteWrapper><HtmlRenderer /></RouteWrapper>
  },
  {
    path: 'github-pr-generator',
    element: <RouteWrapper><GithubPrScriptGenerator /></RouteWrapper>
  },
  {
    path: 'color-converter',
    element: <RouteWrapper><ColorConverter /></RouteWrapper>
  },
  {
    path: 'website-scanner',
    element: <RouteWrapper><WebsiteScanner /></RouteWrapper>
  },
  {
    path: 'ai-website-tester',
    element: <RouteWrapper><AIWebsiteTester /></RouteWrapper>
  },
  {
    path: 'file-processor',
    element: <RouteWrapper><FileProcessor /></RouteWrapper>
  },
  {
    path: 'collection-manager',
    element: <RouteWrapper><CollectionManager /></RouteWrapper>
  },
  {
    path: 'prompt-enhancer',
    element: <RouteWrapper><PromptEnhancer /></RouteWrapper>
  },
  {
    path: 'media-converter',
    element: <RouteWrapper><MediaConverter /></RouteWrapper>
  },
  {
    path: 'qr-code',
    element: <RouteWrapper><QRCodeGenerator /></RouteWrapper>
  },
  {
    path: 'dummy-data',
    element: <RouteWrapper><DummyDataGenerator /></RouteWrapper>
  },
  {
    path: 'kanban',
    element: <RouteWrapper><KanbanBoard /></RouteWrapper>
  },
  {
    path: 'command-book',
    element: <RouteWrapper><CommandBook /></RouteWrapper>
  },
  {
    path: 'jarvis',
    element: <RouteWrapper><JarvisAssistant /></RouteWrapper>
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
