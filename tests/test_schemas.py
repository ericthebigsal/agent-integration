"""
Unit tests for ConnectorSpec schema — validation, serialization, and round-trip.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

import pytest

from agent.schemas import (
    AuthConfig,
    AuthMethod,
    BackoffStrategy,
    BatchConfig,
    ConnectorSpec,
    EndpointConfig,
    FieldMapping,
    PaginationConfig,
    PaginationStrategy,
    RateLimitConfig,
    ReviewFlag,
    ReviewStatus,
    TokenPlacement,
    Transformation,
)


def _make_minimal_spec() -> ConnectorSpec:
    return ConnectorSpec(
        api_name="Test API",
        api_version="v1",
        base_url="https://api.example.com",
        auth=AuthConfig(
            method=AuthMethod.BEARER_TOKEN,
            token_param="access_token",
            placement=TokenPlacement.QUERY_PARAM,
            confidence=0.95,
        ),
        endpoints=[
            EndpointConfig(
                id="send_data",
                name="Send Data",
                method="POST",
                path="/data",
                description="Send data to the API",
                confidence=0.9,
            )
        ],
        pagination=PaginationConfig(
            strategy=PaginationStrategy.NONE,
            confidence=1.0,
        ),
        rate_limits=RateLimitConfig(
            confidence=0.7,
            backoff_strategy=BackoffStrategy.EXPONENTIAL,
        ),
    )


class TestConnectorSpec:
    def test_round_trip_json(self) -> None:
        spec = _make_minimal_spec()
        serialized = spec.model_dump_json()
        restored = ConnectorSpec.model_validate_json(serialized)
        assert restored.api_name == spec.api_name
        assert restored.auth.method == spec.auth.method

    def test_pending_flags_filters_correctly(self) -> None:
        spec = _make_minimal_spec()
        spec.review_flags = [
            ReviewFlag(
                id="flag-a",
                decision_point="Which auth?",
                concern="Could break",
                options=["a", "b"],
                reasoning="Unclear from docs",
                status=ReviewStatus.PENDING,
            ),
            ReviewFlag(
                id="flag-b",
                decision_point="Batch size?",
                concern="Performance",
                options=["100", "1000"],
                reasoning="Not documented",
                status=ReviewStatus.APPROVED,
                human_decision="1000",
            ),
        ]
        pending = spec.pending_flags()
        assert len(pending) == 1
        assert pending[0].id == "flag-a"

    def test_is_review_complete_with_no_flags(self) -> None:
        spec = _make_minimal_spec()
        assert spec.is_review_complete()

    def test_is_review_complete_with_pending(self) -> None:
        spec = _make_minimal_spec()
        spec.review_flags = [
            ReviewFlag(
                id="pending-flag",
                decision_point="Question",
                concern="Risk",
                options=["x", "y"],
                reasoning="Unclear",
            )
        ]
        assert not spec.is_review_complete()

    def test_flag_by_id(self) -> None:
        spec = _make_minimal_spec()
        flag = ReviewFlag(
            id="my-flag",
            decision_point="Q",
            concern="C",
            options=["a"],
            reasoning="R",
        )
        spec.review_flags = [flag]
        assert spec.flag_by_id("my-flag") is flag
        assert spec.flag_by_id("nonexistent") is None

    def test_confidence_bounds(self) -> None:
        with pytest.raises(Exception):
            AuthConfig(
                method=AuthMethod.BEARER_TOKEN,
                token_param="token",
                placement=TokenPlacement.HEADER,
                confidence=1.5,  # > 1.0, should fail
            )

    def test_field_mapping_with_transformations(self) -> None:
        fm = FieldMapping(
            source_field="email",
            target_field="em",
            required=True,
            data_type="string",
            transformations=[Transformation.LOWERCASE, Transformation.STRIP_WHITESPACE, Transformation.SHA256_HASH],
            confidence=0.99,
        )
        assert len(fm.transformations) == 3
        assert fm.transformations[2] == Transformation.SHA256_HASH

    def test_batch_config_all_or_nothing(self) -> None:
        bc = BatchConfig(
            supported=True,
            max_batch_size=1000,
            payload_key="data",
            all_or_nothing=True,
            confidence=0.95,
        )
        assert bc.all_or_nothing is True


class TestReviewFlag:
    def test_default_status_is_pending(self) -> None:
        flag = ReviewFlag(
            id="test",
            decision_point="Which path?",
            concern="Wrong path = wrong data",
            options=["a", "b"],
            reasoning="Docs are ambiguous",
        )
        assert flag.status == ReviewStatus.PENDING
        assert flag.human_decision is None
