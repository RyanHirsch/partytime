import { timeToSeconds } from "../shared";

describe("Shared Parsing Utils", () => {
  describe("timeToSeconds", () => {
    it("handles simple seconds", () => {
      const singleDigit = timeToSeconds("9");
      expect(singleDigit).toEqual(9);

      const leadingZero = timeToSeconds("03");
      expect(leadingZero).toEqual(3);

      const doubleDigit = timeToSeconds("03");
      expect(doubleDigit).toEqual(3);
    });

    it("defaults to 30 minutes on invalid input", () => {
      const halfHour = 30 * 60;
      expect(timeToSeconds("hello")).toEqual(halfHour);
    });

    it("defaults to zero on empty string", () => {
      expect(timeToSeconds("")).toEqual(0);
    });

    it("converts minutes correctly", () => {
      expect(timeToSeconds("01:00")).toEqual(60);
      expect(timeToSeconds("1:00")).toEqual(60);
      expect(timeToSeconds("1:01")).toEqual(61);
      expect(timeToSeconds("11:00")).toEqual(660);
    });

    it("converts hours correctly", () => {
      expect(timeToSeconds("1:01:00")).toEqual(3660);
      expect(timeToSeconds("1:1:01")).toEqual(3661);
      expect(timeToSeconds("1:11:00")).toEqual(4260);
    });
  });
});
