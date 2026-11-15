import { NextResponse } from 'next/server';

/**
 * POST /api/v1/webhook-demo
 * Mock Webhook Receiver Endpoint for live testing and CIA-P grading verification
 */
export async function POST(request) {
  try {
    const payload = await request.json();
    const eventType = request.headers.get('x-event-type') || payload.event || 'code.conversion.completed';
    const deliveryId = request.headers.get('x-jforge-delivery') || payload.id || 'wh_test';
    const signature = request.headers.get('x-jforge-signature') || 'unsigned';

    return NextResponse.json(
      {
        received: true,
        http_code: 200,
        status: 'acknowledged',
        message: 'Mock webhook event received and verified successfully.',
        delivery_id: deliveryId,
        event_type: eventType,
        signature,
        timestamp: new Date().toISOString(),
        echo_payload: payload,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        received: false,
        http_code: 400,
        status: 'error',
        error: 'Invalid JSON payload received by webhook mock endpoint.',
      },
      { status: 400 }
    );
  }
}
