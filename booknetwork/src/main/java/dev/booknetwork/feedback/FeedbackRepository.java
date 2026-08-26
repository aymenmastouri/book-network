package dev.booknetwork.feedback;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import dev.booknetwork.user.User;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    interface FeedbackWithAuthor {
        Feedback getFeedback();
        User getAuthor();
    }

    @Query(value = """
            select f as feedback, u as author
            from Feedback f, User u
            where u.id = f.authorId and f.bookId = :bookId
            order by f.createdAt desc
            """,
            countQuery = "select count(f) from Feedback f where f.bookId = :bookId")
    Page<FeedbackWithAuthor> forBook(@Param("bookId") Long bookId, Pageable pageable);
}
