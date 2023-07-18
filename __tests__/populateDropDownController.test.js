const axios = require("axios");
const dotenv = require("dotenv");
const CompaniesController = require("../controllers/populateDropDownController.js").default;

jest.mock("axios");
jest.mock("csvtojson", () => {
    return () => {
        return {
            fromString: jest.fn().mockImplementation(() =>
                Promise.resolve([
                    { symbol: "symbol1", name: "name1", status: "Active" },
                    { symbol: "symbol2", name: "name2", status: "Active" },
                ])
            ),
        };
    };
});

dotenv.config();

describe("populateDropDownFunction", () => {
    const mockRequest = {};
    const mockResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    let companiesController;

    beforeEach(() => {
        jest.clearAllMocks();
        companiesController = new CompaniesController();
    });

    it("returns a 200 status and correct companies when cache is populated", async () => {
        const res = mockResponse();
        const mockCompaniesData = "symbol,name\nsymbol1,name1\nsymbol2,name2";
        const companies = [
            { symbol: "symbol1", name: "name1" },
            { symbol: "symbol2", name: "name2" },
        ];

        axios.get.mockResolvedValueOnce({ data: mockCompaniesData });

        await companiesController.populateDropDownFunction(mockRequest, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(companies);
    });

    it("calls fetchCompanies if cache is not populated", async () => {
        const res = mockResponse();
        axios.get.mockResolvedValueOnce({ data: "csvString" });

        await companiesController.populateDropDownFunction(mockRequest, res);

        expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it("handles error in fetchCompanies", async () => {
        const res = mockResponse();
        const error = new Error("error");
        axios.get.mockRejectedValueOnce(error);

        await companiesController.populateDropDownFunction(mockRequest, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });

    it("does not re-fetch companies data when called more than once in a day", async () => {
        const res1 = mockResponse();
        axios.get.mockResolvedValueOnce({ data: "csvString" });
        await companiesController.populateDropDownFunction(mockRequest, res1);

        const res2 = mockResponse();
        await companiesController.populateDropDownFunction(mockRequest, res2);

        expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it("re-fetches companies data after a day has passed", async () => {
        const res1 = mockResponse();
        axios.get.mockResolvedValueOnce({
            data: "csvString",
        });

        // Set initial time
        Date.now = jest.fn(() => 1625100000000);
        await companiesController.populateDropDownFunction(mockRequest, res1);

        // Simulate a day passing
        Date.now = jest.fn(() => 1625186400000);

        const res2 = mockResponse();
        axios.get.mockResolvedValueOnce({
            data: "csvString",
        });
        await companiesController.populateDropDownFunction(mockRequest, res2);

        expect(axios.get).toHaveBeenCalledTimes(2);
    });
});
