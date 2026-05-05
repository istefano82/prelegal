import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.chat_service import ChatService
from app.schemas import NDAContextSchema, LegalAnalysisResponse


@pytest.fixture
def chat_service(db_session: AsyncSession) -> ChatService:
    return ChatService(db_session)


class TestSanitizeFieldUpdates:
    """Test field sanitization for allow-list and enum validation."""

    def test_allows_valid_fields(self, chat_service: ChatService):
        """Valid fields should pass through."""
        updates = {
            "purpose": "To evaluate a merger",
            "effectiveDate": "2025-01-15",
            "governingLaw": "California",
        }
        result = chat_service._sanitize_field_updates(updates)
        assert result == updates

    def test_rejects_invalid_field_names(self, chat_service: ChatService):
        """Invalid field names should be filtered out."""
        updates = {
            "purpose": "Valid",
            "invalid_field": "Should be rejected",
            "another_bad_field": "Also rejected",
        }
        result = chat_service._sanitize_field_updates(updates)
        assert result == {"purpose": "Valid"}

    def test_rejects_non_string_values(self, chat_service: ChatService):
        """Non-string values should be filtered out."""
        updates = {
            "purpose": "Valid string",
            "party1Name": 123,  # Invalid: not a string
            "party1Email": None,  # Invalid: not a string
        }
        result = chat_service._sanitize_field_updates(updates)
        assert result == {"purpose": "Valid string"}

    def test_validates_mndaTerm_enum(self, chat_service: ChatService):
        """mndaTerm must be exactly '1year' or 'continues'."""
        valid_updates = {"mndaTerm": "1year"}
        result = chat_service._sanitize_field_updates(valid_updates)
        assert result == {"mndaTerm": "1year"}

        valid_updates = {"mndaTerm": "continues"}
        result = chat_service._sanitize_field_updates(valid_updates)
        assert result == {"mndaTerm": "continues"}

        invalid_updates = {"mndaTerm": "1 year"}  # Invalid format
        result = chat_service._sanitize_field_updates(invalid_updates)
        assert result == {}

    def test_validates_confidentialityTerm_enum(self, chat_service: ChatService):
        """confidentialityTerm must be exactly '1year' or 'perpetual'."""
        valid_updates = {"confidentialityTerm": "perpetual"}
        result = chat_service._sanitize_field_updates(valid_updates)
        assert result == {"confidentialityTerm": "perpetual"}

        valid_updates = {"confidentialityTerm": "1year"}
        result = chat_service._sanitize_field_updates(valid_updates)
        assert result == {"confidentialityTerm": "1year"}

        invalid_updates = {"confidentialityTerm": "in perpetuity"}  # Invalid format
        result = chat_service._sanitize_field_updates(invalid_updates)
        assert result == {}

    def test_returns_empty_dict_on_all_invalid(self, chat_service: ChatService):
        """Should return empty dict if no valid fields."""
        updates = {"bad1": "value", "bad2": 123}
        result = chat_service._sanitize_field_updates(updates)
        assert result == {}

    def test_mixed_valid_and_invalid(self, chat_service: ChatService):
        """Should keep valid, discard invalid."""
        updates = {
            "purpose": "Valid",
            "bad_field": "Invalid",
            "party1Name": "John Doe",
            "malformed": 999,
            "mndaTerm": "1year",
            "mndaTerm_bad": "1 year",
        }
        result = chat_service._sanitize_field_updates(updates)
        assert result == {
            "purpose": "Valid",
            "party1Name": "John Doe",
            "mndaTerm": "1year",
        }


