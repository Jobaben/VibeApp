"""Add stock_score_history table for tracking score changes over time

Revision ID: f3a5b7c9d2e1
Revises: 0255513ca5c5
Create Date: 2025-11-05 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'f3a5b7c9d2e1'
down_revision: Union[str, None] = '0255513ca5c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create stock_score_history table
    op.create_table('stock_score_history',
        sa.Column('stock_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('snapshot_date', sa.Date(), nullable=False),
        sa.Column('total_score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('value_score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('quality_score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('momentum_score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('health_score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('signal', sa.Enum('STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL', name='signal'), nullable=False),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['stock_id'], ['stocks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for efficient querying
    op.create_index('idx_score_history_stock_date', 'stock_score_history', ['stock_id', 'snapshot_date'], unique=True)
    op.create_index('idx_score_history_date', 'stock_score_history', ['snapshot_date'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_score_history_date', table_name='stock_score_history')
    op.drop_index('idx_score_history_stock_date', table_name='stock_score_history')

    # Drop table
    op.drop_table('stock_score_history')
