import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@contexts/ThemeContext';
import { WorkflowEditorPage } from './pages/WorkflowEditorPage';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    AI Business Automation Dashboard
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    Setup complete. Pages coming soon...
                  </p>
                </div>
              </div>
            }
          />
          <Route path="/workflows/new" element={<WorkflowEditorPage />} />
          <Route path="/workflows/:workflowId/edit" element={<WorkflowEditorPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
