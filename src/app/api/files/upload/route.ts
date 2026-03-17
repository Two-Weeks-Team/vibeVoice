import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

const MINIMAX_URL = 'https://api.minimax.io/v1/files/upload';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const purpose = formData.get('purpose') as string;

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    if (!purpose || !['voice_clone', 'prompt_audio'].includes(purpose)) {
      return NextResponse.json({ error: 'Purpose must be voice_clone or prompt_audio' }, { status: 400 });
    }

    const uploadForm = new FormData();
    uploadForm.append('file', file);
    uploadForm.append('purpose', purpose);

    const res = await fetch(MINIMAX_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: uploadForm,
    });
    const data = await res.json();

    const baseResp = data.base_resp;
    if (!baseResp || baseResp.status_code !== 0) {
      return NextResponse.json(
        { error: baseResp?.status_msg ?? 'File upload failed' },
        { status: 500 }
      );
    }

    if (!data.file?.file_id) {
      return NextResponse.json({ error: 'No file ID returned' }, { status: 500 });
    }

    return NextResponse.json({
      fileId: data.file.file_id,
      filename: data.file.filename,
      bytes: data.file.bytes,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 502 });
  }
}
