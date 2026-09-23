import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createContract } from '../../../../lib/contracts';

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, recipientName, recipientEmail, contractData } = body;

    if (!type || !recipientName || !recipientEmail) {
      return NextResponse.json({ error: 'Missing required fields: type, recipientName, recipientEmail' }, { status: 400 });
    }
    if (!['tutor', 'tutor-student', 'student'].includes(type)) {
      return NextResponse.json({ error: 'type must be "tutor", "tutor-student", or "student"' }, { status: 400 });
    }

    const token = await createContract({ type, recipientName, recipientEmail, contractData });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://studycore-recovery-gameplan.vercel.app';
    const signingUrl = `${appUrl}/contracts/sign/${token}`;

    let subjectLine, emailBody;
    if (type === 'student') {
      subjectLine = 'Action Required: Sign Your StudyCore Services Agreement';
      emailBody = buildStudentEmail({ recipientName, studentName: contractData?.studentName, signingUrl });
    } else if (type === 'tutor-student') {
      subjectLine = `Action Required: Sign Your Student Assignment Agreement — ${contractData?.studentName || 'New Student'}`;
      emailBody = buildTutorStudentEmail({ recipientName, studentName: contractData?.studentName, signingUrl });
    } else {
      subjectLine = 'Action Required: Sign Your StudyCore Tutor Agreement';
      emailBody = buildTutorEmail({ recipientName, signingUrl });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@studycore.net',
      to: recipientEmail,
      subject: subjectLine,
      html: emailBody,
    });

    return NextResponse.json({ success: true, token });
  } catch (err) {
    console.error('contracts/send error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function buildTutorEmail({ recipientName, signingUrl }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
      <div style="background: #0f172a; padding: 24px 32px; border-radius: 8px 8px 0 0;">
        <p style="color: #fff; font-size: 20px; font-weight: bold; margin: 0;">StudyCore LLC</p>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px;">Hi ${recipientName},</p>
        <p>Welcome to StudyCore! Before you begin tutoring, please review and sign your Tutor Services Agreement.</p>
        <p>This agreement covers your role as an independent contractor, compensation, session expectations, and our student commitment policy.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${signingUrl}" style="background: #0f172a; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: bold;">
            Review & Sign Agreement
          </a>
        </div>
        <p style="font-size: 13px; color: #666;">If you have any questions, reply to this email or contact us at <a href="mailto:support@studycore.net">support@studycore.net</a>.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #999; margin: 0;">StudyCore LLC · San Ramon, California · studycore.net</p>
      </div>
    </div>
  `;
}

function buildTutorStudentEmail({ recipientName, studentName, signingUrl }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
      <div style="background: #0f172a; padding: 24px 32px; border-radius: 8px 8px 0 0;">
        <p style="color: #fff; font-size: 20px; font-weight: bold; margin: 0;">StudyCore LLC</p>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px;">Hi ${recipientName},</p>
        <p>You have been assigned to work with <strong>${studentName || 'a new student'}</strong>. Before sessions begin, please review and sign the Tutor-Student Assignment Agreement.</p>
        <p>This agreement covers your commitment to see this student through the full program, session schedule, and consequences for early departure. <strong>Please read Section 3 (Early Departure Consequences) carefully before signing.</strong></p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${signingUrl}" style="background: #0f172a; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: bold;">
            Review & Sign Assignment Agreement
          </a>
        </div>
        <p style="font-size: 13px; color: #666;">If you have any questions, reply to this email or contact us at <a href="mailto:support@studycore.net">support@studycore.net</a>.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #999; margin: 0;">StudyCore LLC · San Ramon, California · studycore.net</p>
      </div>
    </div>
  `;
}

function buildStudentEmail({ recipientName, studentName, signingUrl }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
      <div style="background: #0f172a; padding: 24px 32px; border-radius: 8px 8px 0 0;">
        <p style="color: #fff; font-size: 20px; font-weight: bold; margin: 0;">StudyCore LLC</p>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px;">Hi ${recipientName},</p>
        <p>Thank you for enrolling ${studentName || 'your student'} in StudyCore's SAT tutoring program.</p>
        <p>Please review and sign the SAT Tutoring Services Agreement to officially begin the program. This agreement outlines the program details, schedule, payment terms, and performance guarantee.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${signingUrl}" style="background: #0f172a; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: bold;">
            Review & Sign Agreement
          </a>
        </div>
        <p style="font-size: 13px; color: #666;">If you have any questions, reply to this email or contact us at <a href="mailto:support@studycore.net">support@studycore.net</a>.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #999; margin: 0;">StudyCore LLC · San Ramon, California · studycore.net</p>
      </div>
    </div>
  `;
}
