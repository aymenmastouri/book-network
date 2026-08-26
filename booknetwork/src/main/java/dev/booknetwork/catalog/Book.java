package dev.booknetwork.catalog;

import java.time.OffsetDateTime;

import dev.booknetwork.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "books")
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(nullable = false)
    private String title;

    @Column(name = "author_name", nullable = false)
    private String authorName;

    @Column(nullable = false)
    private String isbn = "";

    @Column(nullable = false)
    private String synopsis = "";

    @Column(name = "cover_path")
    private String coverPath;

    @Column(nullable = false)
    private boolean shareable = true;

    @Column(nullable = false)
    private boolean archived = false;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected Book() {
        // JPA
    }

    public Book(User owner, String title, String authorName, String isbn, String synopsis, boolean shareable) {
        this.owner = owner;
        this.title = title;
        this.authorName = authorName;
        this.isbn = isbn;
        this.synopsis = synopsis;
        this.shareable = shareable;
    }

    public boolean isOwnedBy(java.util.UUID userId) {
        return owner.getId().equals(userId);
    }

    public Long getId() {
        return id;
    }

    public User getOwner() {
        return owner;
    }

    public String getTitle() {
        return title;
    }

    public String getAuthorName() {
        return authorName;
    }

    public String getIsbn() {
        return isbn;
    }

    public String getSynopsis() {
        return synopsis;
    }

    public String getCoverPath() {
        return coverPath;
    }

    public boolean isShareable() {
        return shareable;
    }

    public boolean isArchived() {
        return archived;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public void setIsbn(String isbn) {
        this.isbn = isbn;
    }

    public void setSynopsis(String synopsis) {
        this.synopsis = synopsis;
    }

    public void setCoverPath(String coverPath) {
        this.coverPath = coverPath;
    }

    public void setShareable(boolean shareable) {
        this.shareable = shareable;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }
}
