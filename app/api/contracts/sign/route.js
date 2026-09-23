import { NextResponse } from 'next/server';
import { getContractByToken, markContractSigned } from '../../../../lib/contracts';
import { generateTutorContractPdf } from '../../../../lib/pdf-tutor-contract';
import { generateTutorStudentContractPdf } from '../../../../lib/pdf-tutor-student-contract';
import { generateStudentContractPdf } from '../../../../lib/pdf-student-contract';
import { uploadPdfToDrive } from '../../../../lib/google-drive';

// GET /api/contracts/sign?token=xxx — fetch contract data for rendering
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    const contract = await getContractByToken(token);
    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    if (contract.status === 'signed') {
      return NextResponse.json({ alreadySigned: true, signedAt: contract.signed_at, signedName: contract.signed_name });
    }

    return NextResponse.json({
      type: contract.type,
      recipientName: contract.recipient_name,
      contractData: contract.contract_data,
    });
  } catch (err) {
    console.error('contracts/sign GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/contracts/sign — process a signature submission
export async function POST(req) {
  try {
    const { token, signedName } = await req.json();
    if (!token || !signedName?.trim()) {
      return NextResponse.json({ error: 'Missing token or signedName' }, { status: 400 });
    }

    const contract = await getContractByToken(token);
    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    if (contract.status === 'signed') {
      return NextResponse.json({ error: 'Contract already signed' }, { status: 409 });
    }

    const signedAt = new Date().toISOString();
    const pdfData = {
      ...contract.contract_data,
      signedName: signedName.trim(),
      signedAt,
    };

    // Generate signed PDF
    let pdfBuffer;
    if (contract.type === 'tutor') {
      pdfBuffer = await generateTutorContractPdf(pdfData);
    } else if (contract.type === 'tutor-student') {
      pdfBuffer = await generateTutorStudentContractPdf(pdfData);
    } else {
      pdfBuffer = await generateStudentContractPdf(pdfData);
    }

    // Upload to Google Drive
    const recipientSlug = contract.recipient_name.replace(/\s+/g, '-').toLowerCase();
    const dateSlug = new Date().toISOString().slice(0, 10);
    const fileName = `studycore-${contract.type}-contract-${recipientSlug}-${dateSlug}.pdf`;

    const { fileUrl } = await uploadPdfToDrive(pdfBuffer, fileName);

    // Mark as signed in Supabase
    await markContractSigned(token, { driveFileUrl: fileUrl, signedName: signedName.trim() });

    return NextResponse.json({ success: true, driveFileUrl: fileUrl });
  } catch (err) {
    console.error('contracts/sign POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