class TestBuildSystemPrompt:
    """Test system prompt generation."""

    def test_base_prompt_without_context(self, chat_service: ChatService):
        """Should return base prompt when no context provided."""
        prompt = chat_service._build_system_prompt(None)
        assert "NDA creation assistant" in prompt
        assert "CRITICAL" in prompt
        assert "field_updates" in prompt
        assert all(
            field in prompt
            for field in [
                "purpose",
                "effectiveDate",
                "mndaTerm",
                "confidentialityTerm",
                "governingLaw",
                "jurisdiction",
            ]
        )

    def test_prompt_includes_all_18_fields(self, chat_service: ChatService):
        """System prompt should list all 18 NDA fields."""
        prompt = chat_service._build_system_prompt(None)

        required_fields = [
            "purpose",
            "effectiveDate",
            "mndaTerm",
            "confidentialityTerm",
            "governingLaw",
            "jurisdiction",
            "party1Name",
            "party1Title",
            "party1Company",
            "party1Address",
            "party1Email",
            "party1Date",
            "party2Name",
            "party2Title",
            "party2Company",
            "party2Address",
            "party2Email",
            "party2Date",
        ]

        for field in required_fields:
            assert field in prompt, f"Field '{field}' not in system prompt"

    def test_prompt_with_partial_context(self, chat_service: ChatService):
        """Should show context state with filled and unfilled fields."""
        context = NDAContextSchema(
            purpose="To evaluate a merger",
            effectiveDate="2025-01-15",
            governingLaw="California",
            jurisdiction=None,
            party1Company=None,
            party2Company=None,
        )
        prompt = chat_service._build_system_prompt(context)

        assert "To evaluate a merger" in prompt
        assert "2025-01-15" in prompt
        assert "California" in prompt
        assert "not yet provided" in prompt

    def test_prompt_with_full_context(self, chat_service: ChatService):
        """Should show all filled fields in context."""
        context = NDAContextSchema(
            purpose="To evaluate a merger",
            effectiveDate="2025-01-15",
            mndaTerm="1year",
            confidentialityTerm="perpetual",
            governingLaw="California",
            jurisdiction="San Francisco",
            party1Name="John Doe",
            party1Title="CEO",
            party1Company="Acme Corp",
            party1Address="123 Main St",
            party1Email="john@acme.com",
            party1Date="2025-02-01",
            party2Name="Jane Smith",
            party2Title="CFO",
            party2Company="TechCorp",
            party2Address="456 Oak Ave",
            party2Email="jane@techcorp.com",
            party2Date="2025-02-01",
        )
        prompt = chat_service._build_system_prompt(context)

        assert "John Doe" in prompt
        assert "Jane Smith" in prompt
        assert "Acme Corp" in prompt
        assert "TechCorp" in prompt
        assert "2025-01-15" in prompt

    def test_prompt_specifies_enum_constraints(self, chat_service: ChatService):
        """Prompt should explicitly state enum value constraints."""
        prompt = chat_service._build_system_prompt(None)
        assert "1year" in prompt
        assert "continues" in prompt
        assert "perpetual" in prompt


class TestLegalAnalysisResponseSchema:
    """Test LegalAnalysisResponse schema validation."""

    def test_minimal_valid_response(self):
        """Minimal response with required fields."""
        response = LegalAnalysisResponse(
            answer="Test answer",
            confidence="high",
        )
        assert response.answer == "Test answer"
        assert response.confidence == "high"
        assert response.field_updates == {}
        assert response.suggested_clauses == []
        assert response.warnings == []
        assert response.follow_up_questions == []

    def test_full_response_with_field_updates(self):
        """Response with all fields including field_updates."""
        response = LegalAnalysisResponse(
            answer="I'll set the purpose to: evaluate a merger",
            confidence="high",
            field_updates={"purpose": "Evaluate a merger"},
            suggested_clauses=["Add confidentiality clause"],
            warnings=["Consider non-compete"],
            follow_up_questions=["Who are the parties?"],
        )
        assert response.field_updates == {"purpose": "Evaluate a merger"}
        assert len(response.suggested_clauses) == 1
        assert len(response.warnings) == 1
        assert len(response.follow_up_questions) == 1

    def test_confidence_literal_validation(self):
        """confidence must be one of the literal values."""
        for confidence in ["high", "medium", "low"]:
            response = LegalAnalysisResponse(
                answer="Test",
                confidence=confidence,  # type: ignore
            )
            assert response.confidence == confidence

    def test_follow_up_questions_max_length(self):
        """follow_up_questions is limited to 3 items."""
        # Valid: 3 items
        response = LegalAnalysisResponse(
            answer="Test",
            confidence="high",
            follow_up_questions=["Q1", "Q2", "Q3"],
        )
        assert len(response.follow_up_questions) == 3


class TestNDAContextSchema:
    """Test NDAContextSchema validation."""

    def test_all_fields_optional(self):
        """All fields should be optional."""
        context = NDAContextSchema()
        assert context.purpose is None
        assert context.effectiveDate is None
        assert context.mndaTerm is None
        assert context.confidentialityTerm is None
        assert context.governingLaw is None
        assert context.jurisdiction is None
        assert context.party1Name is None

    def test_valid_with_all_fields(self):
        """Should accept all 18 fields."""
        context = NDAContextSchema(
            purpose="Test",
            effectiveDate="2025-01-15",
            mndaTerm="1year",
            confidentialityTerm="perpetual",
            governingLaw="California",
            jurisdiction="San Francisco",
            party1Name="John",
            party1Title="CEO",
            party1Company="Acme",
            party1Address="123 Main",
            party1Email="john@acme.com",
            party1Date="2025-02-01",
            party2Name="Jane",
            party2Title="CFO",
            party2Company="TechCorp",
            party2Address="456 Oak",
            party2Email="jane@tech.com",
            party2Date="2025-02-01",
        )
        assert context.purpose == "Test"
        assert context.party1Name == "John"
        assert context.party2Company == "TechCorp"

    def test_enum_validation(self):
        """Enum fields should validate literal values."""
        # Valid enums
        context = NDAContextSchema(
            mndaTerm="1year",
            confidentialityTerm="perpetual",
        )
        assert context.mndaTerm == "1year"
        assert context.confidentialityTerm == "perpetual"

        context = NDAContextSchema(
            mndaTerm="continues",
            confidentialityTerm="1year",
        )
        assert context.mndaTerm == "continues"
        assert context.confidentialityTerm == "1year"
