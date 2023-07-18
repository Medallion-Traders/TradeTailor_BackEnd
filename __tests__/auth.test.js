const httpMocks = require("node-mocks-http");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const verifyToken = require("../middleware/auth.js").default;

dotenv.config();

let req, res, next;
beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
});

describe("verifyToken middleware", () => {
    it("should call next if req.user exists", async () => {
        req.user = { id: "testUser" };

        await verifyToken(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    it("should return 403 if no authorization header is present", async () => {
        await verifyToken(req, res, next);

        expect(res._getStatusCode()).toBe(403);
        expect(JSON.parse(res._getData())).toEqual({ message: "Access Denied" });
    });

    it("should return 400 if token does not start with 'Bearer '", async () => {
        req.headers.authorization = "NotBearerToken";

        await verifyToken(req, res, next);

        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({ message: "Invalid Token" });
    });

    it("should return 401 if token has expired", async () => {
        const expiredToken = jwt.sign({ id: "testUser" }, process.env.JWT_SECRET, {
            expiresIn: "-1h",
        });
        req.headers.authorization = `Bearer ${expiredToken}`;

        await verifyToken(req, res, next);

        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData())).toEqual({ message: "Token Expired" });
    });

    it("should attach the verified user to req.user and call next for valid tokens", async () => {
        const validToken = jwt.sign({ id: "testUser" }, process.env.JWT_SECRET);
        req.headers.authorization = `Bearer ${validToken}`;

        await verifyToken(req, res, next);

        expect(req.user).toBeDefined();
        expect(req.user.id).toBe("testUser");
        expect(next).toHaveBeenCalledTimes(1);
    });

    it("should return 400 for invalid tokens", async () => {
        req.headers.authorization = "Bearer invalidToken";

        await verifyToken(req, res, next);

        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({ message: "Internal Server Error" });
    });
});
