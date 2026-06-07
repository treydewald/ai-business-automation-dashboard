from app.engine.workflow_engine import WorkflowEngine

# Create a simple workflow
definition = {
    "steps": [
        {"id": "step1", "type": "test", "name": "Step 1"},
        {"id": "step2", "type": "test", "name": "Step 2"}
    ],
    "edges": [
        {"source": "step1", "target": "step2"}
    ]
}

# Create a simple handler
def test_handler(step, context):
    return {"output": f"Executed {step['id']}"}

engine = WorkflowEngine(definition)
result = engine.execute({"test": test_handler})
print("Engine execution successful!")
print(f"Status: {result['status']}")
print(f"Logs count: {len(result['logs'])}")
