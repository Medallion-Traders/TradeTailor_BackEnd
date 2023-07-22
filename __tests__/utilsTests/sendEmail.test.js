import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
const sendEmail = require("../../utils/sendEmail.js").default;

jest.mock("@sendgrid/mail", () => {
    return {
        setApiKey: jest.fn(),
        send: jest.fn(),
    };
});

describe("sendEmail", () => {
    it("should call SendGrid's send function with correct parameters", async () => {
        const newUser = {
            email: "test@mail.com",
            emailToken: "123456",
        };
        const expectedMsg = {
            to: newUser.email,
            from: "hoegpt@gmail.com",
            templateId: "d-463d85e9fc9e45a9b5ec7207c07dac33",
            dynamic_template_data: {
                verificationUrl: `${process.env.REACT_APP_SERVER_URL}/auth/verify-email?token=${newUser.emailToken}`,
            },
        };

        await sendEmail(newUser);

        expect(sgMail.send).toHaveBeenCalledWith(expectedMsg);
        expect(sgMail.send).toHaveBeenCalledTimes(1);
    });

    it("should handle errors from sgMail.send correctly", async () => {
        const newTestError = new Error("Test error");
        sgMail.send.mockImplementationOnce(() => {
            throw newTestError;
        });

        const newUser = {
            email: "test@mail.com",
            emailToken: "123456",
        };

        // We need to spy on console.error to see if it's called correctly
        const consoleSpy = jest.spyOn(console, "error");
        consoleSpy.mockImplementation(() => {});

        await sendEmail(newUser);

        expect(consoleSpy).toHaveBeenCalledWith(`Failed to send email: ${newTestError}`);

        consoleSpy.mockRestore();
    });
});
