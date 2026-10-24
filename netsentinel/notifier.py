"""
NetSentinel Email Alert Dispatcher and SMTP Notification Engine.
Supports STARTTLS, SSL, authentication, diagnostic connectivity testing,
and structured incident alerting.
"""

import smtplib
import socket
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict, List, Optional


class EmailNotifier:
    """Dispatches security alert notifications and tests SMTP configuration."""

    @staticmethod
    def test_smtp_connection(config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates SMTP server reachability, TLS handshake, and credentials.
        Returns detailed diagnostic report.
        """
        host = config.get("smtp_host", "").strip()
        port = int(config.get("smtp_port", 587))
        encryption = config.get("encryption", "tls").lower().strip()
        user = config.get("smtp_user", "").strip()
        password = config.get("smtp_password", "")
        sender = config.get("sender_address", "").strip() or user or "alerts@netsentinel.local"
        recipients = config.get("recipient_addresses", "").strip() or user

        if not host:
            return {"success": False, "error": "SMTP server host is required"}

        diag_steps = []
        try:
            # 1. DNS & TCP Socket Reachability
            diag_steps.append(f"Resolving {host}:{port}...")
            sock = socket.create_connection((host, port), timeout=8)
            sock.close()
            diag_steps.append("TCP connection established successfully.")

            # 2. SMTP Handshake
            if encryption == "ssl":
                diag_steps.append("Initiating SMTPS (SSL) connection...")
                server = smtplib.SMTP_SSL(host, port, timeout=10)
            else:
                diag_steps.append("Initiating standard SMTP connection...")
                server = smtplib.SMTP(host, port, timeout=10)
                server.ehlo()
                if encryption == "tls":
                    diag_steps.append("Upgrading with STARTTLS...")
                    server.starttls()
                    server.ehlo()

            # 3. Authentication if credentials provided
            if user and password:
                diag_steps.append(f"Authenticating as {user}...")
                server.login(user, password)
                diag_steps.append("SMTP authentication succeeded.")

            # 4. Optional Send Test Email
            if recipients:
                diag_steps.append(f"Sending test notification message to {recipients}...")
                msg = MIMEMultipart("alternative")
                msg["Subject"] = "NetSentinel: SMTP Configuration Verified"
                msg["From"] = sender
                msg["To"] = recipients
                now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

                text_content = (
                    f"NetSentinel Network Security Intelligence\n"
                    f"SMTP alert notification delivery test successful!\n\n"
                    f"Timestamp: {now_str}\n"
                    f"Server Host: {host}:{port}\n"
                    f"Encryption: {encryption.upper()}\n"
                    f"Sender: {sender}\n\n"
                    f"This test confirms that NetSentinel can successfully deliver real-time security alerts to your inbox."
                )
                html_content = f"""
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 8px;">
                    <div style="border-bottom: 2px solid #06b6d4; padding-bottom: 12px; margin-bottom: 16px;">
                        <h2 style="color: #38bdf8; margin: 0; font-size: 20px;">🛡️ NetSentinel Security Notification</h2>
                        <span style="font-size: 12px; color: #94a3b8;">System Configuration Verification</span>
                    </div>
                    <p style="font-size: 14px; line-height: 1.6; color: #e2e8f0;">
                        Your SMTP email alert notification settings have been <strong>successfully verified</strong>.
                    </p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; color: #cbd5e1;">
                        <tr style="border-bottom: 1px solid #334155;">
                            <td style="padding: 8px 0; color: #94a3b8;">Timestamp:</td>
                            <td style="padding: 8px 0; font-family: monospace;">{now_str}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #334155;">
                            <td style="padding: 8px 0; color: #94a3b8;">SMTP Relay:</td>
                            <td style="padding: 8px 0; font-family: monospace;">{host}:{port} ({encryption.upper()})</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #334155;">
                            <td style="padding: 8px 0; color: #94a3b8;">Authorized Sender:</td>
                            <td style="padding: 8px 0; font-family: monospace;">{sender}</td>
                        </tr>
                    </table>
                    <div style="margin-top: 24px; padding: 12px; background-color: #1e293b; border-left: 4px solid #10b981; border-radius: 4px; font-size: 12px; color: #94a3b8;">
                        NetSentinel will now automatically dispatch incident alerts when rogue devices, open high-risk ports, DNS hijack attacks, or RAT trojans are uncovered.
                    </div>
                </div>
                """

                msg.attach(MIMEText(text_content, "plain"))
                msg.attach(MIMEText(html_content, "html"))

                to_addrs = [r.strip() for r in recipients.split(",") if r.strip()]
                server.sendmail(sender, to_addrs, msg.as_string())
                diag_steps.append("Test email dispatched and accepted by mail relay.")

            server.quit()
            return {
                "success": True,
                "message": f"SMTP handshake and test notification to {recipients} succeeded!",
                "diagnostics": diag_steps,
            }

        except smtplib.SMTPAuthenticationError as e:
            diag_steps.append(f"Authentication Error: {e.smtp_error.decode('utf-8', errors='ignore') if isinstance(e.smtp_error, bytes) else str(e)}")
            return {
                "success": False,
                "error": "Authentication failed. Check your SMTP username and password (or use App Password for Gmail/Outlook).",
                "diagnostics": diag_steps,
            }
        except Exception as e:
            diag_steps.append(f"Connection Failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "diagnostics": diag_steps,
            }
