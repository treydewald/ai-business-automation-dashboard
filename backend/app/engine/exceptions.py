class WorkflowException(Exception):
    pass

class DAGValidationError(WorkflowException):
    pass

class StepExecutionError(WorkflowException):
    pass

class ExecutionTimeoutError(WorkflowException):
    pass
