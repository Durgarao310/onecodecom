import nodemailer from 'nodemailer';
import { EMAIL, PASSWORD } from '@config';

class MailService {
  public mailer = nodemailer.createTransport({
    service: 'gamil',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: EMAIL, // generated ethereal user
      pass: PASSWORD, // generated ethereal password
    },
  });

  public otp(email: string, otp: number): Promise<any> {
    const result: any = this.mailer.sendMail({
      to: email, // Change to your recipient
      from: 'gantadurgarao304@gmail.com', // Change to your verified sender
      subject: 'OTP verification',
      text: `please use the below OTP to verify your account`,
      html: `
        <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
        <div style="margin:50px auto;width:70%;padding:20px 0">
            <p style="font-size:1.1em">Hi,</p>
            <p>Thank you for choosing nicetomeetyou. Use the following OTP to complete your Sign Up procedures. OTP is valid for 10 minute</p>
            <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
            <p style="font-size:0.9em;">Regards,<br />nicetomeetyou</p>
            </div>
        </div>
        </div>
        `,
    });
    return result;
  }
}

export default MailService;
