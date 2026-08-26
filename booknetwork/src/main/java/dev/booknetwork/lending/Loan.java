package dev.booknetwork.lending;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A loan references book and borrower by id only — no JPA relations across
 * module boundaries. Its lifecycle is three timestamps: borrowed, returned by
 * the borrower, approved by the owner. A loan is "live" until approval; the
 * database enforces at most one live loan per book with a partial unique
 * index, and stamps the due date (three weeks) at insert.
 */
@Entity
@Table(name = "loans")
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "book_id", nullable = false)
    private Long bookId;

    @Column(name = "borrower_id", nullable = false)
    private UUID borrowerId;

    @Column(name = "borrowed_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime borrowedAt;

    @Column(name = "due_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime dueAt;

    @Column(name = "returned_at")
    private OffsetDateTime returnedAt;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;

    protected Loan() {
        // JPA
    }

    public Loan(Long bookId, UUID borrowerId) {
        this.bookId = bookId;
        this.borrowerId = borrowerId;
    }

    public boolean isReturned() {
        return returnedAt != null;
    }

    public boolean isApproved() {
        return approvedAt != null;
    }

    public boolean isOverdue() {
        return !isReturned() && dueAt != null && OffsetDateTime.now().isAfter(dueAt);
    }

    public void markReturned() {
        this.returnedAt = OffsetDateTime.now();
    }

    public void markApproved() {
        this.approvedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getBookId() {
        return bookId;
    }

    public UUID getBorrowerId() {
        return borrowerId;
    }

    public OffsetDateTime getBorrowedAt() {
        return borrowedAt;
    }

    public OffsetDateTime getDueAt() {
        return dueAt;
    }

    public OffsetDateTime getReturnedAt() {
        return returnedAt;
    }

    public OffsetDateTime getApprovedAt() {
        return approvedAt;
    }
}
