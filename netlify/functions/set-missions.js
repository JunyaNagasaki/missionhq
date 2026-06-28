const GAS_URL = 'https://script.google.com/macros/s/AKfycbzIKClwERGtKW1ujRSyc1iVROJvN3HvwNrv0Vo58M4AuL5tSQYGPBHsTwb2DGpITAQ/exec';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { date, missions } = body;

    if (!date || !missions || !Array.isArray(missions)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'date と missions が必要です' }) };
    }

    const gasRes = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'saveMissionDef', date, missions })
    });

    const result = await gasRes.json();
    return { statusCode: 200, headers, body: JSON.stringify(result) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
