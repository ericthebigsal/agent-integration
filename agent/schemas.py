"""
Pydantic models for the connector spec — the structured output the agent
produces after reading API docs. Every ambiguous decision surfaces as a
ReviewFlag rather than a silent default.
"""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class ReviewStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    OVERRIDDEN = "overridden"  # human chose something different from agent recommendation


class ReviewFlag(BaseModel):
    """
    An explicit decision point the agent is not confident enough to resolve
    on its own. Every ambiguous point should produce one of these rather than
    a silent guess. This is the human-in-the-loop hook.
    """
    id: str = Field(description="Slug-style ID, e.g. 'pixel-vs-dataset-id'")
    decision_point: str = Field(description="One-line summary of what needs a decision")
    concern: str = Field(description="What could go wrong if the agent guesses wrong")
    options: list[str] = Field(description="Discrete choices available to the reviewer")
    agent_recommendation: Optional[str] = Field(
        default=None,
        description="Agent's best guess if it has one; null when truly uncertain",
    )
    reasoning: str = Field(description="Agent's full reasoning for flagging this")
    affects: list[str] = Field(
        default_factory=list,
        description="IDs of endpoints or field mappings that change based on this decision",
    )
    status: ReviewStatus = ReviewStatus.PENDING
    human_decision: Optional[str] = None
    human_notes: Optional[str] = None


class AuthMethod(str, Enum):
    BEARER_TOKEN = "bearer_token"
    API_KEY = "api_key"
    OAUTH2 = "oauth2"
    BASIC = "basic"


class TokenPlacement(str, Enum):
    HEADER = "header"
    QUERY_PARAM = "query_param"
    BODY = "body"


class AuthConfig(BaseModel):
    method: AuthMethod
    token_param: str = Field(description="Parameter name for the token/key")
    placement: TokenPlacement
    header_name: Optional[str] = Field(
        default=None, description="HTTP header name if placement=header, e.g. 'Authorization'"
    )
    scopes: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    review_flag_ids: list[str] = Field(default_factory=list)


class Transformation(str, Enum):
    """Ordered transformations applied to a field value before it is sent."""
    SHA256_HASH = "sha256_hash"
    UNIX_TIMESTAMP = "unix_timestamp"
    LOWERCASE = "lowercase"
    STRIP_WHITESPACE = "strip_whitespace"
    PHONE_E164 = "phone_e164"
    NONE = "none"


class FieldMapping(BaseModel):
    source_field: str = Field(description="Field name in the caller's data model")
    target_field: str = Field(description="Field name in the API payload")
    required: bool
    data_type: str = Field(description="JSON type: string, integer, number, boolean, array, object")
    transformations: list[Transformation] = Field(
        default_factory=list,
        description="Ordered list of transformations applied before sending",
    )
    description: str = ""
    example: Optional[Any] = None
    confidence: float = Field(ge=0.0, le=1.0)
    review_flag_ids: list[str] = Field(default_factory=list)


class BatchConfig(BaseModel):
    supported: bool
    max_batch_size: int
    payload_key: str = Field(description="JSON key that holds the array of items, e.g. 'data'")
    all_or_nothing: bool = Field(
        description="True if the API rejects the entire batch when any single item is invalid"
    )
    confidence: float = Field(ge=0.0, le=1.0)
    review_flag_ids: list[str] = Field(default_factory=list)


class EndpointConfig(BaseModel):
    id: str
    name: str
    method: Literal["GET", "POST", "PUT", "PATCH", "DELETE"]
    path: str = Field(description="Path template relative to base_url, e.g. '/{pixel_id}/events'")
    description: str
    request_content_type: str = "application/json"
    path_params: list[str] = Field(
        default_factory=list, description="Names of path template variables"
    )
    query_params: list[FieldMapping] = Field(default_factory=list)
    body_fields: list[FieldMapping] = Field(default_factory=list)
    batch: Optional[BatchConfig] = None
    confidence: float = Field(ge=0.0, le=1.0)
    review_flag_ids: list[str] = Field(default_factory=list)


class PaginationStrategy(str, Enum):
    NONE = "none"
    CURSOR = "cursor"
    OFFSET = "offset"
    PAGE = "page"
    NEXT_URL = "next_url"


class PaginationConfig(BaseModel):
    strategy: PaginationStrategy
    page_size_param: Optional[str] = None
    cursor_param: Optional[str] = None
    next_url_field: Optional[str] = None
    max_page_size: Optional[int] = None
    confidence: float = Field(ge=0.0, le=1.0)
    review_flag_ids: list[str] = Field(default_factory=list)


class BackoffStrategy(str, Enum):
    EXPONENTIAL = "exponential"
    LINEAR = "linear"
    NONE = "none"


class RateLimitConfig(BaseModel):
    requests_per_window: Optional[int] = None
    window_seconds: Optional[int] = None
    burst_limit: Optional[int] = None
    retry_after_header: Optional[str] = "Retry-After"
    backoff_strategy: BackoffStrategy = BackoffStrategy.EXPONENTIAL
    confidence: float = Field(ge=0.0, le=1.0)
    review_flag_ids: list[str] = Field(default_factory=list)


class ConnectorSpec(BaseModel):
    api_name: str
    api_version: str
    base_url: str
    spec_version: str = "1.0.0"
    generated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    auth: AuthConfig
    endpoints: list[EndpointConfig]
    pagination: PaginationConfig
    rate_limits: RateLimitConfig
    review_flags: list[ReviewFlag] = Field(default_factory=list)
    approved: bool = False

    def pending_flags(self) -> list[ReviewFlag]:
        return [f for f in self.review_flags if f.status == ReviewStatus.PENDING]

    def is_review_complete(self) -> bool:
        return all(f.status != ReviewStatus.PENDING for f in self.review_flags)

    def flag_by_id(self, flag_id: str) -> Optional[ReviewFlag]:
        return next((f for f in self.review_flags if f.id == flag_id), None)
