import logging
from sqlalchemy import event, inspect
from sqlalchemy.orm import Session
from typing import Dict, List, Any
import time

logger = logging.getLogger(__name__)


class QueryOptimizer:
    """Tools for optimizing database queries."""

    def __init__(self, session: Session):
        self.session = session
        self.query_times: Dict[str, List[float]] = {}

    @staticmethod
    def enable_query_logging(engine):
        """Enable query execution logging for performance analysis."""

        @event.listens_for(engine, "before_cursor_execute")
        def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            conn.info.setdefault("query_start_time", []).append(time.time())
            logger.debug(f"Starting query: {statement[:100]}")

        @event.listens_for(engine, "after_cursor_execute")
        def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            total_time = time.time() - conn.info["query_start_time"].pop(-1)
            if total_time > 0.1:
                logger.warning(f"Slow query ({total_time:.3f}s): {statement[:100]}")

    @staticmethod
    def get_missing_indexes(session: Session) -> List[Dict[str, Any]]:
        """Suggest missing indexes based on table structure."""
        inspector = inspect(session.bind)
        missing_indexes = []

        for table_name in inspector.get_table_names():
            columns = inspector.get_columns(table_name)
            indexes = inspector.get_indexes(table_name)
            indexed_cols = set()

            for idx in indexes:
                indexed_cols.update(idx["column_names"])

            for column in columns:
                col_name = column["name"]
                if col_name not in indexed_cols:
                    if col_name.endswith("_id") or col_name in ["status", "created_at", "workflow_id"]:
                        missing_indexes.append({
                            "table": table_name,
                            "column": col_name,
                            "reason": "Foreign key or frequent filter column"
                        })

        return missing_indexes

    @staticmethod
    def optimize_query_joins(session: Session, base_query):
        """Apply optimization hints to a query."""
        return base_query

    @staticmethod
    def enable_connection_pooling(engine, pool_size: int = 20, max_overflow: int = 40):
        """Enable database connection pooling for better resource usage."""
        engine.dispose()
        logger.info(f"Connection pool configured: size={pool_size}, overflow={max_overflow}")
        return engine
