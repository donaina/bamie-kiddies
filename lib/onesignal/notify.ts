interface NotifyAdminParams {
  title: string
  body: string
  url?: string
}

export async function notifyAdmin({ title, body, url }: NotifyAdminParams) {
  if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) {
    console.warn('[OneSignal] Missing env vars, skipping push notification')
    return
  }

  try {
    const payload: Record<string, unknown> = {
      app_id:             process.env.ONESIGNAL_APP_ID,
      included_segments:  ['All'],   // send to all subscribed admin devices
      headings:           { en: title },
      contents:           { en: body },
    }
    if (url) payload.url = url

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[OneSignal] Push failed:', err)
    }
  } catch (error) {
    // Non-critical — don't throw, just log
    console.error('[OneSignal] Error sending push:', error)
  }
}
