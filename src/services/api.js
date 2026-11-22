/**
 * API Service for communicating with FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return { status: 'offline', error: err.message, model_loaded: false };
  }
}

export async function getSupportedClasses() {
  const res = await fetch(`${API_BASE_URL}/api/classes`);
  if (!res.ok) throw new Error('Failed to fetch class metadata');
  return await res.json();
}

export async function getSampleImages() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sample-images`);
    if (!res.ok) return { samples: [] };
    return await res.json();
  } catch {
    return { samples: [] };
  }
}

export async function predictSkinLesion(fileOrBlob, generateGradCAM = true) {
  const formData = new FormData();
  formData.append('file', fileOrBlob);

  const res = await fetch(`${API_BASE_URL}/api/predict?gradcam=${generateGradCAM}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    let errMsg = 'Prediction failed';
    try {
      const errData = await res.json();
      errMsg = errData.detail || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  return await res.json();
}

export async function downloadPdfReport(inferenceResult) {
  const res = await fetch(`${API_BASE_URL}/api/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inferenceResult),
  });

  if (!res.ok) {
    throw new Error('Failed to generate PDF report');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Skin_Lesion_Report_${inferenceResult?.predicted_class?.code?.toUpperCase() || 'Report'}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
