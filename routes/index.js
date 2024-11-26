// routes/index.js

import dotenv from "dotenv";
dotenv.config(); // Load environment variables at the very top

import { Router } from "express";
import axios from "axios"; // Import axios for HTTP requests

const router = Router();

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid"; // Import nanoid

// Initialize DynamoDB Document Client
console.log("AWS_REGION:", process.env.AWS_REGION);
console.log(
  "AWS_ACCESS_KEY_ID exists:",
  process.env.AWS_ACCESS_KEY_ID ? "Yes" : "No"
);
console.log(
  "AWS_SECRET_ACCESS_KEY exists:",
  process.env.AWS_SECRET_ACCESS_KEY ? "Yes" : "No"
);

const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const ddbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);

// Function to generate LeadID
function generateLeadId(companyName, fullName) {
  let prefix = "";

  if (companyName && companyName.trim() !== "") {
    // Use first three letters of the company name
    prefix = companyName
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 3)
      .toUpperCase();
  } else {
    // Use first three letters of the first name
    prefix = fullName
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 3)
      .toUpperCase();
  }

  // If prefix has less than 3 characters, duplicate the last character
  if (prefix.length < 3) {
    const lastChar = prefix.charAt(prefix.length - 1) || "X";
    while (prefix.length < 3) {
      prefix += lastChar;
    }
  }

  // Generate a short random string
  const randomId = nanoid(6); // Adjust the length as needed

  // Combine to form the LeadID
  return `${prefix}-${randomId}`;
}

// View routes
router.get("/terms-and-conditions", (req, res) =>
  res.render("terms-and-conditions")
);
router.get("/", (req, res) => {
  res.render("index", { currentUrl: req.url });
});
router.get("/privacy", (req, res) => res.render("privacy"));
router.get("/solutions", (req, res) => res.render("solutions"));
router.get("/dashboard", (req, res) => res.render("dashboard"));
router.get("/contact", (req, res) => res.render("contact"));
router.get("/bookings", (req, res) => res.render("bookings"));
router.get("/test", (req, res) => res.render("test"));

// Logout route
router.get("/logout", (req, res) => {
  // Logic to handle logout
  // Destroy the session and redirect to home or login
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/dashboard");
    }
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

// POST contact form submission
router.post("/contact", async (req, res) => {
  try {
    console.log("Received contact form submission:", req.body);

    // Extract and validate form data
    const {
      fullName,
      /* lastName, */
      emailAddress,
      phoneNumber,
      companyName,
      optIn,
      consentGiven,
      /*       preferredContactMethod,
      levelOfInterest, */
      subject,
      message,
      "g-recaptcha-response": recaptchaToken, // Extract reCAPTCHA token
    } = req.body;

    // Validate reCAPTCHA token
    if (!recaptchaToken) {
      console.error("Validation error: Missing reCAPTCHA token.");
      return res.status(400).send("Please complete the reCAPTCHA validation.");
    }

    const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;

    // Verify the reCAPTCHA token with Google
    try {
      const recaptchaResponse = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify`,
        null,
        {
          params: {
            secret: recaptchaSecretKey,
            response: recaptchaToken,
          },
        }
      );

      console.log("reCAPTCHA Response:", recaptchaResponse.data); // Debugging log to see the response from Google

      // Check if the reCAPTCHA verification was successful
      if (!recaptchaResponse.data.success) {
        console.error("Validation error: reCAPTCHA verification failed.");
        return res
          .status(400)
          .send("reCAPTCHA validation failed. Please try again.");
      }

      // Check if the score is below the threshold
      if (recaptchaResponse.data.score < 0.5) {
        console.error(
          `Validation error: reCAPTCHA score too low. Score: ${recaptchaResponse.data.score}`
        );
        return res
          .status(400)
          .send(
            "Your reCAPTCHA score is too low, indicating suspicious activity. Please try again."
          );
      }
    } catch (error) {
      console.error("Error verifying reCAPTCHA:", error);
      return res
        .status(500)
        .send("There was an error verifying reCAPTCHA. Please try again.");
    }

    // Validate required fields
    if (
      !fullName ||
      /* !lastName || */
      !emailAddress ||
      !consentGiven ||
      !subject ||
      !message
    ) {
      console.error("Validation error: Missing required fields.");
      return res.status(400).send("Please fill in all required fields.");
    }

    // If company name is not provided, use first and last name
    const companyNameFinal =
      companyName && companyName.trim() !== "" ? companyName : `${fullName}`;

    // Extract email domain
    const emailDomain = emailAddress.toLowerCase().split("@")[1] || "none";
    console.log("Email domain:", emailDomain);

    // Determine CompanyDomain
    let companyDomain = "none";
    if (
      emailDomain &&
      !["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"].includes(
        emailDomain
      )
    ) {
      companyDomain = emailDomain;
    }

    // Generate LeadID and DateCreated
    const leadId = generateLeadId(companyNameFinal, fullName);
    const dateCreated = new Date().toISOString();

    // Construct the item
    const item = {
      PK: leadId,
      SK: dateCreated,
      LeadID: leadId,
      DateCreated: dateCreated,
      EmailAddress: emailAddress.toLowerCase(),
      Completed: false, // Default to false upon creation
      CompanyDomain: companyDomain,
      CompanyName: companyNameFinal,
      FullName: fullName,
      /* LastName: lastName, */
      PhoneNumber: phoneNumber || "",
      OptIn: optIn === "on",
      ConsentGiven: consentGiven === "on",
      /*       PreferredContactMethod: preferredContactMethod || "",
      LevelOfInterest: levelOfInterest || "", */
      Messages: [
        {
          Subject: subject,
          Message: message,
          DateSubmitted: dateCreated,
        },
      ],
    };

    // GSI1 Attributes for querying by EmailAddress
    item.GSI1PK = emailAddress.toLowerCase();
    item.GSI1SK = dateCreated;

    // GSI2 Attributes for querying by Completed status with improved cardinality
    item.CompletedStatus = `COMPLETED#${item.Completed}`; // 'COMPLETED#true' or 'COMPLETED#false'
    item.GSI2PK = item.CompletedStatus;
    item.GSI2SK = dateCreated;

    console.log("Item to be inserted into DynamoDB:", item);

    // Put the item into DynamoDB
    const params = {
      TableName: "LeadsTable",
      Item: item,
    };

    await ddbDocClient.send(new PutCommand(params));

    console.log("Item successfully inserted into DynamoDB.");

    // Redirect to success page
    res.redirect("/contact-success");
  } catch (error) {
    console.error("Error submitting contact form:", error);
    res
      .status(500)
      .render("500", { error: "An error occurred. Please try again later." });
  }
});

// GET contact success page
router.get("/contact-success", (req, res) => res.render("contact-success"));

// NEW ROUTE: Get user's country based on IP address
router.get("/get-country", async (req, res) => {
  try {
    const response = await axios.get(
      `https://ipinfo.io/json?token=${process.env.IPINFO_TOKEN}`
    );
    const countryCode =
      response.data && response.data.country ? response.data.country : "US";
    res.json({ countryCode });
  } catch (error) {
    console.error("Error fetching country code:", error);
    res.json({ countryCode: "US" }); // Default to US if there's an error
  }
});

export default router;
