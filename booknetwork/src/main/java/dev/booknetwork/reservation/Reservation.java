package dev.booknetwork.reservation;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A place in the queue for a borrowed book. Active until fulfilled (the book
 * was auto-assigned on return approval) or canceled by its holder. The queue
 * order is creation time; a member holds at most one active place per book,
 * enforced by a partial unique index.
 */
@Entity
@Table(name = "reservations")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "book_id", nullable = false)
    private Long bookId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "fulfilled_at")
    private OffsetDateTime fulfilledAt;

    @Column(name = "canceled_at")
    private OffsetDateTime canceledAt;

    protected Reservation() {
        // JPA
    }

    public Reservation(Long bookId, UUID userId) {
        this.bookId = bookId;
        this.userId = userId;
    }

    public void markFulfilled() {
        this.fulfilledAt = OffsetDateTime.now();
    }

    public void markCanceled() {
        this.canceledAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getBookId() {
        return bookId;
    }

    public UUID getUserId() {
        return userId;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
