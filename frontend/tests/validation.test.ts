import { describe, expect, it } from "vitest";
import { courseBasicSchema } from "@/lib/validation";

describe("courseBasicSchema", () => {
  it("accepts a valid theory course", () => {
    expect(courseBasicSchema.parse({
      code: "CS301",
      title: "Data Structures",
      course_type: "THEORY",
      lecture_hours: 3,
      tutorial_hours: 1,
      practical_hours: 0,
      credits: 4,
      internal_marks: 40,
      external_marks: 60,
      objectives: "Learn data structures"
    }).code).toBe("CS301");
  });
});
