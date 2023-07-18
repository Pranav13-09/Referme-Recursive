const express = require("express");
const app = express();
const User = require("./Models/userModal");
const sgMail = require("@sendgrid/mail");
const dotenv = require("dotenv");
dotenv.config();

sgMail.setApiKey(process.env.SG_MAIL_API_KEY);

app.use(express.json());

let count = 0;
let interval;

async function recursiveFunction(email) {
  try {
    const user = await User.findOne({ email: email });
    console.log(
      user.totalContactsBeforeUpload,
      "i am totalContacts before upload bro "
    );

    const {
      isUploadingContacts,
      totalContactsToUpload,
      totalContactsBeforeUpload,
    } = user;
    const currentContactsLength = user.contacts.length;
    console.log(
      isUploadingContacts,
      totalContactsToUpload,
      totalContactsBeforeUpload,
      currentContactsLength
    );
    if (
      currentContactsLength ==
        totalContactsBeforeUpload + totalContactsToUpload &&
      isUploadingContacts
    ) {
      console.log("i am here");
      user.pendingContactsToUpload = 0;
      user.isUploadingContacts = false;
      user.totalContactsBeforeUpload = 0;
      user.totalContactsToUpload = 0;

      await user.save();

      const msg = {
        to: `${user.email}`, // Change to your recipient
        from: {
          name: "ReferMe",
          email: "contact@referme.uk",
        }, // Change to your verified sender
        subject: `Your Contacts has been added Sucessfully`,
        html: `
                                      <!DOCTYPE html>
                                      <html>
                                      <head>
                                          <style>
                                          @media only screen and (max-width: 600px) {
                                              /* Add your mobile-specific styles here */
                                          }
                                          body {
                                              font-family: Arial, sans-serif;
                                              line-height: 1.5;
                                              margin: 0;
                                              padding: 0;
                                          }
                                          .container {
                                              max-width: 600px;
                                              margin: 0 auto;
                                              padding: 20px;
                                              background-color: #f9f9f9;
                                          }
                                          </style>
                                      </head>

                                      <body style="margin: 0; padding: 0">
                                          <table
                                          role="presentation"
                                          cellspacing="0"
                                          cellpadding="0"
                                          border="0"
                                          align="center"
                                          width="100%"
                                          class="container"
                                          style="max-width: 600px"
                                          >
                                          <tr>
                                              <td style="padding: 40px 30px 40px 30px">
                                              <table
                                                  role="presentation"
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                              >
                                                  <tr>
                                                  <td style="text-align: center">
                                                      <img
                                                      src="https://referme-user-images.s3.eu-west-2.amazonaws.com/final-logo.png"
                                                      alt="Company Logo"
                                                      width="200"
                                                      style="display: block; margin: 0 auto"
                                                      />
                                                  </td>
                                                  </tr>
                                                  <tr>
                                                  <td style="padding: 20px 0 30px 0; text-align: center">
                                                      <h1 style="font-size: 24px; margin: 0">Dear ${user.firstname},</h1>
                                                  </td>
                                                  </tr>
                                                  <tr>
                                                  <td style="font-size: 16px; line-height: 22px">
                                                      <p style="margin: 0 0 20px 0">
                                                      Your contacts from the CSV list have successfully been added to your contacts list.
                                                      Each contact now possesses a unique referral link that they can share with others, enabling them to provide you with referrals.
                                                          For an overview of your updated contacts, please proceed to the Contacts page.
                                                      </p>
                                                  </td>
                                                  </tr>
                                              </table>
                                              </td>
                                          </tr>
                                          </table>
                                      </body>
                                      </html>
                                      `,
      };

      try {
        await sgMail.send(msg);
        console.log("Email sent");

        console.log("Condition satisfied. Stopping recursive function.");
        clearInterval(interval);
        return;
      } catch (error) {
        console.error(error, "i am in the error of sending mail");

        return;
      }
    }

    count++;

    // Log the arguments and count
    console.log(`Recursive function executed ${count} times.`);

    // Call the recursive function again with the same arguments
  } catch (error) {
    // Handle any errors that occur during the execution of the function
    console.error("Error in recursiveFunction:", error);
  }
}

app.post("/checkCondition", async (req, res) => {
  console.log(req.body, "i am body");
  const { email } = req.body;
  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (user.isUploadingContacts == false) {
    return res
      .status(400)
      .json({ message: "User is not uploading any contacts" });
  }
  interval = setInterval(async () => {
    await recursiveFunction(email);
  }, 5000);

  res.status(200).json({ message: "Recursive function started." });
});

module.exports = app;
