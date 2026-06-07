import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@contexts/ThemeContext';
import { AuthProvider } from '@contexts/AuthContext';
import { WorkflowEditorPage } from '@pages/WorkflowEditorPage';
import { WorkflowDashboard } from '@pages/WorkflowDashboard';
import { WorkflowDetailsPage } from '@pages/WorkflowDetailsPage';
import { ExecutionDashboard } from '@pages/ExecutionDashboard';
import { ExecutionDetailsPage } from '@pages/ExecutionDetailsPage';
import { AnalyticsDashboard } from '@pages/AnalyticsDashboard';
import { LoginPage } from '@pages/LoginPage';
import { TemplateLibrary } from '@pages/TemplateLibrary';
import { AlertsPage } from '@pages/AlertsPage';
import { CustomIntegrationBuilder } from '@pages/CustomIntegrationBuilder';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<WorkflowDashboard />} />
            <Route path="/workflows" element={<WorkflowDashboard />} />
            <Route path="/workflows/new" element={<WorkflowEditorPage />} />
            <Route path="/workflows/:workflowId" element={<WorkflowDetailsPage />} />
            <Route path="/workflows/:workflowId/edit" element={<WorkflowEditorPage />} />
            <Route path="/executions" element={<ExecutionDashboard />} />
            <Route path="/executions/:executionId" element={<ExecutionDetailsPage />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/templates" element={<TemplateLibrary />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/integrations/custom" element={<CustomIntegrationBuilder />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
