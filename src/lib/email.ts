import Mailgun from 'mailgun.js'
import FormData from 'form-data'

const getMailgunClient = () => {
  if (!process.env.MAILGUN_API_KEY) {
    throw new Error('MAILGUN_API_KEY environment variable is required')
  }
  
  const mailgun = new Mailgun(FormData)
  return mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY,
    url: process.env.MAILGUN_URL || 'https://api.mailgun.net'
  })
}

export async function sendInvitationEmail(
  email: string,
  organizationName: string,
  inviterName: string,
  role: string,
  token: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/auth/signup?invitation=${token}`

  const emailData = {
    from: 'info@inandout.work',
    to: email,
    subject: `Invitation to join ${organizationName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1f2937; font-size: 28px; font-weight: bold; margin: 0;">
              You're invited to join ${organizationName}
            </h1>
          </div>
          
          <div style="margin-bottom: 24px;">
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
              Hello! ${inviterName} has invited you to join <strong>${organizationName}</strong> as a <strong>${role.toLowerCase()}</strong>.
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
              InAndOut is a time tracking application that helps teams manage their work hours and schedules efficiently.
            </p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${inviteUrl}" 
               style="display: inline-block; background: linear-gradient(45deg, #8b5cf6, #3b82f6); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
              Accept Invitation
            </a>
          </div>

          <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
              This invitation will expire in 7 days. If you can't click the button above, 
              copy and paste this link into your browser:
            </p>
            <p style="color: #3b82f6; font-size: 14px; margin: 8px 0 0 0; text-align: center; word-break: break-all;">
              ${inviteUrl}
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              This email was sent by InAndOut. If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
You're invited to join ${organizationName}

Hello! ${inviterName} has invited you to join ${organizationName} as a ${role.toLowerCase()}.

InAndOut is a time tracking application that helps teams manage their work hours and schedules efficiently.

Accept your invitation by visiting this link:
${inviteUrl}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.
    `
  }

  try {
    if (!process.env.MAILGUN_DOMAIN) {
      return { success: false, error: 'MAILGUN_DOMAIN not configured' }
    }

    const mg = getMailgunClient()
    const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, emailData)
    return { success: true, messageId: result.id }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

export async function sendScheduleReminderEmail(
  email: string,
  userName: string,
  shiftTitle: string,
  startTime: Date,
  endTime: Date,
  organizationName: string
) {
  const emailData = {
    from: 'info@inandout.work',
    to: email,
    subject: `Shift Reminder: ${shiftTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1f2937; font-size: 28px; font-weight: bold; margin: 0;">
              Shift Reminder
            </h1>
          </div>
          
          <div style="margin-bottom: 24px;">
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
              Hi ${userName},
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
              This is a reminder that you have an upcoming shift scheduled:
            </p>

            <div style="background: linear-gradient(45deg, #8b5cf6, #3b82f6); border-radius: 12px; padding: 24px; margin: 24px 0; color: white;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px;">${shiftTitle}</h2>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <p style="margin: 0; font-size: 16px; opacity: 0.9;">
                    ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                  <p style="margin: 0; font-size: 14px; opacity: 0.8;">
                    Duration: ${Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) * 10) / 10} hours
                  </p>
                </div>
              </div>
            </div>

            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
              Organization: <strong>${organizationName}</strong>
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              This reminder was sent by InAndOut for ${organizationName}.
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
Shift Reminder

Hi ${userName},

This is a reminder that you have an upcoming shift scheduled:

${shiftTitle}
${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
Duration: ${Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) * 10) / 10} hours

Organization: ${organizationName}

