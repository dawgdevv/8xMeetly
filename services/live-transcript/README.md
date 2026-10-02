# Live transcript WebSocket service

The Next.js app runs on Vercel, whose request handlers cannot accept the long-lived WebSocket connection Meeting BaaS uses for live transcript events. This small Node service can run directly on an always-on VPS; Docker is optional. It handles caption events, not meeting audio or video, so a 1 GB VPS is generally sufficient if it has memory available for the service.

## Run directly on a VPS (no Docker)

Use Node.js 22 or newer. Copy this directory to `/opt/8xmeetly-live-transcript`, install its production dependencies, and create a restricted environment file:

```sh
sudo useradd --system --home /opt/8xmeetly-live-transcript --shell /usr/sbin/nologin meetly 2>/dev/null || true
sudo mkdir -p /opt/8xmeetly-live-transcript
sudo cp package.json server.mjs /opt/8xmeetly-live-transcript/
cd /opt/8xmeetly-live-transcript
sudo npm install --omit=dev
sudo chown -R meetly:meetly /opt/8xmeetly-live-transcript
sudo install -o root -g meetly -m 0640 /dev/null /etc/8xmeetly-live-transcript.env
```

Put these values in `/etc/8xmeetly-live-transcript.env` (edit it as root; do not commit or expose it):

```text
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
MEETING_BAAS_STREAM_SECRET=<long-random-secret>
PORT=8080
BIND_ADDRESS=127.0.0.1
```

Create `/etc/systemd/system/8xmeetly-live-transcript.service`:

```ini
[Unit]
Description=8xMeetly live transcript receiver
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=meetly
Group=meetly
WorkingDirectory=/opt/8xmeetly-live-transcript
EnvironmentFile=/etc/8xmeetly-live-transcript.env
ExecStart=/usr/bin/node /opt/8xmeetly-live-transcript/server.mjs
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

If Node is installed somewhere other than `/usr/bin/node`, update `ExecStart` to the path returned by `command -v node`. Start the service:

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now 8xmeetly-live-transcript
sudo systemctl status 8xmeetly-live-transcript
```

Give the VPS a DNS name (for example `transcripts.example.com`) and proxy it with HTTPS/WSS using Caddy or Nginx. For Caddy, the site block can be:

```caddyfile
transcripts.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

Allow inbound ports 80 and 443 for TLS, and keep port 8080 private. Check `https://transcripts.example.com/healthz` returns `{"ok":true}` before connecting Meeting BaaS.

For troubleshooting, use `sudo journalctl -u 8xmeetly-live-transcript -f` to see connection and transcript event logs.

## GitHub Actions deployment

`.github/workflows/deploy-live-transcript.yml` checks the service JavaScript and deploys it whenever files under `services/live-transcript/` change on `main`. You can also start it manually from the repository’s Actions tab. It deploys over SSH, installs the service dependencies on the VPS, restarts systemd, and checks `/healthz`.

Prepare the VPS once using the direct Node/systemd steps above. Use a dedicated SSH deployment account that can write to `/opt/8xmeetly-live-transcript`; for example, create the directory with that account as owner and mode `0755`. Keep the running service under the separate `meetly` account. Grant the deployment account permission to restart only this service by creating `/etc/sudoers.d/8xmeetly-live-transcript-deploy` with the following line (replace `deploy` with the SSH account name):

```sudoers
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart 8xmeetly-live-transcript.service
```

Validate the sudoers file with `sudo visudo -cf /etc/sudoers.d/8xmeetly-live-transcript-deploy`. The deployment account needs Node.js 22+ and npm available in its non-interactive SSH `PATH`. Make sure `/opt/8xmeetly-live-transcript` and its installed files are readable by the `meetly` service account.

Add these Actions repository secrets under **Settings → Secrets and variables → Actions**:

- `VPS_HOST` — VPS IP address or hostname
- `VPS_USER` — SSH deployment account
- `VPS_SSH_KEY` — private key for that account
- `VPS_KNOWN_HOSTS` — verified `known_hosts` line for the VPS
- `VPS_SSH_PORT` — optional; defaults to `22`

Get the host key on a trusted machine with `ssh-keyscan -p <port> <host>` and verify its fingerprint against the VPS console before saving it as `VPS_KNOWN_HOSTS`. Never add Supabase or stream secrets to GitHub Actions; they stay in the VPS environment file.

## Configure the app

Set these environment variables on the service:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MEETING_BAAS_STREAM_SECRET` — a long random value used to protect the socket
- `PORT` — usually supplied by the host
- `BIND_ADDRESS` — optional; use `127.0.0.1` behind a local reverse proxy, or leave unset to bind all interfaces

The service exposes `/healthz` and accepts Meeting BaaS connections at `/transcripts?token=<MEETING_BAAS_STREAM_SECRET>`. It persists interim utterance revisions and finalized segments; the same rows are updated as the speaker continues. Configure the Vercel app with:

```text
MEETING_BAAS_STREAMING_URL=wss://<your-service-host>/transcripts?token=<URL-encoded-secret>
```

After setting that variable, redeploy the Vercel app and apply Supabase migration `0004_live_transcript_segment_keys.sql`. New bot requests then enable managed real-time transcription. The socket writes final utterances to `transcript_segments`; Supabase Realtime updates the open meeting page. The normal post-call artifact still runs and reconciles the final transcript.

Do not expose the Supabase service-role key or stream secret to browser code.
