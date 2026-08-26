package dev.booknetwork.notify;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/**
 * Best-effort mail: every notification is fire-and-forget, and a failing SMTP
 * never breaks the business operation that triggered it. Locally the messages
 * land in MailDev (http://localhost:1080).
 */
@Component
public class MailNotifier {

    private static final Logger log = LoggerFactory.getLogger(MailNotifier.class);
    private static final String FROM = "noreply@booknetwork.dev";

    private final JavaMailSender mailSender;

    public MailNotifier(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void borrowed(String ownerEmail, String bookTitle, String borrowerName) {
        send(ownerEmail, "Your book was borrowed",
                borrowerName + " just borrowed \"" + bookTitle + "\" from your shelf.");
    }

    public void returned(String ownerEmail, String bookTitle, String borrowerName) {
        send(ownerEmail, "A book is coming home",
                borrowerName + " returned \"" + bookTitle + "\". Approve the return to free it up again.");
    }

    public void returnApproved(String borrowerEmail, String bookTitle) {
        send(borrowerEmail, "Return approved",
                "The owner confirmed your return of \"" + bookTitle + "\". Thanks for bringing it home.");
    }

    public void reservationFulfilled(String reserverEmail, String bookTitle) {
        send(reserverEmail, "Your reserved book is yours",
                "\"" + bookTitle + "\" just became free and was lent to you — you were first in the queue.");
    }

    private void send(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(FROM);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Mail '{}' to {} not delivered: {}", subject, to, e.getMessage());
        }
    }
}
