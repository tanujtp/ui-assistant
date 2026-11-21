import { describe, expect, it } from "vitest";
import { MAX_STEPS, extractJsonObject, parseAnswer } from "../src/core/parse";

describe("extractJsonObject", () => {
  it("finds an object wrapped in prose and code fences", () => {
    expect(extractJsonObject('Sure!\n```json\n{"a": 1}\n```')).toBe('{"a": 1}');
  });

  it("ignores braces inside strings", () => {
    const json = '{"message": "use } and { carefully"}';
    expect(extractJsonObject(`x ${json} y`)).toBe(json);
  });

  it("returns null when there is no complete object", () => {
    expect(extractJsonObject('{"a": ')).toBeNull();
    expect(extractJsonObject("no json")).toBeNull();
  });
});

describe("parseAnswer", () => {
  it("parses a valid answer", () => {
    const answer = parseAnswer(
      '{"message":"Do this","steps":[{"target":"e1","title":"Click","instruction":"Press save"}]}',
    );
    expect(answer.message).toBe("Do this");
    expect(answer.steps).toEqual([{ target: "e1", title: "Click", instruction: "Press save" }]);
  });

  it("drops invalid steps and caps the step count", () => {
    const steps = Array.from({ length: 20 }, (_, i) => ({ instruction: `s${i}` }));
    const answer = parseAnswer(JSON.stringify({ message: "m", steps: [null, 5, {}, ...steps] }));
    expect(answer.steps).toHaveLength(MAX_STEPS);
    expect(answer.steps[0]?.title).toBe("Next step");
  });

  it("falls back to plain text for non-JSON output", () => {
    expect(parseAnswer("Just click Save.")).toEqual({ message: "Just click Save.", steps: [] });
  });

  it("never throws on empty or malformed input", () => {
    expect(parseAnswer("").message).toMatch(/couldn't/);
    expect(parseAnswer("{broken").steps).toEqual([]);
  });
});
