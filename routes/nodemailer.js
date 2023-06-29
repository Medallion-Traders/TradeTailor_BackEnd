//this will be implemented with gmail first as otherwise we need a registered domain name that costs 8 sgd per month, the message sent is generic
//will be interesting to render html based on filtering (gender based greeting etc)
//using Twilio SendGrid's v3 Node.js Library
//https://github.com/sendgrid/sendgrid-nodejs

import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const ngrokUrl = `${process.env.REACT_APP_SERVER_URL}`;

const sendEmail = async (newUser) => {
    const { email, emailToken } = newUser;
    const msg = {
        to: email,
        from: "hoegpt@gmail.com",
        templateId: "d-463d85e9fc9e45a9b5ec7207c07dac33",
        dynamic_template_data: {
            verificationUrl: `${ngrokUrl}/auth/verify-email?token=${emailToken}`,
        },
    };

    try {
        await sgMail.send(msg);
        console.log(`Email sent to ${email}`);
    } catch (error) {
        console.error(`Failed to send email: ${error}`);
    }
};

export default sendEmail;
