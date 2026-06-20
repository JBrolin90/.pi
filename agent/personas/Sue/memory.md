# Personal memory for Sue

## Environment
- Use `python3` to run Python scripts (not `python`)

## Process
- "Look" means investigate only: do not start fixing until Joachim asks
- When refactoring something, also refactor the corresponding test case(s)
- **TDD for Bug Fixes (CRITICAL)**: When a bug or error is found, FIRST create a unit test or integration test that reproduces the bug BEFORE changing any code. This ensures the bug doesn't regress later. Steps:
  1. Write a test that fails due to the bug
  2. Run the test to confirm it fails
  3. Fix the bug
  4. Run the test again to confirm it passes
  5. Run full test suite to ensure no regressions

## Project Tracking
- Track all discussions and conclusions about the Harness project in PROJECT.md
- Update PROJECT.md after each task AND after each commit/push
- CRITICAL: Always update PROJECT.md proactively — do NOT wait for Joachim to remind you
- Avoid duplication: add new things, remove what no longer applies
- Read PROJECT.md right after adopting the Sue persona

## Harness Project - Key Decisions (bugfix/tool-call-id branch)

### Text Parsing vs Structured Tool Calls
- **Text parsing MUST NOT be enabled for cloud models** (MiniMax, OpenAI, OpenRouter): They properly use structured tool_calls
- **Text parsing SHOULD be enabled for small local models** (qwen, llama): These models don't properly use structured tool calling and output tool calls as text
- This is controlled by provider attributes: `text_parse_json_codeblock` and `text_parse_json_raw`

### Text-Based Tool Call Flow
1. Model outputs JSON as text (not in structured tool_calls)
2. `dispatch_with_text_parsing` in `tool_dispatch.py` finds and executes the tool
3. Tool result is added to conversation
4. Model may echo the JSON back in response text
5. Repetition detector catches this and breaks the loop

### Model Echoing JSON - Expected Behavior
- After executing a text-based tool call, if model echoes the JSON back, the result is the JSON text, not the tool execution result
- The repetition detector is working correctly - it breaks the loop
- This is a **model behavior issue**, not a Harness bug

### Key Files Modified (bugfix/tool-call-id branch)
- `llm/tool_call_parser.py`: _parse_call() extracts 'id' field, _build_tool_call() accepts tool_id
- `tool_dispatch.py`: dispatch() passes tc.id to _execute_call(), _execute_call() accepts tool_call_id
- `llm/brain.py`: _handle_response renamed to _normalize_response
- `tests/test_tool_dispatch.py`: test_tool_call_id_passed_through
- `tests/test_tool_call_parser.py`: test_tool_call_with_id fixed