import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@contexts/ThemeContext';
import { WorkflowEditorPage } from '@pages/WorkflowEditorPage';
import { WorkflowDashboard } from '@pages/WorkflowDashboard';
import { WorkflowDetailsPage } from '@pages/WorkflowDetailsPage';
import { ExecutionDashboard } from '@pages/ExecutionDashboard';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<WorkflowDashboard />} />
          <Route path="/workflows" element={<WorkflowDashboard />} />
          <Route path="/workflows/new" element={<WorkflowEditorPage />} />
          <Route path="/workflows/:workflowId" element={<WorkflowDetailsPage />} />
          <Route path="/workflows/:workflowId/edit" element={<WorkflowEditorPage />} />
          <Route path="/executions" element={<ExecutionDashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
