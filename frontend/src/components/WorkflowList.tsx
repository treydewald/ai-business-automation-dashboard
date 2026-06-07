import { Workflow } from '../types';
import WorkflowCard from './WorkflowCard';

interface WorkflowListProps {
  workflows: Workflow[];
  onWorkflowClick: (id: string) => void;
}

const WorkflowList = ({ workflows, onWorkflowClick }: WorkflowListProps) => {
  if (workflows.length === 0) {
    return <div className="text-center py-8 text-gray-500">No workflows to display</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {workflows.map((workflow) => (
        <WorkflowCard
          key={workflow.id}
          workflow={workflow}
          onClick={() => onWorkflowClick(workflow.id)}
        />
      ))}
    </div>
  );
};

export default WorkflowList;
