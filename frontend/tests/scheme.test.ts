import { describe, expect, it } from "vitest";
import {
  VERTICAL_SUBVERTICALS,
  STUDY_YEAR_MARKER,
  SEMESTER_PAIR,
  PAIR_SEMESTERS,
} from "@/types/scheme";

describe("Scheme authoring constants and mappings", () => {
  it("maps verticals to correct sub-verticals", () => {
    expect(VERTICAL_SUBVERTICALS.BSESC).toEqual(["BSC", "ESC"]);
    expect(VERTICAL_SUBVERTICALS.PCPEC).toEqual(["PCC", "PEC"]);
    expect(VERTICAL_SUBVERTICALS.MDC).toEqual(["MDM", "OE"]);
    expect(VERTICAL_SUBVERTICALS.SC).toEqual(["VSEC"]);
    expect(VERTICAL_SUBVERTICALS.HSSM).toEqual(["AEC", "EEMC", "IKS", "VEC"]);
    expect(VERTICAL_SUBVERTICALS.EL).toEqual(["RM", "CEFP", "PRJ", "INT"]);
    expect(VERTICAL_SUBVERTICALS.LLC).toEqual(["CC"]);
    expect(VERTICAL_SUBVERTICALS.BC).toEqual([]);
  });

  it("maps semester numbers to study year markers", () => {
    expect(STUDY_YEAR_MARKER[1]).toBe("11");
    expect(STUDY_YEAR_MARKER[2]).toBe("11");
    expect(STUDY_YEAR_MARKER[3]).toBe("12");
    expect(STUDY_YEAR_MARKER[4]).toBe("12");
    expect(STUDY_YEAR_MARKER[5]).toBe("13");
    expect(STUDY_YEAR_MARKER[6]).toBe("13");
    expect(STUDY_YEAR_MARKER[7]).toBe("14");
    expect(STUDY_YEAR_MARKER[8]).toBe("14");
  });

  it("maps semester numbers to cohort pairs and back", () => {
    expect(SEMESTER_PAIR[1]).toBe("FE");
    expect(SEMESTER_PAIR[2]).toBe("FE");
    expect(SEMESTER_PAIR[3]).toBe("SE");
    expect(SEMESTER_PAIR[4]).toBe("SE");
    expect(SEMESTER_PAIR[5]).toBe("TE");
    expect(SEMESTER_PAIR[6]).toBe("TE");
    expect(SEMESTER_PAIR[7]).toBe("BE");
    expect(SEMESTER_PAIR[8]).toBe("BE");

    expect(PAIR_SEMESTERS.FE).toEqual([1, 2]);
    expect(PAIR_SEMESTERS.SE).toEqual([3, 4]);
    expect(PAIR_SEMESTERS.TE).toEqual([5, 6]);
    expect(PAIR_SEMESTERS.BE).toEqual([7, 8]);
  });
});
