const convertUnixToLocaleString = require("../../utils/timeConverter.js").default;

describe("convertUnixToLocaleString", () => {
    it("should convert UNIX timestamp to UTC string correctly", () => {
        const timestamp = 1626800400; // corresponds to 2021-07-20 17:00:00 UTC
        const result = convertUnixToLocaleString(timestamp);

        // should convert correctly
        expect(result).toEqual("2021-07-20 17:00:00");
    });

    it("should pad single-digit date and time components with a leading zero", () => {
        const timestamp = 1633331466; // corresponds to 2021-10-04 07:11:06 UTC
        const result = convertUnixToLocaleString(timestamp);

        // should pad correctly
        expect(result).toEqual("2021-10-04 07:11:06");
    });
});
