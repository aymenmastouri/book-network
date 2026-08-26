package dev.booknetwork.feedback.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FeedbackRequest(
        @NotNull Long bookId,
        @Min(value = 1, message = "Rating is 1 to 5 stars") @Max(value = 5, message = "Rating is 1 to 5 stars") int rating,
        @Size(max = 1000) String comment
) {

    public String commentOrEmpty() {
        return comment == null ? "" : comment.trim();
    }
}