This reminder was sent by InAndOut for ${organizationName}.
    `
  }

  try {
    if (!process.env.MAILGUN_DOMAIN) {
      return { success: false, error: 'MAILGUN_DOMAIN not configured' }
    }

    const mg = getMailgunClient()
    const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, emailData)
    return { success: true, messageId: result.id }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

export async function sendEmailVerificationEmail(
  email: string,
  verificationToken: string,
  userName: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const verificationUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`

  const emailData = {
    from: 'info@inandout.work',
    to: email,
    subject: 'Verify Your Email Address - InAndOut',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1f2937; font-size: 28px; font-weight: bold; margin: 0;">
              Verify Your Email Address
            </h1>
          </div>
          
          <div style="margin-bottom: 24px;">
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
              Hi ${userName},
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
              Thanks for signing up for InAndOut! To complete your registration and start using your account, please verify your email address.
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
              Click the button below to verify your email:
            </p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; background: linear-gradient(45deg, #10b981, #059669); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
              Verify Email Address
            </a>
          </div>

          <div style="background: #ecfdf5; border-left: 4px solid #10b981; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #047857; font-size: 14px; margin: 0; font-weight: 500;">
              ✅ Almost There!
            </p>
            <p style="color: #047857; font-size: 14px; margin: 8px 0 0 0;">
              Once verified, you'll have full access to all InAndOut features including time tracking, team management, and reporting.
            </p>
          </div>

          <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
              If you can't click the button above, copy and paste this link into your browser:
            </p>
            <p style="color: #3b82f6; font-size: 14px; margin: 8px 0 0 0; text-align: center; word-break: break-all;">
              ${verificationUrl}
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              This verification link will expire in 24 hours. If you didn't create an InAndOut account, you can safely ignore this email.
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
Verify Your Email Address

Hi ${userName},

Thanks for signing up for InAndOut! To complete your registration and start using your account, please verify your email address.

Click this link to verify your email:
${verificationUrl}

Once verified, you'll have full access to all InAndOut features including time tracking, team management, and reporting.

This verification link will expire in 24 hours.

If you didn't create an InAndOut account, you can safely ignore this email.

This email was sent by InAndOut.
    `
  }

  try {
    if (!process.env.MAILGUN_DOMAIN) {
      return { success: false, error: 'MAILGUN_DOMAIN not configured' }
    }

    const mg = getMailgunClient()
    const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, emailData)
    return { success: true, messageId: result.id }
  } catch (error) {
    console.error('Email verification send error:', error)
    return { success: false, error }
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`

  const emailData = {
    from: 'info@inandout.work',
    to: email,
    subject: 'Reset Your Password - InAndOut',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1f2937; font-size: 28px; font-weight: bold; margin: 0;">
              Reset Your Password
            </h1>
          </div>
          
          <div style="margin-bottom: 24px;">
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
              Hi ${userName},
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
              We received a request to reset your password for your InAndOut account.
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
              Click the button below to create a new password:
            </p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background: linear-gradient(45deg, #dc2626, #ef4444); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
              Reset Password
            </a>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">
              ⚠️ Security Notice
            </p>
            <p style="color: #92400e; font-size: 14px; margin: 8px 0 0 0;">
              This reset link will expire in 1 hour for security reasons. If you didn't request this password reset, please ignore this email.
            </p>
          </div>

          <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
              If you can't click the button above, copy and paste this link into your browser:
            </p>
            <p style="color: #3b82f6; font-size: 14px; margin: 8px 0 0 0; text-align: center; word-break: break-all;">
              ${resetUrl}
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              This email was sent by InAndOut. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
Reset Your Password

Hi ${userName},

We received a request to reset your password for your InAndOut account.

Click this link to create a new password:
${resetUrl}

This reset link will expire in 1 hour for security reasons.

If you didn't request this password reset, you can safely ignore this email.

This email was sent by InAndOut.
    `
  }

  try {
    if (!process.env.MAILGUN_DOMAIN) {
      return { success: false, error: 'MAILGUN_DOMAIN not configured' }
    }

    const mg = getMailgunClient()
    const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, emailData)
    return { success: true, messageId: result.id }
  } catch (error) {
    console.error('Password reset email send error:', error)
    return { success: false, error }
  }
}